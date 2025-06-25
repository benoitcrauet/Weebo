import os
from flask import Blueprint, render_template, request, redirect, url_for, abort, jsonify
from flask_wtf import FlaskForm
from flask_cors import CORS
from flask_login import login_required
import wtforms
import wtforms.validators as validators
from datetime import datetime, timedelta
from urllib.parse import urlencode
import locale
import json
from io import BytesIO
from PIL import Image
import time

from lib.socketio import SocketIOInstance
from lib.db import session
from lib.models import Show, Conductor, Line, Media
from lib.guid import generate_guid
from lib.dict import model_to_dict
from lib.vdo import generateVdoGuestHash, generateVdoRoomID, generateVdoRemoteHash, generateVdoCoDirectorHash, generateVdoHash
from lib.config import config
from lib.picture import ResizeMaximal
from lib.conductors import getActiveConductor
from lib.events import createNewEvent
from lib.websocket import conductorWebSocketBase
from lib.disk import get_disk_usage
from lib.users import for_admins

bp = Blueprint(os.path.splitext(os.path.basename(__file__))[0], __name__)



app = None
socketio = None
def init(flaskapp):
    global app, bp, socketio
    app = flaskapp
    socketio = SocketIOInstance().socketio
    CORS(app, origins="*")

    app.register_blueprint(bp)


# Définit la locale française
locale.setlocale(locale.LC_TIME, 'fr_FR.UTF-8')




@bp.route("/conductors")
@login_required
def showsList():
    shows = session.query(Show).all()
    return render_template("conductors/showsList.jinja2", shows=shows)



@bp.route("/conductors/<string:show_guid>")
@login_required
def conductorsList(show_guid):
    # On check si l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if show==None:
        abort(404)

    # On liste les conducteurs
    conductors = session.query(Conductor).filter(Conductor.type == "operational").filter(Conductor.show_id == show.id).all()

    # Trier les résultats par la propriété virtuelle date en utilisant Python
    conductors = sorted(conductors, key=lambda x: x.date, reverse=True)


    # On liste les templates
    templates = session.query(Conductor).filter(Conductor.type == "template").filter(Conductor.show_id == show.id).order_by(Conductor.name).all()


    return render_template("conductors/conductorsList.jinja2", show=show, conductors=conductors, templates=templates)



# Classe de formulaire d'édition CONDUCTEUR
class FormConductorEdit(FlaskForm):
    id = wtforms.HiddenField("id", validators=[])
    type = wtforms.SelectField("Type de conducteur", choices=[("operational", "Émission"),("template","Modèle")], description="Est-ce que ce conducteur est une émission ou un modèle ?", validators=[validators.DataRequired()])
    name = wtforms.StringField("Nom", description="Donnez un nom à ce conducteur.", validators=[validators.DataRequired()])
    day = wtforms.IntegerField("Diffusion", description="Entrez ici la date de diffusion de l'émission.", validators=[validators.NumberRange(min=1, max=31)])
    month = wtforms.IntegerField("mois", validators=[validators.NumberRange(min=1, max=12)])
    year = wtforms.IntegerField("année", validators=[validators.NumberRange(min=datetime.now().year-1, max=datetime.now().year+2)])
    guests = wtforms.HiddenField("Participants", description="Saisissez les noms des différents intervenants présents. Vous n'êtes pas obligé de définir absolument un nom par rôle. Attention : ces noms peuvent être susceptibles d'être affichés publiquement.", validators=[])
    vdoEnable = wtforms.BooleanField("Activer VDO", description="Permet d'activer la génération automatique des liens VDO.", validators=[], default=True)
    vdoPassword = wtforms.StringField("Mot de passe VDO", description="Facultatif. Vous permet de définir un mot de passe sur votre room VDO.", validators=[])
    fromTemplate = wtforms.SelectField("Template", choices=[("","- Aucun modèle -")], description="Depuis quel modèle souhaitez-vous créer votre conducteur ?")
    resetStatus = wtforms.BooleanField("Réinitialiser l'état", description="Cochez cette case pour réinitialiser les états de streaming et d'enregistrement.", validators=[])

    show_id = wtforms.HiddenField("show_id")

    submit = wtforms.SubmitField("Valider")



