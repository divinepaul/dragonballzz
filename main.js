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


    let parsedMessage = JSON.parse(recivedMessage);


    switch (parsedMessage.type) {

      case "username":
        addUser(parsedMessage.payload, ws);
        break;
      case "changeAction":
        changeAction(parsedMessage);
    }

  });


});


function addUser(payload, ws) {
  let username =  payload.data;
  let peerId = payload.peerId;
  if (!gameStarted) {



    if ((gameData.players.indexOf(username) == -1)) {
      clients.push(ws);

      let player = {
        username: username,
        peerId:peerId,
        load: 1,
        action: "load",
        ws: (clients.length - 1)
      }

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



    }

  } else {
    let messageData = {
      type: "message",
      payload: {
        data: username + " tried to join the server."
      }
    }

    wss.broadcast(JSON.stringify(messageData));
  }

}

let waitingTimer;

function startWaitingTimer(ws) {

  var sec = 30;

  if (waitingTimer) {
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
      startGame();
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
let gameTimer;
function startGame() {

  let count = 8;
  gameTimer = setInterval(() => {
    let gameTimeData = {
      type: "gameTimer",
      payload: {
        data: count
      }
    }

    wss.broadcast(JSON.stringify(gameTimeData));

    count--;
    if (count < 1) {
      count = 5;
      checkGame();
    }

  }, 1000);

}


function checkGame() {

  gameData.players.forEach((playerName, i) => {

    let player = gameData[playerName];
    let playerAction = player.action;
    let playerLoad = player.load;

    switch (playerAction) {

      case "load":
        gameData[playerName].load += 1;
        break;

      case "beam":
        if (playerLoad < 1) {
          let messageData = {
            type: "message",
            payload: {
              data: player.username + " didnt have enough loads for beam"
            }

          }

          gameData.players.splice(i, 1);
          delete gameData[playerName];

          wss.broadcast(JSON.stringify(messageData));
        } else {
          gameData[playerName].load -= 1;
        }
        break;

      case "punch":
        if (playerLoad < 2) {
          let messageData = {
            type: "message",
            payload: {
              data: "remove: " + player.username + " didnt have enough loads for punch"
            }

          }
          gameData.players.splice(i, 1);
          delete gameData[playerName];

          wss.broadcast(JSON.stringify(messageData));
        } else {
          gameData[playerName].load -= 2;
        }
        break;

      case "tornado":
        if (playerLoad < 3) {
          let messageData = {
            type: "message",
            payload: {
              data: "remove: " + player.username + " didnt have enough loads for tornado"
            }

          }
          gameData.players.splice(i, 1);
          delete gameData[playerName];

          wss.broadcast(JSON.stringify(messageData));
        } else {
          gameData[playerName].load -= 3;
        }
        break;

      case "d-punch":
        if (playerLoad < 4) {
          let messageData = {
            type: "message",
            payload: {
              data: "remove: " + player.username + " didnt have enough loads for d-punch"
            }

          }

          gameData.players.splice(i, 1);
          delete gameData[playerName];

          wss.broadcast(JSON.stringify(messageData));
        } else {
          gameData[playerName].load -= 4;
        }
        break;

      case "d-block":
        if (playerLoad < 1) {
          let messageData = {
            type: "message",
            payload: {
              data: "remove: " + player.username + " didnt have enough loads for d-block"
            }

          }

          gameData.players.splice(i, 1);
          delete gameData[playerName];

          wss.broadcast(JSON.stringify(messageData));
        } else {
          gameData[playerName].load -= 1;
        }
        break;


    }


  });

  let removedPlayers = [];
  gameData.players.forEach((selplayerName, i) => {

    let selPlayer = gameData[selplayerName];
    let selPlayerAction = selPlayer.action;

    gameData.players.forEach((comPlayerName, j) => {
      let comPlayer = gameData[comPlayerName];
      let comPlayerAction = comPlayer.action;

      switch (selPlayerAction) {
        case "load":
          switch (comPlayerAction) {
            case "beam":
            case "punch":
            case "tornado":
            case "d-punch":
              removedPlayers.push(i);
              sendKillMessage(selPlayer, comPlayer);
          }
          break;
        case "block":
          switch (comPlayerAction) {
            case "d-punch":
              removedPlayers.push(i);
              sendKillMessage(selPlayer, comPlayer);

          }
          break;
        case "beam":
          switch (comPlayerAction) {
            case "punch":
            case "tornado":
            case "d-punch":
              removedPlayers.push(i);
              sendKillMessage(selPlayer, comPlayer);


          }
          break;
        case "punch":
          switch (comPlayerAction) {
            case "tornado":
            case "d-punch":
              removedPlayers.push(i);
              sendKillMessage(selPlayer, comPlayer);

          }
          break;
        case "tornado":
          switch (comPlayerAction) {
            case "d-punch":
              removedPlayers.push(i);
              sendKillMessage(selPlayer, comPlayer);
          }
          break;
      }

    });
  });

  
  removedPlayers.forEach(index => {
    let playerName = gameData.players[index];
    gameData.players.splice(index, 1);
    delete gameData[playerName];
  });


  let gameUpdateData = {
    type: "gameStart",
    payload: {
      data: gameData
    }
  }
  wss.broadcast(JSON.stringify(gameUpdateData));


  if (gameData.players.length < 2) {

    clearInterval(gameTimer);
    endGame();
  }


}

function changeAction(actionData) {
  let username = actionData.payload.username;
  if (gameData.players.indexOf(username) != -1) {
    let action = actionData.payload.action;

    gameData[username].action = action;
  }
}

function endGame() {

  let endGameResultData = {
    type: "message",
    payload: {
      data: gameData.players[0] + " won the game."
    }
  }
  wss.broadcast(JSON.stringify(endGameResultData));



  let endGameData = {
    type: "endGame",
    payload: {
      data: "game Ended"
    }
  }

  wss.broadcast(JSON.stringify(endGameData));

  wss.clients.forEach(client => {
    client.close();
  });

  gameStarted = false;

  gameData = { type: "gameData", players: [] };

  clients = [];

}


function sendKillMessage(selPlayer, comPlayer) {
  let messageData = {
    type: "message",
    payload: {
      data: selPlayer.username + " with " + selPlayer.action + " was " + comPlayer.action + "ed"
    }
  }

  wss.broadcast(JSON.stringify(messageData));
}