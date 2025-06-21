console.log("Source viewer ID \""+viewerID+"\"");

// Élément contenant la source
const sourceElement = document.getElementById("sourceText");

// Fonction affichant la source
function displaySource(source) {
    sourceElement.innerText = source;
}

const channel = new BroadcastChannel("viewer_source");
channel.onmessage = (event) => {
    const to_viewerID = event.data.viewerID ?? "";
    const source = event.data.source ?? "";

    if(viewerID == to_viewerID) {
        console.debug("New source message", event.data);
        
        displaySource(source);
    }
};