@bp.route("/conductors/<string:show_guid>/create", methods=["GET", "POST"])
@bp.route("/conductors/<string:show_guid>/<string:cond_guid>/edit", methods=["GET", "POST"])
@login_required
def conductorsEdit(show_guid, cond_guid=None):
    # On check si l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if show==None:
        abort(404)

    editMode = False
    if cond_guid!=None:
        editMode = True
        # On check si le conducteur existe
        conductor = session.query(Conductor).filter(Conductor.id == cond_guid).filter(Conductor.show == show).first()
        if conductor==None:
            abort(404)
    else:
        today = datetime.now()+timedelta(hours=5)
        conductor = Conductor(year=today.year, month=today.month, day=today.day)
    
    form = FormConductorEdit(obj=conductor)
    
    # Suppression du template si c'est une édition
    if editMode:
        del form.fromTemplate
    else:
        # On récupère les templates de l'émission et on les ajoute au champ template
        templates = session.query(Conductor).filter(Conductor.type == "template").filter(Conductor.show_id == show.id).order_by(Conductor.name).all()
        templateList = [(t.id, t.name) for t in templates]
        form.fromTemplate.choices += templateList


    # Validation du formulaire
    if form.validate_on_submit():
        
        # On récupère les différentes dates de diffusion déjà existantes
        conductors = session.query(Conductor).filter(Conductor.type == "operational").filter(Conductor.show_id == show.id).filter(Conductor.id != conductor.id).all()
        dateList = ["{}-{}-{}".format(c.year, c.month, c.day) for c in conductors]

        # On vérifie que la date n'existe pas déjà
        selectedDate = "{}-{}-{}".format(form.year.data, form.month.data, form.day.data)

        if selectedDate in dateList and form.type.data=="operational":
            form.day.errors.append("This date is already taken by another conductor in database.")
        else:

            # Si on a un ID on récupère l'objet
            if form.id.data!="":
                conductor = session.query(Conductor).filter(Conductor.id == form.id.data).first()
                if conductor==None:
                    return "Invalid conductor ID"
            else:
                conductor = Conductor()
        
            conductor.type = form.type.data
            conductor.name = form.name.data.strip()
            conductor.day = form.day.data
            conductor.month = form.month.data
            conductor.year = form.year.data
            conductor.guests = form.guests.data.replace("\r", "")

            conductor.vdoEnable = form.vdoEnable.data
            conductor.vdoPassword = form.vdoPassword.data.strip()

            # Si on demande un reset, on met à false le streaming et le recording
            if form.resetStatus.data:
                conductor.recording = False
                conductor.streaming = False

            conductor.show = show



            if form.id.data=="":
                session.add(conductor)
            else:
                session.merge(conductor)
            session.commit()


            # Si c'est une création et qu'on a un fromTemplate
            if not editMode and form.fromTemplate.data!="":
                lines = session.query(Line).filter(Line.conductor_id == form.fromTemplate.data).all()
                # On insert toutes les lignes
                for l in lines:
                    newLine = Line(type=l.type, name=l.name, text=l.text, order=l.order, jingle=l.jingle, conductor=conductor, done=False)
                    session.add(newLine)
                session.commit()

            return redirect(url_for("conductors.conductorsList", show_guid=show_guid))
    
    return render_template("conductors/conductorsEdit.jinja2", show=show, conductor=conductor, form=form, editMode=editMode)



# Classe de formulaire de suppression
class FormDelete(FlaskForm):
    delete = wtforms.SelectField("Supprimer ?", choices=[("n", "Non"), ("y", "Oui")], validators=[validators.DataRequired()])

    submit = wtforms.SubmitField("Supprimer")



@bp.route("/conductors/<string:show_guid>/<string:cond_guid>/delete", methods=["GET", "POST"])
@login_required
def conductorsDelete(show_guid, cond_guid=None):# On check si l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if show==None:
        abort(404)

    if cond_guid!=None:
        # On check si le conducteur existe
        conductor = session.query(Conductor).filter(Conductor.id == cond_guid).filter(Conductor.show == show).first()
        if conductor==None:
            abort(404)
    
    form = FormDelete()

    # Validation du formulaire
    if form.validate_on_submit():
        conductor = session.query(Conductor).filter(Conductor.id == cond_guid).first()
        if show==None:
            return "ID invalide"
        
        if form.delete.data == "y":
            session.delete(conductor)
            session.commit()

        return redirect(url_for("conductors.conductorsList", show_guid=show.id))
    
    return render_template("conductors/conductorsDelete.jinja2", show=show, conductor=conductor, form=form)



