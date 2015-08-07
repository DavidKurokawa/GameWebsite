function Card(ctx, canvasWidth, canvasHeight, locX, locY, card) {
    // construct the card
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.img = new Image();
    this.img.width = 100;
    this.img.height = 145;
    this.img.locX = locX;
    this.img.locY = locY;
    this.img.frontSrc = "./static/img/" + card + ".png";
    this.img.backSrc = "./static/img/back.jpg";
    this.isUp = true;
    this.isSelected = false;
    this.draggingOffsetX = 0;
    this.draggingOffsetY = 0;
    this.img.src = this.img.frontSrc;

    // check if the card contains the given coordinates
    this.isXYInside = function(x, y) {
        return this.img.locX < x && x < this.img.locX + this.img.width
                && this.img.locY < y && y < this.img.locY + this.img.height;
    }
    
    // check if the card were at the given coordinates would it still be on the canvas
    this.isInsideCanvas = function(x, y) {
        var cardX1 = x;
        var cardX2 = x + this.img.width;
        var cardY1 = y;
        var cardY2 = y + this.img.height;
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
        var cardX1 = this.img.locX;
        var cardX2 = this.img.locX + this.img.width;
        var cardY1 = this.img.locY;
        var cardY2 = this.img.locY + this.img.height;
        return rectX1 <= cardX1 && cardX2 <= rectX2
                && rectY1 <= cardY1 && cardY2 <= rectY2;
    }

    // draw the card
    this.draw = function() {
        this.ctx.drawImage(this.img, this.img.locX, this.img.locY, this.img.width, this.img.height);
        this.ctx.strokeStyle = this.isSelected ? "#FF0000" : "#000000";
        this.ctx.strokeRect(this.img.locX, this.img.locY, this.img.width, this.img.height);
    };

    // move the card
    this.move = function(x, y) {
        x = Math.max(x, 0);
        x = Math.min(x, canvasWidth - this.img.width);
        y = Math.max(y, 0);
        y = Math.min(y, canvasHeight - this.img.height);
        this.img.locX = x;
        this.img.locY = y;
    }

    // select the card
    this.select = function(x, y) {
        this.isSelected = true;
        this.draggingOffsetX = x - this.img.locX;
        this.draggingOffsetY = y - this.img.locY;
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
    this.flip = function() {
        this.isUp = !this.isUp;
        this.img.src = this.isUp ? this.img.frontSrc : this.img.backSrc;
    }
}
