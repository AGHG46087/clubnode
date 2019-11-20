
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


// GEEK HANS - start here      
                
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