@bp.route("/conductors/<string:show_guid>/<string:cond_guid>")
@login_required
def conductorsView(show_guid, cond_guid=None):
    # On check si l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if show==None:
        abort(404)

    if cond_guid!=None:
        # On check si le conducteur existe
        conductor = session.query(Conductor).filter(Conductor.id == cond_guid).filter(Conductor.show == show).first()
        if conductor==None:
            abort(404)
    

    # On récupère la liste des jingles de l'émission
    jingles = session.query(Media).filter(Media.show_id == show.id).order_by(Media.order).all()

    # On récupère la liste des canaux par défaut...
    # MEDIA
    defaultMediaChannels = [c.id for c in show.mediasChannels if c.defaultEnable==True]
    # WEB
    defaultWebChannels = [c.id for c in show.webChannels if c.defaultEnable==True]


    # On récupère la liste des canaux tout court...
    # MEDIA
    mediaChannels = [model_to_dict(c) for c in show.mediasChannels]
    # WEB
    webChannels = [model_to_dict(c) for c in show.webChannels]

    # On prépare la liste des liens
    vdoLinks = []
    vdoRoomID = generateVdoRoomID(conductor.id)

    # Code de remote OBS
    obsRemote = generateVdoRemoteHash(conductor.id)

    # Code co-director
    coDirectorHash = generateVdoCoDirectorHash(conductor.id)

    for i in conductor.guestsList:
        guest = conductor.guestsList[i]
        
        # On n'affiche la webcam que si le rôle est présent dans cette émission
        if guest["defined"]:

            # On fabrique le hash de l'utilisateur
            streamID = generateVdoGuestHash(conductor.id, guest["index"])



            # On fabrique le lien d'invitation
            inviteParams = {
                "room": vdoRoomID, # Room ID
                "push": streamID, # Stream ID
                "label": guest["name"], # Nom du guest
                "webcam": "", # Pas de choix entre screenshare ou webcam (webcam direct)
                "welcomeb64": "Bienvenue, {} !".format(guest["name"]), # Message de bienvenue
                "order": 10-guest["index"], # Priorité de mix (plus le guest est en premier dans la liste, plus il est prioritaire)
                "showlabels": "teams", # Affichage des noms des guests (style Teams)
                "clock24": "2", # Affichage de l'heure en haut
                "timer": "5", # Affichage du timer au centre
                "consent": "", # Permission de contrôler les caméras et micros
                "obs": "", # Activer le controle d'OBS (que pour les guests)
                "remote": obsRemote, # Token de controle d'OBS
                "hands": "", # Autorise les guests à lever la main
                "screensharebutton": "", # Autorise les guests à partager leur écran
                "nohangupbutton": "", # On cache le bouton raccrocher pour éviter les erreurs
                "fullscreenbutton": "", # On permet l'affichage en plein écran
                "grid": "", # Ajout de la grille des tiers
                "channelcount": "1", # Micro en mono
                "agc": "1", # Auto-gain control ON
                "gain": "70", # Volume de l'invité en %
                "limiter": "", # Activation du limiteur audio
                "gate": "1", # Activation du noise gate
            }
            # On rajoute l'image de bienvenue s'il y en a une
            if show.logo:
                inviteParams["welcomeimage"] = config["web"]["baseUrl"]+"/"+config["directories"]["images"]+"/"+show.logo
            # On rajoute le mot de passe s'il y en a un
            if conductor.vdoPassword!="":
                inviteParams["hash"] = generateVdoHash(conductor.vdoPassword)
            
            inviteLink = "https://vdo.ninja/?"+urlencode(inviteParams)



            # On fabrique le lien solo
            soloParams = {
                "room": vdoRoomID, # Room ID
                "view": streamID, # Stream ID
                "solo": "", # Vue solo
            }

            # On rajoute le token OBS mais uniquement sur le premier lien
            if guest["index"]==0:
                soloParams["remote"] = obsRemote # Token de pilotage OBS
            
            # On rajoute le mot de passe s'il y en a un
            if conductor.vdoPassword!="":
                soloParams["password"] = conductor.vdoPassword
            soloLink = "https://vdo.ninja/?"+urlencode(soloParams)

            # On crée le lien version screen capture
            soloCaptureLink = "https://vdo.ninja/?"+urlencode({**soloParams, "view": soloParams["view"]+":s"})



            # On fabrique le lien permanent caméra
            soloPermalink = config["web"]["baseUrl"]+url_for("conductors.vdoPermalink", show_guid=show.id, cam_number=guest["index"]+1)

            # ... ainsi que celui de la capture
            soloCapturePermalink = config["web"]["baseUrl"]+url_for("conductors.vdoPermalink_screencapture", show_guid=show.id, cam_number=guest["index"]+1)


            # On compile le tout et on ajoute à la liste
            obj = {
                "name": guest["name"],
                "role": guest["role"],
                "push": streamID,
                "cam_number": guest["index"],
                "link_invite": inviteLink,
                "link_solo": soloLink,
                "link_capture_solo": soloCaptureLink,
                "permalink_solo": soloPermalink,
                "permalink_capture_solo": soloCapturePermalink,
            }
            vdoLinks.append(obj)
    



    # On fabrique le lien guests
    urlParams = {
        "room": vdoRoomID, # Room ID
        "labelsuggestion": "", # On demande au guest son mom
        "webcam": "", # Pas de choix entre screenshare ou webcam (webcam direct)
        "showlabels": "teams", # Affichage des noms des guests (style Teams)
        "clock24": "2", # Affichage de l'heure en haut
        "timer": "5", # Affichage du timer au centre
        "consent": "", # Permission de contrôler les caméras et micros
        "screensharebutton": "", # Autorise les guests à partager leur écran
        "nohangupbutton": "", # On cache le bouton raccrocher pour éviter les erreurs
        "grid": "", # Ajout de la grille des tiers
        "channelcount": "1", # Micro en mono
        "agc": "1", # Auto-gain control ON
        "gain": "70", # Volume de l'invité en %
        "limiter": "", # Activation du limiteur audio
        "gate": "1", # Activation du noise gate
    }
    # On rajoute le mot de passe s'il y en a un
    if conductor.vdoPassword!="":
        urlParams["hash"] = generateVdoHash(conductor.vdoPassword)
    guestsLink = "https://vdo.ninja/?"+urlencode(urlParams)



    # On fabrique le lien director
    urlParams = {
        "director": vdoRoomID, # Room ID
        "notify": "", # Ajout des notifications
        "cleandirector": "", # Pas de liens d'invitation
        "codirector": coDirectorHash, # Mot de passe co-director
    }
    # On rajoute le mot de passe s'il y en a un
    if conductor.vdoPassword!="":
        urlParams["hash"] = generateVdoHash(conductor.vdoPassword)
    directorLink = "https://vdo.ninja/?"+urlencode(urlParams)

    # On récupère les contraintes de lien
    linksConstraints = config["linksConstraints"]

    # On récupère les presets de lecture
    playPresets = config["playPresets"]

    # On récupère les règles de sources
    sourcesRules = config["sourcesRules"]
    
    return render_template("conductors/conductorsView.jinja2", show=show, conductor=conductor, jingles=jingles, generator=generate_guid, vdoLinks=vdoLinks, vdoRoomID=vdoRoomID, directorLink=directorLink, guestsLink=guestsLink, defaultMediaChannels=defaultMediaChannels, defaultWebChannels=defaultWebChannels, mediaChannels=mediaChannels, webChannels=webChannels, web_base=config["web"]["baseUrl"], medias_dir=config["directories"]["medias"], linksConstraints=linksConstraints, playPresets=playPresets, sourcesRules=sourcesRules, disk=get_disk_usage("GB"))




