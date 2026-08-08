# Weebo

Weebo est une application web de gestion de conducteurs de production audio/vidéo avec VDO et gestion des médias.

## Prérequis

- Python 3
- `pip`
- Un environnement virtuel recommandé

## Installation

1. Copiez le fichier de configuration d'exemple :

```bash
cp config.sample.yaml config.yaml
```

2. Installez les dépendances :

```bash
python3 -m pip install -r requirements.txt
```

3. Configurez `app.env` si nécessaire.

## Lancement de l'application

Depuis la racine du projet :

```bash
python3 main.py
```

### Vérifier la configuration

- `config.yaml` doit exister dans le dossier racine.
- `app.env` est lu automatiquement au démarrage.

## Arguments de ligne de commande

L'application expose des options CLI pour gérer la base de données et les comptes :

- `python3 main.py --reinit-database`
  - réinitialise totalement la base de données
  - supprime le fichier SQLite et nettoie les répertoires `images`, `medias`, `tmp_medias`
  - recrée les tables et génère un compte admin `admin`
  - demande confirmation interactive avant d'agir

- `python3 main.py --reinit-user <username>`
  - réinitialise le mot de passe d'un utilisateur existant
  - propose aussi d'activer le compte ou de le passer administrateur

- `python3 main.py --create-admin`
  - crée un compte admin si l'utilisateur `admin` n'existe pas encore

- `python3 main.py --generate-fake-data`
  - génère des données factices de démonstration dans la base
  - crée une émission de démonstration, des canaux, un conducteur, des lignes, des médias et des événements

> Les commandes de gestion sont interactives et nécessitent une confirmation utilisateur, sauf `--generate-fake-data`.

## Structure rapide

- `main.py` : point d'entrée principal qui démarre les modules `web`, `video` et `cleaner`.
- `lib/` : code métier commun, configuration, base de données, websocket, etc.
- `modules/web/` : application Flask, routes et templates.
- `modules/web/templates/conductors/` : vues et modales de la page conducteur.
- `modules/web/static/js/conductors/` : scripts front-end pour le conducteur.

## Tester localement

1. Copiez la configuration et installez les dépendances comme ci-dessus.
2. Lancez `python3 main.py`.
3. Ouvrez le navigateur sur l'URL affichée par l'application (par défaut, Flask affichera l'hôte et le port).

## Exécuter comme service

### Linux avec `systemd`

Créer un fichier d'unité, par exemple `/etc/systemd/system/weebo.service` :

```ini
[Unit]
Description=Weebo production conductor application
After=network.target

[Service]
Type=simple
User=weebo
WorkingDirectory=/path/to/Weebo
EnvironmentFile=/path/to/Weebo/app.env
ExecStart=/usr/bin/python3 /path/to/Weebo/main.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Puis activer et démarrer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable weebo.service
sudo systemctl start weebo.service
sudo systemctl status weebo.service
```

### macOS avec `launchd`

Créer un fichier de configuration `~/Library/LaunchAgents/com.weebo.weebo.plist` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.weebo.weebo</string>
    <key>ProgramArguments</key>
    <array>
      <string>/usr/bin/python3</string>
      <string>/path/to/Weebo/main.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/path/to/Weebo</string>
    <key>EnvironmentVariables</key>
    <dict>
      <key>PATH</key>
      <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/weebo.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/weebo.stderr.log</string>
  </dict>
</plist>
```

Charger le service :

```bash
launchctl load ~/Library/LaunchAgents/com.weebo.weebo.plist
launchctl start com.weebo.weebo
```

## Notes

- Le service démarre `main.py`, qui lance les modules web, vidéo et cleaner dans des threads.
- Assurez-vous que `config.yaml` est valide et accessible depuis le répertoire de travail.
- Si l'application doit être utilisée en production, préférez déployer derrière un reverse proxy sécurisé.
