import os
from flask import Blueprint, render_template, request, redirect, url_for, abort, jsonify
from flask_wtf import FlaskForm
from flask_wtf.file import FileAllowed
from flask_cors import CORS
from flask_login import login_required
import wtforms
import wtforms.validators as validators
from PIL import Image
from io import BytesIO
from sqlalchemy import func
import json

from lib.socketio import SocketIOInstance
from lib.db import session
from lib.models import Show, Event
from lib.guid import generate_guid
from lib.config import config
from lib.dict import model_to_dict
from lib.events import createNewEvent
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


@bp.route("/events")
@login_required
def shows():
    shows = session.query(Show).all()
    return render_template("events/showsList.jinja2", shows=shows)



@bp.route("/events/<string:show_guid>")
@login_required
def eventsList(show_guid):
    # On vérifie que le show existe bien
    show = session.query(Show).filter(Show.id == show_guid).first()
    if not show:
        abort(404, description="L'émission est introuvable.")
    
    # On liste les évènements de l'émission
    events = session.query(Event).filter(Event.show_id == show.id).order_by(Event.date.asc()).all()

    return render_template("events/eventsList.jinja2", show=show, events=events)


