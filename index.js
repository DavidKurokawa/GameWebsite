var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var numConnections = 0;

app.use("/scripts", express.static(__dirname + "/scripts"));
app.use("/imgs", express.static(__dirname + "/imgs"));
app.get("/", function(req, res) {
    res.sendfile("index.html");
});

var userConnectedStr = "user connected";
var userDisconnectedStr = "user disconnected";

io.on("connection", function(socket) {
    console.log(userConnectedStr);
    socket.broadcast.emit(userConnectedStr);
    socket.emit("msg", "identity " + numConnections);
    socket.on("disconnect", function() {
        console.log(userDisconnectedStr);
        socket.broadcast.emit("msg", userDisconnectedStr);
    });
    socket.on("msg", function(msg) {
        console.log("message: " + msg);
        socket.broadcast.emit("msg", msg);
    });
    ++numConnections;
});

http.listen(9090, function() {
    console.log("listening on *:9090");
});

