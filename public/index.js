let socket;

let gameData;

let messages = [];
function checkName() {
    let username = localStorage.getItem('username');

    if (username) {

        document.querySelector(".username-page").remove();
        document.querySelector(".waiting-page").style.display = "block";
        initSocket(username);

    }


}

function setName() {
    let value = document.querySelector("input").value;

    if (value) {
        localStorage.setItem("username", value);

        document.querySelector(".username-page").remove();
        document.querySelector(".waiting-page").style.display = "block";
        initSocket(value);

    } else {
        alert("enter somethin.")
    }

}


function initSocket(username) {
    socket = new WebSocket("ws://" + window.location.hostname);
    socket.addEventListener("open", () => { onSocketOpen(username) });
    socket.addEventListener("message", (message) => { onMessageRecived(message) });
}

function onSocketOpen(username) {

    let userData = {

        type: "username",
        payload: {
            data: username,

        }
    }
    socket.send(JSON.stringify(userData));

}

function onMessageRecived(message) {
    let parsedMessage = JSON.parse(message.data);
    switch (parsedMessage.type) {
        case "gameData":
            addGameData(parsedMessage);
            break;
        case "newPlayer":
            addNewPlayerToWaiting(parsedMessage, false);
            break;
        case "waitingTimer":
            addWaitingTimer(parsedMessage);
            break;
        case "gameStart":
            startGame(parsedMessage);
            break;
        case "gameTimer":
            updateGameTimer(parsedMessage);
            break;
        case "message":
            addMessage(parsedMessage);
            break;
        case "endGame":
            endGame(parsedMessage);
            break;
    }
}


function addNewPlayerToWaiting(playerDetails, isGameData) {

    let waitingPage = document.querySelector(".waiting-page-main-container");

    let container = document.createElement("div");
    container.className = "container-user";
    let text;
    if (!isGameData) {
        text = document.createTextNode(playerDetails.payload.data.username);
    } else {
        text = document.createTextNode(playerDetails.username);
    }
    text.className = "user-container";

    container.appendChild(text);

    waitingPage.appendChild(container);

}



function addWaitingTimer(timeDetails) {
    let timerText = document.querySelector(".waiting-timer");
    timerText.innerHTML = "Game starts in " + timeDetails.payload.data;
}

function startGame(gameDetails) {
    gameData = gameDetails;
    document.querySelector(".waiting-page").style.display = "none";
    document.querySelector(".playing-page").style.display = "block";
    createPlayerElements(gameDetails);

}

function createPlayerElements(gameDetails) {
    console.log(gameDetails);
    let playerContainers = document.querySelector(".container-players");
    playerContainers.innerHTML = "";
    gameDetails.payload.data.players.forEach((playerName) => {

        let playerInfo = gameDetails.payload.data[playerName];

        let playerDiv = document.createElement("div");
        playerDiv.className = "player-container";

        let playerUserName = document.createElement("h1");
        playerUserName.innerHTML = playerInfo.username;
        playerUserName.className = "player-username";


        let playerLoads = document.createElement("h1");
        playerLoads.innerHTML = playerInfo.load;
        playerLoads.className = "player-load";



        let playerAction = document.createElement("h1");
        playerAction.innerHTML = playerInfo.action;
        playerAction.className = "player-action";

        playerDiv.appendChild(playerUserName);
        playerDiv.appendChild(playerLoads);
        playerDiv.appendChild(playerAction);

        playerContainers.appendChild(playerDiv);

    });
}

function addGameData(gameDetails) {
    gameData = gameDetails;
    if (document.querySelector(".waiting-page")) {
        document.querySelector(".waiting-page-main-container").innerHTML = " ";
        gameDetails.players.forEach(player => {
            addNewPlayerToWaiting(gameDetails[player], true);
        })
    }
}

function updateGameTimer(timeDetails) {
    let timerText = document.querySelector(".playing-timer");
    timerText.innerHTML = "time : " + timeDetails.payload.data;
}

function changeAction(action) {
    let username = localStorage.getItem("username");
    let actionData = {
        type: "changeAction",
        payload: {
            username: username,
            action: action
        }
    }
    socket.send(JSON.stringify(actionData));
}

function endGame(){
    document.querySelector(".playing-page").style.display = "none";
    let username = localStorage.getItem('username');
    initSocket(username);
    document.querySelector(".waiting-page").style.display = "block";
}


function addMessage(parsedMessage){
    let containers = document.querySelectorAll(".message-container");

    containers.forEach(container=>{
        let text = document.createElement("h1");
        text.innerHTML = parsedMessage.payload.data;
        container.appendChild(text);
        container.scrollTop += 100;
    });
}