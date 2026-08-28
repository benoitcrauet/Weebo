import json
import math
import multiprocessing
import os
import queue as _queue
import shutil
import signal
import struct
import subprocess
import time
from io import BytesIO

from PIL import Image
from moviepy.editor import VideoFileClip
from proglog import ProgressBarLogger

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


# ---------------------------------------------------------------------------
# Détection automatique de la rotation (métadonnées d'orientation)
# ---------------------------------------------------------------------------
#
# Les smartphones filment capteur en paysage et ajoutent un flag d'orientation :
#   - vidéos récentes  : side_data "rotation" du flux vidéo (lisible via ffprobe).
#     ATTENTION : ce champ utilise la convention OPPOSÉE au "sens horaire" ; un
#     portrait iPhone y vaut -90 et demande une correction de +90° horaire.
#     (Vérifié : l'auto-rotation ffmpeg de `rotation=-90` équivaut à
#     `-vf transpose=1`, soit 90° dans le sens horaire.)
#   - vidéos anciennes : tag QuickTime "rotate" (valeur positive = sens horaire).
#   - sans ffprobe     : matrice d'affichage lue dans moov/trak/tkhd.
#
# detectRotation() renvoie TOUJOURS un angle normalisé "degrés à appliquer dans
# le sens horaire pour redresser l'image" (0/90/180/270), cohérent avec le
# paramètre `rotate` manuel de l'interface.


def _quantizeAngle(angle):
    """Ramène un angle quelconque au multiple de 90 le plus proche, dans [0, 360)."""
    return (int(round(angle / 90.0)) * 90) % 360


def _ffprobeExecutable():
    """Chemin vers un binaire ffprobe utilisable, ou None."""
    found = shutil.which("ffprobe")
    if found:
        return found
    # ffprobe éventuellement fourni à côté du ffmpeg embarqué par imageio-ffmpeg
    try:
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None
    candidate = ffmpeg.replace("ffmpeg", "ffprobe")
    if candidate != ffmpeg and os.path.isfile(candidate):
        return candidate
    return None


def _rotationFromFfprobe(path):
    """Rotation (sens horaire, normalisée) lue via ffprobe, ou None."""
    exe = _ffprobeExecutable()
    if not exe:
        return None
    try:
        proc = subprocess.run(
            [
                exe, "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream_side_data=rotation:stream_tags=rotate",
                "-of", "json", path,
            ],
            capture_output=True, text=True, timeout=30,
        )
        payload = json.loads(proc.stdout or "{}")
    except Exception:
        return None

    streams = payload.get("streams") or []
    if not streams:
        return None
    stream = streams[0]

    # 1. side_data "rotation" (prioritaire) — signe opposé à la convention horaire
    for side_data in stream.get("side_data_list", []) or []:
        if "rotation" in side_data:
            try:
                return _quantizeAngle(-float(side_data["rotation"]))
            except (TypeError, ValueError):
                pass

    # 2. tag "rotate" hérité (QuickTime / vieux Android). Convention admise :
    #    valeur positive = sens horaire (identique à `-metadata:s:v rotate=`).
    #    NB : non vérifié empiriquement ici (ffmpeg récent n'écrit plus ce tag) ;
    #    si le signe est inversé pour ces fichiers, la rotation partira dans le
    #    mauvais sens. Le side_data ci-dessus reste prioritaire.
    tags = stream.get("tags") or {}
    if "rotate" in tags:
        try:
            return _quantizeAngle(float(tags["rotate"]))
        except (TypeError, ValueError):
            pass

    return None


def _iterBoxes(fh, start, end):
    """Itère (type, contentStart, boxEnd) sur les boxes ISO-BMFF entre start et end."""
    pos = start
    while pos + 8 <= end:
        fh.seek(pos)
        header = fh.read(8)
        if len(header) < 8:
            return
        size = int.from_bytes(header[0:4], "big")
        boxtype = header[4:8]
        content = pos + 8
        if size == 1:
            ext = fh.read(8)
            if len(ext) < 8:
                return
            size = int.from_bytes(ext, "big")
            content = pos + 16
        elif size == 0:
            size = end - pos
        box_end = pos + size
        if size < 8 or box_end > end:
            return
        yield boxtype, content, box_end
        pos = box_end


