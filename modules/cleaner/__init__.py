import sys
import time
from colorama import init, Fore, Back, Style
from datetime import datetime
import os

from lib.db import session
from lib.models import Conductor, Event, Show, Media
from lib.config import config


# Suppression des anciens conducteurs
def deleteOldConductors():
    # Stockage des variables de config
    daysLimit = config["cleaner"]["conductorRetention"]

    # On liste tous les conducteurs
    conductors = session.query(Conductor).filter(Conductor.type=="operational").all()

    # On récupère la date actuelle
    currentTime = datetime.now()
    
    for c in conductors:
        old = currentTime-c.date

        print("Conducteur \"{}\" - ancienneté {} jours.".format(c.name, old.days))
        # Si le conducteur est trop vieux...
        if old.days > int(daysLimit):
            # On supprime le conducteur
            print("    > Suppression !")
            session.delete(c)

    
    # On applique les changements
    session.commit()

# Suppression des anciens conducteurs
def deleteOldEvents():
    # Stockage des variables de config
    maxEvents = config["cleaner"]["maxEvents"]

    # On liste tous les conducteurs
    shows = session.query(Show).order_by(Show.name).all()
    
    for s in shows:
        print("Émission \"{}\"".format(s.name))
        
        # On supprime quand même les events trop anciens
        recentEvents = session.query(Event).filter(Event.show_id == s.id).order_by(Event.date.desc()).all()
        recentEvents_ids = [event.id for event in recentEvents]

        eventNbrByShow = {}
        toDelete = 0
        for e in recentEvents:
            if not e.show_id in eventNbrByShow:
                eventNbrByShow[e.show_id] = 0
            
            eventNbrByShow[e.show_id] += 1

            if eventNbrByShow[e.show_id]>maxEvents:
                session.delete(e)
                toDelete += 1
                pass
        
        # On commit toutes les suppressions
        session.commit()

        print("    > Nettoyage des évènements pour conserver les {} derniers.".format(maxEvents))
        print("        > {} évènements supprimés.".format(toDelete))

    
    # On applique les changements
    session.commit()


# Routine de nettoyage des fichiers médias
def deleteMediaFiles():
    medias_dir = "medias/"

    to_delete = []

    print("Medias files auto cleaner.")
    print("Scanning media files...")

    for file in os.listdir(medias_dir):
        if os.path.isfile(os.path.join(medias_dir, file)):
            # On extrait le nom du fichier et la première partie (jusqu'au premier .)
            basename = os.path.basename(file)
            file_id = basename.split(".")[0]

            if file_id!="":
                # On vérifie si ce fichier est toujours référencé dans la base médias
                media = session.query(Media).filter(Media.path.startswith(file_id)).all()

                # Fichier non référencé : on le supprime
                if not media:
                    if file_id not in to_delete:
                        to_delete.append(file_id)
    
    print("Medias files to delete:")
    if len(to_delete)==0:
        print("   > Nothing to delete.")
    else:
        for f in to_delete:
            print("   > 🎯 " + f)
    
        print("Deleting files...")
        for file in os.listdir(medias_dir):
            if os.path.isfile(os.path.join(medias_dir, file)):
                # On extrait le media_id
                basename = os.path.basename(file)
                file_id = basename.split(".")[0]
                path = os.path.join(medias_dir, file)

                if file_id in to_delete:
                    try:
                        os.remove(path)
                        print("   > 🗑️ The file '" + path + "' has been deleted.")
                    except Exception as e:
                        print("   > ‼️ Error while deleting the file '" + path + "': " + str(e))
    
    print("Done.")



# Routine de nettoyage de tous les éléments
def cleanAll():
    print("##### Suppression conducteurs vieux de {} jours... #####".format(config["cleaner"]["conductorRetention"]))
    deleteOldConductors()
    time.sleep(1)

    print("##### Nettoyage des évènements... #####")
    deleteOldEvents()
    time.sleep(1)

    print("##### Nettoyage des fichiers médias... #####")
    deleteMediaFiles()
    time.sleep(1)

    print("Terminé.")


# Thread du module
def main():
    print("Starting cleaner thread...")
    cleanAll()
    print("Cleaner will start cleaning process everyday at {}h (24h format).".format(config["cleaner"]["schedule"]))

    while True:
        currentTime = datetime.now()

        # Si il est l'heure configurée, on clean
        if currentTime.hour == config["cleaner"]["schedule"] and currentTime.minute == 0:
            cleanAll()

        # On attend le début de la minute suivante
        currentTime = datetime.now()
        wait = 60 - currentTime.second + 1
        time.sleep(wait)


def print(*args, **kwargs):
    sep = kwargs.get('sep', ' ')
    end = kwargs.get('end', '\n')
    message = sep.join(map(str, args)) + end
    sys.stdout.write("🧹  " + Back.GREEN + Fore.WHITE + Style.BRIGHT + "[CLEANER]" + Style.RESET_ALL + " " + message)
