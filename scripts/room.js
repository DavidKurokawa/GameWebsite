// game room
function Room(canvasId, cardMap) {
    // constructor
    this.color;
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.cardMap = cardMap;
    this.send = setUpServer(this);
    var claimAreaSize = 15;
    this.privateAreas = [
        new PrivateArea(0,
                        this,
                        0,
                        0,
                        this.width/2,
                        this.height/2,
                        0,
                        0,
                        claimAreaSize,
                        claimAreaSize),
        new PrivateArea(1,
                        this,
                        this.width/2,
                        0,
                        this.width,
                        this.height/2,
                        this.width - claimAreaSize,
                        0,
                        this.width,
                        claimAreaSize),
        new PrivateArea(2,
                        this,
                        0,
                        this.height/2,
                        this.width/2,
                        this.height,
                        0,
                        this.height - claimAreaSize,
                        claimAreaSize,
                        this.height),
        new PrivateArea(3,
                        this,
                        this.width/2,
                        this.height/2,
                        this.width,
                        this.height,
                        this.width - claimAreaSize,
                        this.height - claimAreaSize,
                        this.width,
                        this.height)
    ];
    this.cards = new DoublyLinkedList(cardMap);
    this.displayed;
    // TODO: this is pretty hacky!
    // we do this waiting for a few purposes:
    // 1. we need to get the state from another connection if there are others
    // 2. the images need to be downloaded from the server
    // 3. we need to know the id of the room to determine the private area
    this.initialized = false;
    var that = this;
    setTimeout(function() {
        for (var card of that.cardMap) {
            card.setRoom(that, that.privateArea);
        }
        that.initialized = true;
        that.redraw(false);
        setUpInputListeners(that);
    }, 2000);

    // get the x offset of the room
    this.offsetX = function() {
        return this.canvas.getBoundingClientRect().left;
    }
    
    // get the y offset of the room
    this.offsetY = function() {
        return this.canvas.getBoundingClientRect().top;
    }

    // redraw the room
    this.redraw = function(report) {
        if (this.initialized) {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.cards.foreach(function(card) {
                card.draw();
            });
            this.redrawPrivateAreas();
            if (report) {
                this.send("rd");
            }
            if (typeof this.displayed !== "undefined") {
                var factor = Math.min(this.width/this.displayed.width,
                                      this.height/this.displayed.height);
                var w = factor*this.displayed.width;
                var h = factor*this.displayed.height;
                var x = (this.width - w)/2;
                var y = (this.height - h)/2;
                this.ctx.drawImage(this.displayed, x, y, w, h);
            }
        }
    }

    // redraw the private areas
    this.redrawPrivateAreas = function() {
        for (var curr of this.privateAreas) {
            curr.draw();
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

    // get the private area associated with the claim area the mouse is currently over (if any)
    this.getPrivateAreaClaimAreaAt = function(x, y) {
        for (var privateArea of this.privateAreas) {
            if (privateArea.isXYInsideClaimArea(x, y)) {
                return privateArea;
            }
        }
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
                card.flip(false);
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
        var selected = this.getSelectedCards();
        // TODO: probably should do this in a more OOP way!
        var n = selected.length;
        var xs = new Array(n);
        var ys = new Array(n);
        var perm = new Array(n);
        for (var i = 0; i < n; ++i) {
            xs[i] = selected[i].locX;
            ys[i] = selected[i].locY;
            perm[i] = i;
        }
        this.shuffle(perm);
        for (var i = 0; i < n; ++i) {
            var j = perm[i];
            selected[j].move(xs[i], ys[i], true);
            this.moveCardToTop(selected[j], true);
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
        var cardsNotAlreadyDeckifying = [];
        for (var card of cardsToDeckify) {
            if (!card.isMovingSlowly) {
                card.isMovingSlowly = true;
                cardsNotAlreadyDeckifying.push(card);
            }
        }
        setTimeout(that.moveCardsSlowly(x, y, cardsNotAlreadyDeckifying), 0);
        if (report) {
            var msg = "fd " + x + " " + y;
            for (var card of cardsNotAlreadyDeckifying) {
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
                for (var card of cardsToMove) {
                    card.isMovingSlowly = false;
                }
            }
        }, 1);
    }

    this.display = function(img) {
        if (this.displayed != img) {
            this.displayed = img;
            this.redraw(false);
        }
    }

    this.undisplay = function() {
        delete this.displayed;
        this.redraw(false);
    }
}
