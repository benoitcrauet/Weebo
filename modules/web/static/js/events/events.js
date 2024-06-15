// Conteneur du tableau
const eventsContainer = document.getElementById("eventListContainer");

// Objet contenant les lignes d'évènements
const eventsList = document.getElementById("eventList");

// Textarea contenant les timecodes
const timecodeOutput = document.getElementById("timecodesOutput");

// Conteneur des filtres de type
const filtersTypeContainer = document.getElementById("filtersType");

// Checkbox de recalcul à partir de la première scène
const checkboxResetOnFirstScene = document.getElementById("eventsResetOnFirstScene");


// Liste des types à cocher automatiquement
const autoCheckTypes = [
    "streaming.start",
    "streaming.stop",
    "jingle.start",
];

// Mode de recalcul depuis la première scène rencontrée (intro)
let resetOnFirstScene = false;

/**
 * Enregistrement des eventListeners des évènements
 */
function registerEventListeners() {
    // On explore tous les éléments
    eventsList.querySelectorAll(".event-item").forEach((element) => {
        // On récupère la checkbox
        const checkbox = element.querySelector(".event-item-checkbox input");
        
        checkbox.addEventListener("input", (e) => {
            element.dataset.checked = e.target.checked;

            // On génère les timecodes
            let tc = generateTimecodes();
            let tcReadable = timecodeToText(tc);
            // On affiche les timecodes
            timecodeOutput.value = tcReadable;
        });
    });

    // Case à cocher pour le recalcul depuis la première scène
    checkboxResetOnFirstScene.addEventListener("input", (e) => {
        resetOnFirstScene = e.target.checked;

        // On génère les timecodes
        let tc = generateTimecodes();
        let tcReadable = timecodeToText(tc);
        // On affiche les timecodes
        timecodeOutput.value = tcReadable;
    });
}


/**
 * Fonction d'auto-sélection des évènements
 */
function autoSelectLastBroadcast() {
    let streamingStart = false;
    let streamingEnd = false;
    let firstScene = true;

    let idList = []; // Liste des IDs à cocher

    // On remonte la liste
    eventsList.querySelectorAll(".event-item").forEach((element) => {
        // On récupère l'ID
        const id = element.dataset.id;
        // Le type
        const type = element.dataset.type;

        // Si c'est un début de stream...
        if(type=="streaming.start") {
            // On reset la liste
            idList = [];

            // On reset le flag de première scène
            firstScene = false;
            
            // On marque le flag
            streamingStart = true;

            console.debug("Found streaming.start: ", element.dataset);
        }
        
        // Tant qu'un streaming end n'a pas été trouvé...
        if(!streamingEnd) {

            if(streamingStart) {
                if(!firstScene && type=="scene.change") {
                    // C'est un changement de scène : on coche le premier uniquement
                    idList.push(id);

                    firstScene = true;
                }
            }

            if(autoCheckTypes.includes(type))
                idList.push(id);
            
            // Si c'est une fin de stream...
            if(type=="streaming.stop") {
                streamingEnd = true;
                console.debug("Found streaming.stop: ", element.dataset);
            }
        }
    });

    // On coche toutes les cases sélectionnées
    eventsList.querySelectorAll(".event-item").forEach((element) => {
        const id = element.dataset.id;
        const checkbox = element.querySelector(".event-item-checkbox input");

        if(idList.includes(id)) {
            // On affiche l'élément
            element.style.display = "table-row";

            // On coche la case
            checkbox.checked = true;
        }
        else {
            // On décoche la case
            checkbox.checked = false;
        }
        // On diffuse l'évènement
        let event = new Event("input");
        checkbox.dispatchEvent(event);
    });
}


/**
 * Fonction de génération des timecodes
 */
