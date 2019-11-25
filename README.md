# Club Node: #

<i>Note:  Some browser disabled pull from local,  will be adding a server to serve music to browsers</i>

Club Node is a music visualizer that cycles through various different visualizations -  

### What is this repository for? ###

* Provides various visualizations of MP3 music.  

### How do I get set up? ###

* By default the introduction screen is enabled. To disable the introduction screen modify the HTML.  `<span id="skipIntro">false</span>`

* Download the repository:
* Add your own music files to the `/music` directory (not inlcuded here for muisic licensing reasons).  I typically have them named in the format of `Artist_SongName.mp3`.  the application will handle the rest
* npm install
* node app.js

Upon startup the applicaiton will connect to the server acquiring a list of songs in the music directory.  and populate the list.
When seen the the list at the top of the screen select the song you want and away it goes.
Visualizations are rotated,  but if you like just one,  you can select the one you like and will stay put.

* The HTML in general no modification. Select the song of interest from the drop down list.
* To run the application, Most modern versions of the browser will work. Chrome may be better for this repository.  there are features as part of the Audio processing the HTML5 audio element was utilized and at the time of implementation,  only Chrome had the the capability to connect the HTML5 audio to the analyzer node.


* Download to a directory of your choosing, and open the index.html with the Chrome browser.

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)
