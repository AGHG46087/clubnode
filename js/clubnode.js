
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
