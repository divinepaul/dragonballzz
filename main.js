var WebSocketServer = require("ws").Server;
let express = require("express");
let http = require("http");
let app = express();
let server = http.createServer(app);

server.listen(process.env.PORT || 8080);

var wss = new WebSocketServer({ server: server });


app.get('/', (req, res) => {
  res.send('ok')
});


wss.on('connection', function connection(ws) {

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });


});