function generateTimecodes() {
    // Évènement de référence
    let reference = null;

    // Flag de première scène
    let firstScene = false;

    // Liste des évènements
    let list = [];

    // On liste les éléments
    eventsList.querySelectorAll(".event-item").forEach((element) => {
        // Uniquement si l'évènement est check
        if(element.dataset.checked == "true") {
            // On génère l'objet
            const event = {
                id: element.dataset.id,
                date: new Date(element.dataset.date.replace(" ", "T")),
                delta: 0, // Delta, en secondes
                type: element.dataset.type,
                description: element.dataset.description
            };

            // Si on a pas de référence, on l'enregistre
            if(reference === null)
                reference = event;
            
            // Si on rencontre une scène pour la première fois
            // et que le mode est actif, on reset la référence
            if(resetOnFirstScene && !firstScene && event.type=="scene.change") {
                firstScene = true;

                // On calcule le delta avec la référence
                let tmpDelta = Math.floor((event.date.getTime() - reference.date.getTime()) / 1000);

                // On défini le delta calculé
                const separator = {
                    id: "",
                    date: event.date,
                    delta: tmpDelta,
                    type: "intro.end",
                    description: "#################### INTRO END ####################"
                }
                list.push(separator);

                reference = event;
                

            }

            // On calcule le delta avec la référence
            let delta = Math.floor((event.date.getTime() - reference.date.getTime()) / 1000);

            // On défini le delta calculé
            event.delta = delta;

            // On insert l'évènement à la liste
            list.push(event);
        }
    });

    return list;
}



/**
 * Fonction permettant l'ajout de leading 0 à un nombre
 */
function zeroPad(input, length=2) {
    input = Math.floor(Number(input) || 0);
    return input.toString().padStart(length, "0");
}



/**
 * Fonction transformant un nombre de secondes en durée humainement lisible
 */
function durationToTime(input) {
    input = Number(input) || 0; // Cast input

    let hours = Math.floor(input / 3600);
    let minutes = Math.floor((input % 3600) / 60);
    let seconds = input % 60;

    if(hours==0) {
        return minutes.toString()+":"+zeroPad(seconds);
    }
    else {
        return hours.toString()+":"+zeroPad(minutes)+":"+zeroPad(seconds);
    }
}



/**
 * Fonction transformant les timecodes en texte brut pour YouTube
 */
function timecodeToText(timecodes) {
    let output = "";

    // On liste les timecodes
    for(let k in timecodes) {
        const t = timecodes[k];

        output += durationToTime(t.delta) + " " + t.description.replace(/(\r|\n)/g, "") + "\n";
    }
    
    return output;
}




/**
 * Fonction d'initialisation des filtres
 */
function initFilters() {
    filtersTypeContainer.querySelectorAll("input[type=checkbox]").forEach((element) => {
        element.addEventListener("input", (e) => {
            filterType(element.dataset.pattern, e.target.checked);
        });
        filterType(element.dataset.pattern, element.checked);
    });
}




/**
 * Fonction de mise à jour des filtres
 */
function filterType(pattern, show) {
    try {
        let regexp = new RegExp("^"+pattern+"$");
        
        // On liste les lignes
        eventsList.querySelectorAll(".event-item").forEach((element) => {
            const type = element.dataset.type;
            const test = regexp.test(type);

            console.debug(type, regexp, test, show!==false);

            if(test) {
                if(show===false && element.dataset.checked=="false")
                    element.style.display = "none";
                else
                    element.style.display = "table-row";
            }
        });
    }
    catch(e) {
        console.error(e);
    }
}





// Au chargement du DOM...
document.addEventListener("DOMContentLoaded", (e) => {
    eventsContainer.scrollTop = eventsContainer.scrollHeight;

    // On stocke l'option de reset automatique du timing
    resetOnFirstScene = checkboxResetOnFirstScene.checked;

    // On initialise les filtres
    initFilters();

    // On crée les event listeners
    registerEventListeners();

    // On coche automatiquement la dernière diffusion
    autoSelectLastBroadcast();
});