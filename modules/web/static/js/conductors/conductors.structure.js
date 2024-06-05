function lineStructure(integrateMedias=true) {

    line_item = document.createElement("tbody");
    line_item.classList.add("cond-line");
    
    tr_display = document.createElement("tr");
    tr_display.classList.add("cond-line-display");

        td_dragger = document.createElement("td");
        td_dragger.classList.add("cond-line-dragger");
        td_dragger.classList.add("cond-edit-mode");
        td_dragger.classList.add("h5");
        td_dragger.classList.add("text-center");
        
            i_dragger = document.createElement("i");
            i_dragger.classList.add("bi");
            i_dragger.classList.add("bi-grip-vertical");

            td_dragger.append(i_dragger);

        td_done = document.createElement("td");
        td_done.classList.add("cond-line-done");
        td_done.classList.add("cond-read-mode");
        td_done.classList.add("h5");
        td_done.classList.add("text-center");

            checkbox_done = document.createElement("input");
            checkbox_done.classList.add("form-check-input");
            checkbox_done.classList.add("cond-line-done-checkbox");
            checkbox_done.setAttribute("type", "checkbox");

            td_done.append(checkbox_done);
        
        td_content = document.createElement("td");
        td_content.classList.add("cond-line-content");

            h3_title = document.createElement("h3");
            h3_title.classList.add("cond-line-title");

            div_text = document.createElement("div");
            div_text.classList.add("cond-line-text");

            div_desc = document.createElement("div");
            div_desc.classList.add("cond-line-desc");

            div_medias = document.createElement("div");
            div_medias.classList.add("cond-line-medias");
            
            if(integrateMedias)
                div_medias.append(mediasStructure());

            td_content.append(h3_title, div_text, div_desc, div_medias);
        
        td_jingle = document.createElement("td");
        td_jingle.classList.add("cond-line-jingle");
        td_jingle.classList.add("text-center");

            button_jingle = document.createElement("a");
            button_jingle.setAttribute("href", "#");
            button_jingle.classList.add("cond-line-jingle-start-button");
            button_jingle.classList.add("btn");
            button_jingle.classList.add("btn-success");
            button_jingle.setAttribute("title", "Lancer le jingle associé")

                i_jingle = document.createElement("i");
                i_jingle.classList.add("bi");
                i_jingle.classList.add("bi-easel-fill");

                button_jingle.append(i_jingle);

            td_jingle.append(button_jingle);

        td_actions = document.createElement("td");
        td_actions.classList.add("cond-line-actions");
        td_actions.classList.add("cond-edit-mode");
        td_actions.classList.add("text-end");

            div_btngroup = document.createElement("div");
            div_btngroup.classList.add("btn-group");

                button_edit = document.createElement("a");
                button_edit.setAttribute("href", "#")
                button_edit.classList.add("cond-line-action-edit");
                button_edit.classList.add("btn");
                button_edit.classList.add("btn-primary");

                    i_edit = document.createElement("i");
                    i_edit.classList.add("bi");
                    i_edit.classList.add("bi-pen-fill");

                    button_edit.append(i_edit);

                button_delete = document.createElement("a");
                button_delete.setAttribute("href", "#");
                button_delete.classList.add("cond-line-action-delete");
                button_delete.classList.add("btn");
                button_delete.classList.add("btn-danger");

                    i_delete = document.createElement("i");
                    i_delete.classList.add("bi");
                    i_delete.classList.add("bi-trash3-fill");

                    button_delete.append(i_delete);

                div_btngroup.append(button_edit, button_delete);

            td_actions.append(div_btngroup);

        tr_display.append(td_dragger, td_done, td_content, td_jingle, td_actions);

    tr_adder = document.createElement("tr");
    tr_adder.classList.add("cond-edit-mode");
    tr_adder.classList.add("cond-insertion-adder");

        td_adder = document.createElement("td");
        td_adder.setAttribute("colspan", "4");

            a_adder = document.createElement("a");
            a_adder.classList.add("cond-insertion-adder-link");
            a_adder.setAttribute("href", "#");

                i_adder = document.createElement("i");
                i_adder.classList.add("bi");
                i_adder.classList.add("bi-plus-square");

                _txt_adder = document.createTextNode("Insérer une ligne");

                a_adder.append(i_adder, _txt_adder);

            td_adder.append(a_adder);

        tr_adder.append(td_adder);
        
    
    line_item.append(tr_display);
    line_item.append(tr_adder);
    
    return line_item
}


