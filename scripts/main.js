// TODO: implement a context-menu that lets me shuffle, form a deck, and flip a bunch of cards
// TODO: make sure I'm dealing with e.clientX/Y and mouseX/Y well
// TODO: there are some obvious issues with timing and the states can get a bit out of whack (not sure if this should be fixed?)
// TODO: fix that the card.select/unselect/toggleSelected functions don't redraw the private area
// TODO: maybe make it so that the private areas can shut off some of their doors?
// TODO: maybe reimplement shuffling so that when you have a bunch of cards, they trade locations but retain the depths at the other location --- that way when we shuffle a deck it makes more sense
// TODO: in general, it's annoying that you can be looking at some cards, and then if you click on one it covers everything behind it

// initialize
function initialize() {
    // standard deck
    function standardDeck() {
        var ret = [];
        var x = 10;
        for (var suit of ["S", "H", "C", "D"]) {
            for (var rank of ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]) {
                ret.push(new Card("./imgs/standard/" + rank + suit + ".png",
                                  "./imgs/standard/back.jpg",
                                  x,
                                  10,
                                  100,
                                  145));
                x += 20;
            }
        }
        return ret;
    }

    // Sushi Go deck
    function sushiGoDeck() {
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
                    ret.push(new Card("./imgs/sushi_go/" + type + ".png",
                                      "./imgs/sushi_go/back.png",
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
        return ret;
    }

    // start room
    var cardMap = sushiGoDeck();
    for (var i = 0; i < cardMap.length; ++i) {
        cardMap[i].id = i;
    }
    new Room("canvas", cardMap);
}
