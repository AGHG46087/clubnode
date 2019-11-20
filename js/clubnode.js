
var mp3player = {
  canvas1: document.getElementById( 'fft1' ),
  canvas2: document.getElementById( 'fft2' ),
  ctx1: null,
  ctx2: null,
  currTime: 0,
  animationFrame: null,
  audioCtx: null,
  analyser: null,
  source: null,
  fftSize: 2048,
  barGradient: null, // init(), drawPulse, drawLifeLine, drawSinWave, drawSymmetricCentered
  rgbGradient: null, // init(), drawSymmetricCentered,
  hotGradient: null, // init(), drawSymmetricCentered
  dotGradient: null, // init(), drawDots, drawRadialBars, drawSymmetricCentered
  pulseGradient: null, // init(), drawRadialBars, drawBigPulse
  canvasHeight: 0,
  canvasWidth: 0,
  audioPlaying: false,
  patterns: [],
  patternIndex: 3,
  patternInterval: 0,
  connection: null,
  PATTERN_CYCLE_ALL: true,
  PATTERN_START_INDEX: 0, // max is patterns.length -1

  /* pause: As the name says: pause the audio and animations */
  pause: function() {
    audio.pause();
    mp3player.audioPlaying = false;
    window.cancelAnimationFrame(mp3player.animationFrame);

    clearInterval(mp3player.patternInterval);
  },
  
  /* start: kicks off the whole animations and audio */
  start: function () {
    // Make sure we have a Analyser first
    if ( mp3player.analyser == null ) {
      console.log('%cmp3player.start(): There is no analyser setup - select a new song.', "color:yellow; background:red; font-size: 16px");
      return;
    }

    if(audio && document.getElementById('audio-player') == null ) {
      // The html audio element has been removed and looking to replay the same song, add it to the DOM again
      window.audio.id='audio-player';
      window.audio.controls = true;
      window.audio.loop = false;
      audio.src = mp3player.mp3file;

      var el = document.getElementById('visualizer' );
      el.appendChild(audio);
      mp3player.setupAudioListeners();
    }

    audio.play();
    mp3player.audioPlaying = true;
    mp3player.animationFrameCallback();

    // Initial pattern index and setup the pattern changer behavior
    mp3player.patternIndex = mp3player.PATTERN_START_INDEX;
    mp3player.patternInterval = setInterval(function() {
      mp3player.patternIndex += (mp3player.PATTERN_CYCLE_ALL) ? 1 : 0;
      if ( mp3player.patternIndex >= mp3player.patterns.length ) {
        mp3player.patternIndex = mp3player.PATTERN_START_INDEX;
      }
      mp3player.toggleCanvasOrientation();
    }, 3000 );
  },
  
  /* loadMp3File: When a mp3 is being loaded this will load a audio file, setup event listeners, and connect analyser */
  loadMp3File: function ( url, keepTitle ) {
    var elMsg = document.getElementById( 'loadMsg' );
    elMsg.innerHTML = 'loading ' + url + ' ...';
    setTimeout(function() { if (!keepTitle) { elMsg.innerHTML = '&nbsp;'; } }, 2000);

    if ( window.audio || mp3player.audioPlaying ) {
      mp3player.resetLifeUniverseAndEverything();
    }

    window.audio = new Audio();
    window.audio.id='audio-player';
    window.audio.controls = true;
    window.audio.loop = false;
    audio.src = url;

    var el = document.getElementById('visualizer' );
    el.appendChild(audio);
    mp3player.setupAudioListeners();

    if( !mp3player.audioCtx ) {
      mp3player.audioCtx = new AudioContext();
    }
    mp3player.analyser = mp3player.audioCtx.createAnalyser();
    // Setting of the FFT size must be power of 2,  set the appropriate value to mp3player.fftSize
    if (( 512 <= mp3player.fftSize && mp3player.fftSize < 2048 ) && ((n & (n - 1)) == 0 ) ) {
      mp3player.analyser.fftSize = mp3player.fftSize;
    }

    mp3player.source = mp3player.audioCtx.createMediaElementSource(audio);
    mp3player.source.connect(mp3player.analyser);
    mp3player.analyser.connect(mp3player.audioCtx.destination);

  },
  /* resetLifeUniverseAndEverything: Everything is stopped for a reason, reset all variables to inital state */
  resetLifeUniverseAndEverything: function() {
    // Stop the Audio player and remove listeners
    window.audio.pause();
    window.audio.removeEventListener('timeupdate');
    window.audio.removeEventListener('ended');

    mp3player.audioPlaying = false;

    // Clear the Animation Frame and pattern switching interval
    window.cancelAnimationFrame(mp3player.animationFrame);
    clearInterval(mp3player.patternInterval);


    // Clear the Canvas elements
    mp3player.ctx1.clearRect(0,0, mp3player.canvasWidth, mp3player.canvasHeight);
    mp3player.ctx2.clearRect(0,0, mp3player.canvasWidth, mp3player.canvasHeight);

    mp3player.patternIndex = mp3player.PATTERN_START_INDEX;
    mp3player.toggleCanvasOrientation();

    try {
      // Remove the existing Audio element from the DOM
      var parent = document.getElementById( 'visualizer' );
      parent.removeChild( window.audio );
    } catch(e) {
      console.log('%cFailed to remove audio node from visualizer, it is not present:', "color:orange; background:blue; font-size: 12px");
    }
    // window.audio = null;

  },
  
  /* closeSocket: closes the socket connection to the web socket server */
  closeSocket: function() {
    if ( mp3player.connection ) {
      mp3player.connection.close();
      mp3player.connection = null;
    }

    var elMsg = document.getElementById( 'loadMsg' );

    var ipAddress = document.getElementById('ipAddress');
    var tmpValue = ipAddress.value;
    ipAddress.value = ''; // clear it out
    if ( tmpValue.length > 1) {
      var value = 'ws://' + tmpValue + ':1234';
      elMsg.innerHTML = 'Closed socket ' + value + ' ...';
    }

    setTimeout(function() { elMsg.innerHTML = '&nbsp;'; }, 2000);
  },
  
  /* connectSocket: requests a Web socket connection and setup listeners on the socket */
  connectSocket: function(url) {
    console.log('Requesting to connect to url=['+url+']');
    var elMsg = document.getElementById( 'loadMsg' );
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    mp3player.connection = new WebSocket(url); //'ws://127.0.0.1:1234'

    // connection is opened and ready to use
    mp3player.connection.onopen = function () {
      elMsg.innerHTML = 'Open socket connection to ' + url + ' ...';
      setTimeout(function() { elMsg.innerHTML = '&nbsp;'; }, 2000);
      console.log('%cmp3player.connectSocket,onopen(): Connection established to url=['+url+']', "color:cyan; background:blue; font-size: 12px");
    };
    // connection is opened and ready to use
    mp3player.connection.onmessage = function (evt) {
      var tempData = evt.data;
      if ( tempData.indexOf('Build-break') > -1 ) {
        console.log('%cmp3player.connectSocket.onmessage(): Build Break msg: %s', "color:yellow; background:red; font-size: 16px", tempData);
        mp3player.notifyBuildBreak(tempData);
      } else {
        console.log('%cmp3player.connectSocket,onmessage(): Message received msg=[%s]', "color:white; background:blue; font-size: 12px", tempData);
      }
    };
    // connection is opened closed
    mp3player.connection.onclose = function () {
      if( !utils.hasClass('error', elMsg) ) {
        elMsg.innerHTML = 'Closed socket to ' + url + ' ...';
        setTimeout(function() { elMsg.innerHTML = '&nbsp;'; }, 2000);
      }
      console.log('%cmp3player.connectSocketonclose(): Server requested Connection to url=['+url+'] closed for business', "color:orange; background:blue; font-size: 12px");
      mp3player.connection = null;
    };
    // an error occurred when sending/receiving data
    mp3player.connection.onerror = function (error) {
      utils.addClass('error', elMsg);
      elMsg.innerHTML = 'WebSocket Error: to '+ url +' ... Check Connection!!';
      setTimeout(function() { utils.removeClass('error', elMsg); elMsg.innerHTML = '&nbsp;'; }, 2000);
      console.log('%cmp3player.connectSocket.onerror(): An Error ocurred when sending/receiving data=['+error+']', "color:yellow; background:red; font-size: 16px");
    };
  },

  /* sendData:  Sends the fft data to the web socket server */
  sendData: function(data) {
    // Sending data to the server if the connection is established
    if ( mp3player.connection ) {
      mp3player.connection.send(data);
    }
  },
  /* animationFrameCallback:  This is the function that is called 60fps pulls fft data, invokes methods to send data and draw */
  animationFrameCallback: function() {
    mp3player.animationFrame = window.requestAnimationFrame(mp3player.animationFrameCallback); // CALLBACK AGAIN

    var freqByteData = new Uint8Array(mp3player.analyser.frequencyBinCount);
    mp3player.analyser.getByteFrequencyData(freqByteData);

    // send the data to external source
    mp3player.sendData(freqByteData);

    // draw on the canvas, save state, clear rectangle, draw, restore state.
    mp3player.ctx1.globalCompositeOperation = 'source-over';
    mp3player.ctx1.save();
    mp3player.ctx1.clearRect(0,0, mp3player.canvasWidth, mp3player.canvasHeight);
    mp3player.ctx2.clearRect(0,0, mp3player.canvasWidth, mp3player.canvasHeight);
    mp3player.patterns[mp3player.patternIndex](freqByteData); // here is the drawing method
    mp3player.ctx1.restore();

  },
  /* drawCrossBars: draws visualizer as two crossing images */
  drawCrossBars: function(data) {
    var spacer_width = 10;
    var bar_width = 5;
    var offset = 5;
    var numBars = Math.round(mp3player.canvasWidth / spacer_width );

    mp3player.ctx1.fillStyle = '#F6D565';
    mp3player.ctx1.lineCap = 'round';

    mp3player.ctx2.fillStyle = '#3A5E8C'; //mp3player.barGradient;
    mp3player.ctx2.lineCap = 'round';

    for(var i = 0; i < numBars; i++ ) {
      var value = data[i+offset];
      // Changed from Both Left to Right, to more symmetric. simply (numbars-i) in the ctx2.fillrect()
      mp3player.ctx1.fillRect(i*spacer_width, mp3player.canvasHeight, bar_width, -value);
      mp3player.ctx2.fillRect((numBars-i)*spacer_width, mp3player.canvasHeight, bar_width, -value);
    }

  },
       
  /* drawSymmetricCentered: draws visualizer as starting from center and draw out to boundries */
  drawSymmetricCentered: function(data) {
    var gradients = [mp3player.barGradient, mp3player.rgbGradient, mp3player.hotGradient, mp3player.dotGradient];
    var color = gradients[parseInt(mp3player.currTime) % gradients.length];
    var centerX = mp3player.canvasWidth / 2;
    var offset = (mp3player.canvasHeight/2) * 0.25;
    var value = 0;

    mp3player.ctx1.fillStyle = color;

    var datalen=  parseInt(data.length / 2, 10);
    for( var i = 0; i < datalen; i++ ) {
      value = data[i] + offset;
      mp3player.ctx1.fillRect(centerX - (i*5), mp3player.canvasHeight - value, 3, mp3player.canvasHeight );
      mp3player.ctx1.fillRect(centerX + (i*5), mp3player.canvasHeight - value, 3, mp3player.canvasHeight );
    }

  },

  /* add a class to an element */
  addClass: function ( classname, element ) {
    var cn = element.className;
    //test for existence
    if ( cn.indexOf( classname ) != -1 ) {
      return;
    }
    //add a space if the element already has class
    if ( cn != '' ) {
      classname = ' ' + classname;
    }
    element.className = cn + classname;
  },
  /* remove a class from an element */
  removeClass: function ( classname, element ) {
    var cn = element.className;
    var rxp = new RegExp( "\\s?\\b" + classname + "\\b", "g" );
    cn = cn.replace( rxp, '' );
    element.className = cn;
  },
    
  /* does a element contain a specific class */
  hasClass: function(classname, element) {
    return new RegExp(' ' + classname + ' ').test(' ' + element.className + ' ');
  },
  /* random number inclusive of low and upper range */
  intRandom: function(low, up) {
    return Math.floor(Math.random() * (up - low) + low);
  },
  /* distance between two points */
  findDistance: function(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

};

var bigPulseState = {
  colors: ['#fd2700', '#64d700', 'fdfb00', '#8314fd', '#b8009c', '#fa60fd', '#fa0000', '#e64200', '#0093f0', '#fda0c0'],
  currentColor: '#0093f0',
  addCount: 0,
  lastAverage: 0,
  circles: [],
  initialized: false,
  init: function() {
    for ( var z = 0; z < 10; z++ ) {
      bigPulseState.circles[z] = {
        c: '', r: 0, a: 0
      }
    }
    bigPulseState.currentColor = bigPulseState.colors[utils.intRandom(0,bigPulseState.colors.length)];
    bigPulseState.initialized = true;
  }
};

var connectedParticlesState = {
  canvasWidth: 0,
  canvasHeight: 0,
  fftSize: 512,
  particles: [],
  particleNum: 128,
  colors: ['#F35D4F','#f36849','#C0D988','#6DDAF1','#F1E85B', '706DF3'],

  initialized: false,
  divisor: function () {
    var rc = 4;
    if (( connectedParticlesState.canvasHeight < 550 ) || ( connectedParticlesState.canvasWidth < 801 )) {
      rc = 8;
    }
    if (( connectedParticlesState.canvasHeight < 351 ) || ( connectedParticlesState.canvasWidth < 501 )) {
      rc = 16;
    }
    if (( connectedParticlesState.canvasHeight < 251 ) || ( connectedParticlesState.canvasWidth < 301 )) {
      rc = 32;
    }

    return rc;
  },
  init: function(width, height) {

    // internal Object Particle.
    function Particle() {
      this.x = Math.round(Math.random() * connectedParticlesState.canvasWidth);
      this.y = Math.round(Math.random() * connectedParticlesState.canvasHeight);
      this.rad = Math.round(Math.random() * 10) + 15;
      this.rgba = connectedParticlesState.colors[utils.intRandom(0,connectedParticlesState.colors.length )];
      this.vx = Math.round(Math.random() * 3) - 1.5;
      this.vy = Math.round(Math.random() * 3) - 1.5;
    }

    connectedParticlesState.particles.length = 0;
    connectedParticlesState.canvasWidth = width || 1000;
    connectedParticlesState.canvasHeight = height || 350;
    var particleDivisor = connectedParticlesState.divisor();
    connectedParticlesState.particleNum = connectedParticlesState.fftSize / particleDivisor;
    for( var i = 0; i < connectedParticlesState.particleNum; i++ ) {
      connectedParticlesState.particles.push(new Particle());
    }
    //console.log('connectedParticlesState.init(): fftSize=['+connectedParticlesState.fftSize+'], divisor=['+particleDivisor+'] particles.length=['+connectedParticlesState.particles.length+']');

    connectedParticlesState.initialized = true;
  }

};

var peakedBarsState = {
  barSize: 64,
  bars: [],
  dots: [],
  width: 0,
  height: 0,
  /*color: //['157, 193, 243', '245, 232, 153', '226, 51, 110' ], */
  colors: ['0,47,229', '5,223,230', '11,231,70', '157, 193, 243', '245, 232, 153', '226, 51, 110', '206,233,20', '233,180,23', '234,102,26', '241,90,17', '248,51,9' ],
  initialized: false,

  init: function(width, height) {
    peakedBarsState.width = width;
    peakedBarsState.height = height;
    peakedBarsState.bars.length = 0; // empty the array
    peakedBarsState.dots.length = 0; // empty the array
    var barWidth = Math.floor(width/ peakedBarsState.barSize);
    for( var i = 0; i < peakedBarsState.barSize; i++ ) {
      peakedBarsState.dots[i] = 0;
      peakedBarsState.bars[i] = {
        x: (i * barWidth),
        w: barWidth,
        h: 0,
        color: peakedBarsState.colors[Math.floor(Math.random() * peakedBarsState.colors.length)]
      }
    }
    peakedBarsState.initialized = true;
  }
};

var radialBarsState = {
  arcSize: 18,
  arcs: [],
  dots: [],
  colors: ['5,223,230', '0,47,229', '234,102,26', '11,231,70', '248,51,9', '157, 193, 243', '245, 232, 153', '226, 51, 110', '206,233,20', '233,180,23',  '241,90,17'],
  initialized: false,

  init: function(width, height) {
    var arcCount = 60;
    radialBarsState.width = width;
    radialBarsState.height = height;
    radialBarsState.arcs.length = 0; // empty the array
    radialBarsState.dots.length = 0; // empty the array
    for( var i = 0; i < arcCount; i++ ) {
      radialBarsState.dots[i] = 0;
      radialBarsState.arcs[i] = {
        startAngle: 0,
        endAngle: 0,
        h: 0,
        color: radialBarsState.colors[utils.intRandom(0, i* radialBarsState.colors.length) % radialBarsState.colors.length]
      }
    }

    radialBarsState.initialized = true;
  },
  randomizeColors: function() {
    var arc;
    for( var i = 0; i < radialBarsState.arcs.length; i++ ) {
      arc = radialBarsState.arcs[i];
      arc.color = radialBarsState.colors[utils.intRandom(0, i* radialBarsState.colors.length) % radialBarsState.colors.length];
    }
  }
};

var lifeLineState = {
  lastValue: [],
  separate: [],
  separateTimer: 0,
  shadowBlur: 0,
  average: 0,
  color: {},
  choice: 0,
  initialized: false,

  init: function() {
    for (var i = 0; i < 256; i++) {
      lifeLineState.lastValue[i] = 0;
    }
    lifeLineState.color = {
      r: 100,
      g: 100,
      b: 100,
      rS: utils.intRandom(1, 3),
      gS: utils.intRandom(1, 3),
      bS: utils.intRandom(1, 3),
      rD: 1,
      gD: 1,
      bD: 1
    };
    lifeLineState.initialized = true;
  },
  scaleFactor: function(height) {
    var rc = 80; //
    if ( height > 360 ) {
      var baseThreshold = rc; // @ height 360
      var percentage = (height / baseThreshold) / 100;
      var ratio = parseInt( height * percentage );
      rc = (baseThreshold - ratio) + 10;
    }
    return rc;
  },
  changeColor: function() {
    lifeLineState.choice = utils.intRandom(0, 9);
    if (lifeLineState.choice < 3) {
      lifeLineState.color.r = lifeLineState.color.r + lifeLineState.color.rS * lifeLineState.color.rD;
      if (lifeLineState.color.r > 225) {
        lifeLineState.color.rD = -1;
      } else if (lifeLineState.color.r < 100) {
        lifeLineState.color.rD = 1;
      }
    } else if (lifeLineState.choice < 6) {
      lifeLineState.color.g = lifeLineState.color.g + lifeLineState.color.gS * lifeLineState.color.gD;
      if (lifeLineState.color.g > 225) {
        lifeLineState.color.gD = -1;
      } else if (lifeLineState.color.g < 100) {
        lifeLineState.color.gD = 1;
      }
    } else {
      lifeLineState.color.b = lifeLineState.color.b + lifeLineState.color.bS * lifeLineState.color.bD;
      if (lifeLineState.color.b > 225) {
        lifeLineState.color.bD = -1;
      } else if (lifeLineState.color.b < 100) {
        lifeLineState.color.bD = 1;
      }
    }
  }
};


var triangleState = {
  beginAngle: 0,
  stars: new Array(512),
  MAX_DEPTH: 32,
  initialized: false,


  init: function() {

    for( var i = 0; i < triangleState.stars.length; i++ ) {
      triangleState.stars[i] = {
        x: utils.intRandom(-25,25),
        y: utils.intRandom(-25,25),
        z: utils.intRandom(1,triangleState.MAX_DEPTH)
      }
    }
    triangleState.initialized = true;
  }

};
                
var sinWaveState = {
  sinAngle: [],
  line: [],
  len: 512 / 2 - 20, // smallest fft size
  color: 0,
  initialized: false,

  sinWaveColor: function(context, width, height) {
    if ( !context ) { return; }
    sinWaveState.color = context.createLinearGradient(0, 0, 0, height);
    sinWaveState.color.addColorStop(0.1, '#ff5614');
    sinWaveState.color.addColorStop(0.3, '#fffa47');
    sinWaveState.color.addColorStop(0.4, '#f93b04');
    sinWaveState.color.addColorStop(0.5, '#f93b04');
    sinWaveState.color.addColorStop(0.6, '#fffa47');
    sinWaveState.color.addColorStop(0.7, '#f93b04');
    sinWaveState.color.addColorStop(0.75, '#f01800');
    sinWaveState.color.addColorStop(0.8, '#fb7220');
    sinWaveState.color.addColorStop(0.9, '#f93b04');
    sinWaveState.color.addColorStop(1, '#f01800');
  },
  init: function(context, width, height) {
    var angleGap = Math.random() * 0.01 + 0.05,
      angle = 0;

    sinWaveState.sinAngle.length = 0;
    sinWaveState.sinAngle[0] = Math.sin(angle);
    for ( var i = 1; i < sinWaveState.len; i++ ) {
      sinWaveState.sinAngle[i] = Math.sin(angle);
      if((sinWaveState.sinAngle[i-1] > 0 && sinWaveState.sinAngle[i] < 0) ||
         (sinWaveState.sinAngle[i-1] < 0 && sinWaveState.sinAngle[i] > 0)) {
        angleGap = Math.random() * 0.01 + 0.05;
      }
      angle += angleGap;
    }
    sinWaveState.sinWaveColor(context, width, height);
    sinWaveState.initialized = true;
  }
};

var mp3player = {
  /* drawDots: Draws the visualizer as dots */
  drawDots: function(data) {
    var radius = 4;
    var value = 0;
    var offset = (mp3player.canvasHeight/2) * 0.25;

    for( var i = 0; i < data.length; i++ ) {
      value = data[i] + offset;
      mp3player.ctx1.beginPath();
      mp3player.ctx1.arc(i*12, mp3player.canvasHeight - value, radius, 0, 2 * Math.PI, false);
      mp3player.ctx1.fillStyle = mp3player.dotGradient;
      mp3player.ctx1.fill();
      mp3player.ctx1.lineWidth = 1;
      mp3player.ctx1.strokeStyle = '#003300';
      mp3player.ctx1.stroke();
    }
  },
  
  /* drawInvertedBars: draws visualizer as two sets inverted on each other  */
  drawInvertedBars: function(data) {
    var spacer_width = 10;
    var bar_width = 5;
    var indexOffset = 100;
    var offset = (mp3player.canvasHeight/3) * 0.25;
    var numBars = Math.round(mp3player.canvasWidth / spacer_width );


    var value = 0;
    for( var i = 0; i < numBars; i++ ) {
      value = data[i + indexOffset] + offset;
      mp3player.ctx1.fillStyle = '#F6D565';
      mp3player.ctx1.lineCap = 'round';
      mp3player.ctx1.fillRect(i * spacer_width, mp3player.canvasHeight , bar_width, -value );
      mp3player.ctx1.fillStyle = '#3A5E8C';
      mp3player.ctx1.lineCap = 'round';
      mp3player.ctx1.fillRect(i * spacer_width, 0 , bar_width, value );
    }
  },

  /* drawRadialBars: Draws visualizer as bars radiating from the center of the canvas */
  drawRadialBars: function(data) {
    var centerX = parseInt(mp3player.canvasWidth / 2, 10);
    var centerY = parseInt(mp3player.canvasHeight / 2, 10);
    var radius = 10;
    var value = 0;
    var offset = (mp3player.canvasHeight/2) * 0.25;

    mp3player.ctx1.beginPath();
    mp3player.ctx1.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    mp3player.ctx1.fillStyle = mp3player.pulseGradient;
    mp3player.ctx1.fill();

    var radians, innerX, outerX, innerY, outerY;
    for ( var i = 0; i < data.length; i++ ) {
      value = data[i] + offset;
      radians = i * (2 * Math.PI / 180);
      innerX = centerX + radius * Math.cos(radians);
      innerY = centerY + radius * Math.sin(radians);
      outerX = centerX + value * Math.cos(radians) ;
      outerY = centerY + value * Math.sin(radians)- (value * 0.10);

      mp3player.ctx1.beginPath();
      mp3player.ctx1.moveTo(innerX, innerY);
      mp3player.ctx1.lineTo(outerX, outerY);
      mp3player.ctx1.strokeStyle = mp3player.dotGradient;
      mp3player.ctx1.lineWidth = (i % 5);
      mp3player.ctx1.stroke();

    }
  },

  /* drawBigPulse: Draws the visualizer as a pulse that emits radials */
  drawBigPulse: function(data) {
    var stateVars = bigPulseState;
    var i, len, maxWidth;
    var circleEnd = 2 * Math.PI, speed = 20, average, total = 0,
      center = {
        x: Math.floor(mp3player.canvasWidth / 2),
        y: Math.floor(mp3player.canvasHeight / 2)
      };


    for (var t = 0, len_t = data.length; t < len_t; t += 10) {
      total += data[t];
    }
    average = total / len_t * 10;


    mp3player.ctx1.fillStyle = mp3player.pulseGradient;
    mp3player.ctx1.beginPath();
    mp3player.ctx1.arc(center.x, center.y, average, 0, circleEnd, true);
    mp3player.ctx1.closePath();
    mp3player.ctx1.fill();

    mp3player.ctx1.lineWidth = 4;
    for (i = 0, len = stateVars.circles.length, maxWidth = mp3player.canvasWidth / 1.5; i < len; i++) {
      var c = stateVars.circles[i];
      if (c.a == 0) {
        continue;
      }
      mp3player.ctx1.strokeStyle = c.c;
      mp3player.ctx1.beginPath();
      mp3player.ctx1.arc(center.x, center.y, c.r, 0, circleEnd, true);
      mp3player.ctx1.closePath();
      mp3player.ctx1.stroke();
      c.r += speed;
      if (c.r > maxWidth) {
        c.a = 0;
      }
    }
    if (average < stateVars.lastAvarage) {
      if (stateVars.addCount > 2) {
        for (i = 0, len = stateVars.circles.length; i < len; i++) {
          if (stateVars.circles[i].a == 0) {
            stateVars.circles[i].c = stateVars.currentColor;
            stateVars.circles[i].r = average;
            stateVars.circles[i].a = 1;
            break;
          }
        }
      } else if (stateVars.addCount > 0) {
        stateVars.currentColor = stateVars.colors[utils.intRandom(0, stateVars.colors.length)];
      }
      stateVars.addCount = 0;
    } else {
      stateVars.addCount++;
    }
    stateVars.lastAvarage = average;
  },

  /* drawConnectedParticles: draws visualizer as a particles with connected limbs of related particles */
  drawConnectedParticles: function(data) {
    var stateVars = connectedParticlesState;
    var p, p2, i, j, len, factor, total, avg;
    len = data.length / 2; //256; //data.length / 2;
    mp3player.ctx1.globalCompositeOperation = 'lighter';
    mp3player.ctx1.linewidth = 0.5;

    for (i = 0, total = 0; i < len; i++) {
      total += data[i];
    }
    avg = total / len;
    var partLen = stateVars.particles.length;

    for(i = 0; i < partLen; i++){
      p = stateVars.particles[i];
      factor = 1;
      for(j = 0; j < partLen; j++){
        p2 = stateVars.particles[j];
        if(p.rgba == p2.rgba && utils.findDistance(p, p2) < avg){
          mp3player.ctx1.strokeStyle = p.rgba;
          mp3player.ctx1.beginPath();
          mp3player.ctx1.moveTo(p.x, p.y);
          mp3player.ctx1.lineTo(p2.x, p2.y);
          mp3player.ctx1.stroke();
          factor += 0.6;
        }
      }

      mp3player.ctx1.fillStyle = p.rgba;
      mp3player.ctx1.strokeStyle = p.rgba;

      mp3player.ctx1.beginPath();
      mp3player.ctx1.arc(p.x, p.y, p.rad * factor, 0, Math.PI * 2, true);
      mp3player.ctx1.fill();
      mp3player.ctx1.closePath();

      mp3player.ctx1.beginPath();
      mp3player.ctx1.arc(p.x, p.y, (p.rad + 5) * factor, 0, Math.PI * 2, true);
      mp3player.ctx1.stroke();
      mp3player.ctx1.closePath();

      p.x += p.vx;
      p.y += p.vy;

      if(p.x > mp3player.canvasWidth + p.rad) p.x = 0;
      if(p.x < -p.rad) p.x = mp3player.canvasWidth;
      if(p.y > mp3player.canvasHeight + p.rad) p.y = 0;
      if(p.y < -p.rad) p.y = mp3player.canvasHeight;
    }
  },

  /* drawPeakedBars: draws visualizer as a bars with peaked decaying points */
  drawPeakedBars: function(data) {
    var stateVars = peakedBarsState;
    var total = 0, b, iData, barHeight;
    var offset = (mp3player.canvasHeight > 400 ) ? (mp3player.canvasHeight/2) * 0.25 : 0;


    for (var i = 0; i < stateVars.barSize; i++) {
      iData = i + 128;
      b = stateVars.bars[i];
      if (b.h == 0) {
        b.h = data[iData] + offset;
      } else {
        if (b.h < data[iData]) {
          b.h += Math.floor((data[iData] - b.h) / 2);
        } else {
          b.h -= Math.floor((b.h - data[iData]) / 1.2);
        }
      }
      b.h *= 1.7;
      barHeight = mp3player.canvasHeight/3;
      mp3player.ctx1.fillStyle = 'rgba(' + b.color + ', 0.8)';
      mp3player.ctx1.fillRect(b.x, mp3player.canvasHeight - b.h, b.w, barHeight);

      stateVars.dots[i] = (stateVars.dots[i] < b.h) ? b.h : stateVars.dots[i]-1;

      mp3player.ctx1.fillStyle = mp3player.ctx1.fillStyle.replace('0.8)', '0.5)');
      mp3player.ctx1.fillRect(b.x, mp3player.canvasHeight - stateVars.dots[i]- b.w , b.w, b.w);
      total += data[iData];
    }
  },
  
  /* drawLifeLine: draws visualizer that appears like a EKG life line */
  drawLifeLine: function(data) {
    var gradients = [mp3player.barGradient, mp3player.rgbGradient, mp3player.hotGradient];
    var color = gradients[parseInt(mp3player.currTime) % gradients.length]; // mp3player.rgbGradient; //mp3player.hotGradient;

    var stateVars = lifeLineState;
    var width = mp3player.canvasWidth / 128,
      x = 0,
      y = 0,
      i, j,
      direction = 1,
      middle = mp3player.canvasHeight / 2,
      separateLength = 0,
      separateNum = 0,
      total = 0,
      lastAverage = stateVars.average;

    stateVars.changeColor();
    var r = stateVars.color.r,
        g = stateVars.color.g,
        b = stateVars.color.b;

    mp3player.ctx1.shadowColor = 'rgba(' + (r + 70) + ', ' + (g + 70) + ', ' + (b + 70) + ', 1)';
    mp3player.ctx1.shadowBlur = stateVars.shadowBlur;
    mp3player.ctx1.strokeStyle = color; //mp3player.barGradient;
    //mp3player.ctx1.strokeStyle = 'rgba(' + r + ', ' + g + ', ' + b + ', 1)';
    mp3player.ctx1.lineWidth = 5;
    mp3player.ctx1.lineJoin = 'miter';
    mp3player.ctx1.miterLimit = 100;
    mp3player.ctx1.beginPath();
    mp3player.ctx1.moveTo(0, middle);
    if (stateVars.separateTimer == 0) {
      stateVars.separateTimer = Math.floor(Math.random() * 50) + 20;
      for (i = 0; i < 128; i++) {
        stateVars.separate[i] = 0;
      }
      separateNum = Math.floor(Math.random() * 15);
      for (i = 0; i < separateNum; i++) {
        separateLength = Math.floor(Math.random() * 15);
        var temp = Math.floor(Math.random() * 128);
        stateVars.separate[temp] = 1;
        for (j = 1; j < separateLength; j++) {
          stateVars.separate[temp + j] = 1;
        }
      }
    } else {
      stateVars.separateTimer--;
    }
    var scaleFactor = stateVars.scaleFactor(mp3player.canvasHeight);  // 80;

    for (i = 0; i < 128; i++) {
      y = data[i] - (100 - i) * 0.5; // GEEK
      y = (y - scaleFactor) < 0 ? 0 : y - scaleFactor;
      if (y > middle) {
        y = middle;
      }
      if (stateVars.separate[i] == 1) {
        stateVars.lastValue[i] -= 20;
        if (stateVars.lastValue[i] < 0) {
          stateVars.lastValue[i] = 0;
        }
        y = stateVars.lastValue[i];
      } else {
        if (y - stateVars.lastValue[i] > 20) {
          stateVars.lastValue[i] += 20;
          y = stateVars.lastValue[i];
        } else {
          stateVars.lastValue[i] = y;
        }
      }
      y = y * direction + middle;

      mp3player.ctx1.lineTo(x, y );
      total += y;
      direction = -direction;
      x = x + width;
    }
    stateVars.average = total / 128;
    if (lastAverage > stateVars.average) {
      stateVars.shadowBlur--;
    } else {
      stateVars.shadowBlur++;
    }
    mp3player.ctx1.lineTo(mp3player.canvasWidth, middle);
    mp3player.ctx1.stroke();
  },


  /* drawTriangles: draws visualizer as rotating triangles */
  drawTriangles: function(data) {
    var stateVars = triangleState;
    var angle = stateVars.beginAngle,
      cx = mp3player.canvasWidth / 2,
      cy = mp3player.canvasHeight / 2,
      total = 0, k, px, py, size, shade,
      speedFactor = (data.length >= 1024) ? 32 : 16,
      len = data.length / speedFactor,
      twoPI = 2 * Math.PI,
      angleGap = twoPI / 3,
      color =  'rgba(186, 135, 72, 0.5)';

    // draw star field
    for(var j = 0; j < stateVars.stars.length; j++ ) {
     stateVars.stars[j].z -= 0.01;
      if( stateVars.stars[j].z <= 0 ) {
        stateVars.stars[j].x = utils.intRandom(-25,25);
        stateVars.stars[j].y = utils.intRandom(-25,25);
        stateVars.stars[j].z = stateVars.MAX_DEPTH;
      }

      k = 128 / stateVars.stars[j].z;
      px = stateVars.stars[j].x * k + cx;
      py = stateVars.stars[j].y * k + cy;

      if ( px >= 0 && px <= mp3player.canvasWidth && py >= 0 && py <= mp3player.canvasHeight ) {
        size = (1 - stateVars.stars[j].z / 32.0) * 5;
        shade = parseInt((1 - stateVars.stars[j].z / 32.0) * 255);
        mp3player.ctx1.fillStyle = 'rgb(' + shade + ',' +shade +',' + shade + ')';
        mp3player.ctx1.fillRect(px,py, size, size);
      }
    }

    mp3player.ctx1.globalCompositeOperation = 'lighter';
    mp3player.ctx1.strokeStyle = color;
    mp3player.ctx1.lineWidth = 10;
    for (var i = 12; i < len; i += 2) {
      angle += 0.2;
      mp3player.ctx1.beginPath();
      mp3player.ctx1.moveTo(cx + data[i] * Math.sin(angle), cy + data[i] * Math.cos(angle));
      mp3player.ctx1.lineTo(cx + data[i] * Math.sin(angle + angleGap), cy + data[i] * Math.cos(angle + angleGap));
      mp3player.ctx1.lineTo(cx + data[i] * Math.sin(angle + angleGap * 2), cy + data[i] * Math.cos(angle + angleGap * 2));
      mp3player.ctx1.closePath();
      mp3player.ctx1.stroke();
      total += (data[i]);
    }
    stateVars.beginAngle = (stateVars.beginAngle + 0.00001 * total) % twoPI;
  },

  /* drawSinWave:  draws visualizer as a sin wave */
  drawSinWave: function(data) {
    var stateVars = sinWaveState;
    var halfH = mp3player.canvasHeight / 2, x, gap, cx, cy, i;
    var offset = (mp3player.canvasHeight > 400 ) ? (mp3player.canvasHeight/2) * 0.25 : 0;

    for( i=0; i < stateVars.len; i++ ) {
      stateVars.line[i] = (data[i] + offset) * stateVars.sinAngle[i];
    }
    mp3player.ctx1.shadowColor = '#fffa47';
    mp3player.ctx1.shadowBlur = 15;
    mp3player.ctx1.color =  mp3player.barGradient;
    mp3player.ctx1.strokeStyle = mp3player.barGradient;
    mp3player.ctx1.lineWidth = 2;

    mp3player.ctx1.beginPath();
    x = 0;
    gap = Math.ceil(mp3player.canvasWidth / stateVars.len);
    mp3player.ctx1.moveTo(x, halfH);
    for( i=1; i < stateVars.len; i++ ) {
      cx = (x + x + gap ) / 2;
      cy = halfH - (stateVars.line[i] + stateVars.line[i+1]) / 2;
      mp3player.ctx1.quadraticCurveTo(x, halfH - stateVars.line[i], cx, cy);
      x += gap;
    }
    mp3player.ctx1.quadraticCurveTo(x, halfH - stateVars.line[i], x + gap, halfH - stateVars.line[i+1]);
    mp3player.ctx1.stroke();
  },

  /* drawRadialPeaks:  Draw circled clock graph, inspired by the Apple Watch */
  drawRadialPeaks: function(data) {
    var stateVars = radialBarsState;
    var colors = stateVars.colors,
      RANDOM_COLORS = true,
      recycleColors = (RANDOM_COLORS && (parseInt(mp3player.currTime) % colors.length === 0)),
      centerY = parseInt( mp3player.canvasHeight / 2, 10 ),
      centerX = parseInt( mp3player.canvasWidth / 2, 10 ),
      radius = Math.floor(Math.min(centerY, centerX)-10 ),
      ROTATE_TO_TOP = false,
      degToRads = (Math.PI/180),
      startDeg = (ROTATE_TO_TOP ) ? 270 : 0,// this is the top of the circle
      startAngle = startDeg * degToRads, //1.50 * Math.PI //just a hair off the top
      endAngle = (2 * Math.PI), // this is 0 radians
      lineWidth = 15,
      done = false;


    /* If we have a true statement, then we will randomize the colors every so often */
    if ( recycleColors ) {
      stateVars.randomizeColors();
    }

    var arc, value, tempVal, peanut;
    /* Only draw enough circles as we have radius available.  Done will be true when radius is less than lineWidth. */
    for ( var i = 0; !done && i < data.length; i++ ) {
      /* are doing our calculations in degrees and compute en dAngle to radians, if tempVal is greater than 360, then normalize it  */
      tempVal = startDeg + data[i];
      value = (tempVal > 360) ? (tempVal - 360) : tempVal;
      endAngle = value * degToRads;

      /* arc is pulled here for the color - it is used after the bar to compute the peanut */
      arc = stateVars.arcs[i];
      /* strokeStyle color is the index mod by the colors array length */
      mp3player.ctx1.strokeStyle = (RANDOM_COLORS) ?  'rgba('+arc.color+', 0.8)' : 'rgba('+colors[i%colors.length]+', 0.8)';
      mp3player.ctx1.lineCap = 'round';
      mp3player.ctx1.lineWidth = lineWidth;
      mp3player.ctx1.beginPath();
      mp3player.ctx1.arc( centerX, centerY, radius, startAngle, endAngle, false );
      mp3player.ctx1.stroke();

      /* now for the peanut arc - where is now and adjust decay of position */
      if( arc.h == 0 ) {
        arc.h = value;
      } else {
        if( arc.h < value ) {
          arc.h += Math.floor((value - arc.h)/2);
        } else {
          arc.h -= Math.floor((arc.h - value)/1.2);
        }
      }
      /* add 10% to the position, if we are the range of 270 to 360, make it the position of the long bar + 10%  */
      arc.h *= 1.1;
      if ( ROTATE_TO_TOP ) {
        arc.h = ( tempVal > 270 && tempVal <= 360 ) ? value * 0.10 : arc.h;
      }

      /* record the last position and resuse next time around the frame */
      stateVars.dots[i] = (stateVars.dots[i] < arc.h ) ? arc.h : stateVars.dots[i]-1;

      tempVal = stateVars.dots[i];

      /* What is the size of the peanut bar - radius affects the length, so adjust accordingly */
      peanut =  ( i <= 1 ) ? 3 : (stateVars.arcSize - (stateVars.arcSize - i ));
      /* Compute the peanut start and end angles into radians */
      arc.startAngle = tempVal * degToRads;
      tempVal += peanut;
      arc.endAngle = tempVal * degToRads;

      /* Draw the peanut */
      mp3player.ctx1.beginPath();
      mp3player.ctx1.strokeStyle = mp3player.ctx1.strokeStyle.replace('0.8)', '0.5)');
      mp3player.ctx1.arc( centerX, centerY, radius, arc.startAngle, arc.endAngle, false );
      mp3player.ctx1.stroke();

      /* compute the amount of radius we have remaining, if it is too little we are done with visualization */
      radius -= lineWidth+1;
      done = (radius < lineWidth);
    }
  },


  /* setupPatterns: places all the patterns into an array that will be cycled through at playtime  */
  setupPatterns: function () {
    mp3player.patterns.push(mp3player.drawCrossBars);          // 0
    mp3player.patterns.push(mp3player.drawSymmetricCentered);  // 1
    mp3player.patterns.push(mp3player.drawDots);               // 2
    mp3player.patterns.push(mp3player.drawInvertedBars);       // 3
    mp3player.patterns.push(mp3player.drawRadialBars);         // 4
    mp3player.patterns.push(mp3player.drawBigPulse);           // 5
    mp3player.patterns.push(mp3player.drawConnectedParticles); // 6
    mp3player.patterns.push(mp3player.drawPeakedBars);         // 7
    mp3player.patterns.push(mp3player.drawLifeLine);           // 8
    mp3player.patterns.push(mp3player.drawTriangles);          // 9
    mp3player.patterns.push(mp3player.drawSinWave);            // 10
    mp3player.patterns.push(mp3player.drawRadialPeaks);        // 11
  },

  /* toggleCanvasOrientation: When the pattern changes, assure the proper CSS class are applied */
  toggleCanvasOrientation: function() {
    var gui = document.getElementById('mp3gui');
    var classPresent = utils.hasClass('flat', gui);
    if ( mp3player.patternIndex === 0 && classPresent ) {
      utils.removeClass('flat', gui);
    }
    else if ( mp3player.patternIndex > 0 && !classPresent ) {
      utils.addClass('flat', gui);
    }

  },

  /* windowResizeHandler: The Window has resize event - make adjustments */
  windowResizeHandler: function() {
    var tHeight = parseInt(window.innerHeight * 0.60) + '';
    var tWidth = parseInt(window.innerWidth) + '';

    var fftel = document.getElementById('fft1');
    fftel.setAttribute('height', tHeight);
    fftel.setAttribute('width', tWidth);
    fftel = document.getElementById('fft2');
    fftel.setAttribute('height', tHeight);
    fftel.setAttribute('width', tWidth);

    var style = ( window.getComputedStyle ) ? window.getComputedStyle( mp3player.canvas1 ) :  mp3player.canvas1.currentStyle;
    mp3player.canvasHeight = parseInt( style.height, 10 );
    mp3player.canvasWidth = parseInt( style.width, 10 );

    try {
      peakedBarsState.init(mp3player.canvasWidth, mp3player.canvasHeight);
      connectedParticlesState.init(mp3player.canvasWidth, mp3player.canvasHeight);
      sinWaveState.init(mp3player.ctx1, mp3player.canvasWidth, mp3player.canvasHeight);
      // setup gradient colors
      mp3player.barGradient = mp3player.getBarGradient();
      mp3player.hotGradient = mp3player.getBarGradient2();
      mp3player.rgbGradient = mp3player.getBarGradient3();
      mp3player.dotGradient = mp3player.getDotGradient();
      mp3player.pulseGradient = mp3player.getCircleGradient();

    } catch(exc) {
      // Context of canvas may not yet be set
      console.log('Exception in resize of Window: Context of canvas may be null here: ' + exc);
    }

    console.log( 'mp3player.windowResizeHandler(): width=[' + mp3player.canvasWidth + '], height=[' + mp3player.canvasHeight + ']' );

  },


// GEEK HANS - start here
};

                
  function ParticleEl( i ) {
    this.r = Math.round( Math.random() * 255 | 0 );
    this.g = Math.round( Math.random() * 255 | 0 );
    this.b = Math.round( Math.random() * 255 | 0 );
    this.alpha = 1;

    this.x = (i * area_length) % W;
    this.y = (i * area_length) / W * area_length;


    /* randomize delta to make particles sparkling */
    this.deltaOffset = Math.random() * PULSATION_PERIOD | 0;

    this.radius = 0.2 + Math.random() * 2;
  }

  var positions = [];

  function new_positions() {
    tctx.fillStyle = "white";
    tctx.fillRect( 0, 0, W, H );
    tctx.fill();

    tctx.font = "bold " + QUALITY_TO_FONT_SIZE[QUALITY] + "px " + FANCY_FONT;
    var text = titles[itercount % titles.length]; // String(Math.random()).substr(-3);
    itercount++;

    tctx.strokeStyle = "black";
    tctx.strokeText( text, (QUALITY + 1) * 5, QUALITY_TO_TEXT_POS[QUALITY] );

    var image_data = tctx.getImageData( 0, 0, W, H );
    var pixels = image_data.data;
    positions = [];
    for ( var i = 0; i < pixels.length; i = i + 4 ) {
      if ( pixels[i] != 255 ) {
        var position = {
          x: (i / 4 % W | 0) * QUALITY_TO_SCALE[QUALITY] | 0, y: (i / 4 / W | 0) * QUALITY_TO_SCALE[QUALITY] | 0
        };
        positions.push( position );
      }
    }

    get_destinations();
  }

  function draw() {

    var now = Date.now();
    var mod = 1;

    ctx.globalCompositeOperation = "source-over";

    if ( BLUR ) ctx.globalAlpha = 0.1; else if ( !BLUR && !BLINK ) ctx.globalAlpha = 1.0;

    ctx.fillStyle = BACKGROUND;
    ctx.fillRect( 0, 0, W, H );

    if ( BLENDING ) ctx.globalCompositeOperation = "lighter";

    var p = null;

    for ( var i = 0; i < particles.length; i++ ) {
      p = particles[i];

      /* in lower qualities there is not enough full pixels for all of  them - dirty hack*/

      if ( isNaN( p.x ) ) {
        continue;
      }

      ctx.beginPath();
      ctx.fillStyle = "rgb(" + p.r + ", " + p.g + ", " + p.b + ")";
      ctx.fillStyle = "rgba(" + p.r + ", " + p.g + ", " + p.b + ", " + p.alpha + ")";


      if ( BLINK ) ctx.globalAlpha = Math.sin( Math.PI * mod );

      if ( PULSATION ) { /* this would be 0 -> 1 */
        mod = ((GLOBAL_PULSATION ? 0 : p.deltaOffset) + now) % PULSATION_PERIOD / PULSATION_PERIOD;

        /* lets make the value bouncing with sinus */
        mod = Math.sin( mod * Math.PI );
      } else {
        mod = 1;
      }

      var offset = TREMBLING ? TREMBLING * (-1 + Math.random() * 2) : 0;

      var radius = PARTICLE_RADIUS * p.radius;

      if ( !ARC ) {
        ctx.fillRect( offset + p.x - mod * radius / 2 | 0, offset + p.y - mod * radius / 2 | 0, radius * mod, radius * mod );
      } else {
        ctx.arc( offset + p.x | 0, offset + p.y | 0, radius * mod, 0, Math.PI * 2, false );
        ctx.fill();
      }


      p.x += (p.dx - p.x) / 10;
      p.y += (p.dy - p.y) / 10;
    }
  }

  function get_destinations() {
    var pa = null;
    var po = null;
    var n = 0;
    var nearest_position = 0;
    for ( var i = 0; i < particles.length; i++ ) {
      pa = particles[i];
      particles[i].alpha = 1;
      var distance = [];
      nearest_position = 0;
      if ( positions.length ) {
        for ( n = 0; n < positions.length; n++ ) {
          po = positions[n];
          distance[n] = Math.sqrt( (pa.x - po.x) * (pa.x - po.x) + (pa.y - po.y) * (pa.y - po.y) );
          if ( n > 0 ) {
            if ( distance[n] <= distance[nearest_position] ) {
              nearest_position = n;
            }
          }
        }
        particles[i].dx = positions[nearest_position].x;
        particles[i].dy = positions[nearest_position].y;
        particles[i].distance = distance[nearest_position];

        var po1 = positions[nearest_position];
        for ( n = 0; n < positions.length; n++ ) {
          var po2 = positions[n];
          distance = Math.sqrt( (po1.x - po2.x) * (po1.x - po2.x) + (po1.y - po2.y) * (po1.y - po2.y) );
          if ( distance <= 5 ) {
            positions.splice( n, 1 );
          }
        }
      } else {
        //particles[i].alpha = 0;
      }
    }
  }


  // function cancels all intervals hides clubnode section and renders the mp3 player view
  function stopClubNode() {
    clearInterval( interval_positions );
    clearInterval( interval_draw );
    var el = document.getElementById( 'clubnode' );
    utils.addClass( 'hide', el );
    utils.removeClass( 'show', el );

    el = document.getElementById( 'mp3connect' );
    utils.addClass( 'show', el );
    utils.removeClass( 'hide', el );

    var elList = document.getElementsByClassName('mp3player');
    for ( var i = 0; i < elList.length; i++) {
      el = elList[i];
      utils.removeClass('hide', el);
    }
    // Now we can start listening to mp3gui controls
    mp3player.init();
  }

  // If the 'skipIntro' element is present and the innerHTML is 'true'  then stop the intro and move onto the music
  function skipIntro() {
    var el = document.getElementById( "skipIntro" );
    var text = (el) ? el.innerHTML.toLowerCase() : 'false';
    if ( text === 'true' ) {
      stopClubNode();
    }
  }

  function init() {

    // default the mp3 file to none.
    document.getElementById( "mp3file" ).selectedIndex = 0;
    // Setup the initial positions
    new_positions();
    // Kick off animations and save interval references to cancel later
    interval_draw = setInterval( draw, 16.67 );
    interval_positions = setInterval( function () {
      new_positions();
      if ( itercount > titles.length ) {
        stopClubNode(); // Stop animations and move on
      }
    }, 2000 );

    skipIntro();
  }


  // future handlings of resize and do it once to start
  window.addEventListener("resize", mp3player.windowResizeHandler);
  //init the page.
  init();
};

