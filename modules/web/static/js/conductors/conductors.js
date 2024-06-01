// Query représentant le modal du formulaire d'édition des lignes
const modalLineQuery = "#editLineFormModal";
// QUery représentant le titre du modal d'édition des lignes
const modalLineTitleQuery = "#editLineFormModalTitle";

// Query représentant le modal du formulaire d'édition des médias
const modalMediaQuery = "#editMediaFormModal";
// QUery représentant le titre du modal d'édition des médias
const modalMediaTitleQuery = "#editMediaFormModalTitle";

// Query représentant le tableau triable des conducteurs
const conductorTableQuery = "#cond-main-table";
// Query représentant le dragger des lignes de conducteurs
const conductorLineDraggerQuery = ".cond-line-dragger";

// Query représentant le tableau triable des médias
const conductorMediasTableQuery = ".cond-line-medias-table tbody";
// Query représentant le dragger des lignes de conducteurs
const conductorMediasDraggerQuery = ".cond-medias-line-dragger";


// ID du toast générique
const genericToastQuery = "#genericToast";




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
const lineModalText = document.getElementById("fText");
const lineModalJingle = document.getElementById("fJingle");
const lineModalId = document.getElementById("fId");
const lineModalInsertAfter = document.getElementById("fInsertAfter");
const lineModalSubmit = document.getElementById("fSubmit");

const lineModalTypeContainer = document.getElementById("fTypeContainer");
const lineModalNameContainer = document.getElementById("fNameContainer");
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
 */
