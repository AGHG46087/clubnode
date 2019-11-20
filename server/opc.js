/*
 * Simple Open Pixel Control client for Node.js
 *
 * Adapted from original works 2013-2014 Micah Elizabeth Scott
 * This file is released into the public domain.
 *
 * Added new functionality and processing of pixels - removed particle processing.
 *
 */

var net = require('net');
var fs = require('fs');

function intToHex(value) {
  return ('00' + value.toString(16).toUpperCase()).slice(-2);
}

/********************************************************************************
 * Core OPC Client
 */

var OPC = function (host, port) {
  this.host = host;
  this.port = port;
  this.pixelBuffer = null;
};

OPC.prototype._reconnect = function () {
  var _this = this;

  this.socket = new net.Socket();
  this.connected = false;

  this.socket.onclose = function () {
    console.log("Connection closed");
    _this.socket = null;
    _this.connected = false;
  };

  this.socket.connect(this.port, this.host, function () {
    console.log("Connected to " + _this.socket.remoteAddress);
    _this.connected = true;
    _this.socket.setNoDelay();
  });
};

OPC.prototype.writePixels = function () {
  if (!this.socket) {
    this._reconnect();
  }
  if (!this.connected) {
    return;
  }
  this.socket.write(this.pixelBuffer);
};

OPC.prototype.setPixelCount = function (num) {
  var length = 4 + num * 3;
  if (this.pixelBuffer == null || this.pixelBuffer.length != length) {
    this.pixelBuffer = new Buffer(length);
  }

  // Initialize OPC header
  this.pixelBuffer.writeUInt8(0, 0);           // Channel
  this.pixelBuffer.writeUInt8(0, 1);           // Command
  this.pixelBuffer.writeUInt16BE(num * 3, 2);  // Length
};

OPC.prototype.setPixel = function (num, r, g, b) {
  var offset = 4 + num * 3;
  if (this.pixelBuffer == null || offset + 3 > this.pixelBuffer.length) {
    this.setPixelCount(num + 1);
  }

  this.pixelBuffer.writeUInt8(Math.max(0, Math.min(255, r | 0)), offset);
  this.pixelBuffer.writeUInt8(Math.max(0, Math.min(255, g | 0)), offset + 1);
  this.pixelBuffer.writeUInt8(Math.max(0, Math.min(255, b | 0)), offset + 2);
};
OPC.prototype.setPixelColor = function(num, color) {
  this.setPixel(num, color[0], color[1], color[2] )
};

/********************************************************************************
 * Client convenience methods
 */
OPC.prototype.shutOffPixels = function(len) {
  for ( var i = 0; i < len; i++ ) {
    this.setPixel(i, 0,0,0);
  }
  this.writePixels();
  console.log('Clearing '+len+' pixels');
};


/********************************************************************************
 * Global convenience methods
 */
OPC.intRandom = function(low, up) {
  return Math.floor(Math.random() * (up - low) + low);
};
OPC.loadModel = function (filename) {
  // Synchronously load a JSON model from a file on disk
  return JSON.parse(fs.readFileSync(filename))
};
OPC.makeAColor= function(frequency1, frequency2, frequency3, phase1, phase2, phase3, width, center, cycle) {

  if (center == undefined)   center = 128;
  if (width == undefined)     width = 127;
  if (cycle == undefined)     cycle = 50;

  var i = cycle;
  var red = parseInt(Math.sin(frequency1*i + phase1) * width + center);
  var grn = parseInt(Math.sin(frequency2*i + phase2) * width + center);
  var blu = parseInt(Math.sin(frequency3*i + phase3) * width + center);

  return [red,grn,blu];
};

OPC.hsv_rgb = function (h, s, v) {
/*
 * Converts HSV to RGB value.  converts a hue-saturation-value (HSV) colormap to a
 * red-green-blue (RGB) colormap. H is the number of poistion in the cone colormap
 * colors in the colormap. saturation is the strength or purty - meaning how much
 * white is added to the color. Value is the brightness [0-100%] where 0 is black
 * respectively.
 */

  s = s / 100;
  v = v / 100;

  var hi = Math.floor((h/60) % 6);
  var f = (h / 60) - hi;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  var rgb = [];

  switch (hi) {
    case 0: rgb = [v,t,p];break;
    case 1: rgb = [q,v,p];break;
    case 2: rgb = [p,v,t];break;
    case 3: rgb = [p,q,v];break;
    case 4: rgb = [t,p,v];break;
    case 5: rgb = [v,p,q];break;
  }

  var r = Math.max(0,Math.min(255, Math.round(rgb[0]*256))),
      g = Math.max(0,Math.min(255, Math.round(rgb[1]*256))),
      b = Math.max(0,Math.min(255, Math.round(rgb[2]*256)));
//  var r = Math.min(255, Math.round(rgb[0]*256)),
//    g = Math.min(255, Math.round(rgb[1]*256)),
//    b = Math.min(255, Math.round(rgb[2]*256));

  return [r,g,b];
};

