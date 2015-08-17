(function(context) {
    // setup
    var modulePrivateArea;
    var moduleLinkedList;
    if (typeof exports === "undefined") {
        modulePrivateArea = document;
        moduleLinkedList = document;
    } else {
        modulePrivateArea = require(__dirname + "/private-area");
        moduleLinkedList = require(__dirname + "/linkedlist");
    }

    // game room
    context.Room = function(isServer, playerName, canvas, canvasWidth, canvasHeight) {
        // constructor
        this.playerId;
        this.playerName = playerName;
        this.playerColor;
        this.playerMap = {};
        this.canvas = canvas;
        this.width = canvasWidth;
        this.height = canvasHeight;
        var claimAreaSize = 15;
        // TODO: this is pretty hacky!
        // we do this waiting for a few purposes:
        // 1. we need to get the state from another connection if there are others
        // 2. the images need to be downloaded from the server
        // 3. we need to know the player id of the room to determine the private area
        this.initialized = isServer;
        this.isServer = isServer;
        if (!isServer) {
            this.ctx = canvas.getContext("2d");
            var server = new document.Server(isServer, this);
            this.send = server.sendInstruction;
            var that = this;
            setTimeout(function() {
                that.initialized = true;
                that.redraw(false);
                setUpInputListeners(that);
            }, 2000);
        }
        this.privateAreas = [
            new modulePrivateArea.PrivateArea(0,
                                              this,
                                              0,
                                              0,
                                              3*this.width/4,
                                              this.height/4,
                                              0,
                                              0,
                                              claimAreaSize,
                                              claimAreaSize),
            new modulePrivateArea.PrivateArea(1,
                                              this,
                                              3*this.width/4,
                                              0,
                                              this.width,
                                              3*this.height/4,
                                              this.width - claimAreaSize,
                                              0,
                                              this.width,
                                              claimAreaSize),
            new modulePrivateArea.PrivateArea(2,
                                              this,
                                              0,
                                              this.height/4,
                                              this.width/4,
                                              this.height,
                                              0,
                                              this.height - claimAreaSize,
                                              claimAreaSize,
                                              this.height),
            new modulePrivateArea.PrivateArea(3,
                                              this,
                                              this.width/4,
                                              3*this.height/4,
                                              this.width,
                                              this.height,
                                              this.width - claimAreaSize,
                                              this.height - claimAreaSize,
                                              this.width,
                                              this.height)
        ];
        this.displayed;

        // initialize deck
        this.initializeDeck = function(deck) {
            for (var i = 0; i < deck.length; ++i) {
                deck[i].id = i;
            }
            this.cardMap = deck;
            this.cards = new moduleLinkedList.DoublyLinkedList(this.cardMap);
            var that = this;
            this.cardMap.forEach(function(card) {
                card.setRoom(that);
            });
        }

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
            if (!this.initialized || this.isServer) {
                return;
            }
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.cards.forEach(function(card) {
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

        // redraw the private areas
        this.redrawPrivateAreas = function() {
            this.privateAreas.forEach(function(curr) {
                curr.draw();
            });
        }

        // get the card the mouse is currently over
        this.getTopmostCardAt = function(x, y) {
            var ret;
            this.cards.forEach(function(card) {
                if (card.isXYInside(x, y)) {
                    ret = card;
                }
            });
            return ret;
        }

        // get the private area associated with the claim area the mouse is currently over (if any)
        this.getPrivateAreaClaimAreaAt = function(x, y) {
            var ret;
            this.privateAreas.forEach(function(privateArea) {
                if (privateArea.isXYInsideClaimArea(x, y)) {
                    ret = privateArea;
                }
            });
            return ret;
        }

        // get all selected cards
        this.getSelectedCards = function() {
            var ret = [];
            this.cards.forEach(function(card) {
                if (card.isSelected) {
                    ret.push(card);
                }
            });
            return ret;
        }

        // unselect all cards
        this.unselectAll = function() {
            this.cards.forEach(function(card) {
                card.unselect();
            });
        }

        // flip the selected cards
        this.flipSelected = function() {
            this.cards.forEach(function(card) {
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
                this.send("am " + selected[j].id + " " + xs[i] + " " + ys[i]);
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
            cardsToDeckify.forEach(function(card) {
                if (!card.isMovingSlowly) {
                    card.isMovingSlowly = true;
                    cardsNotAlreadyDeckifying.push(card);
                }
            });
            if (this.isServer) {
                while (!this.moveCardsTowards(x, y, cardsNotAlreadyDeckifying)) {}
            } else {
                var that = this;
                var job = setInterval(function() {
                    var done = that.moveCardsTowards(x, y, cardsNotAlreadyDeckifying)
                    that.redraw(false);
                    if (done) {
                        clearInterval(job);
                        cardsNotAlreadyDeckifying.forEach(function(card) {
                            card.isMovingSlowly = false;
                        });
                    }
                }, 1);
            }
            if (report) {
                var msg = "fd " + x + " " + y;
                cardsNotAlreadyDeckifying.forEach(function(card) {
                    msg += " " + card.id;
                });
                this.send(msg);
            }
        }

        // move given cards toward the given coordinates
        this.moveCardsTowards = function(x, y, cardsToMove) {
            var SPEED = 20;
            var done = true;
            cardsToMove.forEach(function(card) {
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
            });
            return done;
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
    };
})(typeof exports === "undefined" ? document : exports);
