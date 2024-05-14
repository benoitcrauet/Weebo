from flask import Flask, send_from_directory
from flask_socketio import SocketIO
from flask_cors import CORS
import time
import os
import logging
from gevent import pywsgi
from geventwebsocket.handler import WebSocketHandler

from lib.config import config
from lib.arguments import arguments


######################
##### MODULE WEB #####
######################

def main():
    
    # Initialisation du serveur web
    app = Flask("modules.web")
    app.config["SECRET_KEY"] = config["web_secret_key"]
    CORS(app, origins="*") # CORS from all

    # Ajouter une règle de route pour servir les fichiers statiques du dossier '/medias'
    @app.route('/medias/<path:filename>')
    def medias_static(filename):
        root_path = os.path.dirname(os.path.abspath(__file__))
        medias_folder = os.path.abspath(os.path.join(root_path, "..", "..", "medias"))
        return send_from_directory(medias_folder, filename)


    # Ajouter une règle de route pour servir les fichiers statiques du dossier '/images'
    @app.route('/images/<path:filename>')
    def images_static(filename):
        root_path = os.path.dirname(os.path.abspath(__file__))
        medias_folder = os.path.abspath(os.path.join(root_path, "..", "..", "images"))
        return send_from_directory(medias_folder, filename)


    # Import des sous-modules de controleurs
    from .controllers import home, channels, shows, conductors
    home.init(app)
    channels.init(app)
    shows.init(app)
    conductors.init(app)

    #app.run(debug=(arguments.debug), host=config["web_host"], port=config["web_port"]) #, ssl_context="adhoc")


    server = pywsgi.WSGIServer(('127.0.0.1', 8000), app, handler_class=WebSocketHandler)
    server.serve_forever()


