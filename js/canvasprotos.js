/*
 *  canvasprotos.js   metjod to add prototype functions to the canvas,
 *  not sure if I am going to use these in this project but IK will place the file here
 *  in the case That I do add them 
 */


function canvasProtos() {

  CanvasRenderingContext2D.prototype.line = function ( x1, y1, x2, y2 ) {
    this.lineCap = 'round';
    this.beginPath();
    this.moveTo( x1, y1 );
    this.lineTo( x2, y2 );
    this.closePath();
    this.stroke();
  };
  CanvasRenderingContext2D.prototype.circle = function ( x, y, r, fill_opt ) {
    this.beginPath();
    this.arc( x, y, r, 0, Math.PI * 2, true );
    this.closePath();
    if ( fill_opt ) {
      this.fillStyle = 'rgba(0,0,0,1)';
      this.fill();
      this.stroke();
    } else {
      this.stroke();
    }
  };
  CanvasRenderingContext2D.prototype.rectangle = function ( x, y, w, h, fill_opt ) {
    this.beginPath();
    this.rect( x, y, w, h );
    this.closePath();
    if ( fill_opt ) {
      this.fillStyle = 'rgba(0,0,0,1)';
      this.fill();
    } else {
      this.stroke();
    }
  };
  CanvasRenderingContext2D.prototype.triangle = function ( p1, p2, p3, fill_opt ) {
    // Stroked triangle.
    this.beginPath();
    this.moveTo( p1.x, p1.y );
    this.lineTo( p2.x, p2.y );
    this.lineTo( p3.x, p3.y );
    this.closePath();
    if ( fill_opt ) {
      this.fillStyle = 'rgba(0,0,0,1)';
      this.fill();
    } else {
      this.stroke();
    }
  };
};


