// input listeners
function setUpInputListeners(room) {
    // set up
    var room = room;
    var groupSelectionX;
    var groupSelectionY;
    var isGroupSelecting = false;
    var mouseX;
    var mouseY;
    var isMouseDown = false;
    var hasMouseMovedWhenDown;
    $(document).mousedown(function(e) { handleMouseDown(e); });
    $(document).mousemove(function(e) { handleMouseMove(e); });
    $(document).mouseup(function(e) { handleMouseUp(e); });
    $(document).dblclick(function(e) { handleDoubleClick(e); });
    $(document).keypress(function(e) { handleKeyPress(e); });

    // readjust offset of mouse location to cards for dragging
    function adjustRelativeLocations(x, y) {
        room.cards.foreach(function(card) {
            if (card.isSelected) {
                card.draggingOffsetX = x - card.locX;
                card.draggingOffsetY = y - card.locY;
            }
        });
    }

    // handle mouse down events
    function handleMouseDown(e) {
        isMouseDown = true;
        hasMouseMovedWhenDown = false;
        var selected = room.getTopmostCardAt(mouseX, mouseY);
        if (e.ctrlKey) {
            adjustRelativeLocations(mouseX, mouseY);
            // if ctrl is down and the selected card is already selected: adjust all relative locations and unselect the card
            if (selected != null && selected.isSelected) {
                selected.unselect();
            // if ctrl is down and the selected card is not already selected: adjust all relative locatiosn and select the card
            } else if (selected != null && !selected.isSelected) {
                selected.select(mouseX, mouseY);
            }
        } else {
            // if ctrl is up and there is no selected card: unselect everything
            if (selected == null) {
                room.unselectAll();
            // if ctrl is up and the selected card is already selected: adjust all relative locations and reselect the card
            } else if (selected.isSelected) {
                adjustRelativeLocations(mouseX, mouseY);
                selected.select(mouseX, mouseY);
            // if ctrl is up and the selected card is not already selected: select that card and unselect everything else
            } else {
                room.unselectAll();
                selected.select(mouseX, mouseY);
            }
        }
        if (selected != null) {
            room.moveCardToTop(selected, true);
        }
        // group selection
        if (selected == null) {
            isGroupSelecting = true;
            groupSelectionX = mouseX;
            groupSelectionY = mouseY;
        }
    }

    // handle mouse up events
    function handleMouseUp(e) {
        // check group selection
        if (isGroupSelecting) {
            room.cards.foreach(function(card) {
                var rectX1 = Math.min(groupSelectionX, mouseX);
                var rectY1 = Math.min(groupSelectionY, mouseY);
                var rectX2 = Math.max(groupSelectionX, mouseX);
                var rectY2 = Math.max(groupSelectionY, mouseY);
                if (card.isContainedIn(rectX1, rectY1, rectX2, rectY2)) {
                    card.toggleSelected();
                }
            });
            room.redraw(false);
        }
        if (!e.ctrlKey && !hasMouseMovedWhenDown) {
            room.unselectAll();
            var selected = room.getTopmostCardAt(mouseX, mouseY);
            if (typeof selected !== 'undefined') {
                selected.select(mouseX, mouseY);
            }
            room.redraw(true);
        }
        // clean up
        isMouseDown = false;
        isGroupSelecting = false;
    }

    // handle mouse move events
    function handleMouseMove(e) {
        hasMouseMovedWhenDown = true;
        mouseX = e.clientX + document.body.scrollLeft - room.offsetX();
        mouseY = e.clientY + document.body.scrollTop - room.offsetY();
        if (isMouseDown && !isGroupSelecting) {
            room.cards.foreach(function(card) {
                if (card.isSelected) {
                    var newX = mouseX - card.draggingOffsetX;
                    var newY = mouseY - card.draggingOffsetY;
                    card.move(newX, newY, true);
                }
            });
        }
        if (isMouseDown) {
            room.redraw(!isGroupSelecting);
        }
        if (isGroupSelecting) {
            room.ctx.strokeStyle = "#FF0000";
            room.ctx.strokeRect(groupSelectionX, groupSelectionY, mouseX - groupSelectionX, mouseY - groupSelectionY);
        }
    }

    // handle mouse double click events
    function handleDoubleClick(e) {
        var selected = room.getTopmostCardAt(mouseX, mouseY);
        if (selected != null) {
            selected.flip(false);
            //selected.draw();
            room.redraw(true); // TODO: perhaps I should use selected.draw() but then I have to send that to the server
        }
    }

    // handle key press events
    function handleKeyPress(e) {
        console.log("keycode = " + e.keyCode);
        if (e.keyCode == 0 || e.keyCode == 32) {
            room.formDeck(mouseX, mouseY, room.getSelectedCards(), true);
        } else if (e.keyCode == 13) {
            room.reorderSelected();
        } else if (e.keyCode == 102) {
            room.flipSelected();
        }
    }
}
