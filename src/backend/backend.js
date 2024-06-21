const express = require('express');
// const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const getLocalIpAddress = require('./getIp');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const bcrypt = require("bcrypt")
const DiffMatchPatch = require("diff-match-patch")

const app = express();
// const server = http.createServer(app);
const server = https.createServer({
    key: fs.readFileSync('../data/localhost-key.pem'),
    cert: fs.readFileSync('../data/localhost.pem')
  }, app);
const wss = new WebSocket.Server({ server });
const dmp = new DiffMatchPatch()

// TODO: would be cool to have a good logging system

const frontendPath = path.join(__dirname, '..', 'frontend');

// app.use(express.static(frontendPath));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use(express.json({ limit: '50mb' })); // Adjust the limit as needed

// app.use('/public', express.static(path.join(frontendPath, 'public')));
app.use(bodyParser.json());


const dbPath = path.join(__dirname, '..', 'data/db.json');
// Create or load the database
let database = {};
if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath, 'utf-8');
    database = JSON.parse(data);
}


app.get('/room/:token', function (req, res) {
    const token = req.params.token;
    const responseFilename = "room.html"
    const responsePath = path.join(frontendPath, responseFilename);

    // Check if the token exists in the db.json file
    if (database[token]) {
        res.sendFile(responsePath);
    } else {
        res.status(404).send(`Token "${token}" not found`);
    }
});


app.post('/create/', function (req, res) {
    console.log("creating a new room & document");
    const inputData = req.body;

    const password = inputData.password;

    // The following is quite slow, maybe should make it async or something

    const saltRounds = 16;  // 16 bytes for salting the password
    const salt = bcrypt.genSaltSync(saltRounds);

    const hashedPassword = bcrypt.hashSync(password, salt);

    const randomTokenBytes = bcrypt.genSaltSync(saltRounds);  // NOT a salt, despite the API function name
    const base64Token = Buffer.from(randomTokenBytes).toString('base64');

    const document = inputData.contents;

    database[base64Token] = { salt, hashedPassword, document };

    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));

    res.redirect(`/room/${base64Token}`);
});

//get the document contexts here
app.post("/save-text/", function (req, res) {

    console.log("backend response:", req);

});


app.delete("/delete/", function (req, res) {

    console.log("wantiong to delete stuff");
    const inputData = req.body;

    const plainPassword = inputData.password;
    const token = inputData.token;

    if (!database[token]) {
        res.status(404).send(`Token "${token}" not found`);
        return;
    }

    const salt = database[token].salt;
    const savedPassword = database[token].hashedPassword;

    const hashedPassword = bcrypt.hashSync(plainPassword, salt);

    if (savedPassword !== hashedPassword) {
        res.status(403).send(`passwords do not match`);
        return;
    }

    delete database[token];

    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));

    res.redirect(`/`);
});


app.get('*', function (req, res) {
    res.status(404).send('Url not Found');
});

let wsDatabase = new Map();  // it's fine if we don't create a "real" db for this one

wss.on('connection', (ws, req) => {
    // TODO: maybe dynamically create new servers for each new token? idk how to do that right now though
    console.log('Client connected');


    const token = req.url.split('/')[1];
    wsDatabase.set(ws, token);


    handleInitialConnection(ws, token);

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        // console.log(parsedMessage);
        handleIncomingMessage(ws, parsedMessage, token);
    });

    ws.on('close', () => {
        wsDatabase.delete(ws);
        console.log('Client disconnected');
    });
});

function handleInitialConnection(ws, connectionToken) {
    let currentDocument = database[connectionToken].document;

    var diff = dmp.diff_main("", currentDocument);
    dmp.diff_cleanupEfficiency(diff);
    var patches = dmp.patch_make("", diff);
    var patchString = dmp.patch_toText(patches);

    sendToMatchingClients("document", connectionToken, { type: "document", content: patchString, init: "true" });
}

function handleWSChat(content, key) {
    console.log(`received message containing ${content.content.slice(0, 20)}...`);

    sendToMatchingClients("chat", key, content)
}


function handleWSDocumentUpdate(content, key) {
    document = content.content;

    let patches = dmp.patch_fromText(content.content);

    console.log("received content", content);

    sendToMatchingClients("document", key, content)

    let currDoc = database[key].document

    // console.log("the curr doc is", currDoc);
    let newDoc = dmp.patch_apply(patches, currDoc)[0]
    // console.log("the new doc is", newDoc);

    database[key].document = newDoc
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
}

function handleIncomingMessage(ws, message, senderToken) {
    if (!database[senderToken]) {
        return;
    }
    switch (message.type) {
        case 'chat': {
            handleWSChat(message, senderToken)
            return
        }
        case 'document': {
            handleWSDocumentUpdate(message, senderToken)
            return
        }
    }
}

function sendToMatchingClients(type, senderToken, messages) {
    if (!["document", "chat"].includes(type)) {
        throw new Error(`Tpe ${type} is invalid!`);
    }

    wsDatabase.forEach((clientToken, client) => {
        if (clientToken !== senderToken) {
            return;  // don't send anything to clients who don't have matching tokens
        }

        // console.log(`Attempting to send ${type} to client ${client._socket.server._connectionKey}`);

        if (client.readyState !== WebSocket.OPEN) {
            console.log("Failed to send message");
            // TODO: close connection too?
            return
        }

        if (!Array.isArray(messages)) {
            messages = [messages]
        }

        messages.forEach(message => {
            // console.log(message);
            // let toSend = { type: type, content: message };
            client.send(JSON.stringify(message));
        });
        console.log(`${type} sent!`);
    });

    console.log();  // Empty line to get cleaner logs
}


const PORT = 3000;

// Automatically determine the local IP address
const localIPAddress = getLocalIpAddress();
// server.listen(PORT, localIPAddress, () => {
//     console.log(`Server listening on http://${localIPAddress}:${PORT}`);
// });

server.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
  });