# Pas de login ici : c'est les liens VDO pour OBS
@bp.route("/cameraslink/<string:show_guid>/<int:cam_number>", endpoint="vdoPermalink")
@bp.route("/cameraslink/<string:show_guid>/<int:cam_number>/screencapture", endpoint="vdoPermalink_screencapture")
def vdoPermalink(show_guid, cam_number):
    # Est-ce que le show existe ?
    show = session.query(Show).filter(Show.id == show_guid).first()
    if not show:
        abort(404, description="Cette émission n'existe pas.")
    
    selectedConductor = getActiveConductor(show.id)
    
    # Si on a pas de conducteur trouvé, on renvoie un 503
    if selectedConductor:
        # On génère l'ID de la room VDO
        vdoRoomID = generateVdoRoomID(selectedConductor.id)

        # On génère le streamID
        streamID = generateVdoGuestHash(selectedConductor.id, cam_number-1)

        # Code de remote OBS
        obsRemote = generateVdoRemoteHash(selectedConductor.id)

        # On fabrique le lien solo
        soloParams = {
            "room": vdoRoomID, # Room ID
            "view": streamID, # Stream ID
            "solo": "" # Vue solo
        }

        # Si on demande le screen capture, on rajoute le :s
        if request.path.endswith("/screencapture"):
            soloParams["view"] += ":s"
            print("test")

        # On rajoute le token OBS mais uniquement sur le premier lien
        if cam_number-1 <= 0:
            soloParams["remote"] = obsRemote # Token de pilotage OBS
        
        # On rajoute le mot de passe s'il y en a un
        if selectedConductor.vdoPassword!="":
            soloParams["password"] = selectedConductor.vdoPassword
        redirectLink = "https://vdo.ninja/?"+urlencode(soloParams)

        # On redirige
        return redirect(redirectLink, code=307)
        return "Redirect to {}<br><br>Conductor name: {}".format(redirectLink, selectedConductor.name)

    abort(503, description="Il n'y a pas encore de conducteurs dans cette émission.")
    return ""









@bp.route("/api/conductor/<string:cond_guid>", methods=["GET"])
@login_required
def api_conductorGet(cond_guid):
    # On check si le conducteur existe
    conductor = session.query(Conductor).filter(Conductor.id == cond_guid).first()
    if not cond_guid:
        abort(404)
    
    # On renvoie la ligne
    return jsonify(model_to_dict(conductor))


@bp.route("/api/conductor/line/<string:line_guid>", methods=["GET"])
@login_required
def api_conductorsLineGet(line_guid):
    # On check si la ligne existe
    line = session.query(Line).filter(Line.id == line_guid).first()
    if not line:
        abort(404)
    
    # On renvoie la ligne
    return jsonify(model_to_dict(line))



@bp.route("/api/conductor/line/<string:line_guid>", methods=["DELETE"])
@login_required
def api_conductorsLineDelete(line_guid):
    # On check si la ligne existe
    line = session.query(Line).filter(Line.id == line_guid).first()
    if line==None:
        abort(404)
    
    # On supprime la ligne
    session.delete(line)
    session.commit()

    # Maintenant on liste les lignes et on affiche
    lines = session.query(Line).filter(Line.conductor_id == line.conductor_id).order_by(Line.order).all()
    lines_to_send = [model_to_dict(obj) for obj in lines]

    # On envoie la liste à jour aux sockets
    socketio.emit("conductor_command", conductorWebSocketBase(action="delete", conductor=line.conductor_id, data_line=lines_to_send, data_media=None))

    return jsonify(lines_to_send)


@bp.route("/api/conductor/<string:cond_guid>/lines", methods=["GET"])
@login_required
def api_conductorsLinesList(cond_guid):
    # On check si le conducteur existe
    conductor = session.query(Conductor).filter(Conductor.id == cond_guid).first()
    if conductor==None:
        abort(404)
    
    # On récupère les lignes
    lines = session.query(Line).filter(Line.conductor_id == cond_guid).order_by(Line.order).all()

    # On compile l'objet conducteur avec les lignes encapsulées dedans
    output = {
        "conductor": model_to_dict(conductor),
        "lines": [model_to_dict(obj) for obj in lines]
    }

    return jsonify(output)


@bp.route("/api/conductor/<string:cond_guid>/lines", methods=["PUT"])
@login_required
def api_conductorsLinesListInsert(cond_guid):
    # On check si le conducteur existe
    conductor = session.query(Conductor).filter(Conductor.id == cond_guid).first()
    if conductor==None:
        abort(404)
    
    if request.is_json:
        data = request.json

        if "insertAfter" in data and "type" in data and "name" in data and "text" in data and "jingle" in data:
            # On récupère les lignes
            lines = session.query(Line).filter(Line.conductor_id == cond_guid).order_by(Line.order).all()

            # On décale de 1 l'ordre de tous les autres
            previousFound = False
            previousOrder = 0
            lastOrder = 0
            for line in lines:
                if previousFound or data["insertAfter"]=="":
                    line.order += 1
                    session.merge(line)

                if line.id == data["insertAfter"]:
                    previousFound = True
                    previousOrder = line.order
                
                lastOrder = line.order
            
            # On défini le nouvel ordre sur le précédent sauf s'il est introuvable
            newOrder = previousOrder+1 if previousFound else lastOrder+1

            # Si pas de insertAfter, on le place au début
            if data["insertAfter"]=="":
                newOrder = 1


            # Maintenant on ajoute la nouvelle ligne
            newLine = Line(type=data["type"], name=data["name"], highlight=data["highlight"], text=data["text"], jingle=data["jingle"], order=newOrder, conductor=conductor, done=False)
            session.add(newLine)

            # On stocke les objets modifiés pour le websocket
            modified_objects = [model_to_dict(obj) for obj in session.dirty]

            # Stockage en bdd
            session.commit()

            # On envoie la liste des objets modifés en socket
            socketio.emit("conductor_command", conductorWebSocketBase(action="insert", conductor=cond_guid, data_line=modified_objects, data_media=None))

            # Maintenant on liste les lignes et on affiche
            lines = session.query(Line).filter(Line.conductor_id == cond_guid).order_by(Line.order).all()
            return jsonify([model_to_dict(obj) for obj in lines])

        else:
            abort(422, description="Clés requises : insertAfter, type, name, text.")
    else:
        abort(400, description="La requête doit-être une requête JSON.")


