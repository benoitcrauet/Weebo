// Query représentant le modal du formulaire d'édition des lignes
const modalLineQuery = "#editLineFormModal";
// QUery représentant le titre du modal d'édition des lignes
const modalLineTitleQuery = "#editLineFormModalTitle";

// Query représentant le modal du formulaire d'édition des médias
const modalMediaQuery = "#editMediaFormModal";
// QUery représentant le titre du modal d'édition des médias
const modalMediaTitleQuery = "#editMediaFormModalTitle";

// Query représentant le modal du formulaire d'édition des médias
const modalMarkerQuery = "#markerModal";

// Query représentant le tableau triable des conducteurs
const conductorTableQuery = "#cond-main-table";
// Query représentant le dragger des lignes de conducteurs
const conductorLineDraggerQuery = ".cond-line-dragger";

// Query représentant le tableau triable des médias
const conductorMediasTableQuery = ".cond-line-medias-table tbody";
// Query représentant le dragger des lignes de conducteurs
const conductorMediasDraggerQuery = ".cond-medias-line-dragger";

// Query du toast générique
const genericToastQuery = "#genericToast";

// Query de la toolbar
const toolsbarQuery = "#toolsbar";

// Query de la progressbar disk usage
const diskUsageProgressbarQuery = "#diskUsageProgress";
const diskFreeProgressbarQuery = "#diskFreeProgress";







// Shift pressed?
let shiftPressed = false;




$(function() {
    // On rend les lignes draggables
    $(conductorTableQuery).sortable({
        opacity: 0.5,
        scrollsensitivity: 50,
        axis: "y",
        handle: conductorLineDraggerQuery,
        start: function(event, ui) {
            console.log("Starting dragging line...");
        },
        stop: function(event, ui) {
            console.log("Dragging finished!");
            console.log("Sending new order to server...");
            linesSendReorder(calculateLinesOrder());
        }
    });
});





// On récupère les éléments
const condMainTable = document.querySelector(conductorTableQuery);

const formEditLine = document.getElementById("formEditLine");
const lineModalTitle = document.querySelector(modalLineTitleQuery);
const lineModalType = document.getElementById("fType");
const lineModalName = document.getElementById("fName");
const lineModalHighlight = document.getElementById("fHighlight");
const lineModalText = document.getElementById("fText");
const lineModalJingle = document.getElementById("fJingle");
const lineModalId = document.getElementById("fId");
const lineModalTag1 = document.getElementById("fTag1");
const lineModalTag2 = document.getElementById("fTag2");
const lineModalTag3 = document.getElementById("fTag3");
const lineModalTag4 = document.getElementById("fTag4");
const lineModalInsertAfter = document.getElementById("fInsertAfter");
const lineModalSubmit = document.getElementById("fSubmit");

const lineModalTagsAccordion = document.getElementById("accordionLineTagsPan");

const lineModalTypeContainer = document.getElementById("fTypeContainer");
const lineModalNameContainer = document.getElementById("fNameContainer");
const lineModalHighlightContainer = document.getElementById("fHighlightContainer");
const lineModalTextContainer = document.getElementById("fTextContainer");
const lineModalJingleContainer = document.getElementById("fJingleContainer");

var lineModal = null;
var mediaModal = null;

var genericToast = null;

/**
 * Ouvre une modale d'édition de ligne
 * @param {string} id 
 * @param {string} insertAfter 
 * @param {string} type 
 * @param {string} name 
 * @param {string} text 
 * @param {string} tag1 
 * @param {string} tag2 
 * @param {string} tag3 
 * @param {string} tag4 
 */
async function openLineEditor(id=null, insertAfter=null, type=null, name=null, text=null, tag1=null, tag2=null, tag3=null, tag4=null) {
    let editMode = false;
    if(id!==null)
        editMode = true;
    
    if(editMode) {
        lineModalTitle.innerText = "Modification de la ligne";

        // Si c'est un édit mode, on cache le type
        lineModalTypeContainer.style.display = "none";

        let data = await lineGet(id)
        try {
            // On set les éléments
            lineModalType.value = data.type;
            lineModalName.value = data.name;
            lineModalHighlight.checked = data.highlight;
            lineModalText.value = data.text;
            lineModalJingle.value = data.jingle;
            lineModalId.value = data.id;
            lineModalInsertAfter.value = "";
            lineModalTag1.value = data.tag1 ?? "";
            lineModalTag2.value = data.tag2 ?? "";
            lineModalTag3.value = data.tag3 ?? "";
            lineModalTag4.value = data.tag4 ?? "";

            // On ouvre l'accordion des tags, si des données sont présentes
            let bsCollapse = new bootstrap.Collapse(lineModalTagsAccordion, {
                toggle: false
            });
            if(data.tag1!="" || data.tag2!="" || data.tag3!="" || data.tag4!="")
                bsCollapse.show();
            else // Si aucune donnée dans les tags, on ferme l'accordion
                bsCollapse.hide();

            lineEditUpdateDisplay(lineModalType.value);

            lineModal.show();
        } catch(error) {
            console.error("Impossible d'obtenir la ligne d'orgine pour le formulaire d'édition.");
        }
    }
    else {
        // Titre
        lineModalTitle.innerText = "Nouvelle ligne";

        // Si c'est une nouvelle ligne, on affiche le type
        lineModalTypeContainer.style.display = "block";

        // On reset les éléments
        lineModalType.selectedIndex = 0;
        lineModalName.value = "";
        lineModalHighlight.checked = false;
        lineModalText.value = "";
        lineModalJingle.value = "";
        lineModalId.value = id ?? "";
        lineModalInsertAfter.value = insertAfter ?? "";
        lineModalTag1.value = "";
        lineModalTag2.value = "";
        lineModalTag3.value = "";
        lineModalTag4.value = "";

        // On ferme l'accordion des tags, par défaut
        let bsCollapse = new bootstrap.Collapse(lineModalTagsAccordion, {
            toggle: false
        });
        bsCollapse.hide();

        lineEditUpdateDisplay(lineModalType.value);

        lineModal.show();
    }

    // On réactive le submit
    lineModalSubmit.disabled = false;
}




const formEditMedia = document.getElementById("formEditMedia");
const mediaModalTitle = document.querySelector(modalMediaTitleQuery);

const mediaModalType = document.getElementById("gType");
const mediaModalName = document.getElementById("gName");
const mediaModalSource = document.getElementById("gSource");
const mediaModalFile = document.getElementById("gFile");
const mediaModalLoop = document.getElementById("gLoop");
const mediaModalVolume = document.getElementById("gVolume");
const mediaModalVolumeAfterLoop = document.getElementById("gVolumeAfterLoop");
const mediaModalUrl = document.getElementById("gUrl");
const mediaModalMediaChannel = document.getElementById("gMediaChannel");
const mediaModalWebChannel = document.getElementById("gWebChannel");
const mediaModalSubmit = document.getElementById("gSubmit");
const mediaModalCancel = document.getElementById("gCancel");

