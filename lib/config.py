from dotenv import dotenv_values
import os
import yaml

config = {}
try:
    with open("config.yaml") as configFile:
        config = yaml.safe_load(configFile)
except Exception as e:
    print("Impossible de lire le fichier de configuration config.yaml")
    quit()


app = {}
for key, value in dotenv_values("app.env").items():
    app[key] = value