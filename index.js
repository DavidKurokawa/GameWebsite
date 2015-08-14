// setup
var port = 8080;
var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var sockets = [];
var availableColors = ["#FF8C00", "#FF0000", "#00DD00", "#0000FF"];
var main = require(__dirname + "/js/main");
var room = main.initializeSushiGo(true);
var coms = require(__dirname + "/js/server");

// link files
app.use("/css", express.static(__dirname + "/css"));
app.use("/imgs", express.static(__dirname + "/imgs"));
app.use("/js", express.static(__dirname + "/js"));
app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html");
});

// emit the given message to the given medium
function emit(medium, msg) {
    console.log("m: " + msg);
    medium.emit("m", msg);
}

// sync the status of the provided medium
function syncStatus(medium) {
    var msg = "ss";
    sockets.forEach(function(socket) {
        msg += " " + socket.playerId + " " + socket.color;
    });
    msg += " #";
    room.privateAreas.forEach(function(privateArea) {
        msg += " " + (privateArea.isClaimed() ? privateArea.playerId : "#");
    });
    room.cards.forEach(function(card) {
        msg += " " + card.id
             + " " + card.locX
             + " " + card.locY
             + " " + (card.isUpPublicly ? 1 : 0);
        for (var playerId in card.selectors) {
            msg += " " + playerId;
        }
        msg += " #";
    });
    emit(medium, msg);
}

// connection handler
io.on("connection", function(socket) {
    // handle a connection
    socket.color = availableColors.pop(); // TODO: this will fail if there are too many connections
    socket.playerId = sockets.length;
    var newUserSuffix = socket.playerId + " " + socket.color;
    emit(socket, "id " + newUserSuffix);
    emit(socket.broadcast, "u+ " + newUserSuffix);
    syncStatus(socket);
    sockets.push(socket);

    // disconnect handler
    socket.on("disconnect", function() {
        availableColors.push(socket.color);
        delete socket.color;
        emit(socket.broadcast, "u-");
        room.privateAreas.forEach(function(privateArea) {
            if (socket.playerId == privateArea.playerId) {
                privateArea.unclaim();
                emit(socket.broadcast, "up " + privateArea.id + " " + privateArea.playerId);
            }
        });
    });

    // message handler
    socket.on("m", function(msg) {
        var cmd = msg.substr(0, 2);
        coms.parseMessage(room, msg);
        // TODO: basing the medium based off the cmd is hacky, better fix this soon!
        emit(cmd == "cp" || cmd == "up" ? io : socket.broadcast, msg);
    });
});

// listen for http connections
http.listen(port, function() {
    console.log("listening on *:" + port)
});

