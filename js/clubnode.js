
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