const mediaModalUrlAlert = document.getElementById("gUrlAlert");

const mediaModalCutBegin = document.getElementById("gCutBegin");
const mediaModalCutEnd = document.getElementById("gCutEnd");
const mediaModalRotate = document.getElementById("gRotate");

const mediaId = document.getElementById("gId");
const mediaLine = document.getElementById("gLine");


const mediaModalTypeContainer = document.getElementById("gTypeContainer");
const mediaModalNameContainer = document.getElementById("gNameContainer");
const mediaModalSourceContainer = document.getElementById("gSourceContainer");
const mediaModalFileContainer = document.getElementById("gFileContainer");
const mediaModalDiskUsageContainer = document.getElementById("gDiskUsageContainer");
const mediaModalRotateContainer = document.getElementById("gRotateContainer");
const mediaModalPlayPresetsContainer = document.getElementById("gPlayPresetsContainer");
const mediaModalLoopContainer = document.getElementById("gLoopContainer");
const mediaModalVolumeContainer = document.getElementById("gVolumeContainer");
const mediaModalVolumeAfterLoopContainer = document.getElementById("gVolumeAfterLoopContainer");
const mediaModalUrlContainer = document.getElementById("gUrlContainer");
const mediaModalMediaChannelContainer = document.getElementById("gMediaChannelContainer");
const mediaModalWebChannelContainer = document.getElementById("gWebChannelContainer");

const mediaModalTranscodeSettingsContainer = document.getElementById("gTranscodeSettingsContainer");
const mediaModalTranscodeSettingsAccordion = document.getElementById("accordionTranscodeSettings");

const mediaModalCutBeginContainer = document.getElementById("gCutBeginContainer");
const mediaModalCutEndContainer = document.getElementById("gCutEndContainer");


/**
 * Ouvre une modale d'édition de média
 * @param {string} line ID de la ligne
 * @param {string} id ID du média (si édition)
 * @param {string} type Type de média
 * @param {string} name Nom du média
 * @param {string} source Source du média
 * @param {boolean} loop Active la lecture en boucle du média
 * @param {number} volume Volume du média entre 0 et 1
 * @param {string} url URL de la page web
 * @param {array} mediaChannel Liste des ID de canaux médias
 * @param {array} webChannel Liste des ID de canaux web
 */
async function openMediaEditor(line, id=null, type=null, name=null, source=null, loop=null, volume=null, url=null, mediaChannel=null, webChannel=null) {
    let editMode = false;
    if(id!==null)
        editMode = true;

    // On set la valeur de la ligne parente
    mediaLine.value = line;

    // On efface l'alerte d'URL
    mediaModalUrlAlert.innerHTML = "";
    mediaModalUrlAlert.style.display = "none";
    mediaModalUrl.dataset.refused = false;
    
    if(editMode) {
        mediaModalTitle.innerText = "Modification du média";

        // Si c'est un édit mode, on cache le type
        mediaModalTypeContainer.style.display = "none";

        let data = await mediaGet(id)
        try {
            mediaModalType.value = data.type;
            mediaModalName.value = data.name;
            mediaModalSource.value = data.source;
            mediaModalFile.value = "";
            mediaModalLoop.checked = data.loop;
            mediaModalVolume.value = data.volume;
            mediaModalVolumeAfterLoop.value = data.volumeAfterLoop;
            mediaModalUrl.value = data.path;
            mediaId.value = data.id;
            multiSelectSetValues(mediaModalMediaChannel, defaultMediaChannels);
            multiSelectSetValues(mediaModalWebChannel, defaultWebChannels);
            if(data.type=="media")
                multiSelectSetValues(mediaModalMediaChannel, data.channel.split(","));
            else
                multiSelectSetValues(mediaModalWebChannel, data.channel.split(","));

            mediaEditUpdateDisplay(mediaModalType.value);

            // On affiche le transcode settings
            mediaModalTranscodeSettingsContainer.style.display = "none";

            // On cache le champ file
            mediaModalFileContainer.style.display = "none";

            mediaModal.show();
        } catch(error) {
            console.error("Impossible d'obtenir le média d'orgine pour le formulaire d'édition.");
        }
    }
    else {
        // Titre
        mediaModalTitle.innerText = "Nouveau média";

        // Si c'est une nouvelle ligne, on affiche le type
        mediaModalTypeContainer.style.display = "block";

        // On reset les éléments
        mediaModalType.selectedIndex = 0;
        mediaModalName.value = "";
        mediaModalSource.value = "";
        mediaModalFile.value = "";
        mediaModalCutBegin.value = "";
        mediaModalCutEnd.value = "";
        mediaModalRotate.selectedIndex = 0;
        mediaModalLoop.checked = true;
        mediaModalVolume.value = 0;
        mediaModalVolumeAfterLoop.value = 0;
        mediaModalUrl.value = "";
        mediaId.value = "";
        multiSelectSetValues(mediaModalMediaChannel, defaultMediaChannels);
        multiSelectSetValues(mediaModalWebChannel, defaultWebChannels);

        mediaEditUpdateDisplay(mediaModalType.value);

        // On cache le transcode settings
        mediaModalTranscodeSettingsContainer.style.display = "block";

        mediaModal.show();
    }

    // On réactive le submit
    mediaModalSubmit.disabled = false;
    mediaModalCancel.disabled = false;
}





const formMarker = document.getElementById("formMarker");

const markerModalDescription = document.getElementById("hDescription");

const markerModalSubmit = document.getElementById("hSubmit");
const markerModalCancel = document.getElementById("hCancel");
/**
 * Ouvre une modale de création de marqueur
 */
async function openMarkerEditor() {
    // On affiche le modal du marqueur
    markerModal.show();
}



function getSecondsFromString(input) {
    if(!/^\d+:\d{2}$/.test(input))
        return false;
    const timeArray = input.split(":").map(Number);
    let [minutes, seconds] = timeArray;
    return minutes * 60 + seconds;
}

function getStringFromSeconds(input) {
    const minutes = Math.floor(input / 60);
    const seconds = input % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}


/**
 * Met à jour ou ajout des lignes dans le DOM en fonction des données d'entrée
 */
function updateLines(data, keep=false) {
    let idToKeep = [];

    // On explore les données
    for(let k in data) {
        let line = data[k];
        let element = document.getElementById("cond-line-" + line.id);

        // On ajoute l'ID à la liste
        idToKeep.push(line.id);

        // Si l'élément existe on le met à jour...
        if(element !== null) {
            lineSetDatas(element, line); // On met juste à jour les infos
        }
        // ...s'il n'existe pas, on le crée
        else {
            let newLine = lineStructure(activateMedias);
            lineSetDatas(newLine, line);
            condMainTable.append(newLine);
        }
    }

    if(!keep)
        // On cherche aussi des éléments à supprimer
        condMainTable.querySelectorAll(".cond-line").forEach(element => {
            let id = element.dataset.id;

            if(!idToKeep.includes(id))
                // ID introuvable > on supprime l'élément
                element.remove();
        });
}




