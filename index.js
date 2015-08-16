var port = 8080;
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var initializer = require(__dirname + "/js/initializer");
var coms = require(__dirname + "/js/server");
var rooms = {};

app.use(bodyParser());
app.use("/css", express.static(__dirname + "/css"));
app.use("/imgs", express.static(__dirname + "/imgs"));
app.use("/js", express.static(__dirname + "/js"));
app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.post("/", function(req, res) {
    // set up room
    var game = req.body.game;
    var rand = Math.floor(1e8*Math.random());
    var deck;
    if (game == "standard") {
        deck = initializer.standardDeck(true);
    } else {
        deck = initializer.sushiGoDeck(true);
    }
    var room = initializer.initializeRoom(true);
    room.initializeDeck(deck);
    var path = "/r/" + rand;
    var namespace = io.of(path);
    var sockets = [];
    var availableColors = ["#FF8C00", "#FF0000", "#00DD00", "#0000FF"];
    app.get(path, function(req, res) {
        res.sendFile(__dirname + "/room.html");
    });
    res.redirect(path);

    var activeConnections = 0;
    var closeJobId;
    ifRoomIsNotUsedCloseIt();

    // close the room if it is no longer in use
    function ifRoomIsNotUsedCloseIt() {
        if (closeJobId !== "undefined") {
            clearTimeout(closeJobId);
        }
        closeJobId = setTimeout(function() {
            if (activeConnections == 0) {
                delete io.nsps[path];
                var routes = app._router.stack;
                for (var i = 0; i < routes.length; ++i) {
                    if (routes[i].path == path) {
                        routes.splice(i, 1);
                        break;
                    }
                }
                console.log("namespace " + path + " closed");
            }
        }, 5*60*1000);
    }

    // emit the given message to the given medium
    function emit(medium, msg) {
        console.log("m: " + msg);
        medium.emit("m", msg);
    }

    // sync the status of the provided medium
    function syncStatus(medium) {
        var msg = "ss";
        sockets.forEach(function(socket) {
            if (typeof socket.playerId !== "undefined") {
                msg += " " + socket.playerId + " " + socket.color;
            }
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
    namespace.on("connection", function(socket) {
        // handle a connection
        ++activeConnections;
        socket.color = availableColors.pop(); // TODO: this will fail if there are too many connections
        socket.playerId = sockets.length;
        var newUserSuffix = socket.playerId + " " + socket.color;
        emit(socket, "gm " + game);
        emit(socket, "id " + newUserSuffix);
        emit(socket.broadcast, "u+ " + newUserSuffix);
        syncStatus(socket);
        sockets.push(socket);

        // disconnect handler
        socket.on("disconnect", function() {
            if (--activeConnections == 0) {
                ifRoomIsNotUsedCloseIt();
            }
            availableColors.push(socket.color);
            room.privateAreas.forEach(function(privateArea) {
                if (socket.playerId == privateArea.playerId) {
                    emit(socket.broadcast, "up " + privateArea.id + " " + privateArea.playerId);
                    privateArea.unclaim();
                }
            });
            emit(socket.broadcast, "u- " + socket.playerId);
            delete socket.playerId;
            delete socket.color;
        });

        // message handler
        socket.on("m", function(msg) {
            var cmd = msg.substr(0, 2);
            coms.parseMessage(room, msg);
            // TODO: basing the medium based off the cmd is hacky, better fix this soon!
            emit(cmd == "cp" || cmd == "up" ? namespace : socket.broadcast, msg);
        });
    });
});

// listen for http connections
http.listen(port, function() {
    console.log("listening on *:" + port)
});
