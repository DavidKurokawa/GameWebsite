(function(context) {
    // setup
    var moduleCard;
    var moduleRoom;
    if (typeof exports === "undefined") {
        moduleCard = document;
        moduleRoom = document;
    } else {
        moduleCard = require(__dirname + "/card");
        moduleRoom = require(__dirname + "/room");
    }

    // initialize
    context.initialize = function(isServer) {
        // get the player's name
        var playerName;
        if (!isServer) {
            var attempted = false;
            var maxLength = 16;
            while (typeof playerName === "undefined"
                    || playerName.length > maxLength
                    || !/^[a-z0-9]+$/i.test(playerName)) {
                var msg = "Enter your name (less than " + maxLength + " alphanumeric characters):"
                if (attempted) {
                    msg = "That was not a valid name.\n\n" + msg;
                }
                playerName = prompt(msg);
                attempted = true;
            }
        }
        // initialize the room
        var canvas;
        var canvasId = "game-room";
        var canvasWidth = 1200;
        var canvasHeight = 900;
        if (!isServer) {
            canvas = document.getElementById(canvasId);
            canvas.id = canvasId;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            canvas.onselectstart = function() { return false; }
        }
        return new moduleRoom.Room(isServer, playerName, canvas, canvasWidth, canvasHeight);
    };

    // create a standard deck
    context.standardDeck = function(isServer) {
        var deck = [];
        var x = 10;
        ["S", "H", "C", "D"].forEach(function(suit) {
            ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"].forEach(function(rank) {
                deck.push(new moduleCard.Card(isServer,
                                              "/imgs/standard/" + rank + suit + ".png",
                                              "/imgs/standard/big_" + rank + suit + ".png",
                                              "/imgs/standard/back.jpeg",
                                              "/imgs/standard/big_back.jpeg",
                                              x,
                                              10,
                                              100,
                                              145));
                x += 20;
            });
        });
        ["R", "B"].forEach(function(color) {
            deck.push(new moduleCard.Card(isServer,
                                          "/imgs/standard/" + color + "J.png",
                                          "/imgs/standard/big_" + color + "J.png",
                                          "/imgs/standard/back.jpeg",
                                          "/imgs/standard/big_back.jpeg",
                                          x,
                                          10,
                                          100,
                                          145));
            x += 20;
        });
        return deck;
    };

    // create a Sushi Go Deck
    context.sushiGoDeck = function(isServer) {
        var deck = [];
        var x = 10;
        var y = 10;
        var types = {"chopsticks": 4,
                     "dumpling": 14,
                     "maki1": 6,
                     "maki2": 12,
                     "maki3": 8,
                     "nigiri1": 5,
                     "nigiri2": 10,
                     "nigiri3": 5,
                     "pudding": 10,
                     "sashimi": 14,
                     "tempura": 14,
                     "wasabi": 6};
        var total = 0;
        for (var type in types) {
            if (types.hasOwnProperty(type)) {
                for (var i = 0; i < types[type]; ++i) {
                    deck.push(new moduleCard.Card(isServer,
                                                  "/imgs/sushi_go/" + type + ".png",
                                                  "/imgs/sushi_go/big_" + type + ".png",
                                                  "/imgs/sushi_go/back.png",
                                                  "/imgs/sushi_go/big_back.png",
                                                  x,
                                                  y,
                                                  100,
                                                  156));
                    x += 20;
                    if (++total == 54) {
                        x = 10;
                        y = 180;
                    }
                }
            }
        }
        return deck;
    };
})(typeof exports === "undefined" ? document : exports);
