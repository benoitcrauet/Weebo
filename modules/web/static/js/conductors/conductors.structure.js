function lineStructure() {

    line_item = document.createElement("tbody");
    line_item.classList.add("cond-line");
    
    tr_display = document.createElement("tr");
    tr_display.classList.add("cond-line-display");

        td_dragger = document.createElement("td");
        td_dragger.classList.add("cond-line-dragger");
        td_dragger.classList.add("cond-edit-mode");
        td_dragger.classList.add("h5");
        td_dragger.classList.add("text-center");
        td_dragger.classList.add("align-middle");
        
            i_dragger = document.createElement("i");
            i_dragger.classList.add("bi");
            i_dragger.classList.add("bi-grip-vertical");

            td_dragger.append(i_dragger);

        td_done = document.createElement("td");
        td_done.classList.add("cond-line-done");
        td_done.classList.add("cond-read-mode");
        td_done.classList.add("h5");
        td_done.classList.add("text-center");
        td_done.classList.add("align-middle");

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
            
                div_medias.append(mediasStructure());

            td_content.append(h3_title, div_text, div_desc, div_medias);
        
        td_actions = document.createElement("td");
        td_actions.classList.add("cond-line-actions");
        td_actions.classList.add("cond-edit-mode");
        td_actions.classList.add("text-end");

            div_btngroup = document.createElement("div");
            div_btngroup.classList.add("btn-group");

                button_edit = document.createElement("button");
                button_edit.classList.add("cond-line-action-edit");
                button_edit.classList.add("btn");
                button_edit.classList.add("btn-primary");

                    i_edit = document.createElement("i");
                    i_edit.classList.add("bi");
                    i_edit.classList.add("bi-pen-fill");

                    button_edit.append(i_edit);

                button_delete = document.createElement("button");
                button_delete.classList.add("cond-line-action-delete");
                button_delete.classList.add("btn");
                button_delete.classList.add("btn-danger");

                    i_delete = document.createElement("i");
                    i_delete.classList.add("bi");
                    i_delete.classList.add("bi-trash3-fill");

                    button_delete.append(i_delete);


                div_btngroup.append(button_edit, button_delete);


            td_actions.append(div_btngroup);


        tr_display.append(td_dragger, td_done, td_content, td_actions);


    tr_adder = document.createElement("tr");
    tr_adder.classList.add("cond-edit-mode");
    tr_adder.classList.add("cond-insertion-adder");

        td_adder = document.createElement("td");
        td_adder.setAttribute("colspan", "3");

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

function lineSetDatas(element, line) {
    let id = line.id;
    let type = line.type;
    let name = line.name;
    let text = line.text;
    let done = line.done;
    let order = line.order;

    // On édite le tbody principal
    element.setAttribute("id", "cond-line-"+id);
    element.dataset.id = id;
    element.dataset.type = type;
    element.dataset.order = order;

    // On édite le nom de la ligne
    element.querySelector(".cond-line-title").innerText = name;

    // On édite le contenu de la ligne
    element.querySelector(".cond-line-text").innerHTML = nl2br(parseMarkdown(htmlspecialchars(text)));
    element.querySelector(".cond-line-desc").innerText = text;

    // On édite les boutons
    element.querySelector(".cond-line-action-edit").dataset.id = id;
    element.querySelector(".cond-line-action-delete").dataset.id = id;
    element.querySelector(".cond-insertion-adder-link").dataset.id = id;

    // On édite la checkbox
    element.querySelector(".cond-line-done-checkbox").checked = done;
}


function mediasStructure() {
    return document.createTextNode("");
}