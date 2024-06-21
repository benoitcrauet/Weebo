import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--reinit-database", action="store_true", help="Réinitialise totalement la base de données. ATTENTION : la base de données actuelle sera perdue.", required=False)
parser.add_argument("--reinit-user", help="Permet de réinitialiser le mot de passe d'un utilisateur donné.", required=False)
parser.add_argument("--create-admin", action="store_true", help="Permet de recréer le compte administrateur.", required=False)
parser.add_argument("--debug", action="store_true", help="Permet d'activer le mode déboguage (trace des activités techniques dans la console).", required=False)
arguments = parser.parse_args()