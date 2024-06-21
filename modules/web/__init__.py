from flask import Flask, send_from_directory, abort, request, Response
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import sys
import os
from gevent import pywsgi
from geventwebsocket.handler import WebSocketHandler
from colorama import Back, Fore, Style

from lib.config import config
from lib.socketio import SocketIOInstance
from lib.db import session
from lib.models import User


######################
##### MODULE WEB #####
######################

def parse_range_header(range_header, file_size):
    # Fonction utilitaire pour analyser l'en-tête Range et retourner les positions de début et de fin
    ranges = range_header.strip().lower().replace('bytes=', '').split('-')
    start = int(ranges[0]) if ranges[0] else 0
    end = int(ranges[1]) if ranges[1] else file_size - 1
    return start, end

def main():
    print("Starting web thread...")
    
    # Initialisation du serveur web
    app = Flask("modules.web")
    app.config["SECRET_KEY"] = config["web"]["secretKey"]
    socketio = SocketIOInstance(app)
    CORS(app, origins="*") # CORS from all


    # Configuration du login manager
    login_manager = LoginManager(app)
    login_manager.login_view = "users.login"


    # Manière dont on récupère l'utilisateur courant
    @login_manager.user_loader
    def load_user(user_id):
        return session.query(User).filter(User.active == True).filter(User.id == user_id).first()


    # Ajouter une règle de route pour servir les fichiers statiques du dossier '/medias'
    @app.route('/medias/<path:filename>')
    def medias_static(filename):
        root_path = os.path.dirname(os.path.abspath(__file__))
        medias_folder = os.path.abspath(os.path.join(root_path, "..", "..", config["directories"]["medias"]))
        return send_from_directory(medias_folder, filename, conditional=False)



    # Ajouter une règle de route pour servir les fichiers statiques du dossier '/images'
    @app.route('/images/<path:filename>')
    def images_static(filename):
        root_path = os.path.dirname(os.path.abspath(__file__))
        medias_folder = os.path.abspath(os.path.join(root_path, "..", "..", config["directories"]["images"]))
        return send_from_directory(medias_folder, filename)


    # Import des sous-modules de controleurs
    from .controllers import users, home, channels, shows, conductors, links, jingles, spy, events, server
    users.init(app)
    home.init(app)
    channels.init(app)
    shows.init(app)
    conductors.init(app)
    links.init(app)
    jingles.init(app)
    spy.init(app)
    events.init(app)
    server.init(app)
    
    server = pywsgi.WSGIServer((config["web"]["host"], int(config["web"]["port"])), app, handler_class=WebSocketHandler, log=None)
    server.serve_forever()




def print(*args, **kwargs):
    sep = kwargs.get('sep', ' ')
    end = kwargs.get('end', '\n')
    message = sep.join(map(str, args)) + end
    sys.stdout.write("🌎  " + Back.CYAN + Fore.WHITE + Style.BRIGHT + "[WEB]" + Style.RESET_ALL + " " + message)