/**
 * Remet les lignes du DOM dans l'ordre
 */
function reorderLines() {
    // Sélectionne tous les tbody
    const tbodyList = condMainTable.querySelectorAll('.cond-line');

    // Convertit la NodeList en tableau
    const tbodyArray = Array.from(tbodyList);

    // Trie le tableau en fonction de l'attribut data-order
    tbodyArray.sort((a, b) => {
        const orderA = parseInt(a.getAttribute('data-order'));
        const orderB = parseInt(b.getAttribute('data-order'));
        return orderA - orderB;
    });

    // Réinsère les tbody triés dans l'ordre dans leur parent (table)
    tbodyArray.forEach(tbody => condMainTable.appendChild(tbody));

}



/**
 * Remet les médias du DOM dans l'ordre
 */
function reorderMedias() {
    // Pour chaque ligne...
    let mediasContainer = condMainTable.querySelectorAll(".cond-line-medias-table tbody");
    mediasContainer.forEach(lineMediasContainer => {
        // ... on réordonne les médias selon leur ordre

        // Sélectionne tous les médias de la ligne
        const trList = lineMediasContainer.querySelectorAll('.cond-medias-line');

        // Convertit la NodeList en tableau
        const trArray = Array.from(trList);

        // Trie le tableau en fonction de l'attribut data-order
        trArray.sort((a, b) => {
            const orderA = parseInt(a.getAttribute('data-order'));
            const orderB = parseInt(b.getAttribute('data-order'));
            return orderA - orderB;
        });

        // Réinsère les tbody triés dans l'ordre dans leur parent (table)
        trArray.forEach(tbody => lineMediasContainer.appendChild(tbody));
    });

    

}




/**
 * Calcule l'ordre des lignes actuellement dans le conducteur
 * @returns Tableau contenant les nouvelles valeurs d'ordre pour le conducteur courant
 */
function calculateLinesOrder() {
    let newOrder = [];

    let lines = condMainTable.querySelectorAll(".cond-line");
    let o = 1;
    lines.forEach(element => {
        if(element.dataset.id !== undefined)
            newOrder.push({
                id: element.dataset.id,
                order: o++
            });
    });

    return newOrder;
}



/**
 * Calcule l'ordre des médias actuellement dans la ligne indiquée
 * @param {string} lineID ID de la ligne de conducteur à calculer
 * @returns Tableau contenant les nouvelles valeurs d'ordre pour le conducteur courant
 */
function calculateMediasOrder(lineID) {
    let newOrder = [];

    let lines = document.getElementById("cond-line-"+lineID).querySelectorAll(".cond-medias-line");
    let o = 1;
    lines.forEach(element => {
        if(element.dataset.id !== undefined)
            newOrder.push({
                id: element.dataset.id,
                order: o++
            });
    });

    return newOrder;
}



/**
 * Active ou désactive le mode recording
 */
function recordingEnable(enable) {
    console.debug("Enable recording", enable);

    if(enable) {
        document.body.classList.add("recording");
    }
    else {
        document.body.classList.remove("recording");
    }
}



/**
 * Active ou désactive le mode streaming
 */
function streamingEnable(enable) {
    console.debug("Enable streaming", enable);
    if(enable) {
        document.body.classList.add("streaming");
    }
    else {
        document.body.classList.remove("streaming");
    }
}


/**
 * Remet à jour l'ensemble du DOM du conducteur
 */
async function refreshAllConductor(callback=null) {
    console.debug("Refresh all...");

    // Effectue la requête GET
    fetch("/api/conductor/"+currentConductorID+"/lines")
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la requête GET');
            }
            return response.json();
        })
        .then(data => {
            // On efface le tableau
            document.querySelectorAll(".cond-line").forEach(function(element) {
                element.remove();
            });

            // On redéfini les modes recording et streaming
            recordingEnable(data.conductor.recording);
            streamingEnable(data.conductor.streaming);

            // On récupère chaque data et on place dans le tableau
            for(let k in data.lines) {
                let line = data.lines[k];
                
                // On crée la structure DOM et on l'ajoute
                let elements = lineStructure(activateMedias);
                lineSetDatas(elements, line);
                condMainTable.append(elements);
                // On enregistre les eventListeners
                lineElementsRegisterEventListeners(elements);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération du conducteur :', error);
        })
        .finally(function() {

            // Maintenant on met à jour les médias
            fetch("/api/conductor/"+currentConductorID+"/medias")
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erreur lors de la requête GET');
                    }
                    return response.json();
                })
                .then(data => {
                    // On récupère chaque media et on place dans le tableau
                    for(let k in data) {
                        let media = data[k];
                        
                        insertMediaInConductor(media);
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de la récupération du conducteur :', error);
                })
                .finally(function() {
                    // Finalement on appelle le callback s'il est défini
                    if(typeof callback === "function") {
                        callback();
                    }
                })
        });
}




/**
 * Permet d'inscrire les éléments intéractifs d'une ligne de conducteur sur leurs évènements respectifs.
 * @param {HTMLElement} elements Structure d'une ligne de conducteur
 */
function lineElementsRegisterEventListeners(elements) {
    let lineID = elements.getAttribute("data-id");

    // Évènement quand on coche la case d'une ligne
    const lineDone = elements.querySelector(".cond-line-done-checkbox");
    lineDone.addEventListener("click", function(e) {
        e.preventDefault();

        lineSendEdit(lineID, null, null, null, e.target.checked, null);
    });

    // Évènement quand on clique sur un bouton d'insertion
    const adder = elements.querySelector(".cond-insertion-adder-link");
    adder.addEventListener("click", function(e) {
        e.preventDefault();
        clickLineEdit(null, lineID);
    });

    // Évènement quand on clique sur un bouton d'édition
    const lineEdit = elements.querySelector(".cond-line-action-edit");
    lineEdit.addEventListener("click", function(e) {
        e.preventDefault();
        clickLineEdit(lineID);
    });

    // Évènement quand on clique sur un bouton de suppression
    const lineDelete = elements.querySelector(".cond-line-action-delete");
    lineDelete.addEventListener("click", function(e) {
        e.preventDefault();
        if(shiftPressed || confirm("Êtes-vous sûr de vouloir supprimer cette ligne ?"))
            lineSendDelete(lineID);
    });

    // Évènement quand on clique sur le bouton d'ajout de médias
    if(activateMedias) {
        const mediasInsert = elements.querySelector(".cond-medias-adder-link");
        mediasInsert.addEventListener("click", function(e) {
            e.preventDefault();
            openMediaEditor(lineID);
        });
    }

    // Évènement quand on clique sur le bouton de lancement du jingle
    const jingleButton = elements.querySelector(".cond-line-jingle-start-button");
    jingleButton.addEventListener("click", function(e) {
        e.preventDefault();
        
        const jingleID = this.dataset.jingle;

        // On envoie une requête de lancement de jingle au serveur
        if(shiftPressed || confirm("Êtes-vous sûr de vouloir lancer ce jingle ?"))
            jingleBroadcast(jingleID);
    })



    // On rend les médias de la ligne draggables
    $(elements).find(conductorMediasTableQuery).sortable({
        opacity: 0.5,
        scrollsensitivity: 50,
        axis: "y",
        handle: conductorMediasDraggerQuery,
        start: function(event, ui) {
            console.log("Starting dragging media...");
        },
        stop: function(event, ui) {
            console.log("Dragging finished!");
            mediasSendReorder(lineID, calculateMediasOrder(lineID));
        }
    });
}

