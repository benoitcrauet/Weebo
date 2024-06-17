import os
from flask import Blueprint, render_template, request, redirect, url_for, abort, jsonify
from flask_wtf import FlaskForm
from flask_wtf.file import FileAllowed
from flask_cors import CORS
import wtforms
import wtforms.validators as validators
import json

from lib.socketio import SocketIOInstance
from lib.db import session
from lib.models import Show, Media, MediaChannel
from lib.guid import generate_guid
from lib.config import config
from lib.dict import model_to_dict
from lib.events import createNewEvent

bp = Blueprint(os.path.splitext(os.path.basename(__file__))[0], __name__)

app = None
socketio = None
def init(flaskapp):
    global app, bp, socketio
    app = flaskapp
    socketio = SocketIOInstance().socketio
    CORS(app, origins="*")

    app.register_blueprint(bp)


@bp.route("/jingles")
def shows():
    shows = session.query(Show).all()
    return render_template("jingles/showsList.jinja2", shows=shows)



@bp.route("/jingles/<string:show_guid>")
def jinglesList(show_guid):
    # On vérifie que le show existe bien
    show = session.query(Show).filter(Show.id == show_guid).first()
    if not show:
        abort(404, description="L'émission est introuvable.")
    
    # On liste les jingles de l'émission
    jingles = session.query(Media).filter(Media.show_id == show.id).order_by(Media.order).all()

    # On liste les canaux
    channels = session.query(MediaChannel).filter(MediaChannel.show_id == show.id).all()
    channelsInvert = {}
    for c in channels:
        channelsInvert[c.id] = model_to_dict(c)
    
    modifiedJingles = []
    for j in jingles:
        arrChannels = j.channel.split(",") if j.channel else []
        channelsList = []
        for i in arrChannels:
            if i in channelsInvert:
                channelsList.append(channelsInvert[i])
        
        modifiedJingle = model_to_dict(j)
        modifiedJingle["channelsList"] = channelsList

        modifiedJingles.append(modifiedJingle)

    return render_template("jingles/jinglesList.jinja2", show=show, jingles=modifiedJingles, config=config)



# Classe de validation
class FormMediaEdit(FlaskForm):
    id = wtforms.HiddenField("ID", validators=[])
    name = wtforms.StringField("Nom du jingle", validators=[validators.DataRequired()], render_kw={"maxlength": 30})
    file = wtforms.FileField("Fichier", description="Insérez ici le fichier vidéo du jingle.", validators=[FileAllowed(["mov","avi","mp4","webm"])])
    fileRaw = wtforms.BooleanField("Fichier brut", description="Cochez cette case si vous souhaitez transférer le fichier brut pour, par exemple, faire passer la couche transparente. Le fichier ne sera alors pas transcodé. Faites attention au poids du fichier ! Ne fonctionne qu'avec les fichiers WEBM.", validators=[FileAllowed(["mov","avi","mp4","webm"])])
    volume = wtforms.DecimalRangeField("Volume", description="Indiquez le volume de lecture de ce jingle", validators=[validators.InputRequired(), validators.NumberRange(min=0, max=1)])
    channels = wtforms.SelectMultipleField("Canaux", validators=[validators.DataRequired()])

    submit = wtforms.SubmitField("Valider")


@bp.route("/jingles/<string:show_guid>/create", methods=["GET","POST"])
@bp.route("/jingles/<string:show_guid>/<string:guid>/edit", methods=["GET","POST"])
def jingleEdit(show_guid, guid=None):
    # On vérifie que le show existe bien
    show = session.query(Show).filter(Show.id == show_guid).first()
    if not show:
        abort(404, description="L'émission est introuvable.")


    editMode = False
    if guid is not None:
        editMode = True
    
    if editMode:
        media = session.query(Media).filter(Media.id == guid).first()
    else:
        media = Media()
        media.volume = 1
    

    # Si l'objet n'existe pas : 404
    if not media:
        abort(404)

    form = FormMediaEdit(obj=media)

    # On liste les canaux media et on les envoie au formulaire
    channels = session.query(MediaChannel).filter(MediaChannel.show_id == show.id).order_by(MediaChannel.name).all()
    form.channels.choices = [(c.id, c.name) for c in channels]

    if editMode:
        form.file.description = form.file.description + " Ne mettez un fichier que si vous souhaitez remplacer le jingle actuel."
    
    # Validation du formulaire
    if form.validate_on_submit():
        # Si on a un ID on récupère l'objet
        if editMode and form.id.data!="":
            media = session.query(Media).filter(Media.id == form.id.data).first()
            if not media:
                return "Invalid media ID"
        else:
            media = Media()
            media.show_id = show.id
        
        # On récupère l'ordre maximal
        allJingles = session.query(Media).filter(Media.show_id == show.id).all()
        max_order = -1
        for j in allJingles:
            if j.order > max_order:
                max_order = j.order

        media.name = form.name.data
        media.volume = form.volume.data
        media.channel = ",".join(form.channels.data) if type(form.channels.data) is list else ""
        media.order = max_order + 1
        media.type = "media"

        # On récupère le fichier
        file = request.files["file"]

        # On récupère l'extension
        extension = file.filename.rsplit(".")[-1].lower()

        # On génère un nouveau nom de fichier pour le média temporaire
        filename = generate_guid()

        if not editMode and file.filename=="":
            form.file.errors.append("You need to upload a valid video file.")
        else:
            # Upload du fichier
            try:
                if extension!="":
                    # On sauvegarde le fichier renommé avec son extension
                    filename_main = filename + "." + extension
                    file.save(config["directories"]["mediasTmp"]+"/"+filename_main)

                    # On crée le fichier méta
                    metadata = {
                        "media_id": media.id
                    }

                    # Si l'extension est webm et qu'on demande un fichier brut, on rajoute le paramètre
                    if extension=="webm" and form.fileRaw.data==True:
                        metadata["raw"] = True
                    
                    # Si c'est une édition, on remplace les fichiers
                    if editMode:
                        metadata["paths"] = {
                            "filename": media.path,
                            "thumbnail": media.tmb,
                            "meta": media.id + ".meta.txt"
                        }

                    meta_path = config["directories"]["mediasTmp"]+"/" + filename + ".meta.txt"
                    with open(meta_path, "w") as meta_file:
                        json.dump(metadata, meta_file, indent=4)
                    
                    # On set la progression à 0
                    media.progress = 0
                    # On défini le nom de fichier
                    media.path = filename_main

            except Exception as e:
                abort(500, description=e)

            finally:

                if editMode:
                    session.merge(media)
                else:
                    session.add(media)
                session.commit()

            return redirect(url_for("jingles.jinglesList", show_guid=show.id))
    else:
        form.channels.data = media.channel.split(",") if media.channel else []
    
    return render_template("jingles/jinglesEdit.jinja2", show_guid=show_guid, guid=guid, show=show,  media=media, form=form, config=config)