async function openLineEditor(id=null, insertAfter=null, type=null, name=null, text=null) {
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
            lineModalText.value = data.text;
            lineModalJingle.value = data.jingle;
            lineModalId.value = data.id;
            lineModalInsertAfter.value = "";

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
        lineModalText.value = "";
        lineModalJingle.value = "";
        lineModalId.value = id ?? "";
        lineModalInsertAfter.value = insertAfter ?? "";

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

const mediaModalCutBegin = document.getElementById("gCutBegin");
const mediaModalCutEnd = document.getElementById("gCutEnd");
const mediaModalRotate = document.getElementById("gRotate");

const mediaId = document.getElementById("gId");
const mediaLine = document.getElementById("gLine");


const mediaModalTypeContainer = document.getElementById("gTypeContainer");
const mediaModalNameContainer = document.getElementById("gNameContainer");
const mediaModalSourceContainer = document.getElementById("gSourceContainer");
const mediaModalFileContainer = document.getElementById("gFileContainer");
const mediaModalRotateContainer = document.getElementById("gRotateContainer");
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
    
    if(editMode) {
        mediaModalTitle.innerText = "Modification du média";

        // Si c'est un édit mode, on cache le type
        mediaModalTypeContainer.style.display = "none";

        let data = await mediaGet(id)
        try {
            console.log(data);
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
        mediaModalLoop.checked = false;
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
function updateLines(data) {
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
 * Remet à jour l'ensemble du DOM du conducteur
 */
function refreshAllConductor() {
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

            // On récupère chaque data et on place dans le tableau
            for(let k in data) {
                let line = data[k];
                
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
        let checked = e.target.checked;
        let linesToEdit = checkContinuousDone(lineID, checked);

        if(checked && linesToEdit.length>0) {
            if(!confirm("Certains éléments sont restés décochés plus haut dans le conducteur...\nÊtes-vous sûr de vouloir cocher celui-ci ?")) {
                e.preventDefault();
                return false;
            }
        }
        if(!checked && linesToEdit.length>0) {
            if(!confirm("Certains éléments sont restés cochés plus bas dans le conducteur...\nÊtes-vous sûr de vouloir décocher celui-ci ?")) {
                e.preventDefault();
                return false;
            }
        }

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
        if(confirm("Êtes-vous sûr de vouloir supprimer cette ligne ?"))
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
        if(confirm("Êtes-vous sûr de vouloir lancer ce jingle ?"))
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
                    displayGenericToast("Erreur", "Une erreur est survenue lors de la copie du lien dans le presse-papier.", "danger");
                });
        } else {
            displayGenericToast("API Clipboard indisponible", "Impossible de copier le lien sur ce navigateur.", "warning");
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

        let path = "/"+mediasDir+"/"+mediaPath;
        if(mediaType == "web")
            path = mediaPath;
        
        showPreview(mediaType, mediaName, path, mediaLoop, mediaVolume);
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
        if(confirm("Êtes-vous sûr de vouloir supprimer ce média ?"))
            mediaSendDelete(mediaID);
    });

    // Évènement quand on clique sur un bouton de diffusion
    const mediaOnair = elements.querySelector(".cond-medias-line-action-onair");
    mediaOnair.addEventListener("click", function(e) {
        e.preventDefault();
        if(confirm("Êtes-vous sûr de vouloir diffuser ce média ?"))
            mediaBroadcast(mediaID);
    });

    // Évènement quand on clique sur un bouton stop
    const mediaStopBtn = elements.querySelector(".cond-medias-line-action-stop");
    mediaStopBtn.addEventListener("click", function(e) {
        e.preventDefault();
        if(confirm("Êtes-vous sûr de vouloir arrêter ce média ?"))
            mediaStop(mediaID);
    });
}



/**
 * Lance un média
 * @param {string} id ID du média à diffuser
 */
function mediaBroadcast(id) {
    fetch("/api/conductors/"+currentConductorID+"/medias/"+id+"/armtake");
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
 * Vérifie si toutes les checkboxes jusqu'à une ligne donnée sont cochées
 * @param {string} lineTarget ID de la ligne à vérifier
 * @param {boolean} done Permet de vérifier si les cases sont toutes cochées depuis le début (true) ou décochées jusqu'à la fin (false)
 */
function checkContinuousDone(lineTarget, done) {
    let lines = condMainTable.querySelectorAll(".cond-line");

    let lineFound = false;

    let linesToEdit = [];

    lines.forEach(lineElement => {
        let checkbox = lineElement.querySelector(".cond-line-done-checkbox");
        let checked = checkbox.checked;
        let lineID = lineElement.dataset.id;
        let lineType = lineElement.dataset.type;

        if(lineID == lineTarget)
            lineFound = true;

        if(lineType == "classic") {

            if(done && !lineFound) {
                console.log(lineID, checked);
                if(!checked)
                    linesToEdit.push(lineID);
            }

            if(!done && lineFound) {
                console.log(lineID, checked);
                if(checked)
                    linesToEdit.push(lineID);
            }

        }
    });

    return linesToEdit;
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
            if(id_list.includes(id))
                media.remove();
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
 */
function lineSendEdit(id, type=null, name=null, text=null, done=null, order=null) {
    let data = {};

    if(type!==null) data.type = type;
    if(name!==null) data.name = name;
    if(text!==null) data.text = text;
    if(done!==null) data.done = done;
    if(order!==null) data.order = order;
    
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
 * Parse du markdown pour le transformer en HTML.
 * @param {string} markdown Texte formatté en markdown
 * @returns Sortie HTML une fois le markdown parsé
 */
function parseMarkdown(markdown) {
    // Remplace le gras et l'italique
    markdown = markdown.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>'); // gras et italique
    markdown = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // gras
    markdown = markdown.replace(/\*(.*?)\*/g, '<em>$1</em>'); // italique
    // Remplace le souligné
    markdown = markdown.replace(/__(.*?)__/g, '<u>$1</u>');
    return markdown;
}


/**
 * Remplace les sauts de ligne par des balises <br>
 */
function nl2br(input) {
    // Remplace les sauts de ligne par <br>
    input = input.replace(/\n/g, '<br>');
    return input
}



/**
 * Permet de convertir une chaîne de caractères afin de protéger la page de toute tentative d'injection HTML.
 * @param {string} text Texte à protéger
 * @returns Texte protégé contre les injections HTML
 */
function htmlspecialchars(text) {
    return text.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
}





/**
 * Adapte l'affichage du formulaire modal d'édition de ligne selon le type de ligne
 * @param {string} type Type de ligne
 */
function lineEditUpdateDisplay(type) {
    switch(type) {
        case "classic":
            lineModalNameContainer.style.display = "block";
            lineModalTextContainer.style.display = "block";
            lineModalJingleContainer.style.display = "block";
            break;
        case "section":
            lineModalNameContainer.style.display = "block";
            lineModalTextContainer.style.display = "block";
            lineModalJingleContainer.style.display = "block";
            break;
        case "comment":
            lineModalNameContainer.style.display = "none";
            lineModalTextContainer.style.display = "block";
            lineModalJingleContainer.style.display = "block";
            lineModalName.value = "";
            break;
        case "important":
            lineModalNameContainer.style.display = "none";
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
            mediaModalUrlContainer.style.display = "none";
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
            mediaModalUrlContainer.style.display = "block";
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
            mediaModalUrlContainer.style.display = "none";
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
        text: lineModalText.value,
        jingle: lineModalJingle.value,
        insertAfter: lineModalInsertAfter.value
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
            // Refresh du conducteur
            refreshAllConductor();
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

            // Refresh du conducteur
            refreshAllConductor();
        });
});


// Au chargement...
$(function() {
    // On instancie la modale du formulaire de ligne
    lineModal = new bootstrap.Modal(modalLineQuery);

    // On instancie la modale du formulaire de médias
    mediaModal = new bootstrap.Modal(modalMediaQuery);

    // On récupère l'instance du toast générique
    genericToast = bootstrap.Toast.getOrCreateInstance(document.querySelector(genericToastQuery));



    // On refresh le conducteur
    refreshAllConductor();



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

});