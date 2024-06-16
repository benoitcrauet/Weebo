
# Génère un objet WebSocket de base pour les conducteurs
def conductorWebSocketBase(action, conductor, data_line, data_media):
    object = {
        "action": None,
        "conductor": None,
        "data_line": {},
        "data_media": {}
    }

    object["action"] = action
    object["conductor"] = conductor
    object["data_line"] = data_line
    object["data_media"] = data_media

    return object