/**
 * Permet d'inscrire les éléments intéractifs d'un média sur leurs évènements respectifs.
 * @param {HTMLElement} elements Structure d'un média
 */
function mediaElementsRegisterEventListeners(elements) {
    let lineID = elements.getAttribute("data-line-id");
    let mediaID = elements.getAttribute("data-id");

    // Évènement quand on clique sur le bouton d'erreur
    const mediaError = elements.querySelector(".cond-media-error-button");
    mediaError.addEventListener("click", function(e) {
        e.preventDefault();
        
        let mediaElement = document.getElementById("cond-media-line-"+mediaID);
        let mediaError = mediaElement.getAttribute("data-error");
        
        alert("Erreur de transcodage du média :\n\n"+mediaError);
    });

    // Évènement quand on clique sur le bouton de copie de lien
    const mediaCopy = elements.querySelector(".cond-medias-line-action-copy");
    mediaCopy.addEventListener("click", function(e) {
        e.preventDefault();
        
        let mediaElement = document.getElementById("cond-media-line-"+mediaID);
        let mediaPath = mediaElement.getAttribute("data-path");
        let mediaType = mediaElement.getAttribute("data-type");

        // Si c'est un média, on construit le lien absolu
        if(mediaType=="media")
            mediaPath = webBase + "/" + mediasDir + "/" + mediaPath;

        if (navigator.clipboard) {
            // Utilisez l'API Clipboard pour écrire le texte
            navigator.clipboard.writeText(mediaPath)
                .then(() => {
                    displayGenericToast("Lien copié", "Le lien a bien été copié dans le presse-papier !");
                })
                .catch(err => {
                    displayGenericToast("Erreur", "Une erreur est survenue lors de la copie du lien dans le presse-papier. Vous pouvez le copier ici :\n\n"+mediaPath, "danger");
                });
        } else {
            displayGenericToast("API Clipboard indisponible", "Impossible de copier le lien sur ce navigateur. Vous pouvez le copier ici :\n\n"+mediaPath, "warning");
        }
    });

    // Évènement quand on clique sur le bouton de preview
    const mediaPreview = elements.querySelector(".cond-medias-line-action-preview");
    mediaPreview.addEventListener("click", function(e) {
        e.preventDefault();
        
        let mediaElement = document.getElementById("cond-media-line-"+mediaID);
        let mediaType = mediaElement.getAttribute("data-type");
        let mediaName = mediaElement.getAttribute("data-name");
        let mediaPath = mediaElement.getAttribute("data-path");
        let mediaLoop = mediaElement.getAttribute("data-loop") == "true";
        let mediaVolume = mediaElement.getAttribute("data-volume");
        let mediaModalVolumeAfterLoop = mediaElement.getAttribute("data-volume-after-loop");

        let path = "/"+mediasDir+"/"+mediaPath;
        if(mediaType == "web")
            path = mediaPath;
        
        showPreview(mediaID, mediaType, mediaName, path, mediaLoop, mediaVolume, mediaModalVolumeAfterLoop);
    });

    // Évènement quand on clique sur le bouton d'édition
    const mediaEdit = elements.querySelector(".cond-medias-line-action-edit");
    mediaEdit.addEventListener("click", function(e) {
        e.preventDefault();
        openMediaEditor(lineID, mediaID);
    });

    // Évènement quand on clique sur un bouton de suppression
    const mediaDelete = elements.querySelector(".cond-medias-line-action-delete");
    mediaDelete.addEventListener("click", function(e) {
        e.preventDefault();
        if(shiftPressed || confirm("Êtes-vous sûr de vouloir supprimer ce média ?"))
            mediaSendDelete(mediaID);
    });

    // Évènement quand on clique sur un bouton de diffusion
    const mediaOnair = elements.querySelector(".cond-medias-line-action-onair");
    mediaOnair.addEventListener("click", function(e) {
        e.preventDefault();
        if(shiftPressed || confirm("Êtes-vous sûr de vouloir diffuser ce média ?"))
            mediaBroadcast(mediaID);
    });

    // Évènement quand on clique sur un bouton stop
    const mediaStopBtn = elements.querySelector(".cond-medias-line-action-stop");
    mediaStopBtn.addEventListener("click", function(e) {
        e.preventDefault();
        if(shiftPressed || confirm("Êtes-vous sûr de vouloir arrêter ce média ?"))
            mediaStop(mediaID);
    });
}



/**
 * Lance un média
 * @param {string} id ID du média à jouer
 * @param {number} [volume=null] Forçage du volume (null pour laisser le volume par défaut du média)
 * @param {number} [startFrom=0] Jouer la vidéo à partir de cet instant
 */
function mediaBroadcast(id, volume=null, startFrom=null) {
    let obj = {
        "surcharge": {
            "startFrom": Number(startFrom),
        }
    };
    if(volume!==null)
        obj.surcharge.volume = Number(volume);

    fetch("/api/conductors/"+currentConductorID+"/medias/"+id+"/armtake", {
        method: "POST",
        body: JSON.stringify(obj),
        headers: {
            "Content-Type": "application/json"
        }
    });
}


/**
 * Stoppe un média s'il est en cours de lecture quelque part
 * @param {string} id ID du média à stopper
 */
function mediaStop(id) {
    fetch("/api/conductors/"+currentConductorID+"/medias/"+id+"/stop");
}


/**
 * Lance un jingle
 * @param {string} id ID du média à diffuser
 */
function jingleBroadcast(id) {
    fetch("/api/jingle/"+id+"/launch");
}


/**
 * Insert ou update le média automatiquement dans le bon tableau
 * @param {array} media Objet représentant le média
 * @param {boolean} autoDelete Si true, les médias non présents dans le paramètre "media" seront supprimés du DOM
 */
