// card to play with
function Card(card, locX, locY) {
    // construct the card
    this.id;
    this.imgFront = new Image();
    this.imgFront.src = "./imgs/" + card + ".png";
    this.imgBack = new Image();
    this.imgBack.src = "./imgs/back.jpg";
    this.width = 100;
    this.height = 145;
    this.locX = locX;
    this.locY = locY;
    this.isUpPublicly = true;
    this.isUpPrivately = true;
    this.isSelected = false;
    this.draggingOffsetX = 0;
    this.draggingOffsetY = 0;

    // set the room to use
    this.setRoom = function(room, privateArea) {
        this.ctx = room.ctx;
        this.roomWidth = room.width;
        this.roomHeight = room.height;
        this.privateArea = privateArea;
        this.send = room.send;
    }

    // check if the given point is inside the given rectangle
    this.isXYInsideRectangle = function(x, y, rectX1, rectY1, rectX2, rectY2) {
        return rectX1 <= x && x <= rectX2 && rectY1 <= y && y <= rectY2;
    }

    // check if the first given rectangle is in the second given rectangle
    this.isRectangleInsideRectangle = function(inX1, inY1, inX2, inY2, outX1, outY1, outX2, outY2) {
        return outX1 <= inX1 && inX2 <= outX2 && outY1 <= inY1 && inY2 <= outY2;
    }

    // check if the card contains the given coordinates
    this.isXYInside = function(x, y) {
        return this.isXYInsideRectangle(x,
                                        y,
                                        this.locX,
                                        this.locY,
                                        this.locX + this.width,
                                        this.locY + this.height);
    }
    
    // check if the card were at the given coordinates would it still be on the canvas
    this.isInsideCanvas = function(x, y) {
        return this.isRectangleInsideRectangle(x,
                                               y,
                                               x + this.width,
                                               y + this.height,
                                               0,
                                               0,
                                               this.roomWidth,
                                               this.roomHeight);
    }

    // check if the card is contained in the given rectangle
    this.isContainedIn = function(x1, y1, x2, y2) {
        return this.isRectangleInsideRectangle(this.locX,
                                               this.locY,
                                               this.locX + this.width,
                                               this.locY + this.height,
                                               x1,
                                               y1,
                                               x2,
                                               y2);
    }

    // check if the card is inside the private area
    this.isInsidePrivateArea = function() {
        return this.isContainedIn(this.privateArea.x1,
                                  this.privateArea.y1,
                                  this.privateArea.x2,
                                  this.privateArea.y2);
    }

    // check if the card is inside the public area
    this.isInsidePublicArea = function() {
        // this checks that the card is inside the public area by checking the corners of the card
        // if the card is large enough (or the private area small enough), this may not work
        var x = this.locX;
        var y = this.locY;
        var w = this.width;
        var h = this.height;
        var x1 = this.privateArea.x1;
        var y1 = this.privateArea.y1;
        var x2 = this.privateArea.x2;
        var y2 = this.privateArea.y2;
        return !this.isXYInsideRectangle(x, y, x1, y1, x2, y2)
               && !this.isXYInsideRectangle(x + w, y, x1, y1, x2, y2)
               && !this.isXYInsideRectangle(x + w, y + h, x1, y1, x2, y2)
               && !this.isXYInsideRectangle(x, y + h, x1, y1, x2, y2);
    }
    
    // draw the border of the card
    this.drawBorder = function() {
        this.ctx.strokeStyle = this.isSelected ? "#FF0000" : "#000000";
        this.ctx.strokeRect(this.locX, this.locY, this.width, this.height);
    }

    // draw the card
    this.draw = function() {
        var x = this.locX;
        var y = this.locY;
        var w = this.width;
        var h = this.height;
        var isPrivate = this.isInsidePrivateArea();
        var isPublic = this.isInsidePublicArea();
        if (this.isUpPrivately == this.isUpPublicly || isPrivate || isPublic) {
            var isUp = isPrivate ? this.isUpPrivately : this.isUpPublicly;
            var img = isUp ? this.imgFront : this.imgBack;
            this.ctx.drawImage(img, x, y, w, h);
        } else {
            var imgPublic = this.isUpPublicly ? this.imgFront : this.imgBack;
            this.ctx.drawImage(imgPublic, x, y, w, h);
            var imgPrivate = this.isUpPrivately ? this.imgFront : this.imgBack;
            var croppedX = x >= this.privateArea.x1 ? 0 : (this.privateArea.x1 - x);
            var croppedY = y >= this.privateArea.y1 ? 0 : (this.privateArea.y1 - y);
            var croppedWidth = x + w <= this.privateArea.x2 ? w : (this.privateArea.x2 - x);
            var croppedHeight = h - croppedY;
            this.ctx.drawImage(imgPrivate,
                               croppedX,
                               croppedY,
                               croppedWidth,
                               croppedHeight,
                               x + croppedX,
                               y + croppedY,
                               croppedWidth,
                               croppedHeight);
        }
        this.drawBorder();
    };

    // move the card
    this.move = function(x, y, report) {
        x = Math.max(x, 0);
        x = Math.min(x, this.roomWidth - this.width);
        y = Math.max(y, 0);
        y = Math.min(y, this.roomHeight - this.height);
        x = parseInt(x);
        y = parseInt(y);
        this.locX = x;
        this.locY = y;
        if (report) {
            this.send("mv " + this.id + " " + x + " " + y);
        }
    }

    // select the card
    this.select = function(x, y) {
        this.isSelected = true;
        this.draggingOffsetX = x - this.locX;
        this.draggingOffsetY = y - this.locY;
        this.draw();
    };

    // unselect the card
    this.unselect = function() {
        this.isSelected = false;
        this.draw();
    };

    // toggle the selected status of the card
    this.toggleSelected = function() {
        this.isSelected = !this.isSelected;
        this.draw();
    }

    // flip the card
    this.flip = function(report) {
        var isPrivate = this.isInsidePrivateArea();
        if (isPrivate || !isPublic) {
            this.isUpPrivately = !this.isUpPrivately;
        }
        var isPublic = this.isInsidePublicArea();
        if (isPublic || !isPrivate) {
            this.isUpPublicly = !this.isUpPublicly;
            if (report) {
                this.send("fl " + this.id);
            }
        }
    }
}
