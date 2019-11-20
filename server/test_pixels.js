/**
 *  driver to draw data on the pixels using the OPC this will create a Vu Meter on a 8x5 pixel grid
 */
var OPC = require('./OPC');
var model = OPC.loadModel('./grid8x5.json');
var client = new OPC('localhost', 7890);


var data = [84,110,161,227,255,255,246,222,211,212,205,192,189,193,196,199,186,165,146,160,171,175,181,200,213,210,204,200,186,178,168,169,172,167,165,169,165,162,167,174,165,152,158,177,178,173,161,197,213,203,188,178,168,165,176,187,180,163,172,172,161,152,157,159,171,177,174,161,147,155,134,128,157,163,148,128,132,142,139,122,133,147,145,134,129,133,144,145,134,126,130,128,131,141,157,171,173,182,175,155,142,132,133,133,123,118,122,132,154,157,139,134,135,135,152,170,168,154,155,162,204,216,199,165,141,118,134,138,147,136,135,143,144,140,133,142,146,128,126,127,123,122,129,137,167,182,171,147,140,135,120,115,122,123,124,119,102,116,115,107,100,107,117,120,118,109,110,112,130,155,154,132,103,109,108,105,104,93,104,106,97,98,102,111,109,90,87,101,103,100,105,114,123,143,145,125,99,96,88,88,90,87,96,99,102,105,105,107,113,111,104,103,107,99,93,80,95,118,125,115,102,101,107,108,102,99,92,88,77,76,76,89,85,71,77,72,75,85,78,78,83,90,89,95,93,88,80,79,84,82,78,79,83,79,70,82,85,83,88,88,86,88,92,95,93,102,113,112,103,100,94,95,94,94,93,94,95,91,93,92,80,72,78,84,91,94,93,89,93,100,114,113,95,81,80,89,95,96,93,87,89,93,95,89,84,74,72,73,69,61,60,63,57,65,89,95,82,71,69,66,66,75,85,86,84,85,83,80,81,78,74,69,61,64,64,59,69,78,92,97,85,72,70,73,71,67,62,63,56,49,55,55,50,52,48,38,42,41,40,50,54,47,38,54,57,44,45,45,46,52,52,45,46,51,51,47,49,49,46,45,40,39,46,49,50,44,60,83,83,69,63,51,37,27,32,35,28,35,45,50,52,48,41,36,38,41,49,52,57,54,61,74,71,51,33,29,27,28,28,28,31,32,32,31,21,15,17,19,24,27,29,31,28,30,35,50,54,51,48,42,37,35,37,35,26,21,21,24,19,17,29,29,35,39,43,44,44,45,50,62,68,62,53,44,32,39,41,40,44,42,43,36,31,29,25,12,12,22,27,29,31,34,36,48,55,55,49,43,40,38,34,24,16,15,19,26,25,29,32,32,30,28,23,19,15,2,0,16,26,21,15,15,9,7,3,1,0,2,3,4,6,5,5,3,7,10,14,17,15,16,9,30,47,42,22,12,14,12,5,0,0,4,13,14,14,20,22,25,22,12,1,0,0,0,0,9,25,29,25,18,1,0,6,1,2,0,0,0,0,0,0,0,0,0,0,2,6,2,3,0,0,5,8,8,4,1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,9,4,12,17,13,8,5,4,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

function closeDown() {
  //client.shutOffPixels(model.length);
  console.log('shutdown LEDs');
  client.shutOffPixels(model.length);
}

function setColumnRowPixelColor(x,y,color) {
  var tmpPos = 0;
  x = (0 <= x && x < 8) ? x : 0;
  y = (0 <= y && y < 5) ? y : 0;
  tmpPos = x + (8 * (y));
  client.setPixelColor(tmpPos, color);
  console.log('GEEK:  LED   Row,Col=Position:  x=['+x+'], y=['+y+'], pos=['+tmpPos+']');
}


function drawFace()
{
  var millisSeconds = 6000, numCycles = 50, cycleCount = 0, timing = parseInt(millisSeconds/numCycles);
  var center = 128, width = 127, cycle= 128;
  var phase1 = 0, phase2 = 2, phase3 = 4;
  var steps = 6, frequency = 2*Math.PI/steps;
  //var frequency = 2.4;
  var bgColor = OPC.makeAColor(frequency, frequency, frequency, phase1, phase2, phase3,center, width, cycle);
  var fgColor = [0,0,0]; // Black
  var flatface = [0,1, 6,7, 9,10, 13,14, 19,20, 25,26, 29,30, 32,33, 38,39 ];
  var sadface =  [2,5, 19,20, 25,26,27,28,29,30,32,39 ];
  var face, color;

  var interval = setInterval(function() {
    bgColor = OPC.makeAColor(frequency, frequency, frequency, phase1, phase2, phase3,center, width, cycleCount++);
    if ( cycleCount >= numCycles ) {
      clearInterval(interval);
      closeDown();
      console.log('Clear interval - done');
      return;
    }
    client.shutOffPixels(model.length);
    face = (cycleCount % 2 === 0 ) ? flatface : sadface;
    for( var i = 0; i < model.length; i++ ) {
      color = (face.indexOf(i) > -1 ) ? fgColor : bgColor;
      client.setPixel(i, color[0], color[1], color[2]);
    }

    client.writePixels();
    console.log('DrawFace(), color=['+bgColor+']');

  }, timing);

}

function drawPixels() {
  var center = 128, width = 127, cycle= 0;
  var phase1 = 0, phase2 = 2, phase3 = 4;
  var steps = 6, frequency = 2*Math.PI/steps;

  var color = OPC.makeAColor(frequency, frequency, frequency, phase1, phase2, phase3,center, width, cycle);
  var i = 0;

  for(i = 0; i < model.length; i++ ) {
    cycle = i;
    color = OPC.makeAColor( frequency, frequency, frequency, phase1, phase2, phase3, center, width, cycle );
    client.setPixelColor( i, color );
    console.log( 'drawPixels(), color[' + i + ']=[' + color + ']' );
  }
  client.writePixels();

  return;

  var interval = setInterval(function() {
    i++;
    cycle = i;
      color = OPC.makeAColor(frequency, frequency, frequency, phase1, phase2, phase3,center, width, cycle);
      client.setPixelColor(i, color);
      console.log('drawPixels(), color['+i+']=['+color+']');
    client.writePixels();
    if ( i === model.length ) {
      clearInterval(interval);
      return;
    }
  }, 1000 );
}

drawPixels();
//drawFace();

