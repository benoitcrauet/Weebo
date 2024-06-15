from datetime import datetime, timedelta
from sqlalchemy import desc
import locale

from lib.db import session
from lib.models import Event


def createNewEvent(show_id, type, description):
    # On crée le nouvel élément
    newEvent = Event()
    newEvent.show_id = show_id
    newEvent.type = type
    newEvent.description = description
    newEvent.date = datetime.now()

    return newEvent