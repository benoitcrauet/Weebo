from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, JSON, Float, CheckConstraint, ForeignKey, event
from sqlalchemy.orm import relationship, sessionmaker
import os
from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from lib.db import engine, Base, session
from lib.guid import generate_guid
from lib.config import config
from lib.password import generate_password


class User(UserMixin, Base):
    __tablename__ = "Users"

    id = Column(String, primary_key=True, default=lambda: str(generate_guid()))
    username = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(150), nullable=False)
    firstname = Column(String(50), nullable=False)
    lastname = Column(String(50), nullable=False)
    isAdmin = Column(Boolean, nullable=False)

    active = Column(Boolean, nullable=False)

    @property
    def password(self):
        raise AttributeError("password is not a readable attribute")
    

    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f"<User {self.username}>"
    

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.active:
            self.active = True
        if not self.isAdmin:
            self.active = False




class Show(Base):
    __tablename__ = 'Shows'

    id = Column(String, primary_key=True, default=lambda: str(generate_guid()))
    name = Column(String)
    description = Column(String)
    roles = Column(String)
    logo = Column(String)

    videoWidth = Column(Integer, default=1920)
    videoHeight = Column(Integer, default=1080)
    videoQuality = Column(Float, default=0.5)

    mediasChannels = relationship("MediaChannel", back_populates="show", cascade="all, delete")
    webChannels = relationship("WebChannel", back_populates="show", cascade="all, delete")
    conductors = relationship("Conductor", back_populates="show", cascade="all, delete")
    medias = relationship("Media", back_populates="show", cascade="all, delete")
    events = relationship("Event", back_populates="show", cascade="all, delete")

    @property
    def rolesList(self):
        roles = self.roles.split("\n")
        list = {}
        i = 0
        for role in roles:
            list[i] = {
                "index": i,
                "name": roles[i]
            }
            i += 1

        return list


    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.videoWidth:
            self.videoWidth = 1920
        if not self.videoHeight:
            self.videoHeight = 1080
        if not self.videoQuality:
            self.videoQuality = 0.5

def delete_show_avatar(mapper, connection, target):
    if target.logo:
        os.remove("images/" + target.logo)
event.listen(Show, "before_delete", delete_show_avatar)



class MediaChannel(Base):
    __tablename__ = "MediaChannels"

    id = Column(String, primary_key=True, default=lambda: str(generate_guid()))
    name = Column(String)
    description = Column(Integer)
    customCSS = Column(String)
    width = Column(Integer, default=1920)
    height = Column(Integer, default=1080)
    defaultEnable = Column(Boolean)

    show_id = Column(String, ForeignKey('Shows.id'))
    show = relationship("Show", back_populates="mediasChannels")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.width:
            self.width = 1920
        if not self.height:
            self.height = 1080
        if not self.defaultEnable:
            self.defaultEnable = False


class WebChannel(Base):
    __tablename__ = "WebChannels"

    id = Column(String, primary_key=True, default=lambda: str(generate_guid()))
    name = Column(String)
    description = Column(Integer)
    defaultEnable = Column(Boolean)

    show_id = Column(String, ForeignKey('Shows.id'))
    show = relationship("Show", back_populates="webChannels")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.defaultEnable:
            self.defaultEnable = False