@bp.route("/api/conductor/line/<string:line_guid>", methods=["PATCH"])
@login_required
def api_conductorsLineEdit(line_guid):
    # On check si la ligne existe
    line = session.query(Line).filter(Line.id == line_guid).first()
    conductor = None
    if line==None:
        abort(404)
    else:
        # On récupère le conducteur
        conductor = session.query(Conductor).filter(Conductor.id == line.conductor_id).first()

    show_id = None
    if not conductor:
        abort(500, description="Cette ligne est orpheline")
    else:
        # On récupère le show_id
        show_id = conductor.show_id
        
    if request.is_json:
        data = request.json

        # On stocke l'ancien état done
        oldDone = line.done

        if "type" in data:
            line.type = data["type"];
        if "name" in data:
            line.name = data["name"];
        if "highlight" in data:
            line.highlight = data["highlight"];
        if "text" in data:
            line.text = data["text"];
        if "jingle" in data:
            line.jingle = data["jingle"];
        if "order" in data:
            line.order = data["order"];
        if "done" in data:
            line.done = data["done"];
        

        # On crée l'évènement si l'état "done" est différent
        if line.type=="classic" and line.done != oldDone:
            if line.done:
                newEvent = createNewEvent(show_id, "line.done", "Line \"{}\" is done.".format(line.name))
            else:
                newEvent = createNewEvent(show_id, "line.undone", "Line \"{}\" is undone.".format(line.name))
            # On ajoute l'évènement à la base
            session.add(newEvent)
        
        # On modifie la ligne
        session.merge(line)

        # On enregistre toutes les modifications dans la database
        session.commit()


        # Maintenant on liste les lignes et on renvoie au socket
        lines = session.query(Line).filter(Line.conductor_id == line.conductor_id).order_by(Line.order).all()
        lines_to_send = [model_to_dict(obj) for obj in lines]

        # On envoie la liste en socket
        socketio.emit("conductor_command", conductorWebSocketBase(action="edit", conductor=line.conductor_id, data_line=lines_to_send, data_media=None))

        # On renvoie l'objet modifié
        return jsonify(model_to_dict(line))
    else:
        abort(400, description="La requête doit être une requête JSON.")


@bp.route("/api/conductor/<string:cond_guid>/orders", methods=["PATCH"])
@login_required
def api_conductorsLinesReorder(cond_guid):
    # On check si le conducteur existe
    conductor = session.query(Conductor).filter(Conductor.id == cond_guid).first()
    if conductor==None:
        abort(404)
        
    if request.is_json:
        data = request.json
        
        compiledOrder = {}

        for l in data:
            if not "id" in l or not "order" in l:
                abort(400, description="L'objet JSON doit-être une liste d'objets étants uniquement constitués de valeurs id et order.")
            else:
                compiledOrder[l["id"]] = l["order"]
        
        # On liste les lignes
        lines = session.query(Line).filter(Line.conductor_id == cond_guid).order_by(Line.order).all()

        for line in lines:
            if line.id in compiledOrder:
                line.order = compiledOrder[line.id]
                session.merge(line)
        
        session.commit()

        # Maintenant on liste les lignes et on affiche
        lines = session.query(Line).filter(Line.conductor_id == cond_guid).order_by(Line.order).all()
        lines_to_send = [model_to_dict(obj) for obj in lines]

        # On envoie les lignes réordonnées au socket
        socketio.emit("conductor_command", conductorWebSocketBase(action="reorder", conductor=line.conductor_id, data_line=lines_to_send, data_media=None))

        return jsonify(lines_to_send)
    else:
        abort(400, description="La requête doit être une requête JSON.")








@bp.route("/api/conductor/<string:cond_guid>/medias", methods=["GET"])
@login_required
def api_conductorsMediasList(cond_guid):
    # On check si le conducteur existe
    conductor = session.query(Conductor).filter(Conductor.id == cond_guid).first()
    if conductor==None:
        abort(404)

    lines = []
    for l in conductor.lines:
        lines.append(l.id)
    
    # On récupère les médias
    medias = session.query(Media).filter(Media.line_id.in_(lines)).order_by(Media.line_id).order_by(Media.order).all()

    return jsonify([model_to_dict(obj) for obj in medias])


