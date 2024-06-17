import time
import os
import sys
import json
from flask import Flask
from flask_socketio import SocketIO
import requests
from colorama import init, Fore, Back, Style
import shutil
import math

from lib.db import session
from lib.models import Media, Show, Line, Conductor
from lib.config import config
from lib.video import convertVideo, getThumbnailPicture


dirTmpMedias = config["directories"]["mediasTmp"] # Temporary medias folder without last /
dirMedias = config["directories"]["medias"] # Temporary medias folder without last /

# On défini le dossier temporaire pour ffmpeg
ffmpeg_temporary = "{}/{}".format(os.getcwd(), dirTmpMedias)

def main():
    print("Starting video thread...")
    
    time.sleep(3)
    # On scanne le dossier
    while True:
        files = os.listdir(dirTmpMedias+"/")

        for filename in files:
            file_path = os.path.join(dirTmpMedias, filename)
            if os.path.isfile(file_path) and not filename.endswith(".meta.txt") and not filename.startswith("."):
                # On récupère le nom de fichier et son extension
                basename, extension = filename.split(".")

                # On crée le nom du fichier meta
                meta_filename = basename + ".meta.txt"

                meta = {}

                # Si le fichier meta existe
                if os.path.isfile(dirTmpMedias+"/"+meta_filename):

                    # On récupère le meta file
                    with open(dirTmpMedias+"/"+meta_filename) as file:
                        meta = json.load(file)
                    
                    # Si on a un media id
                    if meta["media_id"]:
                        print("Found media source file \"{}\":".format(filename))

                        # On stocke l'ID
                        media_guid = meta["media_id"]

                        # On remande un fichier raw ?
                        media_raw = "raw" in meta and meta["raw"]==True

                        print("    > Raw: {}".format("Yes" if media_raw else "No"))

                        # On récupère les paramètres de transcodage
                        transcode = {}
                        if "transcode" in meta:
                            transcode = meta["transcode"]
                        
                        # On vérifie si le média existe
                        media = session.query(Media).filter(Media.id == media_guid).first()

                        if media:

                            # On récupère l'émission correspondante
                            if not media.line_id:
                                line = None
                                conductor = None
                                show = session.query(Show).filter(Show.id == media.show_id).first()
                            else:
                                # On récupère la ligne, le conducteur et l'émission
                                line = session.query(Line).filter(Line.id == media.line_id).first()
                                conductor = session.query(Conductor).filter(Conductor.id == line.conductor_id).first()
                                show = session.query(Show).filter(Show.id == conductor.show_id).first()
                            
                            # On prépare la conversion

                            # On récupère les paramètres de transcodage
                            if not "width" in transcode:
                                transcode["width"] = show.videoWidth
                            if not "height" in transcode:
                                transcode["height"] = show.videoHeight
                            if not "large" in transcode:
                                transcode["large"] = transcode["width"] if transcode["width"]>transcode["height"] else transcode["height"]
                            if not "quality" in transcode:
                                transcode["quality"] = min(1, max(0, show.videoQuality))

                            
                            print("    > Transcoding quality: {}%".format(math.floor(transcode["quality"]*100)))
                            print("    > Transcoding dimensions: {}x{}".format(transcode["width"], transcode["height"]))


                            # On crée le nom du fichier miniature
                            tmb_filename = media.id + ".tmb.gif"
                            # On crée le nom du fichier converti
                            final_filename = media.id + ".webm"
                            # On crée le nom du nouveau fichier meta
                            final_meta_filename = media.id + ".meta.txt"

                            # Si on indique des noms de fichier, on prends ceux-là à la place
                            if "paths" in meta:
                                if "filename" in meta["paths"]:
                                    final_filename = meta["paths"]["filename"]
                                if "thumbnail" in meta["paths"]:
                                    tmb_filename = meta["paths"]["thumbnail"]
                                if "meta" in meta["paths"]:
                                    final_meta_filename = meta["paths"]["meta"]

                            # On déclare une nouvelle passe d'encodage
                            media.passes += 1
                            session.merge(media)

                            print("    > Media name: {}".format(media.name))

                            # Si on est dans les retry acceptables
                            if media.passes <= int(config["transcoding"]["maxRetry"]):
                                print("    > Pass {}/{}...".format(media.passes, config["transcoding"]["maxRetry"]))
                                print("")

                                # Fonction anonyme permettant d'envoyer une update
                                def updateMediaWeb():
                                    # On envoie un évènement de mise à jour au web
                                    try:
                                        if media.line_id:
                                            requests.get("{}/api/conductor/media/update/{}".format(config["web"]["baseUrl"], media.id), timeout=0.5)
                                    except Exception as e:
                                        print("ERROR while sending event to web: {}".format(e))

                                # Fonction anonyme permettant le suivi de progression
                                def progressCallback(percent, lastUpdate):
                                    modified = False
                                    currentTime = time.time()

                                    if currentTime - lastUpdate[0] >= 2:
                                        media.progress = percent
                                        modified = True

                                    if percent>=100:
                                        media.progress = 100
                                        media.path = final_filename
                                        media.error = None
                                        modified = True
                                    
                                    if modified:
                                        print("    ⚙️ Conversion in progress... {}%".format(percent))
                                        session.merge(media)
                                        session.commit()
                                        lastUpdate[0] = currentTime

                                        updateMediaWeb()
                                

                                # Si on demande une vidéo brute, on bypass la conversion
                                if media_raw:
                                    # On copie le fichier
                                    print("    ⚙️ Just copying file {} to {}".format(filename, dirMedias + "/" + final_filename))
                                    shutil.copy(dirTmpMedias + "/" + filename, dirMedias + "/" + final_filename)
                                    media.progress = 100
                                    media.path = final_filename
                                    media.error = None
                                    session.merge(media)

                                    videoConversion = True
                                else:
                                    # On lance la conversion
                                    videoConversion = convertVideo(dirTmpMedias+"/"+filename, dirMedias+"/"+final_filename, transcode["large"], progressCallback, transcode, transcode["quality"], config["transcoding"]["threads"])

                                if videoConversion==True:
                                    print("        > ✅ Conversion succeeded for media ID {}.".format(media.id))
                                    time.sleep(0.2)
                                    print("    🏞️ Extracting gif thumbnail for {}...".format(media.id))
                                    time.sleep(0.2)

                                    thumbnailExtraction = getThumbnailPicture(dirMedias+"/"+final_filename, dirMedias+"/"+tmb_filename, 70);
                                
                                    if thumbnailExtraction==True:
                                        print("        > ✅ Conversion complete for media ID {}".format(media.id))

                                        # On met à jour la bdd avec le fichier miniature
                                        media.tmb = tmb_filename

                                        session.merge(media)
                                        session.commit()

                                        time.sleep(0.2)
                                        # On envoie l'update au web
                                        updateMediaWeb()
                                    else:
                                        print("        > ⚠️ Thumbnail extraction error for media ID {}".format(media.id))

                                        # On injecte l'erreur dans le média
                                        media.error = "Thumbnail Extraction\n\n"+str(thumbnailExtraction)
                                        session.merge(media)
                                        session.commit()

                                        updateMediaWeb()
                                    

                                    # Suppression du fichier d'origine
                                    os.remove(dirTmpMedias + "/" + filename)

                                    # Déplacement du meta file
                                    shutil.move(dirTmpMedias + "/" + meta_filename, dirMedias + "/" + final_meta_filename)
                                else:
                                    print("        > ⚠️ Conversion error for media ID {}".format(media.id))

                                    # On injecte l'erreur dans le média
                                    media.error = str(videoConversion)
                                    session.merge(media)
                                    session.commit()

                                    updateMediaWeb()

                                session.commit()

                            else:
                                print("    > ⚠️ Too many tries.")
                                print("        > 🗑️ Deleting media.")

                                session.delete(media)
                                session.commit()

                        else:
                            # Média introuvable : on supprime les fichiers meta et source
                            print("    > Media entry does not exists in database.")
                            print("        > 🗑️ Removing files...")

                            os.remove(dirTmpMedias+"/"+meta_filename)
                            os.remove(dirTmpMedias+"/"+filename)

                    else:
                        print("Metadata file not found for {}.".format(filename))


                    sys.stdout.write("\n")

        sys.stdout.flush()
        time.sleep(10) # On attend 10 secondes avant le prochain scan



def print(*args, **kwargs):
    sep = kwargs.get('sep', ' ')
    end = kwargs.get('end', '\n')
    message = sep.join(map(str, args)) + end
    sys.stdout.write("🎞️  " + Back.RED + Fore.WHITE + Style.BRIGHT + "[MEDIA CONVERTER]" + Style.RESET_ALL + " " + message)

