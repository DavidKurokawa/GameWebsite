// input listeners
function setUpInputListeners(room) {
    // set up
    var room = room;
    var groupSelectionX;
    var groupSelectionY;
    var isGroupSelecting = false;
    var mouseX;
    var mouseY;
    var isLeftMouseButtonDown = false;
    var isRightMouseButtonDown = false;
    var hasMouseMovedWhenDown;
    room.canvas.oncontextmenu = function() { return false; };
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

    // handle left mouse button down events
    function handleLeftMouseButtonDown(e) {
        isLeftMouseButtonDown = true;
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

    // enlarge the topmost card at the current mouse location
    function enlargeTopmostCardAtMouseLocation() {
        var card = room.getTopmostCardAt(mouseX, mouseY);
        if (card != null) {
            var img = card.isUpPublicly ? card.imgEnlargedFront : card.imgEnlargedBack;
            if (typeof room.privateArea !== "undefined" && room.privateArea.isXYInside(mouseX, mouseY)) {
                img = card.isUpPrivately ? card.imgEnlargedFront : card.imgEnlargedBack;
            }
            room.display(img);
        }
    }

    // handle right mouse button down events
    function handleRightMouseButtonDown(e) {
        isRightMouseButtonDown = true;
        enlargeTopmostCardAtMouseLocation();
    }

    // handle mouse down events
    function handleMouseDown(e) {
        if (e.button == 0) {
            handleLeftMouseButtonDown(e);
        } else if (e.button == 2) {
            handleRightMouseButtonDown(e);
        }
    }

    // handle left mouse button up events
    function handleLeftMouseButtonUp(e) {
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
            if (typeof selected !== "undefined") {
                selected.select(mouseX, mouseY);
            }
            room.redraw(true);
        }
        // clean up
        isLeftMouseButtonDown = false;
        isGroupSelecting = false;
    }

    // handle right mouse button up events
    function handleRightMouseButtonUp() {
        isRightMouseButtonDown = false;
        room.undisplay();
    }

    // handle mouse up events
    function handleMouseUp(e) {
        if (e.button == 0) {
            handleLeftMouseButtonUp(e);
        } else if (e.button == 2) {
            handleRightMouseButtonUp(e);
        }
    }

    // handle mouse move events
    function handleMouseMove(e) {
        hasMouseMovedWhenDown = true;
        mouseX = e.clientX - room.offsetX();
        mouseY = e.clientY - room.offsetY();
        if (isLeftMouseButtonDown && !isGroupSelecting) {
            room.cards.foreach(function(card) {
                if (card.isSelected) {
                    var newX = mouseX - card.draggingOffsetX;
                    var newY = mouseY - card.draggingOffsetY;
                    card.move(newX, newY, true);
                }
            });
        }
        if (isLeftMouseButtonDown) {
            room.redraw(!isGroupSelecting);
        }
        if (isGroupSelecting) {
            room.ctx.strokeStyle = "#FF0000";
            room.ctx.strokeRect(groupSelectionX,
                                groupSelectionY,
                                mouseX - groupSelectionX,
                                mouseY - groupSelectionY);
        }
        if (isRightMouseButtonDown) {
            enlargeTopmostCardAtMouseLocation();
        }
    }

    // handle mouse double click events
    function handleDoubleClick(e) {
        var privateArea = room.getPrivateAreaClaimAreaAt(mouseX, mouseY);
        if (typeof privateArea !== "undefined") {
            // claim/unclaim any private areas if applicable
            if (!privateArea.isClaimed()) {
                room.send("rp " + privateArea.id);
            } else if (privateArea.isMine()) {
                room.send("up");
            }
        } else {
            // flip over the topmost card the mouse is over
            var selected = room.getTopmostCardAt(mouseX, mouseY);
            if (selected != null) {
                selected.flip(false);
                room.redraw(true);
            }
        }
    }

    // handle key press events
    function handleKeyPress(e) {
        console.log("keycode = " + e.keyCode);
        if (e.keyCode == 100) {
            room.formDeck(mouseX, mouseY, room.getSelectedCards(), true);
        } else if (e.keyCode == 115) {
            room.reorderSelected();
        } else if (e.keyCode == 102) {
            room.flipSelected();
        }
    }
}
