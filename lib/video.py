from moviepy.editor import VideoFileClip
from proglog import ProgressBarLogger
import math
import os
import time

from lib.picture import ResizeMaximal

class VideoLogger(ProgressBarLogger):
    prc = 0
    lastUpdate = [0]
    cbk = None

    def setCbk(self, cbk):
        self.cbk = cbk

    def callback(self, **changes):
        # Appelé chaque fois que le message du logger est mis à jour
        for parameter, value in changes.items():
            # print(f'Parameter {parameter} is now {value}')
            pass
    
    def bars_callback(self, bar, attr, value, old_value=None):
        # Appelé chaque fois que la progression du logger est mise à jour
        percentage = (value / self.bars[bar]['total']) * 100
        
        if bar=="t" and attr=="index":
            self.prc = int(percentage)
            self.cbk(self.prc, self.lastUpdate)


"""Converti une vidéo
Args:
    input (str): path du fichier d'origine
    output (str): path du fichier de sortie
    maxborder (int): bord le plus large de la vidéo de sortie. False pour désactiver le redimensionnement.
    progressCallback (Callable)
    transcodeParams (dict): paramètres additionnels de transcodage (cutBegin [secondes], cutEnd [secondes], rotate [0, 90, 180, 270])
"""
def convertVideo(input, output, maxborder, progressCallback, transcodeParams={}):
    try:
        # Charger la vidéo
        with VideoFileClip(input) as video:

            # On récupère la durée
            videoDuration = video.duration
        
            # On récupère la taille actuelle
            currentSize = video.size
            currentWidth = currentSize[0]
            currentHeight = currentSize[1]

            if maxborder != False:
                # On calcule les nouvelles dimensions
                newWidth, newHeight = ResizeMaximal(currentWidth, currentHeight, maxborder)
                newSize = (newWidth, newHeight)
            else:
                newSize = (currentWidth, currentHeight)


            # On demande un extrait ?
            newBegin = 0
            newEnd = videoDuration
            if "cutBegin" in transcodeParams and "cutEnd" in transcodeParams:

                if transcodeParams["cutBegin"]=="":
                    cutBegin = 0
                else:
                    cutBegin = int(transcodeParams["cutBegin"])
                
                if transcodeParams["cutEnd"]=="":
                    cutEnd = videoDuration
                else:
                    cutEnd = int(transcodeParams["cutEnd"])

                if cutBegin < cutEnd and cutBegin < videoDuration and cutEnd < videoDuration:
                    newBegin = cutBegin
                    newEnd = cutEnd
            
            # Si on a un rotate
            rotateDeg = 0
            if "rotate" in transcodeParams:
                rotateParam = 0
                try:
                    rotateParam = int(transcodeParams["rotate"])
                except Exception as e:
                    pass
                
                if rotateParam==0 or rotateParam==90 or rotateParam==180 or rotateParam==270:
                    rotateDeg = rotateParam
            
            # On crée un extrait
            subclip = video.subclip(newBegin, newEnd)

            # On initialise le logger qui permettra de suivre l'avancement
            logger = VideoLogger()
            logger.setCbk(progressCallback)

            # On échange width et height en cas de rotate de 90 et 270
            if rotateDeg==90 or rotateDeg==270:
                newSize = (newSize[1], newSize[0])

            # Personnaliser les options de l'encodeur FFmpeg
            ffmpeg_params = [
                "-b:v", "1M",                               # Débit binaire vidéo
                "-crf", "22",                               # Facteur de qualité Constant Rate Factor (CRF)
                "-q:v", "10",                               # Qualité vidéo (ici 10, 0 étant la meilleure qualité)
                "-quality", "good",                         # Qualité globale de l'encodage (options: fast, good, best)
                "-speed", "1",                              # Vitesse de l'encodage (plus la valeur est élevée, plus l'encodage est rapide)
                "-threads", "1",                            # Nombre de threads à utiliser pour l'encodage
                "-vf", f"scale={newSize[0]}:{newSize[1]}"   # Redimensionner la vidéo
            ];

            # Lancement du transcodage avec un redimensionnement
            subclip.rotate(rotateDeg).write_videofile(output, codec="libvpx", preset="superfast", ffmpeg_params=ffmpeg_params, logger=logger)

    except Exception as e:
        print("Error occured: {}".format(e))
        return False
    finally:
        try:
            video.close()
            subclip.close()
        except Exception as e:
            pass
    
    return True



"""Converti une vidéo en gif
Args:
    input (str): path de la vidéo d'orgine
    output (str): path de l'image de sortie
    maxborder (int): bord le plus large de la miniature de sortie. False pour désactiver le redimensionnement.
"""
def getThumbnailPicture(input, output, maxborder):
    clipStart = 10
    clipDuration = 5
    try:
        # Charger la vidéo
        with VideoFileClip(input) as video:

            videoDuration = video.duration

            # On défini la période d'extraction
            if False and clipStart + clipDuration <= videoDuration:
                sequenceStart = clipStart
                sequenceEnd = clipStart + clipDuration
            else:
                if clipDuration < videoDuration:
                    sequenceStart = (videoDuration - clipDuration) / 2
                    sequenceEnd = sequenceStart + clipDuration
                else:
                    sequenceStart = 0
                    sequenceEnd = videoDuration
            
            # Extraction du clip
            clip = video.subclip(sequenceStart, sequenceEnd)

            # On redimensionne le clip
            currentSize = clip.size
            currentWidth = currentSize[0]
            currentHeight = currentSize[1]
            newSize = ResizeMaximal(currentWidth, currentHeight, maxborder)
            clip = clip.resize(newSize)

            # On enregistre le GIF
            clip.write_gif(os.getcwd()+"/"+output, fps=8, fuzz=40, program="ffmpeg")

            clip.close()

    except Exception as e:
        print("Error occured: {}".format(e))
        return False
    finally:
        try:
            video.close()
        except Exception as e:
            pass

    return True

