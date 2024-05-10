from dotenv import dotenv_values
import os

config = {}
for key, value in dotenv_values("config.env").items():
    config[key] = value

app = {}
for key, value in dotenv_values("app.env").items():
    app[key] = value