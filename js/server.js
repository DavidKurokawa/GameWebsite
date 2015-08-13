// server communicator via Socket.IO
function setUpServer(room) {
    var socket = io();
    socket.on("m", function(msg) { document.parseMessage(room, msg); });
    return function(msg) {
        socket.emit("m", msg);
    };
};

(function(context) {
    // parse an incoming message
    context.parseMessage = function(room, msg) {
        var split = msg.split(" ");
        var cmd = split[0];
        if (cmd == "m") {
            var id = parseInt(split[1]);
            var x = parseInt(split[2]);
            var y = parseInt(split[3]);
            room.cards.forEach(function(card) {
                if (id in card.selectors) {
                    var newX = x - card.selectors[id]["x"];
                    var newY = y - card.selectors[id]["y"];
                    card.move(newX, newY, false);
                }
            });
            room.redraw(false);
        } else if (cmd == "do") {
            var id = parseInt(split[1]);
            var x = parseInt(split[2]);
            var y = parseInt(split[3]);
            room.cards.forEach(function(card) {
                if (id in card.selectors) {
                    card.setDraggingOffsetFor(id, x - card.locX, y - card.locY);
                }
            });
        } else if (cmd == "am") {
            var cardId = parseInt(split[1]);
            var x = parseInt(split[2]);
            var y = parseInt(split[3]);
            room.cardMap[cardId].move(x, y, false);
        } else if (cmd == "se") {
            var id = parseInt(split[1]);
            var cardId = split[2];
            room.cardMap[cardId].selectedBy(id);
        } else if (cmd == "us") {
            var id = parseInt(split[1]);
            var cardId = split[2];
            room.cardMap[cardId].unselectedBy(id);
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
            var id = parseInt(split[1]);
            var color = split[2];
            room.colorMap[id] = color;
        } else if (cmd == "u-") {
            console.log("A user has left.");
        } else if (cmd == "ss") {
            var i = 1;
            while (i < split.length && split[i] != "#") {
                var id = parseInt(split[i++]);
                var color = split[i++];
                room.colorMap[id] = color;
            }
            ++i;
            for (var j = 0; j < room.privateAreas.length; ++j) {
                if (split[i] == "#") {
                    room.privateAreas[j].unclaim();
                } else {
                    room.privateAreas[j].claim(parseInt(split[i]));
                }
                ++i;
            }
            var newCards = new Array(room.cardMap.length);
            for (var j = 0; i < split.length; ++j) {
                var cardId = parseInt(split[i]);
                var card = room.cardMap[cardId];
                card.selectors = {};
                card.locX = parseInt(split[++i]);
                card.locY = parseInt(split[++i]);
                card.isUpPublicly = split[++i] == "1";
                while (++i < split.length && split[i] != "#") {
                    card.selectedBy(parseInt(split[i]));
                }
                newCards[j] = card;
                ++i;
            }
            room.cards = new document.DoublyLinkedList(newCards);
            room.redraw(false);
        } else if (cmd == "cp") {
            var privateArea = room.privateAreas[parseInt(split[1])];
            var id = parseInt(split[2]);
            if (id == room.id) {
                room.privateArea = privateArea;
            }
            privateArea.claim(id);
        } else if (cmd == "up") {
            var privateArea = room.privateAreas[parseInt(split[1])];
            if (privateArea.isMine()) {
                delete room.privateArea;
            }
            privateArea.unclaim();
        } else if (cmd == "id") {
            room.id = parseInt(split[1]);
            room.color = split[2];
            room.colorMap[room.id] = room.color;
        }
    };
})(typeof exports === "undefined" ? document : exports);