def _tkhdAngle(fh, start, end):
    """Angle (sens horaire, normalisé) issu de la matrice d'affichage d'un box tkhd.

    Renvoie None si la piste n'est pas visuelle (largeur/hauteur nulles, cas des
    pistes audio) ou si la matrice est dégénérée.
    """
    fh.seek(start)
    data = fh.read(end - start)
    if len(data) < 4:
        return None
    version = data[0]
    # Octets précédant la matrice, selon la version du box :
    #   v1 : version+flags(4) ctime(8) mtime(8) track_id(4) reserved(4) duration(8) = 36
    #   v0 : idem sur 32 bits                                                       = 24
    # puis reserved(8) layer(2) alternate_group(2) volume(2) reserved(2)            = 16
    head = 36 if version == 1 else 24
    matrix_off = head + 16
    if len(data) < matrix_off + 36 + 8:
        return None
    matrix = struct.unpack(">9i", data[matrix_off:matrix_off + 36])
    width = struct.unpack(">I", data[matrix_off + 36:matrix_off + 40])[0]
    height = struct.unpack(">I", data[matrix_off + 40:matrix_off + 44])[0]
    if width == 0 or height == 0:
        return None  # piste non visuelle (audio, texte, timecode…)
    a = matrix[0] / 65536.0
    b = matrix[1] / 65536.0
    if a == 0 and b == 0:
        return None
    # ffmpeg définit rotation(side_data) = -atan2(b, a) ; la correction horaire
    # est donc directement +atan2(b, a).
    return _quantizeAngle(math.degrees(math.atan2(b, a)))


def _rotationFromMp4(path):
    """Rotation (sens horaire, normalisée) via un parcours manuel MP4/MOV, ou None."""
    try:
        with open(path, "rb") as fh:
            fh.seek(0, os.SEEK_END)
            file_end = fh.tell()
            for btype, cstart, cend in _iterBoxes(fh, 0, file_end):
                if btype != b"moov":
                    continue
                for mtype, mstart, mend in _iterBoxes(fh, cstart, cend):
                    if mtype != b"trak":
                        continue
                    for ttype, tstart, tend in _iterBoxes(fh, mstart, mend):
                        if ttype == b"tkhd":
                            angle = _tkhdAngle(fh, tstart, tend)
                            if angle is not None:
                                return angle
                return None
    except Exception:
        return None
    return None


def detectRotation(path):
    """Détecte la rotation d'orientation d'une vidéo.

    Cascade : ffprobe (système, ou embarqué via imageio-ffmpeg) puis, à défaut,
    parcours manuel de la matrice d'affichage MP4/MOV (moins fiable, MP4/MOV
    uniquement).

    Args:
        path (str): chemin du fichier vidéo.

    Returns:
        int: angle à appliquer dans le sens horaire pour redresser l'image
             (0, 90, 180 ou 270). 0 si rien n'est détecté ou en cas d'erreur.
    """
    for detector in (_rotationFromFfprobe, _rotationFromMp4):
        try:
            angle = detector(path)
        except Exception:
            angle = None
        if angle:
            return angle
    return 0


# ---------------------------------------------------------------------------
# Auto-rotation ffmpeg au décodage
# ---------------------------------------------------------------------------
#
# moviepy 2.0.0.dev2 lit les vidéos en appelant `ffmpeg` SANS `-noautorotate`.
# Selon la version de ffmpeg, les frames renvoyées à moviepy peuvent donc être
# DÉJÀ réorientées d'après les métadonnées (mais redimensionnées aux dimensions
# codées — donc écrasées). Comme on ne connaît pas la version de ffmpeg de la
# machine d'exécution, on détecte ce comportement à chaud plutôt que de le
# supposer : on compare une frame décodée avec et sans `-noautorotate`.


def _ffmpegBinary():
    """Le binaire ffmpeg utilisé par moviepy pour lire les vidéos."""
    try:
        from moviepy.config import FFMPEG_BINARY
        if FFMPEG_BINARY and os.path.sep in str(FFMPEG_BINARY):
            return FFMPEG_BINARY
    except Exception:
        pass
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return shutil.which("ffmpeg") or "ffmpeg"


