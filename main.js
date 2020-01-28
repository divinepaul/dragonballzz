var WebSocketServer = require("ws").Server;
let express = require("express");
let http = require("http");
let app = express();
let server = http.createServer(app);

server.listen(process.env.PORT || 80);

app.use(express.static('public'));

let wss = new WebSocketServer({ server: server });

let gameData = { type: "gameData", players: [] };
let clients = [];
let gameStarted = false;

wss.broadcast = function broadcast(msg) {

  wss.clients.forEach((client) => {
    client.send(msg);
  });
};


wss.on('connection', function (ws) {

  wss.broadcast(JSON.stringify(gameData));

  ws.on('message', function (recivedMessage) {

    console.log('received: %s', recivedMessage);

    let parsedMessage = JSON.parse(recivedMessage);


    switch (parsedMessage.type) {

      case "username":
        addUser(parsedMessage.payload.data, ws);
        break;
    }

  });


});


function addUser(username, ws) {
  
  if (!gameStarted) {
    clients.push(ws);
    let player = {
      username: username,
      load: 1,
      action: null,
      ws: (clients.length - 1)
    }

    if (!(gameData.players[username])) {

      gameData.players.push(username);
      gameData[username] = player;
      ws.name = username;
      let playerData = {
        type: "newPlayer",
        payload: {
          data: player
        }
      }

      wss.broadcast(JSON.stringify(playerData));

      if (gameData.players.length > 1) {
        startWaitingTimer(ws);
      }

      console.log(gameData);
    }
  } else {
    let messageData = {
      type: "message",
      payload: {
        data: username +" tried to join the server."
      }
    }
    console.log(username +" tried to join the server.");
    wss.broadcast(JSON.stringify(messageData));
  }

}

let waitingTimer;

function startWaitingTimer(ws) {

  var sec = 30;
  if(waitingTimer){
    clearInterval(waitingTimer);
  }
 
  waitingTimer = setInterval(function () {

    sec--;

    if (sec < 0) {

      gameStarted = true;

      let gameStartData = {
        type: "gameStart",
        payload: {
          data: gameData
        }
      }
      wss.broadcast(JSON.stringify(gameStartData));

      clearInterval(waitingTimer);

    } else {
      let timeMessage = {
        type: "waitingTimer",
        payload: {
          data: sec
        }
      }

      wss.broadcast(JSON.stringify(timeMessage));
    }

  }, 1000);


  
}
