// setup
var port = 8080;
var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var sockets = [];
var unavailablePrivateAreas = {};
var availableColors = ["FF8C00", "#FF0000", "#00DD00", "#0000FF"];
setInterval(requestStatusReport, 10000);

// link files
app.use("/css", express.static(__dirname + "/css"));
app.use("/imgs", express.static(__dirname + "/imgs"));
app.use("/scripts", express.static(__dirname + "/scripts"));
app.get("/", function(req, res) {
    res.sendfile("index.html");
});

// emit the given message to the given medium
function emit(medium, msg) {
    console.log("msg: " + msg);
    medium.emit("msg", msg);
}

// request a status report from some active connection
function requestStatusReport() {
    for (var i = 0; i < sockets.length; ++i) {
        if (sockets[i].connected) {
            emit(sockets[i], "rs");
            break;
        }
    }
}

// unclaim the provided socket's private area
function unclaimPrivateArea(socket) {
    if (typeof socket.privateArea !== "undefined") {
        emit(io, "up " + socket.privateArea);
        delete unavailablePrivateAreas[socket.privateArea];
        delete socket.privateArea;
    }
}

// connection handler
io.on("connection", function(socket) {
    // handle a connection
    socket.color = availableColors.pop(); // TODO: this will fail if there are too many connections
    emit(socket, "id " + socket.color);
    emit(socket.broadcast, "u+");
    requestStatusReport();
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
                emit(io, "cp " + privateArea + " " + socket.color);
            }
        } else if (cmd == "up") {
            unclaimPrivateArea(socket);
        } else {
            emit(socket.broadcast, msg);
        }
    });
});

// listen for http connections
http.listen(port, function() {
    console.log("listening on *:" + port)
});

