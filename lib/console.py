import time
import os
import sys
from colorama import Fore, Back, Style

from lib.config import config
from lib.file import clean_media_dir
from lib.db import session
from lib.models import User
from lib.password import generate_password



def reinit_database():
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

            db_file = config["database"]["file"]

            if os.path.exists(db_file):
                print(f"Suppression du fichier '{db_file}'...")
                print("")
                os.remove(db_file)
                time.sleep(1)
            
            # Suppression des médias
            print(f"Nettoyage des répertoires...")
            time.sleep(0.5)
            print("  > Répertoire des images : {}/".format(config["directories"]["images"]))
            clean_media_dir(config["directories"]["images"])
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
            print("Création de l'administrateur...")
            time.sleep(1)

            from lib.db import session
            from lib.models import User
            from lib.password import generate_password

            newPassword = generate_password(16)

            newUser = User()
            newUser.firstname = "Super"
            newUser.lastname = "Admin"
            newUser.username = "admin"
            newUser.password = newPassword
            newUser.active = True
            newUser.isAdmin = True

            session.add(newUser)
            session.commit()
            print(" ")
            print("  > Login administrateur:        {}".format(newUser.username))
            print("  > Mot de passe administrateur: {}".format(newPassword))
            print(" ")
            print("Pensez à changer ce mot de passe !")

            time.sleep(1)


            print("✅ Terminé.")

            exit(0)

        else:
            print("🚫 Abandon.")
            exit(0)
    else:
        print("🚫 Abandon.")
        exit(0)



def reinit_user(username):
    # On cherche l'utilisateur
    user = session.query(User).filter(User.username == username).first()

    if user:
        print("Vous souhaitez modifier le mot de passe de ce compte :")
        print("- Login : {}".format(user.username))
        print("- Nom   : {} {}".format(user.firstname, user.lastname))
        print("- Admin : {}".format("yes" if user.isAdmin else "no"))
        print("- Actif : {}".format("yes" if user.isAdmin else "no"))
        print("")

        userNewPassword = False
        userActivate = False
        userAdmin = False

        print("")
        confirm = input("Voulez-vous générer un nouveau mot de passe pour cet utilisateur ? [yN] ")
        if confirm.upper()=="Y":
            userNewPassword = True


        if not user.active:
            print("")
            confirm = input("Voulez-vous activer ce compte utilisateur ? [yN] ")
            if confirm.upper()=="Y":
                userActivate = True


        if not user.isAdmin:
            confirm = input("Voulez-vous faire de cet utilisateur un administrateur ? [yN] ")
            if confirm.upper()=="Y":
                userAdmin = True
            

        if userNewPassword or userActivate or userAdmin:
            print("")
            print("Vous vous apprêtez à faire les modifications suivantes sur le compte {} :".format(user.username))

            if userNewPassword:
                print("- Nouveau mot de passe")

            if userActivate:
                print("- Activation du compte")

            if userAdmin:
                print("- Passage du compte en administrateur")
            
            confirm = input("Confirmez-vous ces modifications ? [yN] ")
            if confirm.upper()=="Y":
                print("")
                if userNewPassword:
                    newPassword = generate_password(16)
                    user.password = newPassword
                    print("- Nouveau mot de passe de l'utilisateur : {}".format(newPassword))

                if userActivate:
                    user.active = True

                if userAdmin:
                    user.isAdmin = True
                
                session.merge(user)
                session.commit()
                
                print("")
                print("✅ Terminé.")
                time.sleep(1)

    else:
        print("❌ {}: cet identifiant n'existe pas.".format(username))



def create_admin():
    # On cherche l'utilisateur admin
    user = session.query(User).filter(User.username == "admin").first()

    if not user:
        confirm = input("Voulez-vous créer un compte admin ? [yN] ")
        if confirm.upper()=="Y":
            print("")
            print("Création du compte admin en cours...")
            print("")

            newPassword = generate_password(16)

            newAdmin = User()
            newAdmin.username = "admin"
            newAdmin.firstname = "Super"
            newAdmin.lastname = "Admin"
            newAdmin.active = True
            newAdmin.isAdmin = True
            newAdmin.password = newPassword

            session.add(newAdmin)
            session.commit()

            time.sleep(1);

            print("Compte admin créé :")
            print("Login        : {}".format(newAdmin.username))
            print("Mot de passe : {}".format(newPassword))
            print("")
            print("✅ Terminé.")


    else:
        print("❌ L'utilisateur admin existe déjà.")

