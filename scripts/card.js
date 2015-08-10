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
    this.setRoom = function(room) {
        this.ctx = room.ctx;
        this.roomWidth = room.width;
        this.roomHeight = room.height;
        this.privateArea = room.privateAreas[0]; // TODO: change this!
        this.send = room.send;
    }

    // check if the card contains the given coordinates
    this.isXYInside = function(x, y) {
        return this.locX < x && x < this.locX + this.width
                && this.locY < y && y < this.locY + this.height;
    }
    
    // check if the card were at the given coordinates would it still be on the canvas
    this.isInsideCanvas = function(x, y) {
        var cardX1 = x;
        var cardX2 = x + this.width;
        var cardY1 = y;
        var cardY2 = y + this.height;
        var canvasX1 = 0;
        var canvasX2 = this.roomWidth;
        var canvasY1 = 0;
        var canvasY2 = this.roomHeight;
        return canvasX1 <= cardX1 && cardX2 <= canvasX2
                && canvasY1 <= cardY1 && cardY2 <= canvasY2;
    }

    // check if the card is contained in the given rectangle
    this.isContainedIn = function(x1, y1, x2, y2) {
        var rectX1 = Math.min(x1, x2);
        var rectX2 = Math.max(x1, x2);
        var rectY1 = Math.min(y1, y2);
        var rectY2 = Math.max(y1, y2);
        var cardX1 = this.locX;
        var cardX2 = this.locX + this.width;
        var cardY1 = this.locY;
        var cardY2 = this.locY + this.height;
        return rectX1 <= cardX1 && cardX2 <= rectX2
                && rectY1 <= cardY1 && cardY2 <= rectY2;
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
        return this.locX >= this.privateArea.x2 || this.locY + this.height <= this.privateArea.y1;
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
            this.ctx.drawImage(imgPublic, this.locX, this.locY, this.width, this.height);
            var imgPrivate = this.isUpPrivately ? this.imgFront : this.imgBack;
            var croppedX = 0;
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