OPC.rgb_hsv = function (r, g, b) {
  /**
   * Converts RGB to HSV value. The coordinate system of HSV is cylindrical, and the colors are defined
   * inside a hexcone. The hue value H runs from 0 to 360º. The saturation S is the degree of strength
   * or purity and is from 0 to 1. Purity is how much white is added to the color, so S=1 makes
   * the purest color (no white). Brightness V also ranges from 0 to 1, where 0 is the black.
   *
   * {Integer} r Red value, 0-255
   * {Integer} g Green value, 0-255
   * {Integer} b Blue value, 0-255
   * @returns {Array} The HSV values EG: [h,s,v], [0-360 degrees, 0-100%, 0-100%]
   */

  r = (r / 255);
  g = (g / 255);
  b = (b / 255);

  var min = Math.min(Math.min(r, g), b),
    max = Math.max(Math.max(r, g), b);
    //delta = max - min;

  var value = max,    // Value defined
    saturation,
    hue;

  // Hue Defined
  if (max == min) {
    hue = 0;
  } else if (max == r) {
    hue = (60 * ((g - b) / (max - min))) % 360;
  } else if (max == g) {
    hue = 60 * ((b - r) / (max - min)) + 120;
  } else if (max == b) {
    hue = 60 * ((r - g) / (max - min)) + 240;
  }

  if (hue < 0) {
    hue += 360;
  }

  // Saturation Defined
  if (max == 0) {
    saturation = 0;
  } else {
    saturation = 1 - (min / max);
  }

  return [Math.round(hue), Math.round(saturation * 100), Math.round(value * 100)];

};
/*
  convenience method that accepts a degree to rotate, and the RGB colors,  if the degree is greater than 360 -
  it normalize to to 360, converts the color to HSV, then adds the degrees,  and returning a new color array
 */
OPC.rotateRGB = function(degree, r, g, b ) {

  while ( degree > 360 ) {
    degree -= 360;
  }

  var color,
    hsv = OPC.rgb_hsv(r,g,b);

  var h = hsv[0];
  var s = hsv[1];
  var v = hsv[2];

  h += degree;
  if ( h >= 360 ) {
    h = h - 360;
  }

  color = OPC.hsv_rgb(h,s,v);
  return color;
};
/*
  convenience method that accepts a degree to rotate and a color array -
  where color[0] = red, color[1] = green, color[2] = blue.
  method decomposes array and invokes OPC.rotateRGB
 */
OPC.rotateColor = function(degree, color ) {
  var r = color[0];
  var g = color[1];
  var b = color[2];

  return OPC.rotateRGB(degree, r,g,b);

};

OPC.hex_rgb = function(value) {
  var v = value.toUpperCase();
  var r, g, b;


  if(/^[0-9A-F]{3}$|^[0-9A-F]{6}$/.test(v) ){
    if(v.length == 3) {
      v = v.match(/[0-9A-F]/g);
      v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
      //this.value = v;
    }

    r = parseInt(v.substr(0,2),16);
    g = parseInt(v.substr(2,2),16);
    b = parseInt(v.substr(4,2),16);
  }

  return [r, g, b];

};

OPC.hex_hsv = function(value) {
  var rgb = this.hex_rgb(value);
  return this.rgb_hsv(rgb[0], rgb[1], rgb[2]);
};

OPC.rgb_hex = function(r, g, b) {
  return ( intToHex(r) + intToHex(g) + intToHex(b) );
};

OPC.hsv_hex = function(h, s, v) {
  var rgb = this.hsv_rgb(h,s,v);
  return this.rgb_hex(rgb[0], rgb[1], rgb[2]);
};


module.exports = OPC;
