// TODO: implement a context-menu that lets me shuffle, form a deck, and flip a bunch of cards
// TODO: fix the bug where Card is not a subclass of Image and therefore we can't have the correct border when we double-click
// TODO: make sure I'm dealing with e.clientX/Y and mouseX/Y well
// TODO: the mouse doesn't work well when the screen is scrolled!

// initialize
function initialize() {
    // set up socket.io
    var socket = io();
    socket.on("msg", function(msg) { parseSocketMessage(msg); });
    var identity;

    // set up canvas
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var canvasOffset = $("#canvas").offset();
    var offsetX = canvasOffset.left;
    var offsetY = canvasOffset.top;
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    var groupSelectionX;
    var groupSelectionY;
    var isGroupSelecting = false;

    // set up mouse
    var mouseX;
    var mouseY;
    var isMouseDown = false;
    var hasMouseMovedWhenDown;

    // set up cards
    function fullDeck() {
        var ret = [];
        var x = 10;
        for (suit of ["S", "H", "C", "D"]) {
            for (rank of ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]) {
                ret.push(new Card(ctx, canvasWidth, canvasHeight, x, 10, rank + suit, socket));
                x += 20;
            }
        }
        return ret;
    }
    var map = fullDeck();
    for (var i = 0; i < map.length; ++i) {
        map[i].id = i;
    }
    var cards = new DoublyLinkedList(map);
    // TODO: this is pretty hacky!
    setTimeout(function() {redrawAll(false);}, 2000);
    
    // set up listeners
    $(document).mousedown(function(e){handleMouseDown(e);});
    $(document).mousemove(function(e){handleMouseMove(e);});
    $(document).mouseup(function(e){handleMouseUp(e);});
    $(document).dblclick(function(e){handleDoubleClick(e);});
    $(document).keypress(function(e){handleKeyPress(e);});

    // parse a socket.io message
    function parseSocketMessage(msg) {
        if (msg == "user connected") {
            console.log("A new user has joined!");
        } else if (msg == "user disconnected") {
            console.log("A user has left.");
        } else {
            var split = msg.split(" ");
            if (split[0] == "mv") {
                var cardIdx = parseInt(split[1]);
                var x = parseInt(split[2]);
                var y = parseInt(split[3]);
                map[cardIdx].move(x, y, false);
            } else if (split[0] == "fl") {
                var cardIdx = parseInt(split[1]);
                map[cardIdx].flip(false);
            } else if (split[0] == "rd") {
                redrawAll(false);
            } else if (split[0] == "tt") {
                var cardIdx = parseInt(split[1]);
                moveCardToTop(map[cardIdx], false);
            } else if (split[0] == "identity") {
                identity = parseInt(split[1]);
            }
        }
    }

    // Knuth-shuffle an array
    function shuffle(arr) {
        for (var i = arr.length; i > 0; --i) {
            var j = Math.floor(Math.random()*i);
            var t = arr[i - 1];
            arr[i - 1] = arr[j];
            arr[j] = t;
        }
    }

    // redraw the canvas and all cards
    function redrawAll(report) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        cards.foreach(function(card) {
            card.draw();
        });
        if (report) {
            socket.emit("msg", "rd");
        }
    }

    // get all selected cards
    function getSelectedCards() {
        var ret = [];
        cards.foreach(function(card) {
            if (card.isSelected) {
                ret.push(card);
            }
        });
        return ret;
    }

    // move given card to top (i.e. last to be drawn)
    function moveCardToTop(card, report) {
console.log(card);
        cards.moveToTail(card.node);
        if (report) {
            socket.emit("msg", "tt " + card.id);
        }
    }

    // move selected cards slowly to the given coordinates
    function moveSelectedCardsSlowly(x, y) {
        var SPEED = 20;
        var selected = getSelectedCards();
        var job = setInterval(function() {
            var done = true;
            for (card of selected) {
                var cardX = card.img.locX;
                var cardY = card.img.locY;
                if (x != cardX || y != cardY) {
                    var dist = Math.sqrt((x - cardX)*(x - cardX) + (y - cardY)*(y - cardY));
                    var newX = x;
                    var newY = y;
                    if (dist > SPEED) {
                        newX = cardX + SPEED*(x - cardX)/dist;
                        newY = cardY + SPEED*(y - cardY)/dist;
                    }
                    card.move(newX, newY, true);
                    done = done && cardX == card.img.locX && cardY == card.img.locY;
                }
            }
            redrawAll(true);
            if (done) {
                clearInterval(job);
            }
        }, 1);
    }

    // form a deck with the selected cards at the given coordinates
    function formDeck(x, y) {
        setTimeout(function() {
            moveSelectedCardsSlowly(x, y);
        }, 0);
    }

    // randomly reorder the level of the selected cards
    function reorderSelected() {
        var selected = [];
        cards.foreach(function(card) {
            if (card.isSelected) {
                selected.push(card);
            }
        });
        shuffle(selected);
        for (var i = 0; i < selected.length; ++i) {
            moveCardToTop(selected[i], true);
        }
        redrawAll(true);
    }

    // flip the selected cards
    function flipSelected() {
        cards.foreach(function(card) {
            if (card.isSelected) {
                card.flip(true);
            }
        });
        redrawAll(true);
    }

    // get the card the mouse is currently over
    function getLookedAtCard(x, y) {
        var ret;
        cards.foreach(function(card) {
            if (card.isXYInside(x, y)) {
                ret = card;
            }
        });
        return ret;
    }

    // readjust offset of mouse location to cards for dragging
    function adjustRelativeLocations(x, y) {
        cards.foreach(function(card) {
            if (card.isSelected) {
                card.draggingOffsetX = x - card.img.locX;
                card.draggingOffsetY = y - card.img.locY;
            }
        });
    }

    // unselect all cards
    function unselectAll() {
        cards.foreach(function(card) {
            card.unselect();
        });
    }

    // handle mouse down events
    function handleMouseDown(e) {
        hasMouseMovedWhenDown = false;
        isMouseDown = true;
        var x = parseInt(e.clientX - offsetX);
        var y = parseInt(e.clientY - offsetY);
        var selected = getLookedAtCard(x, y);
        if (e.ctrlKey) {
            adjustRelativeLocations(x, y);
            // if ctrl is down and the selected card is already selected: adjust all relative locations and unselect the card
            if (selected != null && selected.isSelected) {
                selected.unselect();
            // if ctrl is down and the selected card is not already selected: adjust all relative locatiosn and select the card
            } else if (selected != null && !selected.isSelected) {
                selected.select(x, y);
            }
        } else {
            // if ctrl is up and there is no selected card: unselect everything
            if (selected == null) {
                unselectAll();
            // if ctrl is up and the selected card is already selected: adjust all relative locations and reselect the card
            } else if (selected.isSelected) {
                adjustRelativeLocations(x, y);
                selected.select(x, y);
            // if ctrl is up and the selected card is not already selected: select that card and unselect everything else
            } else {
                unselectAll();
                selected.select(x, y);
            }
        }
        if (selected != null) {
            moveCardToTop(selected, true);
        }
        // group selection
        if (selected == null) {
            isGroupSelecting = true;
            groupSelectionX = x;
            groupSelectionY = y;
        }
    }

    // handle mouse up events
    function handleMouseUp(e) {
        // check group selection
        if (isGroupSelecting) {
            cards.foreach(function(card) {
                if (card.isContainedIn(groupSelectionX, groupSelectionY, mouseX, mouseY)) {
                    card.toggleSelected();
                }
            });
            redrawAll(false);
        }
        if (!e.ctrlKey && !hasMouseMovedWhenDown) {
            var x = parseInt(mouseX - offsetX);
            var y = parseInt(mouseY - offsetY);
            unselectAll();
            var selected = getLookedAtCard(x, y);
            if (typeof selected !== 'undefined') {
                selected.select(x, y);
            }
            redrawAll(true);
        }
        // clean up
        isMouseDown = false;
        isGroupSelecting = false;
    }

    // handle mouse move events
    function handleMouseMove(e) {
        hasMouseMovedWhenDown = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
        var x = parseInt(e.clientX - offsetX);
        var y = parseInt(e.clientY - offsetY);
        if (isMouseDown && !isGroupSelecting) {
            cards.foreach(function(card) {
                if (card.isSelected) {
                    var newX = x - card.draggingOffsetX;
                    var newY = y - card.draggingOffsetY;
                    card.move(newX, newY, true);
                }
            });
        }
        if (isMouseDown) {
            redrawAll(!isGroupSelecting);
        }
        if (isGroupSelecting) {
            ctx.strokeStyle = "#FF0000";
            ctx.strokeRect(groupSelectionX, groupSelectionY, mouseX - groupSelectionX, mouseY - groupSelectionY);
        }
    }

    // handle mouse double click events
    function handleDoubleClick(e) {
        var x = e.clientX;
        var y = e.clientY;
        var selected = getLookedAtCard(x, y);
        if (selected != null) {
            selected.flip(true);
            //selected.draw();
            redrawAll(true); // TODO: perhaps I should use selected.draw() but then I have to send that to the server
        }
    }

    // handle key press events
    function handleKeyPress(e) {
        console.log("keycode = " + e.keyCode);
        if (e.keyCode == 0 || e.keyCode == 32) {
            formDeck(mouseX, mouseY);
        } else if (e.keyCode == 13) {
            reorderSelected();
        } else if (e.keyCode == 102) {
            flipSelected();
        }
    }
}