@bp.route("/api/conductor/<string:cond_guid>/line/<string:line_guid>/medias", methods=["PUT"])
@login_required
def api_conductorsLineMediaAdd(cond_guid, line_guid):
    # On check si la ligne existe et que l'ID du conducteur correspond
    line = session.query(Line).filter(Line.id == line_guid).first()
    if line==None:
        abort(404, description="Cette ligne de conducteur n'existe pas")
    elif line.conductor_id != cond_guid:
        abort(404, description="Ce conducteur n'existe pas");
    
    # On récupère les données
    data_raw = request.form.get("data")

    try:
        # Conversion du json
        data = json.loads(data_raw)
    except json.JSONDecodeError as e:
        abort(400, decription="Impossible de décoder le JSON dans le champ data.")
    
    # On vérifie les champs
    if data.get("type") is None:
        abort(400, description="Le champ type est requis.")
    
    if data.get("type")=="media":
        if data.get("name") is None or data.get("name").strip()=="":
            abort(400, description="Le champ name est requis")
        
        if request.files["file"] is None:
            abort(400, description="Le champ file est requis")
        
        if data.get("mediaChannel") is None:
            abort(400, description="Le champ mediaChannel est requis")
    
    elif data.get("type")=="web":
        if data.get("name") is None or data.get("name").strip()=="":
            abort(400, description="Le champ name est requis")
        
        if data.get("url") is None or data.get("url").strip()=="":
            abort(400, description="Le champ url est requis")
        
        if data.get("webChannel") is None:
            abort(400, description="Le champ webChannel est requis")

    else:
        abort(400, description="Type de média invalide")
    
    # A partir d'ici les données sont correctes

    # On crée le nouvel objet
    media = Media()

    # On récupère l'ordre le plus fort
    maxOrderQuery = session.query(Media).filter(Media.line_id == line_guid).order_by(Media.order.desc()).first()
    newOrder = 1
    if maxOrderQuery:
        newOrder = maxOrderQuery.order + 1
    
    media.type = data["type"]
    media.line = line
    media.order = newOrder
    media.name = data["name"]
    
    # On traite selon le type
    if media.type=="media":
        media.channel = data["mediaChannel"]
        media.source = data["source"]
        media.loop = data["loop"]
        media.volume = data["volume"]
        media.volumeAfterLoop = data["volumeAfterLoop"]
        media.progress = -1
        
        # On récupère l'objet transcode
        transcode = {}
        if data.get("transcode"):
            transcode = data.get("transcode")
        


        # On simplifie la rotation
        if not isinstance(transcode, dict):
            transcode = {
                "rotate": 0
            }
        
        rotate_value = transcode.get("rotate", 0)
        try:
            rotate_value = int(rotate_value)
        except (ValueError, TypeError):
            rotate_value = 0
        
        if rotate_value not in {0, 90, 180, 270}:
            rotate_value = 0
        
        transcode["rotate"] = rotate_value



        # On stocke l'objet du fichier
        file = request.files["file"]

        # On génère un nom de fichier temporaire
        extension = file.filename.rsplit(".")[-1].lower()

        # On génère un nom de fichier pour notre média
        filename = generate_guid()
        
        # On check les extensions
        if extension=="jpg" or extension=="jpeg" or extension=="png" or extension=="bmp" or extension=="webp":
            try:
                # On ouvre l'image
                picture_bytes = file.read()
                image = Image.open(BytesIO(picture_bytes))

                # On pivote l'image
                image = image.rotate(0-transcode["rotate"], expand=True)

                # On redimensionne l'image pour le main et pour la miniature
                w,h = image.size
                main_w,main_h = ResizeMaximal(w, h, 2000)
                tmb_w,tmb_h = ResizeMaximal(w, h, 120)

                imgMain = image.resize((main_w,main_h))
                imgTmb = image.resize((tmb_w,tmb_h))

                # On enregistre l'image
                filename_main = filename + ".webp"
                filename_tmb = filename + ".tmb.webp"
                imgMain.save(config["directories"]["medias"]+"/"+filename_main, quality=65)
                imgTmb.save(config["directories"]["medias"]+"/"+filename_tmb, quality=55)

                image.close()
                imgMain.close()
                imgTmb.close()
            except Exception as e:
                abort(500, description=e)
            finally:
                media.path = filename_main
                media.tmb = filename_tmb
                media.progress = 100 # L'image est déjà convertie

                # On crée le fichier méta
                metadata = {
                    "media_id": media.id
                }
                meta_path = config["directories"]["medias"]+"/" + filename + ".meta.txt"
                with open(meta_path, "w") as meta_file:
                    json.dump(metadata, meta_file, indent=4)

        elif extension=="mov" or extension=="mp4" or extension=="mkv" or extension=="avi" or extension=="webm":
            try:
                # On sauvegarde le fichier renommé avec son extension
                filename_main = filename + "." + extension
                file.save(config["directories"]["mediasTmp"]+"/"+filename_main)

            except Exception as e:
                abort(500, description=e)
            finally:
                media.path = filename_main
                media.tmb = None
                media.progress = -1 # L'image est en attente de conversion

                # On crée le fichier méta
                metadata = {
                    "media_id": media.id,
                    "transcode": transcode
                }
                meta_path = config["directories"]["mediasTmp"]+"/" + filename + ".meta.txt"
                with open(meta_path, "w") as meta_file:
                    json.dump(metadata, meta_file, indent=4)
                
        else:
            abort(400, description="Mauvaise extension de fichier pour le fichier média.")

    elif media.type=="web":
        media.channel = data["webChannel"]
        media.path = data["url"]
        media.progress = 100 # Pas de traitement pour les médias

    # On ajoute le média à la base
    session.add(media)

    # On stocke les objets modifiés pour le websocket
    modified_objects = [model_to_dict(obj) for obj in session.dirty]

    # Stockage en bdd
    session.commit()

    # On envoie la liste des objets modifés en socket
    socketio.emit("conductor_command", conductorWebSocketBase(action="insert", conductor=cond_guid, data_line=None, data_media=modified_objects))

    # On renvoie le média
    return jsonify(model_to_dict(media))


@bp.route("/api/conductor/<string:cond_guid>/medias/<string:media_guid>", methods=["PATCH"])
@login_required
def api_conductorsMediaEdit(cond_guid, media_guid):
    # On check si le conducteur existe
    conductor = session.query(Conductor).filter(Conductor.id == cond_guid).first()
    if conductor==None:
        abort(404, description="Le conducteur n'existe pas")
    
    # On check si le media existe
    media = session.query(Media).filter(Media.id == media_guid).first()
    if media==None:
        abort(404, description="Le média n'existe pas")
        
    if request.is_json:
        data = request.json

        if "type" in data:
            media.type = data["type"]
        if "name" in data:
            media.name = data["name"]
        if media.type=="web" and "url" in data:
            media.path = data["url"]
        if "source" in data:
            media.source = data["source"]
        if "loop" in data:
            media.loop = data["loop"]
        if "volume" in data:
            media.volume = data["volume"]
        if "volumeAfterLoop" in data:
            media.volumeAfterLoop = data["volumeAfterLoop"]
        if "mediaChannel" in data and media.type=="media":
            media.channel = data["mediaChannel"]
        if "mediaChannel" in data and media.type=="web":
            media.channel = data["webChannel"]
        
        session.merge(media)
        session.commit()

        # On envoie le média modifié en socket
        socketio.emit("conductor_command", conductorWebSocketBase(action="edit", conductor=conductor.id, data_line=None, data_media=[model_to_dict(media)]))

        # On renvoie l'objet modifié
        return jsonify(model_to_dict(media))
    else:
        abort(400, description="La requête doit être une requête JSON.")


