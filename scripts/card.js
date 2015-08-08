function Card(ctx, canvasWidth, canvasHeight, locX, locY, card, socket) {
    // construct the card
    this.id;
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.imgFront = new Image();
    this.imgFront.src = "./imgs/" + card + ".png";
    this.imgBack = new Image();
    this.imgBack.src = "./imgs/back.jpg";
    this.img = this.imgFront;
    this.width = 100;
    this.height = 145;
    this.locX = locX;
    this.locY = locY;
    this.isUp = true;
    this.isSelected = false;
    this.draggingOffsetX = 0;
    this.draggingOffsetY = 0;
    this.socket = socket;

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
        var canvasX2 = canvasWidth;
        var canvasY1 = 0;
        var canvasY2 = canvasHeight;
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

    // draw the card
    this.draw = function() {
        this.ctx.drawImage(this.img, this.locX, this.locY, this.width, this.height);
        this.ctx.strokeStyle = this.isSelected ? "#FF0000" : "#000000";
        this.ctx.strokeRect(this.locX, this.locY, this.width, this.height);
    };

    // move the card
    this.move = function(x, y, report) {
        x = Math.max(x, 0);
        x = Math.min(x, canvasWidth - this.width);
        y = Math.max(y, 0);
        y = Math.min(y, canvasHeight - this.height);
        x = parseInt(x);
        y = parseInt(y);
        this.locX = x;
        this.locY = y;
        if (report) {
            this.socket.emit("msg", "mv " + this.id + " " + x + " " + y);
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
        this.isUp = !this.isUp;
        this.img = this.isUp ? this.imgFront : this.imgBack;
        if (report) {
            this.socket.emit("msg", "fl " + this.id);
        }
    }
}
