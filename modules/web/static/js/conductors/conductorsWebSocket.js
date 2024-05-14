// URL du socket
//const socketAddr = "/"; //{{ web_base }}';

// Connexion au socket
var socket = io.connect("http://127.0.0.1:8000");


// A la réception d'un socket media_command
socket.on('test', function(data) {
    console.log("test", data);
});
socket.on('conductor_command', function(data) {
    if(data.conductor!==undefined && data.action!==undefined && data.data_line!==undefined && data.data_media!==undefined) {
        const action = data.action;
        const conductor = data.conductor;
        const data_line = data.data_line;
        const data_media = data.data_media;

        if(conductor == currentConductorID) {
            console.debug("Websocket received.", data);
            
            // Seulement si on a de la data dans data_line
            if(data_line != null) {
                // On détermine si on doit supprimer des lignes ou en modifier
                switch(action) {
                    case "insert":
                        // Insertion : on update et on réordonne
                        updateLines(data_line);
                        reorderLines();
                        break;
                    case "edit":
                        // Edit : on met juste à jour les contenus
                        updateLines(data_line);
                        break;
                    case "reorder":
                        // Changement d'ordre : on update et on réordonne
                        updateLines(data_line);
                        reorderLines();
                        break;
                    case "delete":
                        // Suppression : on update juste
                        updateLines(data_line);
                        break;
                    default:
                        updateLines(data_line);
                        reorderLines();
                }
            }
            
            // Seulement si on a de la data dans data_media
            if(data_media != null) {
                // On détermine si on doit supprimer des lignes ou en modifier
                switch(action) {
                    case "insert":
                        // Insertion : on update et on réordonne
                        insertMediaInConductor(data_media);
                        //reorderMedias();
                        break;
                    case "edit":
                        // Edit : on met juste à jour les contenus
                        insertMediaInConductor(data_media);
                        break;
                    case "reorder":
                        // Changement d'ordre : on update et on réordonne
                        insertMediaInConductor(data_media);
                        reorderMedias();
                        break;
                    case "delete":
                        // Suppression : on update juste (en indiquant vouloir supprimer les éléments introuvables)
                        insertMediaInConductor(data_media, true);
                        break;
                    default:
                        insertMediaInConductor(data_media);
                        reorderMedias();
                }
            }
        }
    }
    else {
        console.error("Invalid conductor_command websocket datas received.", data);
    }
});