function insertMediaInConductor(medias, autoDelete=false) {
    // Si ce n'est pas un tableau, on l'encapsule dans un tableau
    if(!Array.isArray(medias))
        medias = [medias];

    // Liste des ID reçus
    id_list = [];
    
    for(let k in medias) {
        let media = medias[k];
        
        let mediaLine = document.getElementById("cond-media-line-" + media.id);

        id_list.push(media.id); // On ajoute l'ID à la liste

        if(mediaLine !== null) {
            // L'élément existe déjà, on update
            mediaLineSetDatas(mediaLine, media);
        }
        else {
            // L'élément n'existe pas, on le crée
            let line = document.getElementById("cond-line-" + media.line_id);

            if(line !== null) {
                let mediasTable = line.querySelector(".cond-line-medias-table");
                
                if(mediasTable !== undefined) {

                    // Génération de la structure et on y place les données
                    let newMedia = mediaLineStructure();
                    mediaLineSetDatas(newMedia, media);

                    // On défini les évènements
                    mediaElementsRegisterEventListeners(newMedia);

                    // On place ça dans le tableau
                    mediasTable.querySelector("tbody").append(newMedia);

                }
            }
        }
    }


    // Si on demande à supprimer les médias absents, on supprime
    if(autoDelete) {
        // On liste les DOM
        let allMedias = condMainTable.querySelectorAll(".cond-medias-line");

        allMedias.forEach(media => {
            let id = media.dataset.id;

            // Si l'ID n'existe pas, on supprime l'élément
            if(id_list.includes(id)) {
                media.remove();
            }
        });
    }
}



/**
 * Envoie au serveur les nouvelles données à propos d'une ligne isolée
 * @param {string} id ID de la ligne à modifier
 * @param {string} type Type de la ligne
 * @param {string} name Nom de la ligne
 * @param {string} text Texte de la ligne
 * @param {boolean} done Définit si la ligne est finie ou non
 * @param {number} order Définit l'ordre de la ligne dans son conducteur
 * @param {string} tag1 Contenu du tag 1 de la ligne
 * @param {string} tag2 Contenu du tag 2 de la ligne
 * @param {string} tag3 Contenu du tag 3 de la ligne
 * @param {string} tag4 Contenu du tag 4 de la ligne
 */
function lineSendEdit(id, type=null, name=null, text=null, done=null, order=null, tag1=null, tag2=null, tag3=null, tag4=null) {
    let data = {};

    if(type!==null) data.type = type;
    if(name!==null) data.name = name;
    if(text!==null) data.text = text;
    if(done!==null) data.done = done;
    if(order!==null) data.order = order;
    if(tag1!==null) data.tag1 = tag1;
    if(tag2!==null) data.tag2 = tag2;
    if(tag3!==null) data.tag3 = tag3;
    if(tag4!==null) data.tag4 = tag4;
    
    // Options de la requête
    var options = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    };

    // URL de l'API
    var url = "/api/conductor/line/"+id;
    
    // Effectue la requête PATCH
    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la requête PATCH');
            }
            return response.json();
        })
        .then(data => {
            console.log("New data for "+id, data)
        })
        .catch(error => {
            console.error('Erreur lors de la mise à jour du conducteur :', error);
        });
}



/**
 * Permet d'enregistrer une nouvelle marque sur l'émission en cours
 */
function newMark(description) {
    let data = {};
    data.description = description;
    
    // Options de la requête
    var options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    };

    // URL de l'API
    var url = "/api/show/"+currentShowID+"/mark";
    
    // Effectue la requête PATCH
    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error("Erreur lors de la requête POST");
            }
            return response.json();
        })
        .then(data => {
            console.log("New data for "+id, data)
        })
        .catch(error => {
            console.error("Erreur lors de l'enregistrement de la nouvelle marque", error);
        });
}



/**
 * Supprime une ligne sur le serveur
 * @param {string} id ID de la ligne à supprimer
 */
function lineSendDelete(id) {
    // Options de la requête
    var options = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    };

    // URL de l'API
    var url = "/api/conductor/line/"+id;
    
    // Effectue la requête DELETE
    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la requête DELETE');
            }
            return response.json();
        })
        .then(data => {
            console.log("New data for "+id, data);

            // On supprime la ligne de l'UI
            let line = document.getElementById("cond-line-" + id);
            if(line != null)
                line.remove();
        })
        .catch(error => {
            console.error('Erreur lors de la suppression de la ligne :', error);
        });
}



/**
 * Supprime un média sur le serveur
 * @param {string} id ID du média à supprimer
 */
function mediaSendDelete(id) {
    // Options de la requête
    var options = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    };

    // URL de l'API
    var url = "/api/conductor/"+currentConductorID+"/media/"+id;
    
    // Effectue la requête DELETE
    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la requête DELETE');
            }
            return response.json();
        })
        .then(data => {
            console.log("New data for "+id, data);

            // On supprime la ligne de l'UI
            let line = document.getElementById("cond-line-" + id);
            if(line != null)
                line.remove();
        })
        .catch(error => {
            console.error('Erreur lors de la suppression de la ligne :', error);
        });
}




/**
 * Envoie une liste d'ID réordonnés au serveur.
 */
function linesSendReorder(reorder) {
    let data = reorder;
    
    // Options de la requête
    var options = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    };
    
    // URL de l'API
    var url = "/api/conductor/"+currentConductorID+"/orders";
    
    // Effectue la requête PATCH
    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la requête PATCH');
            }
            return response.json();
        })
        .then(data => {
            console.log("New data", data)
        })
        .catch(error => {
            console.error('Erreur lors de la mise à jour de l\'ordre des lignes du conducteur :', error);
        });
}



/**
 * Envoie une liste d'ID réordonnés au serveur.
 * @param {string} lineID ID de la ligne
 */
function mediasSendReorder(lineID, reorder) {
    let data = reorder;
    
    // Options de la requête
    var options = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    };
    
    // URL de l'API
    var url = "/api/conductor/medias/"+lineID+"/orders";
    
    // Effectue la requête PATCH
    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la requête PATCH');
            }
            return response.json();
        })
        .then(data => {
            console.log("New data", data)
        })
        .catch(error => {
            console.error('Erreur lors de la mise à jour de l\'ordre des médias :', error);
        });
}




/**
 * Récupère les données d'un conducteur sur le serveur
 * @param {string} id ID du conducteur à récupérer sur le serveur
 */
async function conductorGet(id) {
    // Options de la requête
    var options = {
        method: "GET"
    };
    
    // URL de l'API
    var url = "/api/conductor/"+id;
    
    // Effectue la requête GET et renvoie le résultat
    return fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération du conducteur');
        }
        return response.json();
    })
    .catch(error => {
        console.error('Une erreur s\'est produite :', error);
        return null;
    });
}




/**
 * Récupère les données d'une ligne sur le serveur
 * @param {string} id ID de la ligne à récupérer sur le serveur
 */
