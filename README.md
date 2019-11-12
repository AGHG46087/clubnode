# Club Node: #

<i>Note:  Some browser disabled pull from local,  will be adding a server to serve music to browsers</i>

Club Node is a music visualizer that cycles through various different visualizations -  

### What is this repository for? ###

* Provides various visualizations of MP3 music.  
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### How do I get set up? ###

* By default the introduction screen is disabled. To enable the introduction screen modify the HTML.  `<span id="skipIntro">false</span>`
* The HTML comes with several songs already bundled. Select the song of interest from the drop down list.
* Additional the visualizer also has the ability to connect to a web socket. In the input box place the IP address of the web-socket. the default port of **1234** 
* To connect the server to a LED display as this visualizer was implemented. I used a [AdaFruit Shield ](https://www.adafruit.com/products/1430), Also a [FadeCandy](https://www.adafruit.com/products/1689) board.  Along with the fcserver following the [Open Pixel Control](http://openpixelcontrol.org/).In the Server directory is a node module opc.js which provides basic functions and color manipulations that follows the [Open Pixel Control](http://openpixelcontrol.org/). 
* To run the application, Chrome is required.  there are features as part of the Audio processing the HTML5 audio element was utilized and at the time of implementation,  only Chrome had the the capability to connect the HTML5 audio to the analyzer node.  To connect up to the the web socket server  open a terminal to the server directory and enter **`node rawsocketsrvr.js`**

* Download to a directory of your choosing, and open the index.html with the Chrome browser.

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

