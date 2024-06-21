# Internet-protocols-collabtool-G


To get started with the code, run `npm install` in the file root. Then to run the backend, run `node /path/to/backend.js`.

You also need to install your own certificate for localhost. The best way to do this is to install [mkcert](https://github.com/FiloSottile/mkcert) and running the commands `mkcert -install` and `mkcert localhost 127.0.0.1 ::1`. Save/rename the key files to `localhost.pem` and `localhost.key.pem`, and insert them to `src/data/`.

If you do not want to set up your own keys, you can use an older version of the app. As of 19/03/2024, there are no missing features in older versions. 

The app currently works by connecting to the address `https://localhost:port` that gets printed to console after starting the server. On that page you are prompted to create a room, which you protect with some kind of password. It will then redirect you after the file has been created. The redirect URL contains the unique token for a room.

If you don't want to create a new room, you may instead choose to join one. The url for a room always looks like `localhost:port/room/<token here>`. Upon joining a room, you will the saved document for the room.


## Note:
As of the evening of 20/03/2024, the code for the app will not be touched anymore. However, the final report is included in the git repo, and it is not finished yet. Therefore, there will be commits in the repo after the deadline for the implementation, but only for the documentation. 


# Current state of the project

The app works over HTTPS and uses WSS for secure and encrypted communication between server-client and client-server.

Currently, users can
- create new rooms with password protection
  - rooms can also be created with an initial document
    - Currently, supported document size is up to 50mb. This, however is not realistic with the current implementation because the app freezes even at 1mb
- Join existing rooms (if they know the token)
- once in a room, users can
  - Add text in the saved document
  - Send temporary messages to each active client
  - If they know the password, they can delete the document/room
  - See new updates to the document in real time everyime someone edits the document (updated everytime someone types in the document)
  - see new messages when they are sent (here, "sent" means they press the "send" button. Messages are removed on refresh)¨
    - messages are meant to be akin to temporary notes. The main "app" is the document.
  - See the RTT for the changes _they_ made, and how large the packets received from the server are
  - Download the document as a .txt file
- The system does not suffer if a client disconnects unexpectedly
- All text is saved in a database, so joining pre-existing rooms will load the current saved document for each client. The instant messaging features are not saved in the database, and are only stored in the browser cache.
- There is also support for simulating appending text to the document. This simulation saves the changes made to the database and sends the changes to each client, but importantly will NOT re-render the document for _any_ client. This means that the changes are only visible if a user refreshes their screen.
  - The reason why this feature was added is because for some reason, rendering the document can take a really long time, far longer than the RTT or anything of that matter. While rendering time seems to vary a lot between browsers and hardware, one way to test if updating the document is slow because of rendering or connection to the server is to re-size the document (there is a small draggable element in the bottom right for this). Of course, this solution is not perfect.
- Preliminary support for images (currently not synced between clients)


