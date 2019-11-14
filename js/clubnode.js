

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
