import os
from flask import Blueprint, render_template, request, abort, redirect, url_for, jsonify
from flask_socketio import SocketIO
from flask_wtf import FlaskForm
from flask_cors import CORS
from flask_login import login_required
import wtforms
import wtforms.validators as validators
from sqlalchemy import asc

from lib.socketio import SocketIOInstance
from lib.guid import generate_guid
from lib.mime import get_mime, mime_extract_type
from lib.config import config
from lib.db import session
from lib.models import MediaChannel, WebChannel, Show, Media, Conductor, Line
from lib.dict import model_to_dict
from lib.users import for_admins

bp = Blueprint(os.path.splitext(os.path.basename(__file__))[0], __name__)

app = None
socketio = None
def init(flaskapp):
    global app, bp, socketio
    app = flaskapp
    socketio = SocketIOInstance().socketio
    CORS(app, origin="*")

    app.register_blueprint(bp)


@bp.route("/links")
@login_required
def linksShows():
    shows = session.query(Show).all()
    return render_template("links/linksShows.jinja2", shows=shows)


@bp.route("/links/<string:show_guid>")
@login_required
def linksList(show_guid):
    # On test si l'émission existe
    show = session.query(Show).filter(Show.id == show_guid).first()
    if not show:
        abort(404, description="Cette émission n'existe pas.")
    
    # On récupère les canaux médias
    mediaChannels = session.query(MediaChannel).filter(MediaChannel.show_id == show.id).order_by(MediaChannel.name).all()
    
    # On récupère les canaux web
    webChannels = session.query(WebChannel).filter(WebChannel.show_id == show.id).order_by(WebChannel.name).all()

    # Caméras
    cameras = []
    for i in range(10):
        # On fabrique le lien permanent
        permalink = url_for("conductors.vdoPermalink", show_guid=show.id, cam_number=i+1)
        permalinkCapture = url_for("conductors.vdoPermalink_screencapture", show_guid=show.id, cam_number=i+1)

        cameras.append({
            "number": i+1,
            "permalink": permalink,
            "permalink_capture": permalinkCapture
        })

    
    return render_template("links/linksList.jinja2", show=show, mediaChannels=mediaChannels, webChannels=webChannels, cameras=cameras, config=config)

