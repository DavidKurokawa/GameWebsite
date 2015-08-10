// private area to view cards
function PrivateArea(ctx, x1, y1, x2, y2) {
    // constructor
    this.ctx = ctx;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;

    // draw the private area
    this.draw = function(isMine) {
        this.ctx.strokeStyle = isMine ? "#000000" : "#bebebe";
        this.ctx.strokeRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
    }
}
