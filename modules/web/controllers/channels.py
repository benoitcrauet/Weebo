import os
from flask import Blueprint, render_template, request, abort, redirect, url_for
from flask_socketio import SocketIO
from flask_wtf import FlaskForm
from flask_cors import CORS
import wtforms
import wtforms.validators as validators

from lib.guid import generate_guid
from lib.mime import get_mime, mime_extract_type
from lib.config import config
from lib.db import session
from lib.models import MediaChannel, WebChannel, Show

bp = Blueprint(os.path.splitext(os.path.basename(__file__))[0], __name__)

app = None
socketio = None
def init(flaskapp):
    global app, bp, socketio
    app = flaskapp
    socketio = SocketIO(app)
    CORS(app, origin="*")

    app.register_blueprint(bp)


@bp.route("/shows/<string:show_guid>/channels/medias")
def channelsMedias(show_guid):
    # On test si l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if show == None:
        abort(404)
    
    channels = session.query(MediaChannel).filter(MediaChannel.show_id == show_guid).all()
    return render_template("channels/channelsMedias.jinja2", channels=channels, show=show)




# Classe de validation
class FormMediaChannelEdit(FlaskForm):
    id = wtforms.HiddenField("ID", validators=[])
    name = wtforms.StringField("Nom du canal", validators=[validators.DataRequired()], render_kw={"maxlength": 30})
    description = wtforms.StringField("Description", description="Une simple description, juste pour vous, pour vous y retrouver.", validators=[], render_kw={"maxlength": 150})
    width = wtforms.IntegerField("Résolution", description="Indiquez ici la résolution qui sera utilisée pour ce canal média. Dans la plupart des cas, 1920x1080 convient.", validators=[validators.NumberRange(200, 6000)])
    height = wtforms.IntegerField("Hauteur", validators=[validators.NumberRange(200, 6000)])
    defaultEnable = wtforms.BooleanField("Par défaut", description="Permet de définir si le canal est coché par défaut pour cette émission.")
    customCSS = wtforms.TextAreaField("CSS personnalisé", description="Vous permet de personnaliser le rendu. Moldus, passez votre chemin.")

    submit = wtforms.SubmitField("Valider")


@bp.route("/shows/<string:show_guid>/channels/medias/create", methods=["GET","POST"])
@bp.route("/shows/<string:show_guid>/channels/medias/<string:channel_guid>/edit", methods=["GET","POST"])
def channelsMediasEdit(show_guid, channel_guid=None):
    # On test si l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if show == None:
        abort(404)
    
    editMode = False
    if channel_guid is not None:
        editMode = True
    
    if editMode:
        channel = session.query(MediaChannel).filter(MediaChannel.id == channel_guid).first()
    else:
        channel = MediaChannel()
    
    # Chargement du formulaire
    form = FormMediaChannelEdit(obj=channel)
    
    # Si le formulaire est validé
    if form.validate_on_submit():

        edit = False

        if form.id.data!="":
            channel = session.query(MediaChannel).filter(MediaChannel.id == form.id.data).first()
            edit = True
            if channel == None:
                return "Invalid channel ID"
        else:
            channel = MediaChannel()
        
        channel.show_id = show_guid
        channel.name = form.name.data
        channel.description = form.description.data
        channel.width = form.width.data
        channel.height = form.height.data
        channel.customCSS = form.customCSS.data
        channel.defaultEnable = form.defaultEnable.data
        if edit:
            session.merge(channel)
        else:
            session.add(channel)
        
        session.commit()
        
        return redirect(url_for("channels.channelsMedias", show_guid=show_guid))

    
    return render_template("channels/channelsMediasEdit.jinja2", form=form, show=show, channel=channel, web_base=config["web_base"])



# Classe de validation
class FormDelete(FlaskForm):
    delete = wtforms.SelectField("Supprimer ?", choices=[("n", "Non"), ("y", "Oui")], validators=[validators.DataRequired()])

    submit = wtforms.SubmitField("Supprimer")


@bp.route("/shows/<string:show_guid>/channels/medias/<string:channel_guid>/delete", methods=["GET","POST"])
def channelsMediasDelete(show_guid, channel_guid):
    # On test si l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if show == None:
        abort(404)
    
    channel = session.query(MediaChannel).filter(MediaChannel.id == channel_guid).first()
    # Si l'objet n'existe pas : 404
    if channel==None:
        abort(404)

    form = FormDelete()

    # Validation du formulaire
    if form.validate_on_submit():
        channel = session.query(MediaChannel).filter(MediaChannel.id == channel_guid).first()
        if channel==None:
            return "ID invalide"
        
        if form.delete.data == "y":
            session.delete(channel)
            session.commit()

        return redirect(url_for("channels.channelsMedias", show_guid=show_guid))
    
    return render_template("channels/channelsMediasDelete.jinja2", show=show, channel=channel, form=form)











