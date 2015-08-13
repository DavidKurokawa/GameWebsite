// server communicator via Socket.IO
function setUpServer(room) {
    var socket = io();
    socket.on("msg", function(msg) { document.parseMessage(room, msg); });
    return function(msg) {
        socket.emit("msg", msg);
    };
};

(function(context) {
    // parse an incoming message
    context.parseMessage = function(room, msg) {
        var split = msg.split(" ");
        var cmd = split[0];
        if (cmd == "m") {
            var color = split[1];
            var x = parseInt(split[2]);
            var y = parseInt(split[3]);
            room.cards.forEach(function(card) {
                if (color in card.selectors) {
                    var newX = x - card.selectors[color]["x"];
                    var newY = y - card.selectors[color]["y"];
                    card.move(newX, newY, false);
                }
            });
            room.redraw(false);
        } else if (cmd == "do") {
            var color = split[1];
            var x = parseInt(split[2]);
            var y = parseInt(split[3]);
            room.cards.forEach(function(card) {
                if (color in card.selectors) {
                    card.setDraggingOffsetFor(color, x - card.locX, y - card.locY);
                }
            });
        } else if (cmd == "am") {
            var cardId = parseInt(split[1]);
            var x = parseInt(split[2]);
            var y = parseInt(split[3]);
            room.cardMap[cardId].move(x, y, false);
        } else if (cmd == "se") {
            var color = split[1];
            var cardId = split[2];
            room.cardMap[cardId].selectedBy(color);
        } else if (cmd == "us") {
            var color = split[1];
            var cardId = split[2];
            room.cardMap[cardId].unselectedBy(color);
        } else if (cmd == "fl") {
            var cardId = parseInt(split[1]);
            room.cardMap[cardId].flip(true);
        } else if (cmd == "rd") {
            room.redraw(false);
        } else if (cmd == "tt") {
            var cardId = parseInt(split[1]);
            room.moveCardToTop(room.cardMap[cardId], false);
        } else if (cmd == "fd") {
            var x = parseInt(split[1]);
            var y = parseInt(split[2]);
            var arr = new Array(split.length - 3);
            for (var i = 3; i < split.length; ++i)
                arr[i - 3] = room.cardMap[parseInt(split[i])];
            room.formDeck(x, y, arr, false);
        } else if (cmd == "u+") {
            console.log("A new user has joined!");
        } else if (cmd == "u-") {
            console.log("A user has left.");
        } else if (cmd == "ss") {
            for (var i = 1; i <= room.privateAreas.length; ++i) {
                if (split[i] == "#") {
                    room.privateAreas[i - 1].unclaim();
                } else {
                    room.privateAreas[i - 1].claim(split[i]);
                }
            }
            var newCards = new Array(room.cardMap.length);
            var offset = 1 + room.privateAreas.length;
            var j = 0;
            var i = offset;
            while (i < split.length) {
                var cardId = parseInt(split[i]);
                var card = room.cardMap[cardId];
                card.selectors = {};
                card.locX = parseInt(split[++i]);
                card.locY = parseInt(split[++i]);
                card.isUpPublicly = split[++i] == "1";
                while (++i < split.length && split[i].charAt(0) == "#") {
                    card.selectedBy(split[i]);
                }
                newCards[j++] = card;
            }
            room.cards = new document.DoublyLinkedList(newCards);
            room.redraw(false);
        } else if (cmd == "cp") {
            var privateArea = room.privateAreas[parseInt(split[1])];
            var color = split[2];
            if (color == room.color) {
                room.privateArea = privateArea;
            }
            privateArea.claim(color);
        } else if (cmd == "up") {
            var privateArea = room.privateAreas[parseInt(split[1])];
            if (privateArea.isMine()) {
                delete room.privateArea;
            }
            privateArea.unclaim();
        } else if (cmd == "id") {
            room.color = split[1];
        }
    };
})(typeof exports === "undefined" ? document : exports);
