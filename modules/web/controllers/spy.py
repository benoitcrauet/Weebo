import os
from flask import Blueprint, render_template, request, abort, jsonify
from datetime import datetime, timedelta
from sqlalchemy import desc
import locale

from lib.socketio import SocketIOInstance
from lib.guid import generate_guid
from lib.mime import get_mime, mime_extract_type
from lib.config import config
from lib.db import session
from lib.dict import model_to_dict
from lib.models import Conductor, Show, Event
from lib.conductors import getActiveConductor
from lib.events import createNewEvent

bp = Blueprint(os.path.splitext(os.path.basename(__file__))[0], __name__)

app = None
socketio = None
def init(flaskapp):
    global app, bp
    app = flaskapp
    socketio = SocketIOInstance().socketio
    app.register_blueprint(bp)


# Définit la locale française
locale.setlocale(locale.LC_TIME, 'fr_FR.UTF-8')


@bp.route("/spy/<string:show_guid>")
def spy(show_guid):
    # On vérifie que l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if not show:
        conductor = None
    else:
        # On récupère le conducteur actif
        conductor = getActiveConductor(show.id)

    return render_template("spy/spy.jinja2", show=show, conductor=conductor)


@bp.route("/api/spy/<string:show_guid>/obsStatus", methods=["PATCH"])
def setStatus(show_guid):
    # On vérifie que l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if not show:
        conductor = None
        abort(404)
    else:
        # On récupère le conducteur actif
        conductor = getActiveConductor(show.id)
    
        if conductor:

            try:
                # On ouvre le corps data
                data = request.json

                if "recording" in data and isinstance(data["recording"], bool):
                    # On crée l'évènement seulement s'il y a un changement
                    if not conductor.recording == data["recording"]:
                        conductor.recording = data["recording"]

                        # On crée le nouvel évènement
                        eventType = "recording.{}".format("start" if data["recording"] else "stop")
                        eventDesc = "{} recording".format("Start" if data["recording"] else "Stop")
                        newEvent = createNewEvent(show.id, eventType, eventDesc)

                        session.add(newEvent)

                elif "streaming" in data and isinstance(data["streaming"], bool):
                    # On crée l'évènement seulement s'il y a un changement
                    if not conductor.streaming == data["streaming"]:
                        conductor.streaming = data["streaming"]

                        # On crée le nouvel évènement
                        eventType = "streaming.{}".format("start" if data["streaming"] else "stop")
                        eventDesc = "{} streaming".format("Start" if data["streaming"] else "Stop")
                        newEvent = createNewEvent(show.id, eventType, eventDesc)

                        session.add(newEvent)
                
                elif "currentScene" in data and isinstance(data["currentScene"], str):
                    # On crée l'évènement
                    newEvent = createNewEvent(show.id, "scene.change", "Switching to scene \"{}\"".format(data["currentScene"]))
                    session.add(newEvent)

                
                # On enregistre les modifications DB
                session.commit();

                # On renvoie l'objet d'input
                return jsonify(data), 200

            except Exception as e:
                print(e)
                return jsonify({"error": str(e)}), 400
        else:
            abort(503)
        
        abort(500)


