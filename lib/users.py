from functools import wraps
from flask import abort
from flask_login import current_user

def for_admins(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.isAdmin:
            abort(403, description="Vous n'avez pas les privilèges nécessaires pour accéder à cet espace.")  # Forbidden
        return f(*args, **kwargs)
    return decorated_function

def guest_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if current_user.is_authenticated:
            abort(403, description="Cet espace n'est accessible qu'aux guests.") # Forbidden
        return f(*args, **kwargs)
    return decorated_function