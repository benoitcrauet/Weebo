import os
from flask import Blueprint, render_template, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import desc
import locale
import time
import psutil

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



diskUsage = {}
appUsage = {}
appUsageMB = {}
diskUsageLastUpdate = 0

def updateAllDiskStats():
    global diskUsage, diskUsageLastUpdate, appUsage, appUsageMB
    
    currentTime = time.time()

    # Si la dernière update remonte à plus de 60 secondes
    if currentTime-diskUsageLastUpdate > 60:
        diskUsage = get_disk_usage("GB", 2)
        appUsage = get_app_usage("GB", 2)
        appUsageMB = get_app_usage("MB", 2)
        diskUsageLastUpdate = currentTime


@bp.route("/server/diskusage", methods=["GET"])
def diskUsage():
    global diskUsage, diskUsageLastUpdate, appUsage, appUsageMB

    updateAllDiskStats()
    
    diskUsage["percentage"] = round(diskUsage["percentage"], 2)
    diskUsage["withoutApp"] = round(diskUsage["used"] - appUsage["total"], 2)

    appUsage["percentage"] = round((appUsage["total"]/diskUsage["capacity"])*100, 2)

    return render_template("server/diskUsage.jinja2", diskUsage=diskUsage, appUsage=appUsage, appUsageMB=appUsageMB)


@bp.route("/server/resources", methods=["GET"])
def resources():
    # On récupère le nombre de coeurs physiques et logiques
    coresPhysical = psutil.cpu_count(logical=False)
    coresLogical = psutil.cpu_count(logical=True)

    freq = psutil.cpu_freq()
    
    coresPercent = psutil.cpu_percent(interval=0.5, percpu=True)
    globalPercent = psutil.cpu_percent(interval=0.5, percpu=False)

    ram = psutil.virtual_memory()

    cpu = {
        "percentage": globalPercent,
        "frequency": {
            "current": freq.current,
            "min": freq.min,
            "max": freq.max,
        },
        "cores": {
            "physical": coresPhysical,
            "logical": coresLogical
        }
    }

    cores = []
    for c in range(coresPhysical):
        core = {
            "number": c,
            "frequency": 2,
            "percentage": coresPercent[c]
        }
        cores.append(core)

    ram = {
        "total": convert_file_size(ram.total, "B", "GB", 2),
        "used": convert_file_size(ram.used, "B", "GB", 2),
        "percentage": round((ram.used/ram.total)*100, 2)
    }
    ram["free"] = round(ram["total"]-ram["used"], 2)

    return render_template("server/resources.jinja2", cpu=cpu, cores=cores, ram=ram)



@bp.route("/api/server/diskusage", methods=["GET"])
def api_diskUsage():
    global diskUsage, diskUsageLastUpdate, appUsage

    updateAllDiskStats()
    
    output = {
        "diskUsage": diskUsage,
        "appUsage": appUsage
    }
    
    return jsonify(output)




