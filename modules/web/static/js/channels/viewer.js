// ID des médias armés et en cours de lecture
var armedMedia = null;
var takedMedia = null;

console.log("Viewer ID \""+viewerID+"\"");

// Élément contenant l'alerte de connexion
const _connectionAlert = document.getElementById("connectionAlert");

// Élément vidéo contenant les jingles
const jingleVideo = document.getElementById("jingleVideoElement");

// zIndex des media items
var currentZindex = 9999;

// Mode preview
var previewMode = false;

// Volume max
var maximumVolume = 1;

// Mode jingle override
var jingleOverride = false;



/**
 * Génère un GUID
 * @returns GUID généré
 */
function generateGUID() {
    return 'yxxxyxyyxyxyxxyxyxyxyxyxyxyxyxyxyxyxyxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}



/**
 * Crée une nouvelle structure DOM contenant un nouveau média.
 **/
function mediaArm(mediaID, type, src, source, volume=1, volumeAfterLoop=1, loop=false, startFrom=0) {
    let id = generateGUID();

    // Création du nouvel élément
    let dom_media_item = document.createElement("div");
    dom_media_item.classList.add("media_item");
    dom_media_item.classList.add(type);
    dom_media_item.setAttribute("id", "media-item-" + id);
    dom_media_item.style.zIndex = currentZindex--;
    dom_media_item.dataset.id = id;
    dom_media_item.dataset.mediaId = mediaID;
    dom_media_item.classList.add("invisible"); // Par défaut l'élément est invisible

    let dom_media_osd = document.createElement("div");
    dom_media_osd.classList.add("media_osd");

        let dom_media_osd_remain = document.createElement("div");
        dom_media_osd_remain.classList.add("media_remain");
        dom_media_osd_remain.innerText = ""; // Par défaut, le remain est vide

        let dom_media_osd_progress = document.createElement("div");
        dom_media_osd_progress.classList.add("media_progress");

            let dom_media_osd_progressbar = document.createElement("div");
            dom_media_osd_progressbar.classList.add("progressbar");
            dom_media_osd_progressbar.style.width = "0%";

            dom_media_osd_progress.append(dom_media_osd_progressbar);

        dom_media_osd.append(dom_media_osd_remain, dom_media_osd_progress);

    let dom_media_credit = document.createElement("div");
    dom_media_credit.classList.add("media_credit");
    dom_media_credit.innerText = source.trim();

    let dom_media = document.createElement("div");
    dom_media.classList.add("media_object");

    let dom_media_obj = null;

    // On crée les objets média selon le type
    if(type=="video") {
        dom_media_obj = document.createElement("video");
        dom_media_obj.dataset.volumeAfterLoop = volumeAfterLoop;
        dom_media_obj.dataset.volumeAfterLoopEnabled = 1;
        dom_media_obj.dataset.playerId = id;
        dom_media_obj.dataset.loop = loop;
        dom_media_obj.dataset.playIteration = 1;

        // On désactive l'auto play : c'est JS qui s'en charge
        dom_media_obj.autoplay = false;
    }
    else if(type=="picture") {
        dom_media_obj = document.createElement("img");
        dom_media_obj.setAttribute("alt", "");
    }

    // Définition des ID dom
    dom_media_obj.setAttribute("id", "media-item-obj-" + id);
    dom_media_obj.classList.add("media-item-obj");

    // Définition des URLs des médias
    dom_media_obj.setAttribute("src", src);
    if(type=="video")
        dom_media_obj.volume = scaleVolume(linearToLogarithmic(volume));


    // Event handlers des vidéos
    if(type=="video") {
        const videoObj = dom_media_obj;
        const osdRemain = dom_media_osd_remain;
        const osdProgress = dom_media_osd_progressbar;
        
        if(previewMode) {
            videoObj.addEventListener("timeupdate", function(e) {
                    // On affiche le temps restant si < 10s et première lecture
                    let remain = "";
                    if(videoObj.dataset.playIteration == 1) {
                        const delta = e.target.duration - e.target.currentTime;
                        if(delta <= 10.9999 && delta >= 0)
                            remain = Math.floor(delta);
                    }

                    // On met à jour la progressbar
                    const progress = ((e.target.currentTime / e.target.duration) * 100).toFixed(2);
                    osdProgress.style.width = progress + "%";

                    osdRemain.innerText = remain;
            });
        }
        videoObj.addEventListener("ended", function(e) {
            // Si on loop la vidéo, on retourne au début
            if(videoObj.dataset.loop == "true") {

                // On met en pause la lecture et on relance
                videoObj.pause();
                videoObj.currentTime = 0;
                videoObj.play();

                // On ajoute 1 au play iteration
                videoObj.dataset.playIteration++;

                // On défini le nouveau volume si la fonction est active sur ce média
                if(videoObj.dataset.volumeAfterLoopEnabled == 1)
                    e.target.volume = linearToLogarithmic(scaleVolume(videoObj.dataset.volumeAfterLoop));


                console.log("Loop mode. Replay file with volume "+(videoObj.volume*100)+".");

            }
        });
        videoObj.addEventListener("loadedmetadata", () => {
            videoObj.currentTime = startFrom;
        });
    }


    // On récupère l'élément parent
    let parentElement = document.getElementById("main");

    dom_media.appendChild(dom_media_obj);
    dom_media_item.appendChild(dom_media_osd);
    dom_media_item.appendChild(dom_media_credit);
    dom_media_item.appendChild(dom_media);

    if(parentElement.firstChild === null)
        parentElement.appendChild(dom_media_item);
    else
        parentElement.insertBefore(dom_media_item, parentElement.firstChild);

    // On supprime le media armé s'il existe
    if(armedMedia !== null) {
        let toDelete = document.getElementById("media-item-" + armedMedia);
        if(toDelete !== null) {
            toDelete.parentNode.removeChild(toDelete);
        }
    }

    // On change l'ID du média armé
    armedMedia = id;

    // On retourne les données
    return {
        playerID: id,
        element: dom_media_item
    };

}



/**
 * Unload d'un player selon son playerID
 * @param {string} playerID ID du player
 * @returns void
 */
function mediaUnload(playerID) {
    // On cherche le player ID
    let player = document.querySelector("div[data-id='"+playerID+"']");

    if(player) {
        // On unload les vidéos ou les images
        player.querySelectorAll("video, img").forEach((element) => {
            element.src = "";
        });
    }
}


/**
 * Transite un élément armé vers un élément joué
 **/
function takeArmed(autoPlay = true) {
    // Seulement s'il y a un élément armé
    if(armedMedia !== null) {
        let newMedia = document.getElementById("media-item-" + armedMedia);
        if(newMedia !== null) {
            // Si un élément joué existe, on le passe en invisible
            if(takedMedia !== null) {
                let toHide = document.getElementById("media-item-" + takedMedia);
                if(toHide !== null) {
                    toHide.classList.add("invisible");
                }
            }

            // Destruction de l'élément dans 10 secondes
            window.setTimeout(function(id) {
                let toDelete = document.getElementById("media-item-" + id);
                if(toDelete !== null) {
                    toDelete.parentNode.removeChild(toDelete);
                }
            }, 10000, takedMedia);

            // On enlève la classe invisible du nouveau média
            newMedia.classList.remove("invisible");

            // On transforme le média armé en media joué
            takedMedia = armedMedia;

            // On vide l'ID du média armé
            armedMedia = null;

            // On lance la lecture du nouveau média si besoin
            if(autoPlay)
                mediaPlay(takedMedia);
        }
    }
}


/**
 * Lance la lecture du media défini par l'ID indiqué
 */
function mediaPlay(id) {
    // On récupère le média
    let mediaItem = document.getElementById("media-item-" + id);
    if(mediaItem!==null) {
        // On vérifie si le type de media est compatible avec cette commande
        if(mediaItem.classList.contains("video")) {
            // On récupère les 2 objets et on lance la lecture
            let videoObj = document.getElementById("media-item-obj-" + id);

            if(videoObj !== null)
                videoObj.play();
        }
    }
}


function stopAllMediasID(mediaID) {
    document.querySelectorAll(".media_item").forEach((element) => {;
        if(element.dataset.mediaId == mediaID) {
            console.debug("stopAllMediasID() : Found element for mediaID "+mediaID+". Stopping. ", element);
            element.querySelectorAll("video").forEach((obj) => {
                obj.pause();
            });
        }
    });
}


function destroyAllMediasID(mediaID) {
    document.querySelectorAll(".media_item").forEach((element) => {
        if(element.dataset.mediaId == mediaID) {
            console.debug("destroyAllMediasID() : Found element for mediaID "+mediaID+". Removing. ", element);
            element.remove();
        }
    });
}



/**
 * Transforme un volume linéaire en volume logarithmique
 * @param {number} value Valeur linéaire du volume
 * @returns Valeur logarithmique du volume
 */
function linearToLogarithmic(value) {
    value = Math.min(1, value);
    value = Math.max(0, value);
    return Math.pow(value, 2);
}



/**
 * Réduit une valeur de volume selon la valeur de volume max
 * @param {number} input Valeur de volue à traiter
 * @returns {number} Valeur réduite
 */
function scaleVolume(input, maxVolume=null) {
    input = Math.max(0, input)
    input = Math.min(1, input)

    if(maxVolume===null)
        maxVolume = maximumVolume;
    maxVolume = Math.max(0, maxVolume);
    maxVolume = Math.min(1, maxVolume);

    return input * maximumVolume
}



/**
 * Défini le volume d'un média avec une rampe et un timing
 */
function volumeSet(id=null, exclude=false, target=0, step=0.04, interval=50, callback=null) {
    step = scaleVolume(step);
    target = scaleVolume(target);

    // On récupère le média
    let mediaItem = document.querySelectorAll(".media_item.video").forEach(element => {
        if(id==null || (!exclude && id==element.dataset.id) ||  (exclude && id!=element.dataset.id)) {

            let obj = element.querySelector(".media-item-obj");
            // On défini si on est en mode down
            let down = obj.volume > target;

            // On désactive le volumeAfterLoop
            obj.dataset.volumeAfterLoopEnabled = 0;

            const intervalInstance = setInterval(() => {

                // On calcule le nouveau volume
                let newVol = down ? obj.volume-step : obj.volume+step;

                // On change le volume
                obj.volume = Math.min(1, Math.max(0, newVol));

                // On limite
                if(down && obj.volume<=target)
                    obj.volume = scaleVolume(target);
                else if(!down && obj.volume>=target)
                    obj.volume = scaleVolume(target);

                // On arrête si on arrive au volume cible
                if(obj.volume == target) {
                    clearInterval(intervalInstance);

                    // On éxécute le callback si renseigné
                    if(typeof callback === "function") {
                        callback(obj);
                    }
                }
            }, interval)

        }
    });
}






/**
 * Joue un jingle
 */
function playJingle(src, volume) {
    jingleVideo.classList.remove("show");

    // On charge la vidéo
    jingleVideo.src = src;
    jingleVideo.volume = scaleVolume(linearToLogarithmic(volume));
}

jingleVideo.addEventListener("ended", function(e) {
    e.target.classList.remove("show");
});
jingleVideo.addEventListener("canplay", function(e) {
    e.target.play();
    e.target.classList.add("show");
});






// Connexion au socket
var socket = io.connect("/");


socket.on("connect", () => {
    console.log("Socket connected!");
    _connectionAlert.style.opacity = 0; // On cache l'alerte de connexion
});
socket.on("disconnect", () => {
    console.error("Socket disconnected!");
    _connectionAlert.style.opacity = 1; // On affiche l'alerte de connexion
});

socket.on("media_command", function(data) {
    if(data.command!==undefined && data.viewer!==undefined && data.args!==undefined) {
        const command = data.command;
        const viewer = data.viewer;
        const target = data.target ?? null;
        const args = data.args;

        console.log("Websocket received for viewer ID \"" + viewer + "\"");
        console.debug(data);

        if(viewer.includes(viewerID)  ||  (jingleOverride===true && command=="jingle")) {
            console.log("   It's me! Processing the command...");

            switch(command) {
                case "arm":
                    if ((args.type=="video" || args.type=="picture") &&
                            args.mediaID!==undefined &&
                            args.src!==undefined &&
                            args.source!==undefined &&
                            args.volume!==undefined &&
                            args.volumeAfterLoop!==undefined &&
                            args.loop!==undefined) {
                        console.log("Arming media.");

                        mediaArm(args.mediaID, args.type, args.src, args.source, args.volume, args.volumeAfterLoop, args.loop);
                    }
                    else {
                        console.error("'arm' command needs the following args: type, mediaID, src, credit, volume, volumeAfterLoop, loop.", args);
                    }

                    break;
                
                case "armtake":
                    if ((args.type=="video" || args.type=="picture") &&
                            args.mediaID!==undefined &&
                            args.src!==undefined &&
                            args.source!==undefined &&
                            args.volume!==undefined &&
                            args.volumeAfterLoop!==undefined &&
                            args.loop!==undefined &&
                            args.surcharge!==undefined) {
                        console.log("Arm and take media.");
                        
                        let startFrom = 0;

                        let volume = args.volume;
                        let volumeAfterLoop = args.volumeAfterLoop;

                        // Si on a des surcharges de paramètre, on les traite
                        if(args.surcharge.volume !== undefined) // Volume
                            volume = args.surcharge.volume;

                        if(args.surcharge.startFrom !== undefined) // Point de démarrage
                            startFrom = args.surcharge.startFrom;

                        let mediaData = mediaArm(args.mediaID, args.type, args.src, args.source, volume, volumeAfterLoop, args.loop, startFrom);
                        let mediaElement = mediaData.element;
                        let mediaPlayerID = mediaData.playerID;

                        let videoElement = mediaElement.querySelector(".media-item-obj");

                        // On défini le volumeAfterLoop à 0 sur l'ancien média
                        const videoObj = videoElement.querySelector(".media-item-obj")
                        if(videoObj) videoObj.setAttribute("data-volume-after-loop", 0);

                        // On take quand le média est chargé
                        if(args.type=="picture") {
                            videoElement.addEventListener("load", function() {

                                takeArmed(false);
                                // On baisse le volume des autres médias
                                volumeSet(mediaData.playerID, true, 0, 0.02, 25);
                            })
                        }
                        else if(args.type=="video") {
                            videoElement.addEventListener("canplay", function() {
                                takeArmed(false);
                                
                                // On lance la lecture du média
                                mediaPlay(mediaData.playerID);
                                // On baisse le volume des autres médias
                                volumeSet(mediaData.playerID, true, 0, 0.02, 25, (obj) => {
                                    obj.pause();
                                    
                                    // On unload les éléments
                                    let playerID = obj.dataset.playerId;
                                    mediaUnload(playerID);
                                    console.log(`All medias unloaded on player ID ${playerID}`);
                                });
                            })
                        }
                    }
                    else {
                        console.error("'armtake' command needs the following args: type, mediaID, src, source, volume, volumeAfterLoop, loop.", args);
                    }

                    break;

                case "jingle":

                    if (args.src!==undefined &&
                        args.volume!==undefined) {
                            playJingle(args.src, args.volume);
                    }

                    break;

                case "stop":

                    if (args.mediaID!==undefined) {
                        console.log("Stopping medias ID "+args.mediaID);
                        stopAllMediasID(args.mediaID);
                        destroyAllMediasID(args.mediaID);
                    }

                    break;
            }

        }
        else {
            console.log("   Not me. Abort.");
        }
    }
    else {
        console.error("Invalid media_command websocket datas received.", data);
    }
});




/**
 * Au chargement du DOM
 */
window.addEventListener("DOMContentLoaded", () => {

    // On récupère les paramètres GET
    const url = new URL(window.location.href);
    const getParams = new URLSearchParams(url.search);

    // On stocke l'élément de l'identifier
    const identifier = document.getElementById("identifier");


    // On veut afficher une image de test ?
    if(getParams.get("sample")=="picture") {
        console.log("Displaying picture sample.");
        mediaArm(
            "SAMPLE",
            "picture",
            "/static/sample/image.webp",
            "test"
        );
        takeArmed();
    }
    else if(getParams.get("sample")=="video") {
        console.log("Displaying video sample.");
        mediaArm(
            "SAMPLE",
            "video",
            "/static/sample/video.webm",
            "test",
            1,
            0.5,
            true
        );
        takeArmed();
    }

    // On veut supprimer l'identifier ?
    if(getParams.get("smpte")=="off") {
        // On cache l'identifier
        identifier.classList.add("hide");
    }
    else if(getParams.get("smpte")=="infinite") {
        // On ne fait pas disparaitre l'identifier
    }
    else {
        // On fait disparaitre l'identifier au bout de 10 secondes
        setTimeout(() => {
            identifier.classList.add("hide");
        }, 10000);
    }


    // Si on est en mode preview
    if(getParams.get("preview")!==null) {
        previewMode = true;
        document.body.classList.add("preview");
        console.warn("PREVIEW MODE : USER NEEDS TO INTERACT FIRST");

        // Si on détecte OBS, on supprime l'interact
        if(window.obsstudio !== undefined) {
            document.getElementById("interact").remove();
        }
    }


    // Si on demande un volume maxi
    if(getParams.get("maxVolume")!==null) {
        maxVolume = parseFloat(getParams.get("maxVolume"));
        if(typeof maxVolume==="number" && maxVolume>=0 && maxVolume<=1) {
            maximumVolume = linearToLogarithmic(maxVolume);
            console.warn("VOLUME MODE : ALL MEDIAS WILL HAVE A MAXIMUM VOLUME OF " + Math.floor(maxVolume*100) + "%");
        }
        else {
            console.error("VOLUME MODE : maxVolume MUST BE A NUMBER BETWEEN 0 AND 1");
        }
    }


    // On est en mode "jingle override" ?
    if(getParams.get("jingleOverride")!==null) {
        jingleOverride = getParams.get("jingleOverride")=="1";
    }


});