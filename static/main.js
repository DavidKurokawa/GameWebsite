// TODO: implement a context-menu that lets me shuffle, form a deck, and flip a bunch of cards
// TODO: fix the bug where Card is not a subclass of Image and therefore we can't have the correct border when we double-click
// TODO: make sure I'm dealing with e.clientX/Y and mouseX/Y well

// initialize
function initialize() {
    // set up canvas
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var canvasOffset = $("#canvas").offset();
    var offsetX = canvasOffset.left;
    var offsetY = canvasOffset.top;
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    var shouldRender = false;
    var groupSelectionX;
    var groupSelectionY;
    var isGroupSelecting = false;

    // set up mouse
    var mouseX;
    var mouseY;
    var isMouseDown = false;
    var hasMouseMovedWhenDown = false;

    // set up cards
    function fullDeck() {
        var ret = [];
        var x = 10;
        for (suit of ["S", "H", "C", "D"]) {
            for (rank of ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]) {
                ret.push(new Card(ctx, canvasWidth, canvasHeight, x, 10, rank + suit));
                x += 20;
            }
        }
        return ret;
    }
    var cards = new DoublyLinkedList(fullDeck());
    // TODO: this is pretty hacky!
    setTimeout(redrawAll, 200);
    
    // set up listeners
    $(document).mousedown(function(e){handleMouseDown(e);});
    $(document).mousemove(function(e){handleMouseMove(e);});
    $(document).mouseup(function(e){handleMouseUp(e);});
    $(document).mouseout(function(e){handleMouseOut(e);});
    $(document).dblclick(function(e){handleDoubleClick(e);});
    $(document).keypress(function(e){handleKeyPress(e);});

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
    function redrawAll() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        cards.foreach(function(card) {
            card.draw();
        });
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
                    card.move(newX, newY);
                    done = done && cardX == card.img.locX && cardY == card.img.locY;
                }
            }
            redrawAll();
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
                selected.push(card.node);
            }
        });
        shuffle(selected);
        for (var i = 0; i < selected.length; ++i) {
            cards.moveToTail(selected[i]);
        }
        redrawAll();
    }

    // flip the selected cards
    function flipSelected() {
        cards.foreach(function(card) {
            if (card.isSelected) {
                card.flip();
            }
        });
        redrawAll();
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
        shouldRender = true;
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
            cards.moveToTail(selected.node);
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
        }
        if (!e.ctrlKey && !hasMouseMovedWhenDown) {
            var x = parseInt(mouseX - offsetX);
            var y = parseInt(mouseY - offsetY);
            unselectAll();
            var selected = getLookedAtCard(x, y);
            if (typeof selected !== 'undefined') {
                selected.select(x, y);
            }
        }
        // clean up
        shouldRender = false;
        isMouseDown = false;
        isGroupSelecting = false;
        redrawAll();
    }

    // handle mouse out events
    function handleMouseOut(e) {
        // user has left the canvas, so clear the drag flag
        //shouldRender = false;
        //isMouseDown = false;
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
                    card.move(x - card.draggingOffsetX, y - card.draggingOffsetY);
                }
            });
        }
        if (shouldRender) {
            redrawAll();
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
            selected.flip();
            selected.draw();
        }
    }

    // handle key press events
    function handleKeyPress(e) {
        console.log(e.keyCode);
        if (e.keyCode == 0 || e.keyCode == 32) {
            formDeck(mouseX, mouseY);
        } else if (e.keyCode == 13) {
            reorderSelected();
        } else if (e.keyCode == 102) {
            flipSelected();
        }
    }
}