function mediasStructure() {
    let table = document.createElement("table");
    table.classList.add("table");
    table.classList.add("table-hover");
    table.classList.add("table-sm");
    table.classList.add("cond-line-medias-table");

        let tbody = document.createElement("tbody");

    let tfoot = document.createElement("tfoot");

        let trAdder = document.createElement("tr");
        trAdder.classList.add("cond-edit-mode");
        trAdder.classList.add("cond-medias-adder");

            let tdAdder = document.createElement("td");
            tdAdder.setAttribute("colspan", "5");

                let aAdder = document.createElement("a");
                aAdder.classList.add("cond-medias-adder-link");
                aAdder.setAttribute("href", "#");
                
                    let iAdder = document.createElement("i");
                    iAdder.classList.add("bi");
                    iAdder.classList.add("bi-file-earmark-plus");

                    let textAdder = document.createTextNode("Ajouter un média");
                
                aAdder.append(iAdder, textAdder);

            tdAdder.append(aAdder);

        trAdder.append(tdAdder);
    
    tfoot.append(trAdder);

    table.append(tbody, tfoot);


    return table;
}


function mediaLineStructure() {
    let tr = document.createElement("tr");
    tr.classList.add("cond-medias-line");
        
        let td1 = document.createElement("td");
        td1.classList.add("cond-medias-line-dragger");
        td1.classList.add("text-center");
        td1.classList.add("cond-edit-mode");
        td1.classList.add("vertical-align-middle");
        
            let i1 = document.createElement("i");
            i1.classList.add("bi");
            i1.classList.add("bi-grip-vertical");

        td1.append(i1);
        
        let td2 = document.createElement("td");
        td2.classList.add("cond-medias-line-thumbnail");
        td2.classList.add("text-center");
        
            let imgThumbnail = document.createElement("img");
            imgThumbnail.classList.add("cond-media-thumbnail-img");
            imgThumbnail.setAttribute("src", "");
            imgThumbnail.setAttribute("alt", "");
            
            let iThumbnail = document.createElement("i");
            iThumbnail.classList.add("cond-media-thumbnail-web-icon");
            iThumbnail.classList.add("bi");
            iThumbnail.classList.add("bi-link-45deg");
            
            let spinnerLoad = document.createElement("div");
            spinnerLoad.classList.add("cond-media-convert-spinner");
            spinnerLoad.classList.add("spinner-border");
            spinnerLoad.classList.add("spinner-border-sm");
            spinnerLoad.classList.add("text-light");
            
                let spinnerHidden = document.createElement("div");
                spinnerHidden.classList.add("visually-hidden");
                spinnerHidden.innerText = "Transcodage..."

            spinnerLoad.append(spinnerHidden);

        td2.append(imgThumbnail, iThumbnail, spinnerLoad);
        
        let td3 = document.createElement("td");
        td3.classList.add("cond-medias-line-name");
        
            let mediaName = document.createElement("div");
            mediaName.classList.add("cond-media-name");

                let playIcon = document.createElement("i");
                playIcon.classList.add("cond-media-onair-icon");
                playIcon.classList.add("bi");
                playIcon.classList.add("bi-play-fill");

                let audioIcon0 = document.createElement("i");
                audioIcon0.classList.add("cond-media-volume-icon");
                audioIcon0.classList.add("cond-media-volume-icon-mute");
                audioIcon0.classList.add("bi");
                audioIcon0.classList.add("bi-volume-mute");
                audioIcon0.classList.add("text-muted");

                let audioIcon1 = document.createElement("i");
                audioIcon1.classList.add("cond-media-volume-icon");
                audioIcon1.classList.add("cond-media-volume-icon-low");
                audioIcon1.classList.add("bi");
                audioIcon1.classList.add("bi-volume-down");

                let audioIcon2 = document.createElement("i");
                audioIcon2.classList.add("cond-media-volume-icon");
                audioIcon2.classList.add("cond-media-volume-icon-high");
                audioIcon2.classList.add("bi");
                audioIcon2.classList.add("bi-volume-up-fill");
                audioIcon2.classList.add("text-warning");

                let loopIcon = document.createElement("i");
                loopIcon.classList.add("cond-media-loop-icon");
                loopIcon.classList.add("bi");
                loopIcon.classList.add("bi-repeat");

                let errorButton = document.createElement("a");
                errorButton.setAttribute("href", "#");
                errorButton.classList.add("cond-media-error-button");
                errorButton.classList.add("btn");
                errorButton.classList.add("btn-sm");
                errorButton.classList.add("btn-danger");

                    let errorButtonIcon = document.createElement("i");
                    errorButtonIcon.classList.add("bi");
                    errorButtonIcon.classList.add("bi-exclamation-triangle-fill");
                
                errorButton.append(errorButtonIcon);


                let mediaNameText = document.createElement("span");
                mediaNameText.classList.add("cond-media-name-text");

                let mediaNameSource = document.createElement("span");
                mediaNameSource.classList.add("cond-medias-line-credits");
                mediaNameSource.classList.add("text-muted");
                mediaNameSource.innerText = "";

            mediaName.append(playIcon, audioIcon0, audioIcon1, audioIcon2, loopIcon, errorButton, mediaNameText, mediaNameSource);
        
            let progress = document.createElement("div");
            progress.classList.add("progress");
            progress.setAttribute("role", "progressbar");

                let progressBar = document.createElement("div");
                progressBar.classList.add("progress-bar");
                progressBar.classList.add("progress-bar-striped");
                progressBar.classList.add("progress-bar-animated");
                progressBar.classList.add("cond-media-progressbar");
                progressBar.style.width = "0%";
            
            progress.append(progressBar)

        td3.append(mediaName, progress);
        
        let td4 = document.createElement("td");
        td4.classList.add("cond-medias-line-actions");
        td4.classList.add("text-end");


            let actionsContainer = document.createElement("div");
            actionsContainer.classList.add("actions-container");

                let btnEdit = document.createElement("a");
                btnEdit.classList.add("cond-medias-line-action-edit");
                btnEdit.classList.add("cond-edit-mode");
                btnEdit.classList.add("btn");
                btnEdit.classList.add("btn-sm");
                btnEdit.classList.add("btn-outline-primary");
                btnEdit.setAttribute("title", "Modifier");

                    let iEdit = document.createElement("i");
                    iEdit.classList.add("bi");
                    iEdit.classList.add("bi-pen-fill");

                btnEdit.append(iEdit);

                let btnDelete = document.createElement("a");
                btnDelete.classList.add("cond-medias-line-action-delete");
                btnDelete.classList.add("cond-edit-mode");
                btnDelete.classList.add("btn");
                btnDelete.classList.add("btn-sm");
                btnDelete.classList.add("btn-outline-danger");
                btnDelete.setAttribute("title", "Supprimer le média");

                    let iDelete = document.createElement("i");
                    iDelete.classList.add("bi");
                    iDelete.classList.add("bi-trash3-fill");

                btnDelete.append(iDelete);

                let btnCopy = document.createElement("a");
                btnCopy.classList.add("cond-medias-line-action-copy");
                btnCopy.classList.add("btn");
                btnCopy.classList.add("btn-sm");
                btnCopy.classList.add("btn-outline-secondary");
                btnCopy.setAttribute("title", "Copier le lien");

                    let iCopy = document.createElement("i");
                    iCopy.classList.add("bi");
                    iCopy.classList.add("bi-copy");

                btnCopy.append(iCopy);

                let btnPreview = document.createElement("a");
                btnPreview.classList.add("cond-medias-line-action-preview");
                btnPreview.classList.add("btn");
                btnPreview.classList.add("btn-sm");
                btnPreview.classList.add("btn-dark");
                btnPreview.setAttribute("title", "Prévisualiser");

                    let iPreview = document.createElement("i");
                    iPreview.classList.add("bi");
                    iPreview.classList.add("bi-eye-fill");

                btnPreview.append(iPreview);

                let btnOnAir = document.createElement("a");
                btnOnAir.classList.add("cond-medias-line-action-onair");
                btnOnAir.classList.add("cond-read-mode");
                btnOnAir.classList.add("btn");
                btnOnAir.classList.add("btn-sm");
                btnOnAir.classList.add("btn-success");
                btnOnAir.setAttribute("title", "Diffuser le média à l'antenne");

                    let iOnAir = document.createElement("i");
                    iOnAir.classList.add("bi");
                    iOnAir.classList.add("bi-caret-right-fill");

                    btnOnAir.append(iOnAir);

                let btnStop = document.createElement("a");
                btnStop.classList.add("cond-medias-line-action-stop");
                btnStop.classList.add("cond-read-mode");
                btnStop.classList.add("btn");
                btnStop.classList.add("btn-sm");
                btnStop.classList.add("btn-danger");
                btnStop.setAttribute("title", "Arrêter la diffusion du média");

                    let iStop = document.createElement("i");
                    iStop.classList.add("bi");
                    iStop.classList.add("bi-stop-fill");

                    btnStop.append(iStop);

            actionsContainer.append(btnCopy, btnPreview, btnEdit, btnDelete, btnOnAir, btnStop);

        td4.append(actionsContainer);

    tr.append(td1, td2, td3, td4);
    
    return tr;
}


