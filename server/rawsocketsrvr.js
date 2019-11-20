/*
 *
 */
var WebSocketServer = require('websocket').server;
var http = require('http');
var os = require('os');
var url = require( "url" );
var queryString = require( "querystring" );
var frameProcessor = require('./frameProcessor');

// Ok, in all this network mumbo jumbo, we need to protect our app from crashing.
process.on('uncaughtException', function (err) {
  console.log('Process caught Exception: CHECK FCSERVER! ' + err);
});

console.log('Starting server...');

var interfaces = os.networkInterfaces();
var addresses = [];
for (var k in interfaces) {
  for (var k2 in interfaces[k]) {
    var address = interfaces[k][k2];
    if (address.family === 'IPv4' && !address.internal) {
      addresses.push(address.address);
    }
  }
}

// This is used to maintain the message that a build break occurred.
var build_status = null;

// Create a server and listen for a http request that examines the parameters,
// it looks for build break and then the culprit.  holds the information to be
// sent back to the web socket client.  And then acknowledges receipt of the message.
var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets server
  // we don't have to implement anything.
  // parses the request url
  var theUrl = url.parse( request.url );
  console.log('req: theUrl='+ theUrl);

  // gets the query part of the URL and parses it creating an object
  var queryObj = queryString.parse( theUrl.query );
  console.log('req: queryObj='+ JSON.stringify(queryObj));
  if (queryObj.hasOwnProperty('build') && queryObj['build'] === 'broken' ) {
    build_status = 'Build-break';
    if (queryObj.hasOwnProperty('culprit') && queryObj['culprit'].length > 0 ) {
      build_status += ' ' + 'by' + ' ' + queryObj['culprit'];
    }
    console.log(build_status);
  }

  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end('ACK: Acknowledged: '+build_status+' \n');

});
// Start the server listen on port 1234
server.listen(1234, function() {
  console.log('Listening on address: ' + JSON.stringify(addresses) + ', port: 1234');
});

// create the Web Socket Server
var wsServer = new WebSocketServer({
  httpServer: server
});
// WebSocket server - Manage the connection request
wsServer.on('request', function(request) {
  var connection = request.accept(null, request.origin);
  connection.binaryType = "arraybuffer"; // GEEK: optimize the receiving data
  console.log(new Date() + 'client connected' );
  // interval check, if we have a build break message and we certainly have a server connection -
  // send the message to the client, clear the build_status message
  var breakInterval = setInterval(function() { if ( build_status != null ) { connection.sendUTF(build_status); build_status=null; } },3000);


  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function(message) {
    var data, type = message.type;
    //console.log('Data Type came through, type=['+type+']');
    if( type == 'binary' && 'binaryData' in message && message.binaryData instanceof Buffer) {
      // We have an ArrayBuffer // length=['+message.binaryData.length+']
      data = message.binaryData;
      frameProcessor.process(data);
      //data = new Uint8Array(message.binaryData, 0, message.binaryData.length); // convert to Uint8Array
    }
    else {
      // Some other data type came through
      data = message.utf8Data;
      if ( typeof data === 'string' && data.toLowerCase().indexOf("break") > -1 ) {
        frameProcessor.buildBreak();
      }
    }
    //console.log(type + ' Data Type, length=['+data.length+'], data=['+JSON.stringify(data)+']');
    //console.log(type + ' Data Type, data=['+data+']');

  });

  // Connection close,  if you have the ability to cleanup anything, do it here
  connection.on('close', function(connection) {
    build_status=null; // ensure we do not have another message geared up
    clearInterval(breakInterval); // clear the interval
    setTimeout(frameProcessor.close, 500); // close off the display
    console.log('Client requested Connection closed for business');
  });
});
