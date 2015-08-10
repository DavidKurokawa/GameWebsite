// TODO: implement a context-menu that lets me shuffle, form a deck, and flip a bunch of cards
// TODO: make sure I'm dealing with e.clientX/Y and mouseX/Y well
// TODO: there are some obvious issues with timing and the states can get a bit out of whack (not sure if this should be fixed?)
// TODO: fix that the card.select/unselect/toggleSelected functions don't redraw the private area

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
    // TODO: this is pretty hacky!
    setTimeout(function() { room.redraw(false); }, 2000);
}
