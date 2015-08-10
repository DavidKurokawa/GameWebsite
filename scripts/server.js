// server communicator via Socket.IO
function setUpServer(room) {
    // set up
    var cardMap = room.cardMap;
    var socket = io();
    socket.on("msg", function(msg) { parseMessage(msg); });

    // parse an incoming message
    function parseMessage(msg) {
        var split = msg.split(" ");
        var cmd = split[0];
        if (cmd == "mv") {
            var cardIdx = parseInt(split[1]);
            var x = parseInt(split[2]);
            var y = parseInt(split[3]);
            cardMap[cardIdx].move(x, y, false);
        } else if (cmd == "fl") {
            var cardIdx = parseInt(split[1]);
            cardMap[cardIdx].flip(false);
        } else if (cmd == "rd") {
            room.redraw(false);
        } else if (cmd == "tt") {
            var cardIdx = parseInt(split[1]);
            room.moveCardToTop(cardMap[cardIdx], false);
        } else if (cmd == "fd") {
            var x = parseInt(split[1]);
            var y = parseInt(split[2]);
            var arr = new Array(split.length - 3);
            for (var i = 3; i < split.length; ++i)
                arr[i - 3] = cardMap[parseInt(split[i])];
            room.formDeck(x, y, arr, false);
        } else if (cmd == "u+") {
            console.log("A new user has joined!");
        } else if (cmd == "u-") {
            console.log("A user has left.");
        } else if (cmd == "rs") {
            reportStatus();
        } else if (cmd == "ss") {
            for (var i = 1; i < split.length; i += 3) {
                var card = cardMap[(i - 1)/3];
                card.locX = parseInt(split[i]);
                card.locY = parseInt(split[i + 1]);
                card.isUpPublicly = split[i + 2] == "1";
            }
            room.redraw(false);
        }
    }

    // report the status of all cards
    function reportStatus() {
        var msg = "ss";
        for (var card of cardMap) {
            msg += " " + card.locX
                 + " " + card.locY
                 + " " + (card.isUpPublicly ? 1 : 0);
        }
        send(msg);
    }

    // send a message
    function send(msg) {
        socket.emit("msg", msg);
    }

    return send;
}
