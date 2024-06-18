import os
from flask import Blueprint, render_template, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import desc
import locale
import time

from lib.socketio import SocketIOInstance
from lib.guid import generate_guid
from lib.mime import get_mime, mime_extract_type
from lib.config import config
from lib.db import session
from lib.models import Conductor
from lib.disk import get_disk_usage, get_app_usage, convert_file_size

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




@bp.route("/diskusage", methods=["GET"])
def diskUsage():
    diskUsage = get_disk_usage("GB", 2)
    appUsage = get_app_usage("GB", 2)
    
    diskUsage["percentage"] = round(diskUsage["percentage"], 2)

    appUsage["percentage"] = round((appUsage["total"]/diskUsage["capacity"])*100, 2)

    appUsageMB = get_app_usage("MB", 2)

    return render_template("disk/diskUsage.jinja2", diskUsage=diskUsage, appUsage=appUsage, appUsageMB=appUsageMB)




diskUsage = {}
appUsage = {}
diskUsageLastUpdate = 0
@bp.route("/api/diskusage", methods=["GET"])
def api_diskUsage():
    global diskUsage, diskUsageLastUpdate, appUsage

    currentTime = time.time()

    # Si la dernière update remonte à plus de 60 secondes
    if currentTime-diskUsageLastUpdate > 60:
        diskUsage = get_disk_usage("GB")
        appUsage = get_app_usage("GB")
        diskUsageLastUpdate = currentTime
    
    output = {
        "diskUsage": diskUsage,
        "appUsage": appUsage
    }
    
    return jsonify(output)




