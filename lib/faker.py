from sqlalchemy.orm import sessionmaker
from faker import Faker
from lib.models import Show, MediaChannel, WebChannel  # Importez la base SQLAlchemy
from lib.db import engine
import time

def fakeDB():
    # Créez une session SQLAlchemy
    Session = sessionmaker(bind=engine)
    session = Session()

    # Créer une instance de Faker
    fake = Faker()

    print("Génération des fake datas en cours...")
    time.sleep(1)

    # User
    for _ in range(10):
        show_name=fake.name()
        show_description = fake.text()
        show = Show(name=show_name, description=show_description)

        # MediaChannel
        for _ in range(1):
            name = fake.name()
            description = fake.text()
            customCSS = ""
            width = 1920
            height = 1080
            show = show

            mediaChannel = MediaChannel(name=name, description=description, customCSS=customCSS, width=width, height=height)
            show.mediasChannels.append(mediaChannel)

        # WebChannel
        for _ in range(1):
            name = fake.name()
            description = fake.text()
            show = show

            webChannel = WebChannel(name=name, description=description)
            show.webChannels.append(webChannel)
        


        session.add(show)
    



    # Ajout de toutes les données en base
    session.commit()
    