async function lineGet(id) {
    // Options de la requête
    var options = {
        method: "GET"
    };
    
    // URL de l'API
    var url = "/api/conductor/line/"+id;
    
    // Effectue la requête GET et renvoie le résultat
    return fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération de la ligne');
        }
        return response.json();
    })
    .catch(error => {
        console.error('Une erreur s\'est produite :', error);
        return null;
    });
}



/**
 * Récupère les données d'un média sur le serveur
 * @param {string} id ID du média à récupérer sur le serveur
 */
async function mediaGet(id) {
    // Options de la requête
    var options = {
        method: "GET"
    };
    
    // URL de l'API
    var url = "/api/conductor/media/"+id;
    
    // Effectue la requête GET et renvoie le résultat
    return fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération du média');
        }
        return response.json();
    })
    .catch(error => {
        console.error('Une erreur s\'est produite :', error);
        return null;
    });
}



/**
 * Fonction permettant aux boutons de l'UX de trigger une ouverture de l'éditeur modal.
 * @param {string} id 
 * @param {string} insertAfter 
 * @returns 
 */
function clickLineEdit(id=null, insertAfter=null) {
    // On ouvre la modale avec les infos du bouton
    openLineEditor(id, insertAfter);
}



/**
 * Remplace les URL par des liens cliquables
 **/
function textToLinks(input) {
    // Expression régulière pour détecter les liens dans le texte
    var regex = /(https?:\/\/[^\s]+)/g;

    // Remplacer chaque lien détecté par une balise <a>
    return input.replace(regex, function(lien) {
        return '<a href="' + lien + '" onclick="window.open(this.href); return false;">' + lien + '</a>';
    });
}




/**
 * Parse du markdown pour le transformer en HTML.
 * @param {string} markdown Texte formatté en markdown
 * @returns Sortie HTML une fois le markdown parsé
 */
function parseMarkdown(markdown) {
    if(typeof(markdown)=="string") {
        // Remplace le gras et l'italique
        markdown = markdown.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>'); // gras et italique
        markdown = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // gras
        markdown = markdown.replace(/\*(.*?)\*/g, '<em>$1</em>'); // italique
        // Remplace le souligné
        markdown = markdown.replace(/__(.*?)__/g, '<u>$1</u>');

        // Ajout des liens
        markdown = textToLinks(markdown);
    }
    else {
        console.error("Can't parse markdown in following object:", markdown);
    }

    return markdown;
}




/**
 * Remplace les sauts de ligne par des balises <br>
 */
function nl2br(input) {
    if(typeof(input)=="string") {
        // Remplace les sauts de ligne par <br>
        input = input.replace(/\n/g, '<br>');
    }
    else {
        console.error("Can't process nl2br in object:", input);
    }
    return input
}



/**
 * Permet de convertir une chaîne de caractères afin de protéger la page de toute tentative d'injection HTML.
 * @param {string} text Texte à protéger
 * @returns Texte protégé contre les injections HTML
 */
function htmlspecialchars(text) {
    if(typeof(text)=="string") {
        return text.replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
    }
    else {
        console.error("Can't process htmlspecialchars in following object:", text);
        return text;
    }
}





/**
 * Adapte l'affichage du formulaire modal d'édition de ligne selon le type de ligne
 * @param {string} type Type de ligne
 */
function lineEditUpdateDisplay(type) {
    switch(type) {
        case "classic":
            lineModalNameContainer.style.display = "block";
            lineModalHighlightContainer.style.display = "none";
            lineModalTextContainer.style.display = "block";
            lineModalJingleContainer.style.display = "block";
            break;
        case "section":
            lineModalNameContainer.style.display = "block";
            lineModalHighlightContainer.style.display = "block";
            lineModalTextContainer.style.display = "block";
            lineModalJingleContainer.style.display = "block";
            break;
        case "comment":
            lineModalNameContainer.style.display = "none";
            lineModalHighlightContainer.style.display = "none";
            lineModalTextContainer.style.display = "block";
            lineModalJingleContainer.style.display = "block";
            lineModalName.value = "";
            break;
        case "important":
            lineModalNameContainer.style.display = "none";
            lineModalHighlightContainer.style.display = "none";
            lineModalTextContainer.style.display = "block";
            lineModalJingleContainer.style.display = "block";
            lineModalName.value = "";
            break;
        default:
            lineModalNameContainer.style.display = "none";
            lineModalTextContainer.style.display = "none";
            lineModalJingleContainer.style.display = "none";
            lineModalName.value = "";
            lineModalText.value = "";
            lineModalJingle.value = "";
            break;
    }
}


/**
 * Adapte l'affichage du formulaire modal d'édition de médias selon le type de ligne
 * @param {string} type Type de média
 */
function mediaEditUpdateDisplay(type) {
    switch(type) {
        case "media":
            mediaModalSourceContainer.style.display = "block";
            mediaModalFileContainer.style.display = "block";
            mediaModalDiskUsageContainer.style.display = "block";
            mediaModalUrlContainer.style.display = "none";
            mediaModalPlayPresetsContainer.style.display = "block";
            mediaModalLoopContainer.style.display = "block";
            mediaModalVolumeContainer.style.display = "block";
            mediaModalVolumeAfterLoopContainer.style.display = "block";
            mediaModalMediaChannelContainer.style.display = "block";
            mediaModalWebChannelContainer.style.display = "none";
            mediaModalTranscodeSettingsAccordion.style.display = "block";
            // mediaModalSource.value = "";
            // mediaModalFile.value = "";
            mediaModalUrl.value = "";
            // mediaModalLoop.checked = false;
            // mediaModalVolume.value = 0;
            // multiSelectSetValues(mediaModalMediaChannel, defaultMediaChannels);
            multiSelectSetValues(mediaModalWebChannel, defaultWebChannels);
            break;
        case "web":
            mediaModalSourceContainer.style.display = "none";
            mediaModalFileContainer.style.display = "none";
            mediaModalDiskUsageContainer.style.display = "none";
            mediaModalUrlContainer.style.display = "block";
            mediaModalPlayPresetsContainer.style.display = "none";
            mediaModalLoopContainer.style.display = "none";
            mediaModalVolumeContainer.style.display = "none";
            mediaModalVolumeAfterLoopContainer.style.display = "none";
            mediaModalMediaChannelContainer.style.display = "none";
            mediaModalWebChannelContainer.style.display = "block";
            mediaModalTranscodeSettingsAccordion.style.display = "none";
            mediaModalSource.value = "";
            mediaModalFile.value = "";
            // mediaModalUrl.value = "";
            mediaModalLoop.checked = false;
            mediaModalVolume.value = 0;
            multiSelectSetValues(mediaModalMediaChannel, defaultMediaChannels);
            // multiSelectSetValues(mediaModalWebChannel, defaultWebChannels);
            break;
        default:
            mediaModalSourceContainer.style.display = "none";
            mediaModalFileContainer.style.display = "none";
            mediaModalDiskUsageContainer.style.display = "none";
            mediaModalUrlContainer.style.display = "none";
            mediaModalPlayPresetsContainer.style.display = "none";
            mediaModalLoopContainer.style.display = "none";
            mediaModalVolumeContainer.style.display = "none";
            mediaModalVolumeAfterLoopContainer.style.display = "none";
            mediaModalMediaChannelContainer.style.display = "none";
            mediaModalWebChannelContainer.style.display = "none";
            mediaModalTranscodeSettingsAccordion.style.display = "none";
            mediaModalSource.value = "";
            mediaModalFile.value = "";
            mediaModalUrl.value = "";
            mediaModalLoop.checked = false;
            mediaModalVolume.value = 0;
            multiSelectSetValues(mediaModalMediaChannel, defaultMediaChannels);
            multiSelectSetValues(mediaModalWebChannel, defaultWebChannels);
            break;
    }
}




