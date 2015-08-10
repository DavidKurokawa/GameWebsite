// TODO: implement a context-menu that lets me shuffle, form a deck, and flip a bunch of cards
// TODO: make sure I'm dealing with e.clientX/Y and mouseX/Y well
// TODO: there are some obvious issues with timing and the states can get a bit out of whack (not sure if this should be fixed?)
// TODO: fix that the card.select/unselect/toggleSelected functions don't redraw the private area
// TODO: maybe make it so that the private areas can shut off some of their doors?
// TODO: maybe reimplement shuffling so that when you have a bunch of cards, they trade locations but retain the depths at the other location --- that way when we shuffle a deck it makes more sense
// TODO: in general, it's annoying that you can be looking at some cards, and then if you click on one it covers everything behind it

// initialize
function initialize() {
    // set up cards
    function fullDeck() {
        var ret = [];
        var x = 10;
        for (var suit of ["S", "H", "C", "D"]) {
            for (var rank of ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]) {
                ret.push(new Card(rank + suit, x, 10));
                x += 20;
            }
        }
        return ret;
    }
    var cardMap = fullDeck();
    for (var i = 0; i < cardMap.length; ++i) {
        cardMap[i].id = i;
    }

    // start room
    var room = new Room("canvas", cardMap);
}