class Conductor(Base):
    __tablename__ = "Conductors"

    id = Column(String, primary_key=True, default=lambda: str(generate_guid()))
    name = Column(String)
    guests = Column(String)
    vdoEnable = Column(Boolean)
    type = Column(Enum("operational", "template", name="type_enum"), default="operational")
    currentMediaWeb = Column(String)
    currentMedia = Column(String)

    recording = Column(Boolean, default=False)
    streaming = Column(Boolean, default=False)

    year = Column(Integer)
    month = Column(Integer)
    day = Column(Integer)

    vdoPassword = Column(String)

    @property
    def date(self):
        return datetime(self.year, self.month, self.day)

    lines = relationship("Line", back_populates="conductor", cascade="all, delete")

    show_id = Column(String, ForeignKey('Shows.id'))
    show = relationship("Show", back_populates="conductors")

    @property
    def guestsList(self):
        rawRoles = self.show.roles.split("\n")

        guests = self.guests.split("\n")
        list = []

        i = 0
        for role in rawRoles:
            guest = guests[i] if i<len(guests) else ""

            list.append(
                {
                    "index": i,
                    "role": role,
                    "name": guest.strip(),
                    "defined": guest.strip()!=""
                }
            )
            i += 1

        return list

    @property
    def guestsCount(self):
        lines = self.guests.split("\n")
        nonEmpty = [l for l in lines if l.strip()]
        return len(nonEmpty)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.vdoEnable:
            self.vdoEnable = True
        if not self.type:
            self.type = "operational"


class Line(Base):
    __tablename__ = "Lines"

    id = Column(String, primary_key=True, default=lambda: str(generate_guid()))
    name = Column(String)
    text = Column(String)
    order = Column(Integer)
    done = Column(Boolean, default=True)
    highlight = Column(Boolean, default=False)
    type = Column(String, default="classic")
    jingle = Column(String)

    medias = relationship("Media", back_populates="line", cascade="all, delete")

    conductor_id = Column(String, ForeignKey('Conductors.id'))
    conductor = relationship("Conductor", back_populates="lines")


class Media(Base):
    __tablename__ = "Medias"

    id = Column(String, primary_key=True, default=lambda: str(generate_guid()))
    order = Column(Integer)
    type = Column(Enum("media", "picture", "web", name="type_enum"))
    name = Column(String)
    channel = Column(String)
    path = Column(String)
    tmb = Column(String)
    source = Column(String)
    loop = Column(Boolean, default=True)
    volume = Column(Float)
    volumeAfterLoop = Column(Float)
    progress = Column(Integer)
    error = Column(String)
    passes = Column(Integer)

    line_id = Column(String, ForeignKey('Lines.id'), nullable=True)
    line = relationship("Line", back_populates="medias")

    show_id = Column(String, ForeignKey("Shows.id"), nullable=True)
    show = relationship("Show", back_populates="medias")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.id:
            self.id = generate_guid()
        if not self.passes:
            self.passes = 0

def delete_media_files(mapper, connection, target):
    
    if target.type == "media":
        filename = target.path

        if filename:
            # On sépare nom et extension
            basename, extension = filename.split(".")

            # Paths pour les différents fichiers
            pathFinal = config["directories"]["medias"] + "/" + str(filename)
            pathThumbnail = config["directories"]["medias"] + "/" + str(target.tmb)
            pathTemporary = config["directories"]["mediasTmp"] + "/" + str(target.path)
            pathMeta1 = config["directories"]["mediasTmp"] + "/" + str(basename) + ".meta.txt"
            pathMeta2 = config["directories"]["medias"] + "/" + str(basename) + ".meta.txt"

            # On supprime chaque fichier s'il existe
            try:
                if os.path.exists(pathFinal):
                    os.remove(pathFinal)
                if os.path.exists(pathThumbnail):
                    os.remove(pathThumbnail)
                if os.path.exists(pathTemporary):
                    os.remove(pathTemporary)
                if os.path.exists(pathMeta1):
                    os.remove(pathMeta1)
                if os.path.exists(pathMeta2):
                    os.remove(pathMeta2)
            except Exception as e:
                print("ERROR WHILE DELETING MEDIA FILES FOR ID {}:\n{}".format(target.id, e))

event.listen(Media, "before_delete", delete_media_files)






class Event(Base):
    __tablename__ = "Events"

    id = Column(String, primary_key=True, default=lambda: str(generate_guid()))
    date = Column(DateTime)
    description = Column(String)
    type = Column(String)

    show_id = Column(String, ForeignKey("Shows.id"), nullable=True)
    show = relationship("Show", back_populates="events")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.date:
            self.date = datetime.now()
        if not self.id:
            self.id = generate_guid()