/**
 * Retourne un array contenant les valeurs cochées d'un multi select
 * @param {HTMLElement} element Élément qui représente le multi select
 * @returns 
 */
function multiSelectGetValues(element) {
    return Array.from(element.options)
        .filter(option => option.selected)
        .map(option => option.value);
}


/**
 * Sélectionne les options d'après un tableau donné dans un multi select
 * @param {HTMLElement} element Élément qui représente le multi select
 * @param {array} values Tableau de valeurs à sélectionner dans le multi select représenté par element
 */
function multiSelectSetValues(element, values) {
    element.querySelectorAll("option").forEach(element => {
        element.selected = false;
    });
    values.forEach(value => {
        const option = element.querySelector(`option[value="${value}"]`);
        if(option) option.selected = true;

    });
}



/**
 * Génère un hash aléatoire du nombre de caractères voulus
 * @param {number} length Nombre de caractères du hash de sortie
 * @returns Hash aléatoire de sortie
 */
function generateRandomHash(length) {
    const array = new Uint8Array(length / 2);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
}



/**
 * Affiche un toast générique avec un titre et un message définis.
 * @param {string} title Titre du toast
 * @param {string} message Message du toast
 * @param {boolean} [type=false] Type bootstrap du toast. Par défaut, pas de style appliqué.
 */
function displayGenericToast(title, message, type=false) {
    // On récupère les objets du toast
    let toastElement = document.querySelector(genericToastQuery);
    let toastTitleElement = toastElement.querySelector(".toast-header strong");
    let toastMessageElement = toastElement.querySelector(".toast-body");

    // On supprime les éventuelles classes de style
    toastElement.className = toastElement.className.split(' ').filter(className => !className.startsWith('text-bg-')).join(' ');
    // Si on a un type indiqué, on rajoute la classe
    if(type!==false)
        toastElement.classList.add("text-bg-" + type);

    // On set le titre, message et on affiche
    toastTitleElement.innerText = title;
    toastMessageElement.innerText = message;
    genericToast.show();
}




/**
 * Défini un nouveau média actuel
 * @param {string} mediaID ID du média à définir comme média actuel
 */
function setCurrentMedia(mediaID="") {
    currentMedia = mediaID;

    // On liste tous les médias du conducteur
    document.querySelectorAll(".cond-medias-line").forEach((element) => {
        element.dataset.currentMedia = element.dataset.id == currentMedia;
    });
}




/**
 * Fonction de mise à jour de l'espace disque
 */
function updateDiskUsage(total, used, free) {
    let percentageUsed = (total>0 ? used/total : 0.0) * 100;
    let percentageFree = 100 - percentageUsed;

    usedGB = Number(used).toFixed(2);
    freeGB = Number(free).toFixed(2);

    const progressbarUsed = document.querySelector(diskUsageProgressbarQuery);
    const progressbarFree = document.querySelector(diskFreeProgressbarQuery);
    progressbarUsed.style.width = percentageUsed+"%";
    progressbarUsed.innerText = usedGB+" GB";

    progressbarFree.style.width = percentageFree+"%";
    progressbarFree.innerText = freeGB+" GB";
}



// Event handler du select du type de ligne dans le modal d'édition
lineModalType.addEventListener("change", function(e) {
    lineEditUpdateDisplay(e.target.value);
});


// Event handler du select du type de média dans le modal d'édition
mediaModalType.addEventListener("change", function(e) {
    mediaEditUpdateDisplay(e.target.value);
});


formEditLine.addEventListener("submit", function(e) {
    e.preventDefault();

    // Il faut qu'au moins un des 2 champs soient remplis
    if(lineModalName.value.trim()=="" && lineModalText.value.trim()=="") {
        alert("Vous devez remplir au moins un champ.");
        return false;
    }

    // On disable le bouton submit
    lineModalSubmit.disabled = true;

    // On constitue le corps des données
    let data = {
        type: lineModalType.value,
        name: lineModalName.value,
        highlight: lineModalHighlight.checked,
        text: lineModalText.value,
        jingle: lineModalJingle.value,
        insertAfter: lineModalInsertAfter.value,
        tag1: lineModalTag1.value,
        tag2: lineModalTag2.value,
        tag3: lineModalTag3.value,
        tag4: lineModalTag4.value
    };

    // On récupère l'ID
    let id = lineModalId.value;

    // Si c'est une édition
    if(id != "") {

        // Options de la requête
        var options = {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        };
        
        // URL de l'API
        var url = "/api/conductor/line/"+id;

    }
    else {

        // Options de la requête
        var options = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        };
        
        // URL de l'API
        var url = "/api/conductor/"+currentConductorID+"/lines";

    }
        
    // On envoie la requête
    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la requête');
            }
            return response.json();
        })
        .then(data => {
            console.log('Réponse reçue :', data);
        })
        .catch(error => {
            console.error('Erreur :', error);
        })
        .finally(function() {
            // Fermeture de la modale
            lineModal.hide();

            // On stocke les valeurs de scroll
            let scrollX = window.scrollX;
            let scrollY = window.scrollY;

            // Refresh du conducteur
            refreshAllConductor(() => {
                window.scrollTo(scrollX, scrollY);
            });
        });
});

