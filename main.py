import threading
import os
import time

from lib.config import config
from lib.welcome import welcome
from lib.arguments import arguments


from modules import web, video

welcome()
print()


# En cas de --reinit-database
if arguments.reinit_database:
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
                os.remove(db_file)
                time.sleep(1)
            
            with open(db_file, "a") as f:
                print(f"Création du fichier '{db_file}'...")
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


    thread_web.join()
    thread_vid.join()


