const token = window.location.pathname.split('/').at(-1);
// const socket = new WebSocket(`ws://${window.location.hostname}:3000/${token}`);
const socket = new WebSocket(`wss://${window.location.hostname}:3000/${token}`);
let clientToken = null; // This will be used to calculate RTT later on

let RTTRollingAvgChat = [];  // Update as we go
let SizeRollingAvgChat = [];  // Update as we go
let RTTRollingAvgDocument = [];  // Update as we go
let SizeRollingAvgDocument = [];  // Update as we go

var dmp = new diff_match_patch();

let previousText = "" // Initially the document is empty
let unrenderedTextLen = 0;

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

socket.addEventListener('open', (event) => {
    clientToken = generateUUID();
    console.log('Connected to the server');
});

socket.addEventListener('message', (event) => {
    let eventData = JSON.parse(event.data)

    switch (eventData.type) {
        case "chat": {
            displayChat(eventData.content, eventData.username);
            const container = document.getElementById("rtt-chat-display")
            updateRTT(
                eventData.sender,
                eventData.timestamp,
                calculateMemoryUsage(eventData),
                RTTRollingAvgChat,
                SizeRollingAvgChat,
                container,
            )
            return
        }
        case "document": {
            // console.log(eventData);
            // console.log(previousText);
            if (eventData.init === "true" && previousText !== "") {
                return
            }
            const container = document.getElementById("rtt-document-display")
            updateRTT(
                eventData.sender,
                eventData.timestamp,
                calculateMemoryUsage(eventData),
                RTTRollingAvgDocument,
                SizeRollingAvgDocument,
                container,
                docType = true,
            )

            if (eventData.render === false) {
                return
            }
            unrenderedTextLen = 0
            displayDocument(eventData.content);
            return
        }
        default: {
            console.log("something went wrong", eventData);
        }
    }
});

function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const chat = chatInput.value;
    const sentTimestamp = Date.now();
    var username = document.getElementById("username-input").value;

    if (chat.trim() !== '') {
        socket.send(JSON.stringify({
            type: 'chat',
            content: chat,
            timestamp: sentTimestamp,
            sender: clientToken,
            username: username,
        }));
        chatInput.value = '';
    }
    console.log("sent message");
}

// Enable message input when username is entered
document.getElementById("username-input").addEventListener("input", function () {
    var username = document.getElementById("username-input").value;
    var messageInput = document.getElementById("chat-input");
    messageInput.disabled = username.trim() === ""; // Enable if username is not empty
});

function displayChat(chat, username) {
    const chatBox = document.getElementById('chat-box');
    const chatElement = document.createElement('p');
    chatElement.textContent = `${username}: ${chat}`;

    chatBox.insertBefore(chatElement, chatBox.firstChild);
}


function twoSigFigs(n) {
    return Math.round(n * 100) / 100;
}

function updateArrAndCalculateAverage(arr, newVal, n) {
    arr.push(newVal)

    if (arr.length > n) {
        arr.splice(0, arr.length - n);
    }
    // Note that arr is updated "in place", so we don't need to pass it back etc

    const sum = arr.reduce((a, b) => a + b, 0);
    const avg = (sum / arr.length) || 0;
    return twoSigFigs(avg)
}

function updateRTT(senderToken, senderTimestamp, packetSize, currValuesRTT, currValuesSize, container, docType = false, n = 10) {
    if (senderToken !== clientToken) {
        return // Not our value
    }

    const timestampNow = Date.now();
    const delta = timestampNow - senderTimestamp

    let avgRTT = updateArrAndCalculateAverage(currValuesRTT, delta, n)
    let avgSize = updateArrAndCalculateAverage(currValuesSize, packetSize, n)

    let descriptionString = `
        average RTT based on last ${currValuesRTT.length} sent&received packets: <br>
        <b>${avgRTT}ms</b>. <br>
        The packets had an average size of: <b>${avgSize} bytes</b><br>
        (or <b>${twoSigFigs(avgSize / (1024 * 1024))}MB</b>)
    `

    if (docType === true) {
        let text = getDocText()
        let textSize = getStringSizeBytes(text) + unrenderedTextLen

        descriptionString += `
            <br>
            The document currently has a size of: <b>${textSize} bytes</b><br>
            (or <b>${twoSigFigs(textSize / (1024 * 1024))}MB</b>)
        `
    }

    container.innerHTML = descriptionString
}