formEditMedia.addEventListener("submit", function(e) {
    e.preventDefault();

    let id = mediaId.value;
    let line = mediaLine.value;

    let editMode = id!="";
    
    // On constitue le corps des données
    let data = {
        id: mediaId.value,
        type: mediaModalType.value,
        name: mediaModalName.value,
        url: mediaModalUrl.value,
        source: mediaModalSource.value,
        loop: mediaModalLoop.checked,
        volume: parseFloat(mediaModalVolume.value),
        volumeAfterLoop: parseFloat(mediaModalVolumeAfterLoop.value),
        transcode: {
            cutBegin: getSecondsFromString(mediaModalCutBegin.value),
            cutEnd: getSecondsFromString(mediaModalCutEnd.value),
            rotate: parseInt(mediaModalRotate.value) ?? 0
        },
        mediaChannel: multiSelectGetValues(mediaModalMediaChannel).join(","),
        webChannel: multiSelectGetValues(mediaModalWebChannel).join(",")
    };

    // Si l'URL est invalide, on stoppe l'envoi
    if(data.type=="web" && mediaModalUrl.dataset.refused=="true") {
        alert("Ce lien n'est pas autorisé.");
        return false;
    }
    
    // On désactive le submit et le cancel
    mediaModalSubmit.disabled = true;
    mediaModalCancel.disabled = true;

    // Fichier local indiqué par le client
    localUploadedFile = mediaModalFile.value;

    // On constitue la data à envoyer
    const formData = new FormData();

    // On vérifie qu'on a rempli tous les champs nécessaires
    if(data.type == "media") {
        if(data.name.trim()=="" || (!editMode && localUploadedFile=="") || data.mediaChannel.length==0 || isNaN(data.volume) || typeof data.loop != "boolean") {
            alert("Veuillez remplir tous les champs suivants :\n- Nom\n- Fichier\n- Boucle\n- Volume\n- Canaux");
            mediaModalSubmit.disabled = false;
            return false;
        }
        
        // On ajoute le fichier au form data
        if(!editMode)
            formData.append("file", mediaModalFile.files[0]);
    }
    else if(data.type == "web") {
        if(data.name.trim()=="" || data.url.trim().length<=10 || data.webChannel.length==0) {
            alert("Veuillez remplir tous les champs suivants :\n- Nom\n- URL\n- Canaux");
            mediaModalSubmit.disabled = false;
            return false;
        }
    }
    else {
        alert("Type invalide.");
        mediaModalSubmit.disabled = false;
        return false;
    }

    // On envoie les données du formulaire
    formData.append("data", JSON.stringify(data));

    let options = {}
    let url = null;

    // Si c'est un ajout
    if(!editMode) {
        // Options de la requête
        options = {
            method: "PUT",
            body: formData
        }

        // URL
        url = "/api/conductor/"+currentConductorID+"/line/"+line+"/medias";
    }
    // Si c'est une édition
    else {
        // Options de la requête
        options = {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }

        // URL
        url = "/api/conductor/"+currentConductorID+"/medias/"+id;
        console.log(options, url);
    }
    // On envoie la requête
    fetch(url, options)
        .then(response => {
            if(!response.ok) {
                throw new Error("Erreur lors de la requête");
            }
            return response.json();
        })
        .then(data => {
            console.debug("Réponse reçue :", data);
        })
        .catch(error => {
            console.error("Erreur :", error);
        })
        .finally(function() {
            // Fermeture de la modale
            mediaModal.hide();

            mediaModalSubmit.disabled = false;
            mediaModalCancel.disabled = false;

            // On stocke les valeurs de scroll
            let scrollX = window.scrollX;
            let scrollY = window.scrollY;

            // Refresh du conducteur
            refreshAllConductor(() => {
                window.scrollTo(scrollX, scrollY);
            });
        });
});

formMarker.addEventListener("submit", function(e) {
    // On bloque le comportement par défaut du formulaire
    e.preventDefault();

    // On récupère la description
    let description = markerModalDescription.value;
    
    // On envoie le marqueur au back-end
    newMark(description);

    // On efface le champ description
    markerModalDescription.value = "";

    // On ferme le modal
    markerModal.hide();
});


// Au chargement...
$(function() {
    // On instancie la modale du formulaire de ligne
    lineModal = new bootstrap.Modal(modalLineQuery);

    // On instancie la modale du formulaire de médias
    mediaModal = new bootstrap.Modal(modalMediaQuery);

    // On instancie la modale du formulaire de médias
    markerModal = new bootstrap.Modal(modalMarkerQuery);

    // On récupère l'instance du toast générique
    genericToast = bootstrap.Toast.getOrCreateInstance(document.querySelector(genericToastQuery));



    // Lors de l'affichage de markerModal...
    document.querySelector(modalMarkerQuery).addEventListener("shown.bs.modal", () => {
        markerModalDescription.value = "";
        markerModalDescription.focus();
    });



    /**
     * Fonctionnalité pour rendre les sticky des sections empilables
     */
    function updateStickyPosition() {
        let stickyRows = document.querySelectorAll(".cond-line[data-type='section'] .cond-line-display");
        let offset = document.querySelector("header:nth-child(1)").getBoundingClientRect().height;

        stickyRows.forEach((element, index) => {
            let rect = element.getBoundingClientRect();

            if(index>0) {
                let lastElement = stickyRows[index-1];
                let lastRect = lastElement.getBoundingClientRect();
                let delta = rect.top - lastRect.height;
                let opacity = Math.min(1, (lastRect.height + delta-offset) / lastRect.height);

                lastElement.querySelectorAll("td").forEach(td => {
                    td.style.opacity = opacity;
                });

                if(rect.top <= offset+lastRect.height) {
                    lastElement.style.top = String(delta) + "px";
                }
                else {
                    lastElement.style.top = offset + "px";
                }
            }

            lastElement = element;
        });
    }
    window.addEventListener("scroll", updateStickyPosition);
    window.addEventListener("resize", updateStickyPosition);



    document.addEventListener("keydown", (e) => {
        if(e.shiftKey) {
            shiftPressed = true;
            console.debug("Shift pressed");
        }
    });

    document.addEventListener("keyup", (e) => {
        if(!e.shiftKey) {
            shiftPressed = false;
            console.debug("Shift released");
        }
    });
    

    // On met à jour l'espace disque utilisé
    updateDiskUsage(diskTotal, diskUsed, diskFree);

    // On lance l'interval de mise à jour de l'espace disque
    window.setInterval(() => {
        fetch("/api/server/diskusage")
            .then(response => {
                if(!response.ok) {
                    console.error("Error occured while getting server disk usage datas.");
                }
                return response.json();
            })
            .then(data => {
                diskTotal = data.diskUsage.capacity;
                diskUsed = data.diskUsage.used;
                diskFree = data.diskUsage.free;
                dataPercentage = data.diskUsage.percentage;

                updateDiskUsage(diskTotal, diskUsed, diskFree);
            })
    }, 60000);




    // Update régulière de tous les médias du conducteur
    window.setInterval(() => {
        fetch(`/api/conductors/${currentConductorID}/medias`)
            .then(response => {
                if(!response.ok) {
                    console.error("Error occured while getting medias status.");
                }
                return response.json();
            })
            .then(data => {

                Object.keys(data).forEach(k => {
                    media = data[k];
                    
                    // updating media in DOM
                    insertMediaInConductor(media);
                });


            });
    }, 5000);
});