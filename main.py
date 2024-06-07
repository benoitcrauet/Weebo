import threading
import os
import time
import sys
from colorama import Fore, Back, Style

from lib.config import config
from lib.welcome import welcome
from lib.arguments import arguments
from lib.file import clean_media_dir


from modules import web, video, cleaner

welcome()
print()


# En cas d'absence de fichier config
if not os.path.isfile("config.yaml"):
    print("ERREUR :")
    print("Impossible de trouver le fichier config.yaml. Peut-être devriez-vous modifier et renommer le fichier config.sample.yaml ?")
    quit()


# En cas de --reinit-database
if arguments.reinit_database:
    print("Procédure de réinitialisation de la base de données lancée.")
    print("")
    sys.stdout.write(Back.RED + Fore.WHITE + Style.BRIGHT + "⚠️ ATTENTION : Cette suppression est irréversible et entraînera une perte DÉFINITIVE des fichiers liés. ⚠️" + Style.RESET_ALL + "\n\n")
    
    time.sleep(1)
    input_confirm = input("Êtes-vous sûr de vouloir réinitialiser la base de données ? [yN] ")
    if input_confirm.upper()=="Y":
        input_mistake = input("Est-ce que cette suppression est une erreur ? [Yn] ")
        if input_mistake.upper()=="N":

            print("Reinitialisation de la base de données dans 5 sec...")
            time.sleep(5)
            print()

            db_file = config["database_file"]

            if os.path.exists(db_file):
                print(f"Suppression du fichier '{db_file}'...")
                print("")
                os.remove(db_file)
                time.sleep(1)
            
            # Suppression des médias
            print(f"Nettoyage des répertoires...")
            time.sleep(0.5)
            print("  > Répertoire des images : {}/".format(config["images_dir"]))
            clean_media_dir(config["images_dir"])
            time.sleep(0.5)
            print("  > Répertoire des médias : {}/".format(config["directories"]["medias"]))
            clean_media_dir(config["directories"]["medias"])
            time.sleep(0.5)
            print("  > Répertoire temporaire des médias : {}/".format(config["directories"]["mediasTmp"]))
            clean_media_dir(config["directories"]["mediasTmp"])
            time.sleep(1)
            print("")


            
            with open(db_file, "a") as f:
                print(f"Création du fichier '{db_file}'...")
                print("")
                os.utime(db_file, None)
                time.sleep(1)


            from sqlalchemy import create_engine
            from lib.models import Base

            print("Construction de la base de données...")
            engine = create_engine(f"sqlite:///{db_file}", echo=False)
            Base.metadata.create_all(engine)
            engine.dispose()
            time.sleep(1)

            print("Terminé !")

            exit(0)

        else:
            print("Abandon.")
            exit(0)
    else:
        print("Abandon.")
        exit(0)

elif arguments.fake_data:

    import lib.faker as fakedata
    fakedata.fakeDB()
    exit(0)

# Pas de --reinit-database
else:

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