def _ffmpegAutorotates(path):
    """True si le ffmpeg utilisé réoriente la vidéo au décodage.

    Compare la première frame décodée avec et sans `-noautorotate`. Si ffmpeg est
    trop ancien pour connaître `-noautorotate`, l'appel échoue et on renvoie
    False (les ffmpeg anciens n'auto-pivotent pas) : on appliquera alors la
    rotation nous-mêmes.
    """
    binary = _ffmpegBinary()

    def firstFrame(extra):
        proc = subprocess.run(
            [binary, "-v", "error", *extra, "-i", path, "-frames:v", "1",
             "-f", "image2pipe", "-vcodec", "png", "-"],
            capture_output=True, timeout=30,
        )
        return proc.stdout

    try:
        withRotate = firstFrame([])
        withoutRotate = firstFrame(["-noautorotate"])
    except Exception:
        return False
    return bool(withRotate) and bool(withoutRotate) and withRotate != withoutRotate


def _planRotation(input, rawWidth, rawHeight, manualRotate=0):
    """Planifie le redressement d'une vidéo.

    Args:
        input (str): chemin du fichier source.
        rawWidth, rawHeight (int): dimensions telles que rapportées par moviepy
            (résolution CODÉE, avant rotation).
        manualRotate (int): rotation explicite demandée par l'utilisateur
            (0/90/180/270). Si non nulle, elle définit l'orientation finale
            voulue (elle ne s'ADDITIONNE pas à la rotation détectée).

    Returns:
        (residual, displayWidth, displayHeight):
          - residual : rotation horaire (0/90/180/270) qu'il RESTE à appliquer
            via moviepy, une fois retranchée l'éventuelle auto-rotation de
            ffmpeg au décodage ;
          - displayWidth/displayHeight : dimensions réellement affichées (pour
            ResizeMaximal / `-vf scale`).
    """
    detected = detectRotation(input)

    try:
        manual = int(manualRotate)
    except (ValueError, TypeError):
        manual = 0
    if manual not in (90, 180, 270):
        manual = 0

    # Orientation finale visée : le choix explicite de l'utilisateur s'il est
    # non nul, sinon les métadonnées.
    # NB : dans le pipeline actuel transcodeParams["rotate"] vaut 0 par défaut
    # (cf. controllers/conductors.py) ; on n'a donc override que si non nul,
    # sinon la détection automatique ne servirait jamais.
    target = manual if manual else detected

    # Rotation déjà appliquée par ffmpeg au moment où moviepy décode.
    ffmpegApplied = 0
    if detected:
        try:
            if _ffmpegAutorotates(input):
                ffmpegApplied = detected
        except Exception:
            ffmpegApplied = 0

    # `residual` = ce qu'il reste à faire pour passer de l'état actuel des
    # frames (déjà pivotées de `ffmpegApplied`) à l'orientation `target`.
    # Cas dominants vérifiés : source sans métadonnée + rotate manuel
    # (residual == manual), et métadonnée seule avec ffmpeg auto-rotate
    # (residual == 0). Le cas combiné (métadonnée + rotate manuel différent
    # ET ffmpeg auto-rotate) applique bien un delta cohérent mais n'a pas été
    # testé sur fichier réel.
    residual = (target - ffmpegApplied) % 360

    if target in (90, 270):
        displayWidth, displayHeight = rawHeight, rawWidth
    else:
        displayWidth, displayHeight = rawWidth, rawHeight

    return residual, displayWidth, displayHeight


