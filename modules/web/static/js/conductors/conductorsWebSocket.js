// Connexion au socket
var socket = io.connect("/");

// À la connexion du socket
socket.on("connect", function() {
    _connectionAlertToast.hide();
    _connectionSuccessToast.show();

    refreshAllConductor();
});

// À la déconnexion du socket
socket.on("disconnect", function() {
    _connectionAlertToast.show();
    _connectionSuccessToast.hide();
});

// A la réception d'un socket media_command
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
                        updateLines(data_line, true);
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
                console.debug(data_media);
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
                    case "currentMedia":
                        // Changement de média courant : on transfert l'info au front
                        if(data_media == false)
                            setCurrentMedia(null);
                        else
                            setCurrentMedia(data_media.id);
                        break;
                    default:
                        insertMediaInConductor(data_media);
                        reorderMedias();
                }
            }


            // Dans tous les cas
            switch(action) {
                case "recording.start":
                    // Démarrage du recording
                    recordingEnable(true);
                    break;
                case "recording.stop":
                    // Arrêt du recording
                    recordingEnable(false);
                    break;
                case "streaming.start":
                    // Démarrage du streaming
                    streamingEnable(true);
                    break;
                case "streaming.stop":
                    // Arrêt du streaming
                    streamingEnable(false);
                    break;
            }
        }
    }
    else {
        console.error("Invalid conductor_command websocket datas received.", data);
    }
});