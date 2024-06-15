// Getting GET parameters
const urlParams = new URLSearchParams(window.location.search);

// Only if debug is present
const debugMode = urlParams.has('debug');

// Displaying debug only if debug mode is enabled
if(debugMode)
    document.body.classList.add("debug");
else
    document.body.classList.remove("debug");

// List of debug values
const debugList = document.getElementById("debuglist");

function debug(name, value=undefined) {
    // If no value: delete line
    if(value===undefined) {
        debugList.querySelectorAll("li").forEach(e => {
            if(e.dataset.name == name)
                e.remove();
        });
    }
    else {
        var element = null;
        // Adding value if not exists
        debugList.querySelectorAll("li").forEach(e => {
            if(e.dataset.name == name) {
                element = e;
                return;
            }
        });

        // If element is null, creating it...
        if(element===null) {
            let newElement = document.createElement("li");
            newElement.classList.add("debug-item");

            let newElementName = document.createElement("span");
            newElementName.classList.add("item-name");

            let newElementValue = document.createElement("code");
            newElementValue.classList.add("item-value");

            newElement.append(newElementName, newElementValue);

            debugList.append(newElement);

            element = newElement;
        }

        // Set element value
        element.dataset.name = name;
        element.dataset.value = value;

        element.querySelector(".item-name").innerText = name;
        element.querySelector(".item-value").innerText = value;
    }
}


function displayAlert(text=undefined, information=false) {
    const alert = document.getElementById("alert");
    const alertContent = document.getElementById("alertContent");

    if(text===undefined) {
        alert.classList.remove("show");
    }
    else {
        alert.classList.remove("info");
        if(information)
            alert.classList.add("info");
        
        alert.classList.add("show");
        alertContent.innerText = text;
        alertContent.innerHTML = "<h1>SPY ALERT</h1>" + alertContent.innerHTML;
    }
}


// Access levels list
const obsAccessLevelsList = {
    0: "No access to OBS",
    1: "Read access to OBS status information",
    2: "Read access to user information (current Scene Collection, Transitions)",
    3: "Basic access to OBS (Save replay buffer, etc.)",
    4: "Advanced access to OBS (Change scenes, Start/Stop replay buffer, etc.)",
    5: "Full access to OBS (Start/Stop streaming without warning, etc.)",
};

// Access level to OBS
let obsAccessLevel = 0;


// Streaming status
let obsStreamingStatus = false;
// Recording status
let obsRecordingStatus = true;
// Current scene
let obsScene = null;
// Current scene name
let obsSceneName = null;
// Scene list
let obsSceneList = null;



// When start/stop streaming
function obsStreamingHandler(enable) {
    obsStreamingStatus = enable;

    if(enable) {
        debug("Streaming status", "Started");
    }
    else {
        debug("Streaming status", "Stopped");
    }

    // Sending data to server
    fetch(url["setStatus"], {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "streaming": enable
        })
    });
}

// When start/stop recording
function obsRecordingHandler(enable) {
    obsRecordingStatus = enable;

    if(enable) {
        debug("Recording status", "Started");
    }
    else {
        debug("Recording status", "Stopped");
    }

    // Sending data to server
    fetch(url["setStatus"], {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "recording": enable
        })
    });
}

// When scene is changed
function obsSceneChangeHandler(scene) {
    obsScene = scene;
    obsSceneName = scene.name;
    debug("Current scene", JSON.stringify(scene));

    // Sending data to server
    fetch(url["setStatus"], {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "currentScene": obsSceneName
        })
    });
}

// When scene list is changed
function obsSceneListChangeHandler(scenes) {
    obsSceneList = scenes;
    debug("Scene list", JSON.stringify(scenes));
}



// Check if we have a show
if (show!==undefined && show!=="") {
    // Check if we have a conductor
    if (conductor!==undefined && conductor!="") {
        // Check if OBS API is available
        if (typeof window.obsstudio === 'undefined') {
            debug("OBS API", "Unavailable");
            displayAlert("OBS API is unavailable in this browser.");
        }
        else {
            debug("OBS API");

            // Getting rights access to OBS
            window.obsstudio.getControlLevel((level) => {
                obsAccessLevel = level;
                debug("Access level", level + " (" + obsAccessLevelsList[level] + ")");

                if(level < 5)
                    displayAlert("This source needs a full access to OBS.\n\nPlease set \"Page permissions\" to \"" + obsAccessLevelsList[5] + "\".");
                else
                    displayAlert();
            });




            // RECORDING/STREAMING STATUS LISTENERS
            window.obsstudio.getStatus((status) => {
                debug("Status", JSON.stringify(status));
                obsStreamingHandler(status.streaming);
                obsRecordingHandler(status.recording);
            });
            window.addEventListener('obsRecordingStarted', (event) => {
                obsRecordingHandler(true);
            });
            window.addEventListener('obsRecordingStopped', (event) => {
                obsRecordingHandler(false);
            });
            window.addEventListener('obsStreamingStarted', (event) => {
                obsStreamingHandler(true);
            });
            window.addEventListener('obsStreamingStopped', (event) => {
                obsStreamingHandler(false);
            });

            // SCENE CHANGING
            window.obsstudio.getCurrentScene((scene) => {
                obsSceneChangeHandler(scene);
            });
            window.addEventListener('obsSceneChanged', (event) => {
                obsSceneChangeHandler(event.detail);
            });

            // SCENES LIST
            window.obsstudio.getScenes((scenes) => {
                obsSceneListChangeHandler(scenes);
            });
            window.addEventListener('obsSceneListChanged', (event) => {
                obsSceneListChangeHandler(event.detail);
            });

        }

    }
    else {
        // No conductor defined: error
        displayAlert("No conductor is active for the moment.\n\nPlease create a conductor and refresh this source.", true);
        window.setTimeout(() => {
            displayAlert();
        }, 10000);
    }
}
else {
    // No show found: error
    displayAlert("This show does not exists. Please enter a valid spy URL.");
}