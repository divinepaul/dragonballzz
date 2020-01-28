let socket;

let gameData;


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
            addNewPlayerToWaiting(parsedMessage,false);
            break;
        case "waitingTimer":
            addWaitingTimer(parsedMessage);
            break;
        case "gameStart":
            startGame(parsedMessage);
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
    console.log(waitingPage);
}

function addWaitingTimer(timeDetails) {
    let timerText = document.querySelector(".waiting-timer");
    timerText.innerHTML = "time : " + timeDetails.payload.data;
}

function startGame(gameDetails) {
    document.querySelector(".waiting-page").remove();
}

function addGameData(gameDetails) {
    gameData = gameData;
    if (document.querySelector(".waiting-page")) {
        document.querySelector(".waiting-page-main-container").innerHTML = " ";
        gameDetails.players.forEach(player => {
            addNewPlayerToWaiting(gameDetails[player],true);
        })
    }
}
