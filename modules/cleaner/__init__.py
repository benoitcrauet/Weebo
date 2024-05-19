import sys
import time
from colorama import init, Fore, Back, Style
from datetime import datetime

from lib.db import session
from lib.models import Conductor
from lib.config import config


# Suppression des anciens conducteurs
def deleteOldConductors(daysLimit):
    # On liste tous les conducteurs
    conductors = session.query(Conductor).filter(Conductor.type=="operational").all()

    # On récupère la date actuelle
    currentTime = datetime.now()
    
    deletedItems = 0
    for c in conductors:
        old = currentTime-c.date

        print("Conducteur \"{}\" - ancienneté {} jours.".format(c.name, old.days))
        # Si le conducteur est trop vieux...
        if old.days > int(daysLimit):
            # On supprime le conducteur
            print("    > Suppression !")
            session.delete(c)
            deletedItems += 1
    
    # On applique les changements
    session.commit()


# Routine de nettoyage
def cleanAll():

    print("Suppression conducteurs vieux de {} jours...".format(config["conductor_retention"]))
    deleteOldConductors(config["conductor_retention"])
    time.sleep(1);

    print("Terminé.")



# Thread du module
def main():
    print("Starting cleaner thread...")
    cleanAll()

    while True:
        currentTime = datetime.now()

        # Si il est l'heure configurée, on clean
        if currentTime.hour == config["cleaner_schedule"] and currentTime.minute == 0:
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