@bp.route("/shows/<string:show_guid>/channels/web")
def channelsWeb(show_guid):
    # On test si l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if show == None:
        abort(404)
    
    channels = session.query(WebChannel).filter(WebChannel.show_id == show_guid).all()
    return render_template("channels/channelsWeb.jinja2", channels=channels, show=show)



# Classe de validation
class FormWebChannelEdit(FlaskForm):
    id = wtforms.HiddenField("ID", validators=[])
    name = wtforms.StringField("Nom du canal", validators=[validators.DataRequired()], render_kw={"maxlength": 30})
    description = wtforms.StringField("Description", description="Une simple description, juste pour vous, pour vous y retrouver.", validators=[], render_kw={"maxlength": 150})
    defaultEnable = wtforms.BooleanField("Par défaut", description="Permet de définir si le canal est coché par défaut pour cette émission.")

    submit = wtforms.SubmitField("Valider")


@bp.route("/shows/<string:show_guid>/channels/web/create", methods=["GET","POST"])
@bp.route("/shows/<string:show_guid>/channels/web/<string:channel_guid>/edit", methods=["GET","POST"])
def channelsWebEdit(show_guid, channel_guid=None):
    # On test si l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if show == None:
        abort(404)
    
    editMode = False
    if channel_guid is not None:
        editMode = True
    
    if editMode:
        channel = session.query(WebChannel).filter(WebChannel.id == channel_guid).first()
    else:
        channel = WebChannel()
    
    # Chargement du formulaire
    form = FormWebChannelEdit(obj=channel)
    
    # Si le formulaire est validé
    if form.validate_on_submit():

        edit = False

        if form.id.data!="":
            channel = session.query(WebChannel).filter(WebChannel.id == form.id.data).first()
            edit = True
            if channel == None:
                return "Invalid channel ID"
        else:
            channel = WebChannel()
        
        channel.show_id = show_guid
        channel.name = form.name.data
        channel.description = form.description.data
        channel.defaultEnable = form.defaultEnable.data

        if edit:
            session.merge(channel)
        else:
            session.add(channel)
        
        session.commit()
        
        return redirect(url_for("channels.channelsWeb", show_guid=show_guid))
    
    
    return render_template("channels/channelsWebEdit.jinja2", form=form, show=show, channel=channel, web_base=config["web_base"])




@bp.route("/shows/<string:show_guid>/channels/web/<string:channel_guid>/delete", methods=["GET","POST"])
def channelsWebDelete(show_guid, channel_guid):
    # On test si l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if show == None:
        abort(404)
    
    channel = session.query(WebChannel).filter(WebChannel.id == channel_guid).first()
    # Si l'objet n'existe pas : 404
    if channel==None:
        abort(404)

    form = FormDelete()

    # Validation du formulaire
    if form.validate_on_submit():
        channel = session.query(WebChannel).filter(WebChannel.id == channel_guid).first()
        if channel==None:
            return "ID invalide"
        
        if form.delete.data == "y":
            session.delete(channel)
            session.commit()

        return redirect(url_for("channels.channelsWeb", show_guid=show_guid))
    
    return render_template("channels/channelsWebDelete.jinja2", show=show, channel=channel, form=form)






@bp.route("/viewer/medias/<string:guid>")
def viewerMedias(guid):
    return render_template("channels/viewerVideo.jinja2", viewerID=guid)


@bp.route("/test/arm")
def viewertestarm():
    socketio.emit("media_command", {
        "command": "arm",
        "viewer": "test",
        "args": {
            "type": "video",
            "src": "test.webm",
            "credit": "Source : The Blender Foundation",
            "volume": 0.5,
            "loop": False
        }
    })
    return "socket envoyé"

@bp.route("/test/play")
def viewertestplay():
    socketio.emit("media_command", {
        "command": "take",
        "viewer": "test",
        "args": None
    })
    return "socket envoyé"

@bp.route("/test/buttons")
def viewertestbuttons():
    return '<button onclick="fetch(\'/test/arm\');">Arm</button> <button onclick="fetch(\'/test/play\');">Play</button>'

