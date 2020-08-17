let socket;

let gameData;

let messages = [];

let peer;

let calls = [];
function checkName() {
    let username = localStorage.getItem('username');

    if (username) {

        document.querySelector(".username-page").remove();
        document.querySelector(".waiting-page").style.display = "flex";
        initSocket(username);

    }


}

function setName() {
    let value = document.querySelector("input").value;

    if (value) {
        localStorage.setItem("username", value);

        document.querySelector(".username-page").remove();
        document.querySelector(".waiting-page").style.display = "flex";
        initSocket(value);

    } else {
        alert("enter somethin.")
    }

}


function initSocket(username) {
    socket = new WebSocket("wss://" + window.location.hostname);
    socket.addEventListener("open", () => { onSocketOpen(username) });
    socket.addEventListener("message", (message) => { onMessageRecived(message) });
    peer = new Peer();
    peer.on('call', (call) => {onCall(call)});
    
}


function onCall(call){
    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    getUserMedia({
        audio: true,
        video: false
    }, (mediaStream) =>{


       call.answer(mediaStream);
    //    new Audio().srcObject = mediaStream;
        call.on("stream",(stream) => onAudioRecive(stream));


    }, (e)=>{
        alert("wtf dude?")
    });
}

function onAudioRecive(stream){
    new Audio().srcObject = stream;
}

function onSocketOpen(username) {
    peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        let userData = {

            type: "username",
            payload: {
                data: username,
                peerId: id
    
            }
        }
        socket.send(JSON.stringify(userData));

    });
    

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

    console.log(playerDetails);

    var getUserMedia =  navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia ;
    getUserMedia({
        audio: true,
        video: false
    }, (mediaStream) =>{

        console.log(playerDetails);
        console.log(playerDetails.payload);
        console.log(playerDetails.payload.data.peerId);

        var call = peer.call(playerDetails.payload.data.peerId,mediaStream);
        calls.push(call);
    }, (e)=>{
        alert("wtf dude?");
    });
    


}



function addWaitingTimer(timeDetails) {
    let timerText = document.querySelector(".waiting-timer");
    timerText.innerHTML = "Game starts in " + timeDetails.payload.data;
}

function startGame(gameDetails) {
    gameData = gameDetails;
    document.querySelector(".waiting-page").style.display = "none";
    document.querySelector(".playing-page").style.display = "flex";
    createPlayerElements(gameDetails);

}

function createPlayerElements(gameDetails) {
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
    socket.close();
    socket = null;
    initSocket(username);

    document.querySelector(".waiting-page").style.display = "flex";
}



function addMessage(parsedMessage){
    let containers = document.querySelectorAll(".message-container");

    containers.forEach(container=>{
        let text = document.createElement("h1");
        text.innerHTML = parsedMessage.payload.data + "<br><br>";
        container.appendChild(text);
        container.scrollTop = container.scrollHeight;
    });
}