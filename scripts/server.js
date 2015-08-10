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
            cardMap[cardIdx].flip(true);
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
            var newCards = new Array(cardMap.length);
            for (var i = 1; i < split.length; i += 4) {
                var cardId = parseInt(split[i]);
                var card = cardMap[cardId];
                card.locX = parseInt(split[i + 1]);
                card.locY = parseInt(split[i + 2]);
                card.isUpPublicly = split[i + 3] == "1";
                newCards[(i - 1)/4] = card;
            }
            room.cards = new DoublyLinkedList(newCards);
            room.redraw(false);
        } else if (cmd == "id") {
            room.id = parseInt(split[1]);
        }
    }

    // report the status of all cards
    function reportStatus() {
        var msg = "ss";
        room.cards.foreach(function(card) {
            msg += " " + card.id
                 + " " + card.locX
                 + " " + card.locY
                 + " " + (card.isUpPublicly ? 1 : 0);
        });
        send(msg);
    }

    // send a message
    function send(msg) {
        socket.emit("msg", msg);
    }

    return send;
}
