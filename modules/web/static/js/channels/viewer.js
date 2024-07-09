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
function mediaArm(mediaID, type, src, source, volume=1, volumeAfterLoop=1, loop=false) {
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

    let dom_media_credit = document.createElement("div");
    dom_media_credit.classList.add("media_credit");
    dom_media_credit.innerText = source.trim()!="" ? "Source : " + source : "";

    let dom_media_foreground = document.createElement("div");
    dom_media_foreground.classList.add("media_foreground");

    let dom_media_background = document.createElement("div");
    dom_media_background.classList.add("media_background");

    let dom_media_foreground_obj = null;
    let dom_media_background_obj = null;

    // On crée les objets média selon le type
    if(type=="video") {
        dom_media_background_obj = document.createElement("video");
        dom_media_background_obj.volume = 0;
        
        dom_media_foreground_obj = document.createElement("video");
        dom_media_foreground_obj.dataset.volumeAfterLoop = volumeAfterLoop;
        dom_media_foreground_obj.dataset.playerId = id;
        dom_media_foreground_obj.dataset.loop = loop;
    }
    else if(type=="picture") {
        dom_media_background_obj = document.createElement("img");
        dom_media_background_obj.setAttribute("alt", "");

        dom_media_foreground_obj = document.createElement("img");
        dom_media_foreground_obj.setAttribute("alt", "");
    }

    // Définition des ID dom
    dom_media_background_obj.setAttribute("id", "media-item-obj-background-" + id);
    dom_media_background_obj.classList.add("media-item-obj-background");
    dom_media_foreground_obj.setAttribute("id", "media-item-obj-foreground-" + id);
    dom_media_foreground_obj.classList.add("media-item-obj-foreground");

    // Définition des URLs des médias
    dom_media_background_obj.setAttribute("src", src);
    dom_media_foreground_obj.setAttribute("src", src);
    if(type=="video")
        dom_media_foreground_obj.volume = linearToLogarithmic(volume);


    // Synchronisation des médias foreground/background
    if(type=="video") {
        const vm = dom_media_foreground_obj;
        const vs = dom_media_background_obj;
        let timeTrigger = 0;

        const syncVideos = () => {
            if(timeTrigger==0) {
                //vs.currentTime = vm.currentTime;
                //console.debug(vm.currentTime, vs.currentTime);
            }
            timeTrigger++;
            if(timeTrigger>=20)
                timeTrigger=0;

            if(vm.paused && !vs.paused)
                vs.pause();
            else if(!vm.paused && vs.paused)
                vs.play();
        };
        vm.addEventListener("play", function() {
            vs.play();
            vs.currentTime = vm.currentTime;
        });
        vm.addEventListener("pause", function() {
            vs.pause();
            vs.currentTime = vm.currentTime;
        });
        vm.addEventListener("timeupdate", function() {
            syncVideos();
        });
        vm.addEventListener("ended", function(e) {
            // Si on loop la vidéo, on retourne au début
            if(vm.dataset.loop == "true") {
                console.log("Loop mode. Replay file with volume "+(vm.volume*100)+".");

                vm.currentTime = 0;
                vs.currentTime = 0;
                vm.play();
                vs.play();

                e.target.volume = linearToLogarithmic(vm.dataset.volumeAfterLoop);
            }
        });
    }


    // On récupère l'élément parent
    let parentElement = document.getElementById("main");

    dom_media_background.appendChild(dom_media_background_obj);
    dom_media_foreground.appendChild(dom_media_foreground_obj);
    dom_media_item.appendChild(dom_media_credit);
    dom_media_item.appendChild(dom_media_foreground);
    dom_media_item.appendChild(dom_media_background);

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
function takeArmed() {
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
            let foregroundObj = document.getElementById("media-item-obj-foreground-" + id);
            let backgroundObj = document.getElementById("media-item-obj-foreground-" + id);

            if(foregroundObj !== null)
                foregroundObj.play();
            
            if(backgroundObj !== null)
                backgroundObj.play();
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
 * Défini le volume d'un média avec une rampe et un timing
 */
function volumeSet(id=null, exclude=false, target=0, step=0.04, interval=50, callback=null) {
    // On récupère le média
    let mediaItem = document.querySelectorAll(".media_item.video").forEach(element => {
        if(id==null || (!exclude && id==element.dataset.id) ||  (exclude && id!=element.dataset.id)) {

            let obj = element.querySelector(".media-item-obj-foreground");
            // On défini si on est en mode down
            let down = obj.volume > target;

            const intervalInstance = setInterval(() => {

                // On calcule le nouveau volume
                let newVol = down ? obj.volume-step : obj.volume+step;

                // On baisse le volume
                obj.volume = Math.min(1, Math.max(0, newVol));

                // On limite
                if(down && obj.volume<target)
                    obj.volume = target;
                else if(!down && obj.volume>target)
                    obj.volume = target;

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
    jingleVideo.volume = linearToLogarithmic(volume);
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

        if(viewer.includes(viewerID)) {
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
                            args.loop!==undefined) {
                        console.log("Arm and take media.");
                        
                        let mediaData = mediaArm(args.mediaID, args.type, args.src, args.source, args.volume, args.volumeAfterLoop, args.loop);
                        let mediaElement = mediaData.element;
                        let mediaPlayerID = mediaData.playerID;

                        let foregroundElement = mediaElement.querySelector(".media-item-obj-foreground");

                        // On take quand le média est chargé
                        if(args.type=="picture") {
                            foregroundElement.addEventListener("load", function() {
                                takeArmed();
                                // On baisse le volume des autres médias
                                volumeSet(mediaData.playerID, true, 0, 0.03, 50);
                            })
                        }
                        else if(args.type=="video") {
                            foregroundElement.addEventListener("canplay", function() {
                                takeArmed();
                                
                                // On lance la lecture du média
                                mediaPlay(mediaData.playerID);
                                // On baisse le volume des autres médias
                                volumeSet(mediaData.playerID, true, 0, 0.03, 50, (obj) => {
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
        // On rend le SMPTE infini (pour les calages par ex)
        identifier.classList.add("infinite");
    }


});