function lineSetDatas(element, line) {
    let id = line.id;
    let type = line.type;
    let name = line.name;
    let text = line.text;
    let done = line.done;
    let order = line.order;
    let jingle = (line.jingle==undefined || line.jingle=="") ? false : line.jingle;

    // On édite le tbody principal
    element.setAttribute("id", "cond-line-"+id);
    element.dataset.id = id;
    element.dataset.type = type;
    element.dataset.order = order;
    element.dataset.jingle = jingle;

    // On édite le nom de la ligne
    element.querySelector(".cond-line-title").innerText = name;

    // On édite le contenu de la ligne
    element.querySelector(".cond-line-text").innerHTML = nl2br(parseMarkdown(htmlspecialchars(text)));
    if(type=="section")
        element.querySelector(".cond-line-desc").innerText = text.replace(/(\n|\r)/g, " "); // C'est une section : pas de saut de ligne.
    else
        element.querySelector(".cond-line-desc").innerText = text;

    // On édite les boutons
    element.querySelector(".cond-line-action-edit").dataset.id = id;
    element.querySelector(".cond-line-action-delete").dataset.id = id;
    element.querySelector(".cond-insertion-adder-link").dataset.id = id;

    // On édite la checkbox
    element.querySelector(".cond-line-done-checkbox").checked = done;

    // On envoie le jingle dans le bouton jingle
    element.querySelector(".cond-line-jingle-start-button").dataset.jingle = jingle;
}