"""Converti une vidéo
Args:
    input (str): path du fichier d'origine
    output (str): path du fichier de sortie
    maxborder (int): bord le plus large de la vidéo de sortie. False pour désactiver le redimensionnement.
    progressCallback (Callable)
    transcodeParams (dict): paramètres additionnels de transcodage (cutBegin [secondes], cutEnd [secondes], rotate [0, 90, 180, 270])
    quality (float): qualité de transcodage, de 0.0 (moins bonne qualité) à 1.0 (meilleure qualité)
    threads (int): nombre de threads à utiliser pour le transcodage
"""
def convertVideo(input, output, maxborder, progressCallback, transcodeParams={}, quality=0.5, threads=1):
    try:
        # Charger la vidéo
        with VideoFileClip(input) as video:

            # On protège le champ qualité
            quality = min(1, max(0, quality))

            # On récupère la durée
            videoDuration = video.duration

            # On récupère la taille actuelle (résolution codée)
            currentSize = video.size
            currentWidth = currentSize[0]
            currentHeight = currentSize[1]

            # --- Rotation ----------------------------------------------------
            # On part de la rotation lue dans les métadonnées (vidéos smartphone
            # stockées en paysage) ; un `rotate` manuel non nul la remplace.
            # _planRotation() tient compte du fait que ffmpeg a pu déjà
            # réorienter les frames au décodage : `residual` est ce qu'il reste
            # à faire, et (displayWidth, displayHeight) sont les dimensions
            # réellement affichées.
            rotateResidual, displayWidth, displayHeight = _planRotation(
                input, currentWidth, currentHeight, transcodeParams.get("rotate", 0)
            )

            if maxborder != False:
                # On calcule les nouvelles dimensions (affichées)
                newWidth, newHeight = ResizeMaximal(displayWidth, displayHeight, maxborder)
                newSize = (newWidth, newHeight)
            else:
                newSize = (displayWidth, displayHeight)
            # `-vf scale` s'exécute côté ffmpeg APRÈS le .rotate() de moviepy
            # (qui transforme les frames en amont du pipe, cf.
            # moviepy/video/fx/rotate.py) : on lui passe donc directement les
            # dimensions d'affichage, sans ré-inversion. Ce même scale corrige
            # aussi l'aspect ratio quand ffmpeg a livré des frames déjà pivotées
            # mais écrasées à la résolution codée.

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

            # On crée un extrait
            subclip = video.subclip(newBegin, newEnd)

            # On initialise le logger qui permettra de suivre l'avancement
            logger = VideoLogger()
            logger.setCbk(progressCallback)

            # Personnaliser les options de l'encodeur FFmpeg
            ffmpeg_params = [
                "-b:v", "2M",                               # Débit binaire vidéo
                "-qmin", "10",                              # Quantisation minimale (VBR - 0 pour moins bonne qualité et 63 pour meilleure qualité)
                "-qmax", "42",                              # Quantisation maximale (VBR - 0 pour moins bonne qualité et 63 pour meilleure qualité)
                "-crf", "30",                               # Facteur de qualité Constant Rate Factor (CRF)
                "-q:v", str(10*(1-quality)),                # Qualité vidéo (10 étant la moins bonne qualité, 0 étant la meilleure qualité)
                "-quality", "good",                         # Qualité globale de l'encodage (options: fast, good, best)
                "-cpu-used", "3",                           # Vitesse de l'encodage (plus la valeur est élevée, plus l'encodage est rapide) - VP8: 0 (lent)/5(rapide) - VP9: 0(lent)/8(rapide)
                "-threads", str(threads),                   # Nombre de threads à utiliser pour l'encodage
                "-vf", f"scale={newSize[0]}:{newSize[1]}",  # Redimensionner la vidéo
            ];

            # Lancement du transcodage avec un redimensionnement
            subclip.rotate(0-rotateResidual).write_videofile(output, codec="libvpx", preset="superfast", ffmpeg_params=ffmpeg_params, logger=logger)

    except Exception as e:
        return e
    finally:
        try:
            video.close()
            subclip.close()
        except Exception as e:
            pass

    return True


# ---------------------------------------------------------------------------
# Transcodage isolé (robustesse)
# ---------------------------------------------------------------------------
#
# CHOIX DE ROBUSTESSE
# -------------------
# ffmpeg/libvpx peut se bloquer indéfiniment sur un pipe (deadlock
# stdin/stdout) sans jamais renvoyer d'erreur : le thread vidéo se fige alors en
# silence, media.progress reste bloqué et plus aucun média ne se transcode.
# Un `Restart=on-failure` systemd n'aide pas (le process ne plante pas, il
# pend). On exécute donc chaque conversion dans un SOUS-PROCESSUS qu'on peut
# tuer au bout d'un `timeout` ; la logique de retry existante (media.passes)
# reprend ensuite le fichier normalement.
#
# Contexte "spawn" imposé (et non "fork") : le thread vidéo tourne au milieu de
# Flask / SQLAlchemy / socketio, un fork copierait des verrous dans un état
# incohérent. Le sous-processus est placé dans son propre groupe de process
# pour pouvoir tuer aussi le ffmpeg qu'il a lancé.


