// private area to view cards
function PrivateArea(id, room, x1, y1, x2, y2, claimX1, claimY1, claimX2, claimY2) {
    // constructor
    this.id = id;
    this.room = room;
    this.ctx = room.ctx;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.claimX1 = claimX1;
    this.claimY1 = claimY1;
    this.claimX2 = claimX2;
    this.claimY2 = claimY2;
    this.color;

    // check if this private is the player's
    this.isMine = function() {
        return this.color == this.room.color;
    }

    // check if this private area is claimed
    this.isClaimed = function() {
        return typeof this.color !== "undefined";
    }

    // check if the given coordinates are in the private area
    this.isXYInside = function(x, y) {
        return this.x1 <= x && x <= this.x2 && this.y1 <= y && y <= this.y2;
    }

    // check if the given coordinates are over the private area's claim area
    this.isXYInsideClaimArea = function(x, y) {
        return this.claimX1 <= x && x <= this.claimX2 && this.claimY1 <= y && y <= this.claimY2;
    }

    // claim the private area with the provided color
    this.claim = function(color) {
        this.color = color;
        // TODO: maybe make it more gradual?
        this.room.redraw(false);
    }

    // unclaim the private area
    this.unclaim = function() {
        delete this.color;
        this.room.redraw(false);
    }

    // draw the private area
    this.draw = function() {
        if (this.isClaimed()) {
            this.ctx.strokeStyle = this.color;
            this.ctx.strokeRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
            this.ctx.fillStyle = this.color;
            this.ctx.fillRect(this.claimX1,
                              this.claimY1,
                              this.claimX2 - this.claimX1,
                              this.claimY2 - this.claimY1);
        } else {
            this.ctx.fillStyle = "#BEBEBE";
            this.ctx.fillRect(this.claimX1,
                              this.claimY1,
                              this.claimX2 - this.claimX1,
                              this.claimY2 - this.claimY1);
        }
    }
}