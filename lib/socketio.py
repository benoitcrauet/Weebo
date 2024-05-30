from flask_socketio import SocketIO

class SocketIOInstance:
    _instance = None

    def __new__(cls, app=None):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.socketio = SocketIO(app, cors_allowed_origins="*")
        return cls._instance