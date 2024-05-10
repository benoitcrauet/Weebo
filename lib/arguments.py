import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--reinit-database", action="store_true", help="Recréer totalement un fichier database. ATTENTION : la database actuelle sera perdue.", required=False)
parser.add_argument("--fake-data", action="store_true", help="Génère des données factices dans la base de données.", required=False)
parser.add_argument("--debug", action="store_true", help="Permet d'activer le mode déboguage (trace des activités techniques dans la console).", required=False)
arguments = parser.parse_args()