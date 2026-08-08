import time
import os
import sys
from datetime import datetime, timedelta
from colorama import Fore, Back, Style

from lib.config import config
from lib.file import clean_media_dir
from lib.db import session
from lib.models import User, Show, MediaChannel, WebChannel, Conductor, Line, Media, Event
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


def generate_fake_data():
    print("Génération des données factices de démonstration...")

    existing = session.query(Show).filter(Show.name == "Émission de démonstration").first()
    if existing:
        print("Des données factices existent déjà. Aucun ajout effectué.")
        return

    today = datetime.now()

    show = Show()
    show.name = "Émission de démonstration"
    show.description = "Une émission de démonstration avec des canaux, des conducteurs, des médias et des événements."
    show.roles = "Présentateur\nInvité\nRéalisation"
    show.tagsNotes = "Utilisez ces tags pour tester les conducteurs."
    show.tagName1 = "Urgent"
    show.tagName2 = "Jingle"
    show.tagName3 = "Visuel"
    show.tagName4 = "Interview"

    media_channel_1 = MediaChannel(name="Écran principal", defaultEnable=True, show=show)
    media_channel_2 = MediaChannel(name="Fond sonore", defaultEnable=False, show=show)
    web_channel_1 = WebChannel(name="Page d'accueil", defaultEnable=True, show=show)
    web_channel_2 = WebChannel(name="Statistiques", defaultEnable=False, show=show)

    conductor = Conductor(
        name="Conducteur de démonstration",
        guests="Alice\nBob\nCharlie",
        vdoEnable=True,
        type="operational",
        recording=False,
        streaming=False,
        year=today.year,
        month=today.month,
        day=today.day,
        vdoPassword="demo1234",
        show=show,
    )

    line_1 = Line(
        name="Rubrique d'ouverture",
        text="Bienvenue dans l'émission de démonstration.",
        order=1,
        done=False,
        highlight=True,
        type="section",
        jingle="",
        tag1="urgent",
        conductor=conductor,
    )
    line_2 = Line(
        name="Présentation de l'équipe",
        text="Présentation des rôles et des intervenants du jour.",
        order=2,
        done=False,
        highlight=False,
        type="classic",
        jingle="jingle_01",
        tag2="présentation",
        conductor=conductor,
    )
    line_3 = Line(
        name="Transition vers l'interview",
        text="Rubrique dédiée à l'arrivée de l'invité principal.",
        order=3,
        done=False,
        highlight=True,
        type="section",
        jingle="",
        conductor=conductor,
    )
    line_4 = Line(
        name="Interview",
        text="Entretien avec l'invité principal autour du thème du jour.",
        order=4,
        done=False,
        highlight=False,
        type="classic",
        jingle="jingle_02",
        tag2="interview",
        conductor=conductor,
    )
    line_5 = Line(
        name="Pause musicale",
        text="Diffusion d'un extrait musical sélectionné pour l'émission.",
        order=5,
        done=False,
        highlight=False,
        type="classic",
        jingle="jingle_03",
        conductor=conductor,
    )
    line_6 = Line(
        name="Rubrique finale",
        text="Conclusion de l'émission et remerciements.",
        order=6,
        done=False,
        highlight=True,
        type="section",
        jingle="",
        conductor=conductor,
    )
    line_7 = Line(
        name="Annonces et liens utiles",
        text="Présentation des ressources et des prochains événements.",
        order=7,
        done=False,
        highlight=False,
        type="classic",
        jingle="jingle_04",
        conductor=conductor,
    )

    media_1 = Media(
        order=1,
        type="web",
        name="Site de l'émission",
        channel=web_channel_1.id,
        path="",
        tmb="",
        source="https://example.com",
        loop=False,
        volume=1.0,
        volumeAfterLoop=1.0,
        line=line_2,
        show=show,
    )
    media_2 = Media(
        order=1,
        type="media",
        name="Vidéo de démonstration",
        channel=media_channel_1.id,
        path="demo.mp4",
        tmb="demo.jpg",
        source="",
        loop=False,
        volume=0.8,
        volumeAfterLoop=0.8,
        line=line_4,
        show=show,
    )
    media_3 = Media(
        order=2,
        type="picture",
        name="Image de couverture",
        channel=media_channel_2.id,
        path="demo.jpg",
        tmb="demo_thumb.jpg",
        source="",
        loop=True,
        volume=1.0,
        volumeAfterLoop=1.0,
        show=show,
    )
    media_4 = Media(
        order=3,
        type="web",
        name="Liens de ressources",
        channel=web_channel_2.id,
        path="",
        tmb="",
        source="https://example.com/ressources",
        loop=False,
        volume=1.0,
        volumeAfterLoop=1.0,
        show=show,
    )

    event_1 = Event()
    event_1.date = datetime.now()
    event_1.description = "Début de l'émission"
    event_1.type = "info"
    event_1.tag = "{}"
    event_1.show = show

    event_2 = Event()
    event_2.date = datetime.now() + timedelta(minutes=5)
    event_2.description = "Interview lancée"
    event_2.type = "marker"
    event_2.tag = "{}"
    event_2.show = show

    session.add_all([
        show,
        media_channel_1,
        media_channel_2,
        web_channel_1,
        web_channel_2,
        conductor,
        line_1,
        line_2,
        line_3,
        media_1,
        media_2,
        media_3,
        event_1,
        event_2,
    ])
    session.commit()

    print("✅ Données factices créées :")
    print("  - émission de démonstration")
    print("  - un conducteur avec des lignes et médias")
    print("  - des canaux média et web")
    print("  - des événements de démonstration")

