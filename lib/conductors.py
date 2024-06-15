from datetime import datetime, timedelta

from lib.db import session
from lib.config import config
from lib.models import Conductor

def getActiveConductor(show_guid):
    # On liste les conducteurs dans l'ordre de diffusion
    conductors = session.query(Conductor).filter(Conductor.type == "operational").filter(Conductor.show_id == show_guid).order_by(Conductor.year, Conductor.month, Conductor.day).all()
    
    # On prend la date de référence
    ref = datetime.now() - timedelta(hours=6)

    selectedConductor = None
    # On explore la liste des conducteurs et on garde le dernier en date
    for c in conductors:
        selectedConductor = c

        # Si la date correspond, on s'arrête là
        if c.year==ref.year and c.month==ref.month and c.day==ref.day:
            break
    
    return selectedConductor