@bp.route("/api/conductor/media/<string:media_guid>", methods=["GET"])
@login_required
def api_conductorsLineMediaGet(media_guid):
    # On check si la ligne existe
    media = session.query(Media).filter(Media.id == media_guid).first()
    if media==None:
        abort(404)
    
    # On renvoie la ligne
    return jsonify(model_to_dict(media))


@bp.route("/api/conductor/media/update/<string:media_guid>", methods=["GET"])
def api_conductorsMediasUpdate(media_guid):
    # On vérifie que le média existe
    media = session.query(Media).filter(Media.id == media_guid).first()
    if media==None:
        abort(404, description="Media introuvable")
    
    # On envoie le média en websocket
    # On envoie le média modifié en socket
    socketio.emit("conductor_command", conductorWebSocketBase(action="edit", conductor=media.line.conductor_id, data_line=None, data_media=[model_to_dict(media)]))

    # On retourne le média
    return jsonify(model_to_dict(media))


@bp.route("/api/conductor/medias/<string:line_guid>/orders", methods=["PATCH"])
@login_required
def api_conductorsMediasReorder(line_guid):
    # On check si la ligne de conducteur existe
    line = session.query(Line).filter(Line.id == line_guid).first()
    if line==None:
        abort(404, description="Cette ligne n'existe pas")
        
    if request.is_json:
        data = request.json
        
        compiledOrder = {}

        for l in data:
            if not "id" in l or not "order" in l:
                abort(400, description="L'objet JSON doit-être une liste d'objets étants uniquement constitués de valeurs id et order.")
            else:
                compiledOrder[l["id"]] = l["order"]
        
        # On liste les médias
        medias = session.query(Media).filter(Media.line_id == line_guid).order_by(Media.order).all()

        for media in medias:
            if media.id in compiledOrder:
                media.order = compiledOrder[media.id]
                session.merge(media)
        
        session.commit()

        # Maintenant on liste les lignes et on affiche
        medias = session.query(Media).filter(Media.line_id == line_guid).order_by(Media.order).all()
        medias_to_send = [model_to_dict(obj) for obj in medias]

        # On envoie les lignes réordonnées au socket
        socketio.emit("conductor_command", conductorWebSocketBase(action="reorder", conductor=line.conductor_id, data_line=None, data_media=medias_to_send))

        return jsonify(medias_to_send)
    else:
        abort(400, description="La requête doit être une requête JSON.")


@bp.route("/api/conductor/<string:cond_guid>/media/<string:media_guid>", methods=["DELETE"])
@login_required
def api_conductorsMediaDelete(cond_guid, media_guid):
    # On check si le conducteur existe
    cond = session.query(Conductor).filter(Conductor.id == cond_guid).first()
    if cond==None:
        abort(404, description="Ce conducteur n'existe pas.")
    
    # On check si le média existe
    media = session.query(Media).filter(Media.id == media_guid).first()
    if media==None:
        abort(404, description="Ce média n'existe pas.")
    
    # On supprime la ligne
    session.delete(media)

    # Maintenant on renvoie le média supprimé
    media_to_send = [model_to_dict(media)]

    session.commit()

    # On envoie le média supprimé
    socketio.emit("conductor_command", conductorWebSocketBase(action="delete", conductor=cond.id, data_line=None, data_media=media_to_send))
    return jsonify(media_to_send)




@bp.route("/api/conductors/<string:cond_guid>/medias/<string:media_guid>/armtake", methods=["POST"])
@login_required
def mediaBroadcast(cond_guid, media_guid):
    # On vérifie si le conducteur éxiste
    conductor = session.query(Conductor).filter(Conductor.id == cond_guid).first()
    if not conductor:
        abort(404, description="Ce conducteur est introuvable.")
    
    # On vérifie si le média éxiste
    media = session.query(Media).filter(Media.id == media_guid).first()
    if not media:
        abort(404, description="Ce canal est introuvable.")
    
    if request.is_json:
        data = request.json

        # On prépare les paramètres de surcharge
        surcharge = {
        }

        if "surcharge" in data:
            dataSurcharge = data["surcharge"]
            if isinstance(dataSurcharge, dict):
                if "volume" in dataSurcharge and isinstance(dataSurcharge["volume"], (int, float)):
                    surcharge["volume"] = dataSurcharge["volume"]
                if "startFrom" in dataSurcharge and isinstance(dataSurcharge["startFrom"], (int, float)):
                    surcharge["startFrom"] = dataSurcharge["startFrom"]

        # On met à jour le champ média
        conductor.currentMedia = media.id
        
        # Building viewers list
        viewers_list = media.channel.split(",")

        # Building args list
        args = {}
        if media.type=="media":
            ext = media.path.split(".")[-1]
            # IMAGE
            if ext=="webp":
                args = {
                    "type": "picture",
                    "src": "/"+config["directories"]["medias"]+"/"+media.path,
                    "source": media.source,
                    "volume": None,
                    "volumeAfterLoop": None,
                    "loop": None,
                    "surcharge": surcharge
                }
            # VIDEO
            else:
                args = {
                    "type": "video",
                    "src": "/"+config["directories"]["medias"]+"/"+media.path,
                    "source": media.source,
                    "volume": media.volume,
                    "volumeAfterLoop": media.volumeAfterLoop,
                    "loop": media.loop,
                    "surcharge": surcharge
                }
        else:
            args = {
                "type": "web",
                "src": media.path,
                "surcharge": surcharge
            }

            # On met à jour le media web
            conductor.currentMediaWeb = media.id
        
        # On ajoute le mediaID à la trame
        args["mediaID"] = media.id

        # Building websocket object
        object_to_send = {
            "command": "armtake",
            "viewer": viewers_list,
            "args": args
        }

        # On met à jour le conducteur
        session.merge(conductor)

        # Sending object
        socketio.emit("media_command", object_to_send)

        # Sending information to media command
        socketio.emit("conductor_command", conductorWebSocketBase(action="currentMedia", conductor=conductor.id, data_line=None, data_media=model_to_dict(media)))


        # On crée un nouvel évènement
        if media.type=="media":
            newEvent = createNewEvent(conductor.show_id, "media.start", "Starting media \"{}\"".format(media.name))
        elif media.type=="web":
            newEvent = createNewEvent(conductor.show_id, "web.start", "Displaying web page \"{}\"".format(media.name))
        
        session.add(newEvent)

        # On met à jour la DB
        session.commit()


        return model_to_dict(media)

    else:
        abort(400, description="La requête doit être une requête JSON.")




