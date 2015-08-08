// setup
var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var sockets = [];
setInterval(requestStatusReport, 10000);

// link files
app.use("/scripts", express.static(__dirname + "/scripts"));
app.use("/imgs", express.static(__dirname + "/imgs"));
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

// connection handler
io.on("connection", function(socket) {
    // handle a connection
    emit(socket.broadcast, "u+");
    requestStatusReport();
    sockets.push(socket);

    // disconnect handler
    socket.on("disconnect", function() {
        emit(socket.broadcast, "u-");
    });

    // message handler
    socket.on("msg", function(msg) {
        emit(socket.broadcast, msg);
    });
});

// listen for http connections
http.listen(8080, function() {
    console.log("listening on *:8080")
});

