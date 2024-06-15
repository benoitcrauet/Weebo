// Conteneur du tableau
const eventsContainer = document.getElementById("eventListContainer");

// Objet contenant les lignes d'évènements
const eventsList = document.getElementById("eventList");

// Textarea contenant les timecodes
const timecodeOutput = document.getElementById("timecodesOutput");

// Conteneur des filtres de type
const filtersTypeContainer = document.getElementById("filtersType");


// Liste des types à cocher automatiquement
const autoCheckTypes = [
    "streaming.start",
    "streaming.stop",
    "jingle.start",
];


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
}


/**
 * Fonction d'auto-sélection des évènements
 */
function autoSelectLastBroadcast() {
    let streamingEnd = false;

    let idList = []; // Liste des IDs à cocher

    // On remonte la liste
    eventsList.querySelectorAll(".event-item").forEach((element) => {
        // On récupère l'ID
        const id = element.getAttribute("id");
        // Le type
        const type = element.dataset.type;

        // Si c'est un début de stream...
        if(type=="streaming.start") {
            // On reset la liste
            idList = [];
            
            // On marque le flag
            streamingStart = true;

            console.debug("Found streaming.start: ", element.dataset);
        }
        
        // Tant qu'un streaming end n'a pas été trouvé...
        if(!streamingEnd) {

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
    for(let k in idList) {
        const id = idList[k];
        const element = document.getElementById(id);
        const checkbox = element.querySelector(".event-item-checkbox input");

        checkbox.checked = true;
        // On diffuse l'évènement
        let event = new Event("input");
        checkbox.dispatchEvent(event);
    }
}


/**
 * Fonction de génération des timecodes
 */
function generateTimecodes() {
    // Évènement de référence
    let reference = null;

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

            // On calcule le delta avec la référence
            const delta = Math.floor((event.date.getTime() - reference.date.getTime()) / 1000);

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
                if(show===false)
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

    // On crée les event listeners
    registerEventListeners();

    // On coche automatiquement la dernière diffusion
    autoSelectLastBroadcast();

    // On initialise les filtres
    initFilters();
});