(function(context) {
    // setup
    var moduleInitializer = typeof exports === "undefined"
            ? document
            : require(__dirname + "/initializer");

    // server to communicate
    context.Server = function(isServer, room) {
        this.isServer = isServer;
        if (!isServer) {
            var namespace = window.location.pathname;
            console.log("namespace = " + namespace);
            var socket = io(namespace);
            var that = this;
            socket.on("c", function(msg) { that.parseChatMessage(room.playerMap, msg); });
            $("#send-box").submit(function() {
                var msg = $("#message-to-send").val();
                if (msg.trim().length > 0) {
                    that.sendChatMessage(msg);
                    $("#message-to-send").val("");
                }
                return false;
            });
            socket.on("i", function(msg) { that.parseInstruction(room, msg); });
        }

        // send a chat message
        this.sendChatMessage = function(msg) {
            socket.emit("c", msg);
        }

        // send an instruction
        this.sendInstruction = function(msg) {
            socket.emit("i", msg);
        }

        // parse an incoming chat message
        this.parseChatMessage = function(playerMap, msg) {
            var playerId = msg.playerId;
            var playerName = playerMap[playerId].name;
            var playerColor = playerMap[playerId].color;
            var toOutput = playerName + " says: " + msg.content;
            this.outputChatMessage(toOutput, playerColor);
        }

        // output an actual message in the chat box
        this.outputChatMessage = function(msg, color) {
            var receivedBox = $("#received-box");
            receivedBox.append($("<li>").text(msg).css("color", color));
            receivedBox.stop().animate({
                scrollTop: receivedBox[0].scrollHeight
            }, 200);
        }

        // parse an incoming instruction --- generally the instructions come in a
        // very concise format for speed purposes and therefore do not even use JSON
        this.parseInstruction = function(room, msg) {
            var split = msg.split(" ");
            var cmd = split[0];
            if (cmd == "m") {
                var playerId = parseInt(split[1]);
                var x = parseInt(split[2]);
                var y = parseInt(split[3]);
                room.cards.forEach(function(card) {
                    if (playerId in card.selectors) {
                        var newX = x - card.selectors[playerId]["x"];
                        var newY = y - card.selectors[playerId]["y"];
                        card.move(newX, newY, false);
                    }
                });
                room.redraw(false);
            } else if (cmd == "do") {
                var playerId = parseInt(split[1]);
                var x = parseInt(split[2]);
                var y = parseInt(split[3]);
                room.cards.forEach(function(card) {
                    if (playerId in card.selectors) {
                        card.setDraggingOffsetFor(playerId, x - card.locX, y - card.locY);
                    }
                });
            } else if (cmd == "am") {
                var cardId = parseInt(split[1]);
                var x = parseInt(split[2]);
                var y = parseInt(split[3]);
                room.cardMap[cardId].move(x, y, false);
            } else if (cmd == "se") {
                var playerId = parseInt(split[1]);
                var cardId = split[2];
                room.cardMap[cardId].selectedBy(playerId);
            } else if (cmd == "us") {
                var playerId = parseInt(split[1]);
                var cardId = split[2];
                room.cardMap[cardId].unselectedBy(playerId);
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
                var playerId = parseInt(split[1]);
                var playerName = split[2];
                var playerColor = split[3];
                room.playerMap[playerId] = {
                    "name": playerName,
                    "color": playerColor,
                };
                if (!this.isServer) {
                    this.outputChatMessage(playerName + " has joined!", playerColor);
                }
            } else if (cmd == "u-") {
                var playerId = parseInt(split[1]);
                delete room.playerMap[playerId];
            } else if (cmd == "ss") {
                var i = 1;
                while (i < split.length && split[i] != "#") {
                    var playerId = parseInt(split[i++]);
                    var playerName = split[i++];
                    var playerColor = split[i++];
                    room.playerMap[playerId] = {
                        "name": playerName,
                        "color": playerColor,
                    };
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
                var toClaim = room.privateAreas[parseInt(split[1])];
                if (!toClaim.isClaimed()) {
                    var playerId = parseInt(split[2]);
                    room.privateAreas.forEach(function(privateArea) {
                        if (playerId == privateArea.playerId) {
                            privateArea.unclaim();
                        }
                    });
                    toClaim.claim(playerId);
                }
            } else if (cmd == "up") {
                var toUnclaim = room.privateAreas[parseInt(split[1])];
                var playerId = parseInt(split[2]);
                if (playerId == toUnclaim.playerId) {
                    toUnclaim.unclaim();
                }
            } else if (cmd == "id") {
                room.playerId = parseInt(split[1]);
                room.playerColor = split[2];
                room.playerMap[room.playerId] = {
                    "name": room.playerName,
                    "color": room.playerColor,
                };
                var toSend = "u+ " + room.playerId + " " + room.playerName + " " + room.playerColor;
                this.sendInstruction(toSend);
            } else if (cmd == "gm") {
                var game = split[1];
                var deck;
                if (game == "standard") {
                    deck = moduleInitializer.standardDeck(false);
                } else {
                    deck = moduleInitializer.sushiGoDeck(false);
                }
                room.initializeDeck(deck);
            } else if (cmd == "rf") {
                alert("Unfortunately, the room is full. Please try another room.");
            }
        }
    };
})(typeof exports === "undefined" ? document : exports);
