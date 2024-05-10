from flask import Flask, send_from_directory
import time
import os

from lib.config import config
from lib.arguments import arguments

import lib.picture
######################
##### MODULE WEB #####
######################


# Initialisation du serveur web
app = Flask(__name__)
app.config["SECRET_KEY"] = config["web_secret_key"]


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

app.run(debug=(arguments.debug), host=config["web_host"], port=config["web_port"]) #, ssl_context="adhoc")

def main():
    pass