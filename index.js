var port = 8080;
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var initializer = require(__dirname + "/js/initializer");
var server = require(__dirname + "/js/server");
var coms = new server.Server(true);
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
    var room = initializer.initializeAfterName(true);
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
    
    // emit the given chat message to the given medium
    function emitChatMessage(medium, msg) {
        console.log("c: " + msg.playerId + ": " + msg.content);
        medium.emit("c", msg);
    }

    // emit the given instruction to the given medium
    function emitInstruction(medium, msg) {
        console.log("i: " + msg);
        medium.emit("i", msg);
    }

    // sync the status of the provided medium
    function syncStatus(medium) {
        var msg = "ss";
        sockets.forEach(function(socket) {
            var playerId = socket.playerId;
            if (typeof playerId !== "undefined") {
                var playerName = playerId in room.playerMap ? room.playerMap[playerId].name : "---";
                msg += " " + playerId + " " + playerName + " " + socket.playerColor;
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
        emitInstruction(medium, msg);
    }

    // connection handler
    namespace.on("connection", function(socket) {
        // handle a connection
        if (availableColors.length == 0) {
            emitInstruction(socket, "rf");
            socket.disconnect();
            return;
        }
        ++activeConnections;
        socket.playerColor = availableColors.pop();
        socket.playerId = sockets.length;
        emitInstruction(socket, "gm " + game);
        emitInstruction(socket, "id " + socket.playerId + " " + socket.playerColor);
        syncStatus(socket);
        sockets.push(socket);

        // disconnect handler
        socket.on("disconnect", function() {
            if (--activeConnections == 0) {
                ifRoomIsNotUsedCloseIt();
            }
            availableColors.push(socket.playerColor);
            room.privateAreas.forEach(function(privateArea) {
                if (socket.playerId == privateArea.playerId) {
                    emitInstruction(socket.broadcast, "up " + privateArea.id + " " + privateArea.playerId);
                    privateArea.unclaim();
                }
            });
            emitInstruction(socket.broadcast, "u- " + socket.playerId);
            delete socket.playerId;
            delete socket.playerColor;
        });

        // chat message handler
        socket.on("c", function(msg) {
            var toSend = {
                "playerId": socket.playerId,
                "content": msg,
            };
            emitChatMessage(namespace, toSend);
        });

        // instruction handler
        socket.on("i", function(msg) {
            var cmd = msg.substr(0, 2);
            coms.parseInstruction(room, msg);
            // TODO: basing the medium based off the cmd is hacky, better fix this soon!
            emitInstruction(cmd == "cp" || cmd == "up" ? namespace : socket.broadcast, msg);
        });
    });
});

// listen for http connections
http.listen(port, function() {
    console.log("listening on *:" + port)
});
