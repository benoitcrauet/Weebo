import threading
import os
import time
import sys
from colorama import Fore, Back, Style

from lib.config import config
from lib.welcome import welcome
from lib.arguments import arguments
from lib.console import reinit_database, reinit_user, create_admin, generate_fake_data


def _register_heif():
    """Active le décodage HEIC/HEIF dans PIL (photos iPhone récentes).

    Optionnel : si pillow-heif n'est pas installé, Weebo fonctionne mais
    refusera les uploads .heic/.heif.
    """
    try:
        from pillow_heif import register_heif_opener
        register_heif_opener()
    except ImportError:
        print("pillow-heif absent : les photos HEIC/HEIF ne seront pas acceptées.")


def main():

    welcome()
    print()

    # Support des photos HEIC/HEIF (à faire une seule fois, avant les threads)
    _register_heif()

    # En cas d'absence de fichier config
    if not os.path.isfile("config.yaml"):
        print("ERREUR :")
        print("Impossible de trouver le fichier config.yaml. Peut-être devriez-vous modifier et renommer le fichier config.sample.yaml ?")
        quit()


    # En cas de --reinit-database
    if arguments.reinit_database:
        reinit_database()
        exit(0)

    elif arguments.reinit_user:
        reinit_user(arguments.reinit_user)
        exit(0)

    elif arguments.create_admin:
        create_admin()
        exit(0)

    elif arguments.generate_fake_data:
        generate_fake_data()
        exit(0)

    # Pas de --reinit-database
    else:
        from modules import web, video, cleaner

        # Thread web
        thread_web = threading.Thread(target=web.main, args=())
        thread_web.start()

        # Thread video
        thread_vid = threading.Thread(target=video.main, args=())
        thread_vid.start()

        # Thread cleaner
        thread_cle = threading.Thread(target=cleaner.main, args=())
        thread_cle.start()


        thread_web.join()
        thread_vid.join()
        thread_cle.join()


if __name__ ==  "__main__":
    main()
