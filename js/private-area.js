(function(context) {
    // private area to view cards
    context.PrivateArea = function(id, room, x1, y1, x2, y2, claimX1, claimY1, claimX2, claimY2) {
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
        this.playerId;

        // check if this private is the player's
        this.isMine = function() {
            return this.playerId == this.room.playerId;
        }

        // check if this private area is claimed
        this.isClaimed = function() {
            return typeof this.playerId !== "undefined";
        }

        // check if the given coordinates are in the private area
        this.isXYInside = function(x, y) {
            return this.x1 <= x && x <= this.x2 && this.y1 <= y && y <= this.y2;
        }

        // check if the given coordinates are over the private area's claim area
        this.isXYInsideClaimArea = function(x, y) {
            return this.claimX1 <= x && x <= this.claimX2 && this.claimY1 <= y && y <= this.claimY2;
        }

        // claim the private area with the provided player
        this.claim = function(playerId) {
            this.playerId = playerId;
            if (playerId == this.room.playerId) {
                this.room.privateArea = this.room.privateAreas[this.id];
            }
            this.room.redraw(false);
        }

        // unclaim the private area
        this.unclaim = function() {
            if (this.playerId == this.room.playerId) {
                delete this.room.privateArea;
            }
            delete this.playerId;
            this.room.redraw(false);
        }

        // draw the private area
        this.draw = function() {
            if (this.isServer) {
                return;
            }
            if (this.isClaimed()) {
                var color = this.room.colorMap[this.playerId];
                this.ctx.strokeStyle = color;
                this.ctx.strokeRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
                this.ctx.fillStyle = color;
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
    };
})(typeof exports === "undefined" ? document : exports);