function mediaLineSetDatas(element, media) {
    let id = media.id;
    let order = media.order;
    let type = media.type;
    let name = media.name;
    let url = media.url;
    let path = media.path;
    let tmb = media.tmb;
    let source = media.source;
    let loop = media.loop;
    let volume = media.volume;
    let channel = media.channel;
    let error = media.error;
    let progress = media.progress;
    let line_id = media.line_id;

    // On édite le tr principal
    element.setAttribute("id", "cond-media-line-"+id);
    element.dataset.id = id;
    element.dataset.type = type;
    element.dataset.name = name;
    element.dataset.order = order;
    element.dataset.url = url;
    element.dataset.path = path;
    element.dataset.tmb = tmb;
    element.dataset.source = source;
    element.dataset.loop = loop;
    element.dataset.volume = volume;
    element.dataset.channel = channel;
    element.dataset.progress = progress;
    element.dataset.error = error;
    element.dataset.inprogress = progress<100;
    element.dataset.lineId = line_id;
    element.dataset.currentMedia = currentMedia==id;

    // On ajoute ou supprime la classe error
    if(error!=null) element.classList.add("error");
    else element.classList.remove("error");
    
    // On édite le thumbnail
    if(tmb==null)
        element.querySelector(".cond-media-thumbnail-img").setAttribute("src", "");
    else
        element.querySelector(".cond-media-thumbnail-img").setAttribute("src", "/medias/" + tmb + "?" + Math.floor(Math.random()*100000000));

    // On édite le mode de volume
    if(volume == 0) element.dataset.volumeMode = "mute";
    else if(volume < 0.5) element.dataset.volumeMode = "low";
    else if(volume >= 0.5) element.dataset.volumeMode = "high";

    // On édite le nom
    element.querySelector(".cond-media-name-text").innerText = name;

    // On édite la progression
    element.querySelector(".cond-media-progressbar").style.width = Math.max(0, progress) + "%";

    // On édite la source
    element.querySelector(".cond-medias-line-credits").innerText = source;
}