# Classe de validation
class FormJingleDelete(FlaskForm):
    delete = wtforms.SelectField("Supprimer ?", choices=[("n", "Non"), ("y", "Oui")], validators=[validators.DataRequired()])
    submit = wtforms.SubmitField("Supprimer")


@bp.route("/jingles/<string:show_guid>/<string:guid>/delete", methods=["GET","POST"])
def jingleDelete(show_guid, guid):
    # On vérifie que le show existe bien
    show = session.query(Show).filter(Show.id == show_guid).first()
    if not show:
        abort(404, description="L'émission est introuvable.")

    # On vérifie que le média existe bien
    media = session.query(Media).filter(Media.id == guid).first()
    # Si l'objet n'existe pas : 404
    if not media:
        abort(404, description="Le média n'existe pas.")

    form = FormJingleDelete()

    # Validation du formulaire
    if form.validate_on_submit():
        if form.delete.data == "y":
            session.delete(media)
            session.commit()

        return redirect(url_for("jingles.jinglesList", show_guid=show.id))
    
    return render_template("jingles/jinglesDelete.jinja2", guid=guid, show=show, media=media, form=form)




@bp.route("/api/jingle/<string:guid>/launch", methods=["GET"])
def api_jingleLaunch(guid):
    # On check si le jingle existe
    media = session.query(Media).filter(Media.id == guid).first()
    if not media:
        abort(404, description="Ce média n'existe pas")
    else:
        # On récupère le show
        show = session.query(Show).filter(Show.id == Media.show_id).first()
        if not show:
            abort(500, description="Ce jingle est orphelin.")
    
    # On met à jour le champ média
    media.currentMedia = media.id
    
    # Building viewers list
    viewers_list = media.channel.split(",")

    # Building args list
    args = {
        "src": "/"+config["directories"]["medias"]+"/"+media.path,
        "volume": media.volume
    }
    
    # Building websocket object
    object_to_send = {
        "command": "jingle",
        "viewer": viewers_list,
        "args": args
    }

    # Sending object
    socketio.emit("media_command", object_to_send)


    # On crée un nouvel évènement
    newEvent = createNewEvent(show.id, "jingle.start", "{}".format(media.name))
    session.add(newEvent)

    # On met à jour la DB
    session.commit()
    
    return model_to_dict(media)


@bp.route("/api/jingles/<string:show_guid>/orders", methods=["PATCH"])
def api_jinglesReorder(show_guid):
    # On check si l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if not show:
        abort(404, description="Cette émission n'existe pas")
        
    if request.is_json:
        data = request.json
        
        compiledOrder = {}

        for l in data:
            if not "id" in l or not "order" in l:
                abort(400, description="L'objet JSON doit-être une liste d'objets étants uniquement constitués de valeurs id et order.")
            else:
                compiledOrder[l["id"]] = l["order"]
        
        # On liste les médias
        medias = session.query(Media).filter(Media.show_id == show.id).order_by(Media.order).all()

        for media in medias:
            if media.id in compiledOrder:
                media.order = compiledOrder[media.id]
                session.merge(media)
        
        session.commit()

        # Maintenant on liste les lignes et on affiche
        medias = session.query(Media).filter(Media.line_id == show.id).order_by(Media.order).all()
        medias_to_send = [model_to_dict(obj) for obj in medias]

        return jsonify(medias_to_send)
    else:
        abort(400, description="La requête doit être une requête JSON.")