def _transcodeChild(progressQueue, resultQueue, input, output, maxborder,
                    transcodeParams, quality, threads):
    try:
        os.setpgrp()
    except Exception:
        pass

    def childCallback(percent, lastUpdate):
        try:
            progressQueue.put(percent)
        except Exception:
            pass

    try:
        result = convertVideo(input, output, maxborder, childCallback,
                              transcodeParams, quality, threads)
        resultQueue.put(True if result is True else str(result))
    except Exception as e:  # pragma: no cover - garde-fou
        resultQueue.put("Erreur sous-processus de transcodage : {}".format(e))


def _killProcessTree(proc, sig):
    try:
        os.killpg(os.getpgid(proc.pid), sig)
    except Exception:
        try:
            proc.terminate() if sig == signal.SIGTERM else proc.kill()
        except Exception:
            pass


def convertVideoSafe(input, output, maxborder, progressCallback,
                     transcodeParams={}, quality=0.5, threads=1, timeout=3600):
    """convertVideo() isolé dans un sous-processus avec timeout dur.

    Même signature que convertVideo() plus `timeout` (secondes). Renvoie True en
    cas de succès, sinon une chaîne décrivant l'erreur (ou le timeout).
    """
    ctx = multiprocessing.get_context("spawn")
    progressQueue = ctx.Queue()
    resultQueue = ctx.Queue()
    proc = ctx.Process(
        target=_transcodeChild,
        args=(progressQueue, resultQueue, input, output, maxborder,
              transcodeParams, quality, threads),
        daemon=True,
    )
    proc.start()

    lastUpdate = [0]
    deadline = time.time() + timeout
    result = None

    while result is None:
        # Timeout ? (vérifié à chaque tour, même sous un flux continu de
        # messages de progression)
        if time.time() > deadline:
            _killProcessTree(proc, signal.SIGTERM)
            proc.join(10)
            if proc.is_alive():
                _killProcessTree(proc, signal.SIGKILL)
                proc.join(5)
            result = "Timeout de transcodage ({}s) : sous-processus interrompu".format(timeout)
            break

        # Progression (bloquant court : cadence la boucle à ~1s)
        try:
            percent = progressQueue.get(timeout=1)
            try:
                progressCallback(percent, lastUpdate)
            except Exception:
                pass
            continue
        except _queue.Empty:
            pass

        # Résultat final ?
        try:
            result = resultQueue.get_nowait()
            break
        except _queue.Empty:
            pass

        # Process mort sans résultat ?
        if not proc.is_alive():
            try:
                result = resultQueue.get(timeout=2)
            except _queue.Empty:
                result = "Le sous-processus de transcodage s'est arrêté sans résultat"
            break

    proc.join(5)
    if proc.is_alive():
        _killProcessTree(proc, signal.SIGKILL)

    if result is True:
        try:
            progressCallback(100, lastUpdate)
        except Exception:
            pass
        return True
    return result if result is not None else "Transcodage échoué (raison inconnue)"


"""Converti une vidéo en gif
Args:
    input (str): path de la vidéo d'orgine
    output (str): path de l'image de sortie
    maxborder (int): bord le plus large de la miniature de sortie. False pour désactiver le redimensionnement.
"""
def getThumbnailPicture(input, output, maxborder):
    clipStart = 10
    clipDuration = 8
    try:
        # Charger la vidéo
        with VideoFileClip(input) as video:

            videoDuration = video.duration

            # Rotation d'orientation éventuelle. Après transcodage la rotation
            # est déjà « cuite » dans les pixels : detectRotation() renvoie alors
            # 0 et rien n'est fait ici. Utile en revanche pour les fichiers bruts
            # (jingles "raw" copiés sans transcodage).
            currentWidth, currentHeight = video.size
            rotateResidual, displayWidth, displayHeight = _planRotation(
                input, currentWidth, currentHeight
            )

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

            # On redresse le clip si nécessaire
            if rotateResidual:
                clip = clip.rotate(0-rotateResidual)

            # On redimensionne le clip vers les dimensions AFFICHÉES (ce qui
            # corrige aussi l'aspect ratio si ffmpeg a livré des frames écrasées)
            newSize = ResizeMaximal(displayWidth, displayHeight, maxborder)
            clip = clip.resize(newSize)

            # On enregistre le GIF
            clip.write_gif(os.getcwd()+"/"+output, fps=7, fuzz=40, program="ffmpeg")

            clip.close()

    except Exception as e:
        return e
    finally:
        try:
            video.close()
        except Exception as e:
            pass

    return True
