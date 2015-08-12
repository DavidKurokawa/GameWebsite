// initialize with the provided deck
function initialize(deck) {
    // start room
    for (var i = 0; i < deck.length; ++i) {
        deck[i].id = i;
    }
    var deckButtonWrapper = document.getElementById("deck-button-wrapper");
    document.body.removeChild(deckButtonWrapper);
    var canvas = document.createElement("canvas");
    canvas.id = "game-room";
    canvas.width = 1200;
    canvas.height = 900;
    document.body.appendChild(canvas);
    new Room(canvas.id, deck);
}

// initialize with a standard deck
function initializeStandard() {
    var ret = [];
    var x = 10;
    for (var suit of ["S", "H", "C", "D"]) {
        for (var rank of ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]) {
            ret.push(new Card("/imgs/standard/" + rank + suit + ".png",
                              "/imgs/standard/big_" + rank + suit + ".png",
                              "/imgs/standard/back.jpeg",
                              "/imgs/standard/big_back.jpeg",
                              x,
                              10,
                              100,
                              145));
            x += 20;
        }
    }
    initialize(ret);
}

// initialize with a Sushi Go deck
function initializeSushiGo() {
    var ret = [];
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
                ret.push(new Card("/imgs/sushi_go/" + type + ".png",
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
    initialize(ret);
}
