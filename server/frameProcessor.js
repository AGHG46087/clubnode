/**
 * Created by hgrein on 3/27/15.
 */
var OPC = require('./opc');
var model = OPC.loadModel('./grid8x5.json');
var client = new OPC('localhost', 7890);

var LED_GREEN= [0,128,0], LED_BLUE = [0,128,128], LED_RED = [237,22,102], LED_BLACK = [0,0,0];
var totalColumns = 8, peakHeight = 5, peakOffTop = 8, totalFrames = 10;
var samplePos = 0; // Buffer position counter
var peak = new Array(totalColumns), // peak level of each column; used for falling dots
  dotCount = 0,    // Frame counter for delaying dot-falling speed
  colCount = 0,    // Frame counter for sorting past column data
  col = [],        // Array of Arrays, See initColumns() function: Column levels for the prior ten frames

  minLvAvg = new Array(totalColumns), // For dynamic adjustment of low & high ends of graph
  maxLvAvg = new Array(totalColumns), // Pseudo rolling averages for the prior few frames
  colDiv = new Array(totalColumns);   // Used when filtering FFT output to 8 columns

/*
 These tables were arrived at through testing, modeling and trial and error,
 exposing the unit to assorted music and sounds. But there's no One Perfect
 EQ Setting to Rule Them All, and the graph may respond better to some
 inputs than others. The software works at making the graph interesting,
 but some columns will always be less lively than others, especially
 comparing live speech against ambient music of varying genres.
 */
    // noise: low-level noise that's subtracted from each FFT output column
