import os
from flask import Blueprint, render_template, request
from datetime import datetime, timedelta
from sqlalchemy import desc
import locale

from lib.socketio import SocketIOInstance
from lib.guid import generate_guid
from lib.mime import get_mime, mime_extract_type
from lib.config import config
from lib.db import session
from lib.models import Conductor

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


@bp.route("/")
def home():
    # Date avant laquelle il ne faut pas afficher les conducteurs
    threshold_date = datetime.now() - timedelta(days=14)

    # On récupère les derniers conducteurs en date
    conductors = session.query(Conductor).filter(Conductor.type == "operational").order_by(
        desc(Conductor.year),
        desc(Conductor.month),
        desc(Conductor.day)
    ).limit(4).all();

    # Trier les résultats par la propriété virtuelle date en utilisant Python
    conductors = sorted(conductors, key=lambda x: x.date, reverse=True)

    return render_template("home.jinja2", conductors=conductors)





