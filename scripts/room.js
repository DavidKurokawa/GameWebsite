// game room
function Room(canvasId, cardMap) {
    // constructor
    var canvas = document.getElementById(canvasId);
    this.ctx = canvas.getContext("2d");
    var offset = $("#" + canvasId).offset();
    this.offsetX = offset.left;
    this.offsetY = offset.top;
    this.width = canvas.width;
    this.height = canvas.height;
    this.cardMap = cardMap;
    this.send = setUpServer(this);
    this.privateAreas = [
        new PrivateArea(this.ctx, 0, this.height/2, this.width/2, this.height),
        new PrivateArea(this.ctx, this.width/2, this.height/2, this.width, this.height),
    ];
    for (var card of cardMap) {
        card.setRoom(this);
    }
    this.cards = new DoublyLinkedList(cardMap);
    setUpInputListeners(this);

    // redraw the room
    this.redraw = function(report) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.cards.foreach(function(card) {
            card.draw();
        });
        for (var privateArea of this.privateAreas) {
            privateArea.draw();
        }
        if (report) {
            this.send("rd");
        }
    }

    // get the card the mouse is currently over
    this.getTopmostCardAt = function(x, y) {
        var ret;
        this.cards.foreach(function(card) {
            if (card.isXYInside(x, y)) {
                ret = card;
            }
        });
        return ret;
    }

    // get all selected cards
    this.getSelectedCards = function() {
        var ret = [];
        this.cards.foreach(function(card) {
            if (card.isSelected) {
                ret.push(card);
            }
        });
        return ret;
    }

    // unselect all cards
    this.unselectAll = function() {
        this.cards.foreach(function(card) {
            card.unselect();
        });
    }

    // flip the selected cards
    this.flipSelected = function() {
        this.cards.foreach(function(card) {
            if (card.isSelected) {
                card.flip(true);
            }
        });
        this.redraw(true);
    }

    // move given card to top (i.e. last to be drawn)
    this.moveCardToTop = function(card, report) {
        this.cards.moveToTail(card.node);
        if (report) {
            this.send("tt " + card.id);
        }
    }

    // randomly reorder the level of the selected cards
    this.reorderSelected = function() {
        var selected = [];
        this.cards.foreach(function(card) {
            if (card.isSelected) {
                selected.push(card);
            }
        });
        this.shuffle(selected);
        for (var card of selected) {
            this.moveCardToTop(card, true);
        }
        this.redraw(true);
    }

    // Knuth-shuffle an array
    this.shuffle = function(arr) {
        for (var i = arr.length; i > 0; --i) {
            var j = Math.floor(Math.random()*i);
            var t = arr[i - 1];
            arr[i - 1] = arr[j];
            arr[j] = t;
        }
    }

    // form a deck with the given cards at the given coordinates
    this.formDeck = function(x, y, cardsToDeckify, report) {
        var that = this;
        setTimeout(that.moveCardsSlowly(x, y, cardsToDeckify), 0);
        if (report) {
            var msg = "fd " + x + " " + y;
            for (var card of cardsToDeckify) {
                msg += " " + card.id;
            }
            this.send(msg);
        }
    }

    // move given cards slowly to the given coordinates
    this.moveCardsSlowly = function(x, y, cardsToMove) {
        var SPEED = 20;
        var that = this;
        var job = setInterval(function() {
            var done = true;
            for (var card of cardsToMove) {
                var cardX = card.locX;
                var cardY = card.locY;
                if (x != cardX || y != cardY) {
                    var dist = Math.sqrt((x - cardX)*(x - cardX) + (y - cardY)*(y - cardY));
                    var newX = x;
                    var newY = y;
                    if (dist > SPEED) {
                        newX = cardX + SPEED*(x - cardX)/dist;
                        newY = cardY + SPEED*(y - cardY)/dist;
                    }
                    card.move(newX, newY, false);
                    done = done && cardX == card.locX && cardY == card.locY;
                }
            }
            that.redraw(false);
            if (done) {
                clearInterval(job);
            }
        }, 1);
    }
}