////////////////////////////////////////////////////////////////////////////////////////////
// Kicks off the program start on Window load Event being fired.
// The first function fired is the init() function nested in the onload()
window.onload = function () {

  // The ALL_CAPS variables are intended as constants. Change them to change the behavior of the animations

  if ( typeof AudioContext !== "undefined" ) {
    console.log( 'Supported AudioContext()' );
  } else if ( typeof webkitAudioContext !== "undefined" ) {
    console.log( 'Supported webkitAudioContext()' );
  } else {
    alert( 'AudioContext not supported. :(' );
    throw new Error( 'AudioContext not supported. :(' );
  }


  var QUALITY_TO_FONT_SIZE = [10, 20, 50, 100, 200, 350];
  var QUALITY_TO_SCALE = [20, 14, 6, 3, 1.5, 0.9];
  var QUALITY_TO_TEXT_POS = [10, 18, 43, 86, 170, 280];

  /* trembling + blur = fun */
  var TREMBLING = 0;
  /* 0 - infinity */
  var FANCY_FONT = "arial";
  var BACKGROUND = "#001"; // 003
  var BLENDING = true;
  /* set false if you prefer rectangles */
  var ARC = false;
  /* play with these values */
  var BLUR = false;
  var PULSATION = true;
  var PULSATION_PERIOD = 500;
  var PARTICLE_RADIUS = 5;

  /* disable blur before using blink */
  var BLINK = false;
  var GLOBAL_PULSATION = false;
  var QUALITY = 2;
  /* 0 - 5 */

  document.body.style.backgroundColor = BACKGROUND;
  var titles = ['club', 'nerd!', 'Club', 'Node!'];
  var itercount = 0;
  var interval_positions = null;
  var interval_draw = null;


  var canvas = document.getElementById( "clubnode-canvas" );
  var ctx = canvas.getContext( "2d" );

  var W = canvas.width;
  var H = canvas.height;

  var tcanvas = document.createElement( "canvas" );
  var tctx = tcanvas.getContext( "2d" );
  tcanvas.width = W;
  tcanvas.height = H;


  var total_area = W * H;
  var total_particles = 2000;
  var single_particle_area = total_area / total_particles;
  var area_length = Math.sqrt( single_particle_area );
  console.log( 'Window.onload(): Area length of ClubNode canvas ' + area_length );

  var particles = [];
  for ( var i = 1; i <= total_particles; i++ ) {
    particles.push( new ParticleEl( i ) );
  }


////////////////////////////////////////////////////////////////////////////////////////////
