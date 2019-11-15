
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