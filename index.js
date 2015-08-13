// setup
var port = 8080;
var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var sockets = [];
var unavailablePrivateAreas = {};
var availableColors = ["#FF8C00", "#FF0000", "#00DD00", "#0000FF"];
var main = require(__dirname + "/js/main");
var room = main.initializeSushiGo(true);
var coms = require(__dirname + "/js/server");

// link files
app.use("/css", express.static(__dirname + "/css"));
app.use("/imgs", express.static(__dirname + "/imgs"));
app.use("/js", express.static(__dirname + "/js"));
app.get("/", function(req, res) {
    res.sendfile("index.html");
});

// emit the given message to the given medium
function emit(medium, msg) {
    console.log("msg: " + msg);
    medium.emit("msg", msg);
}

// unclaim the provided socket's private area
function unclaimPrivateArea(socket) {
    if (typeof socket.privateArea !== "undefined") {
        emit(io, "up " + socket.privateArea);
        delete unavailablePrivateAreas[socket.privateArea];
        delete socket.privateArea;
    }
}

// sync the status of the provided medium
function syncStatus(medium) {
    var msg = "ss";
    for (var playerId in room.colorMap) {
        msg += " " + playerId + " " + room.colorMap[playerId];
    }
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
        unclaimPrivateArea(socket);
    });

    // message handler
    socket.on("msg", function(msg) {
        var cmd = msg.substring(0, 2);
        if (cmd == "rp") {
            var privateArea = parseInt(msg.substring("rp ".length));
            if (!(privateArea in unavailablePrivateAreas)) {
                unclaimPrivateArea(socket);
                socket.privateArea = privateArea;
                unavailablePrivateAreas[privateArea] = 1;
                emit(io, "cp " + privateArea + " " + socket.playerId);
            }
        } else if (cmd == "up") {
            unclaimPrivateArea(socket);
        } else {
            coms.parseMessage(room, msg);
            emit(socket.broadcast, msg);
        }
    });
});

// listen for http connections
http.listen(port, function() {
    console.log("listening on *:" + port)
});