var noise = [
    8,6,6,5,3,4,4,4,3,4,4,3,2,3,3,4,
    2,1,2,1,3,2,3,2,1,2,3,1,2,3,4,4,
    3,2,2,2,2,2,2,1,3,2,2,2,2,2,2,2,
    2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,4],
    // These are scaling quotients for each FFT output column, sort of a
    // graphic EQ in reverse. Most music is pretty heavy at the bass end.
  eq = [
    195, 105, 150,145,120, 158, 187, 119,  108, 107, 73, 82, 64, 208, 264, 252,
    //255, 175, 218,225,220, 198, 147,  99,   68,  47, 33, 22, 14,   8,   4,   2,
    150, 140, 100, 120, 160, 140, 100, 100, 150, 140, 120, 90, 90, 98, 90, 100,
    //0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,  0,  0,  0,  0,   0,
    60, 70, 50, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //0,  0,  0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
   // When filtering down to 8 columns, these tables contain indexes
   // and weightings of the FFT spectrum output values to use. Not all
   // buckets are used -- the bottom-most and several at the top are
   // either noisy or out of range or generally not good for a graph.
  col0data = [ 2, 1,  // # of spectrum bins to merge, index of first
    111, 8 ],         // Weights for each bin
  col1data = [ 4, 1,  // 4 bins, starting at index 1
    19, 186, 38, 2 ], // Weights for 4 bins. Got it now?
  col2data = [ 5, 2,
  11, 156, 118, 16, 1 ],
  col3data = [ 8, 3,
    5, 55, 165, 164, 71, 18, 4, 1 ],
  col4data = [ 11, 5,
    3, 24, 89, 169, 178, 118, 54, 20, 6, 2, 1 ],
  col5data = [ 17, 7,
    2, 9, 29, 70, 125, 172, 185, 162, 118, 74, 41, 21, 10, 5, 2, 1, 1 ],
  col6data = [ 25, 11,
    1, 4, 11, 25, 49, 83, 121, 156, 180, 185, 174, 149, 118, 87, 60, 40, 25, 16, 10, 6, 4, 2, 1, 1, 1 ],
  col7data = [ 37, 16,
    1, 2, 5, 10, 18, 30, 46, 67, 92, 118, 143, 164, 179, 185, 184, 174, 158, 139, 118, 97, 77, 60, 45, 34, 25, 18, 13, 9, 7, 5, 3, 2, 2, 1, 1, 1, 1 ],
  // And then this points to the start of the data for each of the columns:
  colData = [col0data, col1data, col2data, col3data, col4data, col5data, col6data, col7data];

/*  initColumns(),  utility method to initialize all data arrays */
function initColumns(frames, cols, peaks) {
  var i,j;
  for ( i=0; i < cols; i++ ) {
    col[i] = [];
    for ( j = 0; j < frames; j++ ) {
      col[i][j] = 0;
    }
  }
  for( i = 0; i < cols; i++ ) {
    minLvAvg[i] = 0;
    maxLvAvg[i] = 512;
    colDiv[i] = 0;
    peak[i] = 0;
  }
}
initColumns(totalFrames, totalColumns, peakHeight);
/*
  clearColumnsLeds(), Utility method for individual addressable LEDs wired in series, to add ress them in
  form of columns for a specified height,  the color is internally treating tham as OFF or BLACK
  */
function clearColumnLeds( col, peak ) {
  if( peak === 0 ) {
    client.setPixelColor(col, LED_BLACK );
  }
  for( var i = 0, num = col; i < peak; i++, num+=8 ) {
    client.setPixelColor(num, LED_BLACK );
  }
}
/* setColumnRowPixelColor(), utility function to address a specific pixel in a row/col manner */
function setColumnRowPixelColor(x,y,color) {
  var tmpPos;
  x = (0 <= x && x < totalColumns) ? x : 0;
  y = (0 <= y && y < peakHeight) ? y : 0;
  tmpPos = x + (8 * (y));
  client.setPixelColor(tmpPos, color);
  //console.log('GEEK:  LED   Row,Col=Position:  x=['+x+'], y=['+y+'], pos=['+tmpPos+']');
}
/* closeDown(), utility function to shut off all leds in the array */
function closeDown() {
  //client.shutOffPixels(model.length);
  console.log('shutdown LEDs');
  for( var i = 0; i < model.length; i++ ) {
    client.setPixel(i, 0,0,0);
  }
  client.writePixels();
}

/*
  draw(), main method is to draw the visualizer in a manner that is similar to old school
  EQ systems of stereos.  In addition - to this feature the visualizer rotate the 3 primaary LED colors over
  the HUE by 1 degree every 3rd frame.
 */
function draw(data)
{
  var spectrum = [];  // an array that will hold noise cancelled data
  var i, x, L=0, ldata=0, nBins=0, binNum=0, c=0; // uint8
  var minLvl, maxLvl; //uint
  var level, y, sum;  //int
  var offsetIndex = 0;
  var FFT_N = 128;    //data.length;

  samplePos = 0;
  // Remove noise and apply EQ levels
  for(x=0; x < FFT_N/2; x++ ) {
    L = noise[x];
    spectrum[x] = data[x+ offsetIndex];
    if ( spectrum[x] < L ) {
      spectrum[x] = 0;
    } else {
      spectrum[x] = ((spectrum[x] - L) * (256 - eq[x] >> peakHeight));
    }
  }
  //fill colors first, then we will erase idle sections.
  for(i=0; i < totalColumns; i++) {
    client.setPixelColor(i, LED_RED);       // row 0, RED
    client.setPixelColor(8 + i, LED_BLUE); // Rwo 1, Blue
    client.setPixelColor(16+ i, LED_BLUE); // Row 2, Blue
    client.setPixelColor(24+ i, LED_GREEN);   // Row 3, Green
    client.setPixelColor(32+ i, LED_GREEN);   // Row 4, Green
  }

  for(x=0; x < totalColumns; x++ ) {
    ldata = colData[x];
    nBins = ldata[0] + 2;
    binNum = ldata[1];
    for(sum=0, i=2; i < nBins; i++ ) {
      sum += spectrum[binNum++] * ldata[i]; // Weighted
      colDiv[x] += data[x];
    }
    col[x][colCount] = sum / colDiv[x]; // Average
    minLvl = maxLvl = col[x][0];
    for(i=1; i < totalFrames; i++ ) {
      if(col[x][i] < minLvl) {
        minLvl = col[x][i];
      } else if( col[x][i] > maxLvl ) {
        maxLvl = col[x][i];
      }
    }
    // minLvl and maxLvl indicate the extents of the FFT output, used
    // for vertically scaling the output graph (so it looks interesting
    // regardless of volume level). If they're too close together though
    // (e.g. at very low volume levels) the graph becomes super coarse
    // and 'jumpy'...so keep some minimum distance between them (this
    // also lets the graph go to zero when no sound is playing):

    if( maxLvl-minLvl < peakHeight) {
      maxLvl = minLvl + peakHeight;
    }
    minLvAvg[x] = (minLvAvg[x] * 7 + minLvl) >> 3; // Dampen min/max levels
    maxLvAvg[x] = (maxLvAvg[x] * 7 + maxLvl) >> 3; // fake rolling average
    // Second fixed-point scale based on dynamic min/max levels
    level = 10 * (col[x][colCount] - minLvAvg[x]) / parseInt(maxLvAvg[x] - minLvAvg[x]);
    // clip output and convert to byte
    if( level < 0) { c = 0; }
    else if ( level > peakOffTop ) { c = peakOffTop; } // Allow dot to go a few pixels off the top
    else { c = parseInt(level); }

    if( c > peak[x] ) { peak[x] = c; } // keep dot on top
    if(peak[x] < 0 ) { // empty the column
      clearColumnLeds(x,peakHeight);
      //continue;
    } else if(c < peakHeight ) { // empty partial column
      clearColumnLeds(x, peakHeight - c);
    }
    // the peak dot color varies but doesn't necessarily match
    // the three screen regions.. yellow has a little more influence.
    y = peakHeight - peak[x];

    /******************** DO NOT DELETE **********************/
    /* Save this section for a high Peak Array of LEDs - It is not so useful for 5 pixel High
    if( y < 1 ) { setColumnRowPixelColor(x,y, LED_RED); }
    else if( y < 5 ) { setColumnRowPixelColor(x,y, LED_BLUE); }
    else { setColumnRowPixelColor(x,y, LED_GREEN); }
    */
    /******************** DO NOT DELETE **********************/

  }
  client.writePixels();

  /******************** Important **************************/
  // Every third frame, make the peak pixels drop by 1:
  if ( ++dotCount >= 3 ) {
    dotCount = 0;
    // reset Averages, col dividers and peaks
    for ( i = 0; i < totalColumns; i++ ) {
      minLvAvg[i] = 0;
      maxLvAvg[i] = 512;
      colDiv[i] = 0;
      //peak[i] = 0; // We are dropping the peaks below
    }
    for ( x = 0; x < peakHeight; x++ ) {
      peak[x] -= (peak[x] > 0) ? 1 : 0; // if peak is above 0, then subtract 1
    }
    // rotate hue over LEDs
    LED_RED = OPC.rotateColor(1, LED_RED);
    LED_BLUE = OPC.rotateColor(1, LED_BLUE);
    LED_GREEN = OPC.rotateColor(1, LED_GREEN);
  }
  // Adjust the Frame Count
  if ( ++colCount >= totalFrames ) {
    colCount = 0;
  }

}
/*
  drawFace() - another function in the suit - basically since the concept was around the most annoying build break,
  when invoked, the method simply iterates over two different drawing faces, and cycles colors over the rainbow
 */
function drawFace()
{
  console.log('frameProcessor.drawFace():  Build Break caught');
  var millisSeconds = 18000, numCycles = 50, cycleCount = 0, timing = parseInt(millisSeconds/numCycles);
  var center = 128, width = 127, cycle= 128;
  var phase1 = 0, phase2 = 2, phase3 = 4;
  var steps = 6, frequency = 2*Math.PI/steps;
  //var frequency = 2.4;
  var bgColor = OPC.makeAColor(frequency, frequency, frequency, phase1, phase2, phase3,center, width, cycle);
  var fgColor = [0,0,0]; // Black
  //var flatface = [3,6, 25,26,27,28,29,30];
  var flatface = [0,1, 6,7, 9,10, 13,14, 19,20, 25,26, 29,30, 32,33, 38,39 ];
  var sadface =  [2,5, 19,20, 25,26,27,28,29,30,32,39 ];
  var face, color;

  var interval = setInterval(function() {
    bgColor = OPC.makeAColor(frequency, frequency, frequency, phase1, phase2, phase3,center, width, cycleCount++);
    if ( cycleCount >= numCycles ) {
      clearInterval(interval);
      client.shutOffPixels(model.length);
      console.log('Clear interval - done');
      return;
    }
    client.shutOffPixels(model.length); // clear pixels to off state
    face = (cycleCount % 2 === 0 ) ? flatface : sadface;
    for( var i = 0; i < model.length; i++ ) {
      color = (face.indexOf(i) > -1 ) ? fgColor : bgColor;
      client.setPixel(i, color[0], color[1], color[2]);
    }

    client.writePixels();
    console.log('DrawFace(), color=['+bgColor+']');

  }, timing);

}

// Module Exports section,  expose 3 interfaces.
module.exports = {
  process: draw,
  buildBreak: drawFace,
  close: closeDown
};