@bp.route("/api/conductors/<string:cond_guid>/medias/<string:media_guid>/stop")
@login_required
def mediaStop(cond_guid, media_guid):
    # On vérifie si le conducteur éxiste
    conductor = session.query(Conductor).filter(Conductor.id == cond_guid).first()
    if not conductor:
        abort(404, description="Ce conducteur est introuvable.")
    
    # On vérifie si le média éxiste
    media = session.query(Media).filter(Media.id == media_guid).first()
    if not media:
        abort(404, description="Ce canal est introuvable.")
    
    # On met à jour le champ média
    conductor.currentMedia = ""
    conductor.currentMediaWeb = ""
    
    # Building viewers list
    viewers_list = media.channel.split(",")

    # Building args list
    args = {
        "mediaID": media.id
    }
    
    # Building websocket object
    object_to_send = {
        "command": "stop",
        "viewer": viewers_list,
        "args": args
    }

    # On met à jour le conducteur
    session.merge(conductor)

    # Sending object
    socketio.emit("media_command", object_to_send)

    # Sending information to media command
    socketio.emit("conductor_command", conductorWebSocketBase(action="currentMedia", conductor=conductor.id, data_line=None, data_media=False))


    # On crée un nouvel évènement
    if media.type=="media":
        newEvent = createNewEvent(conductor.show_id, "media.stop", "Stopping media \"{}\"".format(media.name))
    elif media.type=="web":
        newEvent = createNewEvent(conductor.show_id, "web.stop", "Stopping web page \"{}\"".format(media.name))
    
    session.add(newEvent)

    # On met à jour la DB
    session.commit()
    
    return model_to_dict(media)




@bp.route("/api/conductors/<string:cond_guid>/medias")
@login_required
def mediasStatus(cond_guid):

    # On vérifie si le conducteur éxiste
    conductor = session.query(Conductor).filter(Conductor.id == cond_guid).first()
    if not conductor:
        abort(404, description="Ce conducteur est introuvable.")
    
    status = {}

    # On récupère les médias
    medias = (
        session.query(Media)
        .join(Line, Media.line_id == Line.id)
        .join(Conductor, Line.conductor_id == Conductor.id)
        .filter(Conductor.id == conductor.id)
        .all()
    )

    for m in medias:
        status[m.id] = model_to_dict(m)
    
    return status


@bp.route("/api/summary/<string:show_guid>", endpoint="showSummary")
@bp.route("/api/summary/<string:show_guid>/all", endpoint="showSummaryAll")
def showSummary(show_guid):
    # On vérifie si l'émission éxiste
    show = session.query(Show).filter(Show.id == show_guid).first()
    if not show:
        abort(404, description="Cette émission est introuvable.")
    
    # On récupère le conducteur en cours
    conductor = getActiveConductor(show.id)

    if conductor:
        # On liste le sommaire
        query = session.query(Line).filter(Line.conductor_id == conductor.id)
        if not request.path.endswith("/all"):
            query = query.filter(Line.highlight == True)
        lines = query.order_by(Line.order).all()

        summary = []
        nextHighlight = None # Stockage de la prochaine ligne HIGHLIGHT non cochée
        lastHighlight = None # Stockage de la dernière ligne HIGHLIGHT cochée

        virtualOrder = 1
        for l in lines:
            currentLine = {
                "id": l.id,
                "title": l.name,
                "text": l.text,
                "highlight": l.highlight,
                "done": l.done,
                "order": virtualOrder
            }
            summary.append(currentLine)

            if nextHighlight is None and l.done==False and l.highlight==True:
                nextHighlight = currentLine

            if l.done==True and l.highlight==True:
                lastHighlight = currentLine

            virtualOrder += 1
        
        cleanedConductor = model_to_dict(conductor)
        cleanedConductor["guests"] = conductor.guestsList
        del cleanedConductor["vdoEnable"]
        del cleanedConductor["vdoPassword"]

        cleanedShow = model_to_dict(show)
        cleanedShow["roles"] = show.rolesList

        output = {
            "show": cleanedShow,
            "activeConductor": cleanedConductor,
            "summary": summary,
            "nextHighlight": nextHighlight,
            "lastHighlight": lastHighlight
        }
        
        return jsonify(output)
    else:
        abort(204, description="Cette émission n'a aucun conducteur actif.")

    
    return ""



@bp.route("/api/guests/<string:show_guid>", endpoint="showGuests")
def showGuests(show_guid):
    # On vérifie si l'émission éxiste
    show = session.query(Show).filter(Show.id == show_guid).first()
    if not show:
        abort(404, description="Cette émission est introuvable.")
    
    # On récupère le conducteur en cours
    conductor = getActiveConductor(show.id)

    if conductor:
        # On récupère la liste des guests
        output = {
            "name": conductor.name,
            "date": conductor.date.isoformat(),
            "guests": conductor.guestsList
        }
        
        return jsonify(output)
    else:
        abort(204, description="Cette émission n'a aucun conducteur actif.")

    
    return ""
