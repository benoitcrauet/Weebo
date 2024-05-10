// Query représentant le modal du formulaire d'édition des lignes
const modalLineQuery = "#editLineFormModal";
// QUery représentant le titre du modal d'édition des lignes
const modalLineTitleQuery = "#editLineFormModalTitle";

// Query représentant le tableau triable des conducteurs
const conductorTableQuery = "#cond-main-table"
// Query représentant le dragger des lignes de conducteurs
const conductorLineDraggerQuery = ".cond-line-dragger"


$(function() {
    $(conductorTableQuery).sortable({
        opacity: 0.5,
        placeholder: "lalala",
        scrollsensitivity: 50,
        axis: "y",
        handle: conductorLineDraggerQuery,
        start: function(event, ui) {
            console.log("Starting dragging...");
        },
        stop: function(event, ui) {
            console.log("Dragging finished!");
            console.log("Sending new order to server...");
            linesSendReorder(calculateLinesOrder());
        }
    });
});


var currentShowID = null;
var currentConductorID = null;
var currentClientID = null;





// On récupère les éléments
const condMainTable = document.querySelector(conductorTableQuery);

const formEditLine = document.getElementById("formEditLine");
const lineModalTitle = document.querySelector(modalLineTitleQuery);
const lineModalType = document.getElementById("fType");
const lineModalName = document.getElementById("fName");
const lineModalText = document.getElementById("fText");
const lineModalId = document.getElementById("fId");
const lineModalInsertAfter = document.getElementById("fInsertAfter");
const lineModalSubmit = document.getElementById("fSubmit");

const lineModalTypeContainer = document.getElementById("fTypeContainer");
const lineModalNameContainer = document.getElementById("fNameContainer");
const lineModalTextContainer = document.getElementById("fTextContainer");

var lineModal = null;

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
            console.log(data);
            // On set les éléments
            lineModalType.value = data.type;
            lineModalName.value = data.name;
            lineModalText.value = data.text;
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
        lineModalId.value = id ?? "";
        lineModalInsertAfter.value = insertAfter ?? "";

        lineEditUpdateDisplay(lineModalType.value);

        lineModal.show();
    }

    // On réactive le submit
    lineModalSubmit.disabled = false;
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
            let newLine = lineStructure();
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
    let lines = condMainTable.querySelectorAll(".cond-line");
    lines.forEach(element => {

    });

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
 * Remet à jour l'ensemble du DOM du conducteur
 */
function refreshAllConductor() {
    // Options de la requête
    var options = {
        method: "GET"
    };

    // URL de l'API
    var url = "/api/conductor/"+currentConductorID+"/lines";
    
    // Effectue la requête PUT
    fetch(url, options)
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
                let elements = lineStructure(line);
                lineSetDatas(elements, line);
                condMainTable.append(elements);
                // On enregistre les eventListeners
                lineElementsRegisterEventListeners(elements);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération du conducteur :', error);
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
 * Envoie au serveur les nouvelles données à propos d'une ligne isolée
 * @param {string} id ID de la ligne à modifier
 * @param {string} type Type de la ligne
 * @param {string} name Nom de la ligne
 * @param {string} text Texte de la ligne
 * @param {boolean} done Définit si la ligne est finie ou non
 * @param {number} order Définit l'ordre de la ligne dans son conducteur
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
    });;
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
            break;
        case "section":
            lineModalNameContainer.style.display = "block";
            lineModalTextContainer.style.display = "block";
            break;
        case "comment":
            lineModalNameContainer.style.display = "none";
            lineModalTextContainer.style.display = "block";
            lineModalName.value = "";
            break;
        case "important":
            lineModalNameContainer.style.display = "none";
            lineModalTextContainer.style.display = "block";
            lineModalName.value = "";
            break;
        default:
            lineModalNameContainer.style.display = "none";
            lineModalTextContainer.style.display = "none";
            lineModalName.value = "";
            lineModalText.value = "";
            break;
    }
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



// Event handler du select du type de ligne dans le modal d'édition
lineModalType.addEventListener("change", function(e) {
    lineEditUpdateDisplay(e.target.value);
})


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






// Au chargement...
$(function() {
    // On refresh le conducteur
    refreshAllConductor();

    // On instancie la modale du formulaire de ligne
    lineModal = new bootstrap.Modal(modalLineQuery);
});