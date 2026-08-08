# Weebo

Weebo est une application web de gestion de conducteurs de production audio/vidéo avec VDO et gestion des médias.

## Prérequis

- Python 3
- `pip`
- Un environnement virtuel recommandé

## Installation

1. Copier le fichier de configuration d'exemple :

```bash
cp config.sample.yaml config.yaml
```

2. Installer les dépendances :

```bash
python3 -m pip install -r requirements.txt
```

3. Configurer `app.env` si nécessaire.

## Lancement de l'application

Depuis la racine du projet :

```bash
python3 main.py
```

### Vérifier la configuration

- `config.yaml` doit exister dans le dossier racine.
- `app.env` est lu automatiquement au démarrage.

## Structure rapide

- `main.py` : point d'entrée principal qui démarre les modules `web`, `video` et `cleaner`.
- `lib/` : code métier commun, configuration, base de données, websocket, etc.
- `modules/web/` : application Flask, routes et templates.
- `modules/web/templates/conductors/` : vues et modales de la page conducteur.
- `modules/web/static/js/conductors/` : scripts front-end pour le conducteur.

## Tester localement

1. Copier la configuration et installer les dépendances comme ci-dessus.
2. Lancer `python3 main.py`.
3. Ouvrir le navigateur sur l'URL affichée par l'application (par défaut, Flask affichera l'hôte et le port).

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
- Assure-toi que `config.yaml` est valide et accessible depuis le répertoire de travail.
- Si l'application doit être utilisée en production, préfère déployer derrière un reverse proxy sécurisé.