function getStringSizeBytes(str) {
    const encoder = new TextEncoder();
    const encodedString = encoder.encode(str);
    return encodedString.length;
}

function calculateNewDocument(patches) {
    patches = dmp.patch_fromText(patches);
    return dmp.patch_apply(patches, previousText)[0]
}

function displayDocument(receivedData) {
    const documentTextArea = document.getElementById('collaboration-document');

    let updatedText = calculateNewDocument(receivedData)
    documentTextArea.value = updatedText || "";//use value instead of textcontent to sync the context correctly.

    previousText = updatedText
}


function calculateMemoryUsage(variable) {
    const jsonString = JSON.stringify(variable);

    const bytes = new TextEncoder().encode(jsonString).length;

    return bytes;
}

function getDocText() {
    let doc = document.getElementById('collaboration-box')
    var text = "";

    for (i of doc.children) {
        if (i.nodeName !== "TEXTAREA") {
            continue
        }
        text += i.value;
    }

    return text
}

function calculatePatches(text) {
    var diff = dmp.diff_main(previousText, text);

    dmp.diff_cleanupEfficiency(diff);

    var patches = dmp.patch_make(previousText, diff);

    var patchString = dmp.patch_toText(patches);

    return patchString
}

document.getElementById('collaboration-box').addEventListener('input', function () {
    let text = getDocText()

    let patchString = calculatePatches(text)

    // console.log("raw text is", calculateMemoryUsage(text));
    // console.log("deltas is", calculateMemoryUsage(patchString));

    // console.log(previousText);
    // console.log(patchString);

    // var patches = dmp.patch_fromText(patchString);
    // var patchedResult = dmp.patch_apply(patches, previousText);
    // var updatedText = patchedResult[0];
    // console.log("are the strings equal?", updatedText === text);
    // console.log("\n");

    updateDocumentText(patchString);
    // previousText = text;
});

function splitString(str, size) {
    const result = [];
    for (let i = 0; i < str.length; i += size) {
        result.push(str.slice(i, i + size));
    }
    return result;
}

// This is the function we use to send
// the updates to the server
// because throttle itself returns a function
// see https://www.youtube.com/watch?v=cjIswDCKgu0
// for an explanation
const updateDocumentText = throttle(text => {
    const sentTimestamp = Date.now();
    socket.send(JSON.stringify({
        type: 'document',
        content: text,
        timestamp: sentTimestamp,
        sender: clientToken,
    }));
})


function throttle(cb, delay = 200) {
    // This function insures that we don't overload
    // the server by sending data after _every_ keystroke,
    // instead it will re-send after `delay` ms

    let shouldWait = false
    let waitingArgs
    const timeoutFunc = () => {
        if (waitingArgs == null) {
            shouldWait = false
        } else {
            cb(...waitingArgs)
            waitingArgs = null
            setTimeout(timeoutFunc, delay)
        }
    }

    return (...args) => {
        if (shouldWait) {
            waitingArgs = args
            return
        }
        cb(...args)
        shouldWait = true

        setTimeout(timeoutFunc, delay)
    }
}

function generateRandomString(n) {
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\n";
    var result = "";
    for (var i = 0; i < n; i++) {
        var randomIndex = Math.floor(Math.random() * charset.length);
        result += charset.charAt(randomIndex);
    }
    return result;
}

function simulate_update() {
    let len = parseInt(document.getElementById("sim-len").value)
    if (len <= 0) {
        return
    }
    unrenderedTextLen += len
    let text = getDocText()
    let randomData = generateRandomString(len)
    let patchString = calculatePatches(text + randomData)
    updateDocumentTextNoRerender(patchString);


    console.log(`Simulating sending random string of length ${len} bytes`);
    console.log("padding the document with string", randomData);
}

const updateDocumentTextNoRerender = throttle(text => {
    const sentTimestamp = Date.now();
    socket.send(JSON.stringify({
        type: 'document',
        content: text,
        timestamp: sentTimestamp,
        sender: clientToken,
        render: false,
    }));
})