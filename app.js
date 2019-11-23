var express = require('express');
var fs = require('fs');
var app = express();


app.get('/',function(req,res){

//      return res.redirect('/public/index.html');
      return res.sendFile('index.html', {root: __dirname });

    });

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
//app.use('/public', express.static(__dirname + '/public'));

/** Implementing Simple Music Server using Express JS **/
app.get('/music', function(req,res){
        // File to be served

      var fileId = req.query.id;
      var file = __dirname + '/music/' + fileId;
      console.log("Streaming file: " + file);
      fs.exists(file,function(exists){
            if(exists)
            {
              
              var rstream = fs.createReadStream(file);
              rstream.pipe(res);
            }
            else
            {
              res.send("Its a 404");
              res.end();
            }

          });

    });
app.get('/download', function(req,res){
      var fileId = req.query.id;
      var file = __dirname + '/music/' + fileId;
      fs.exists(file,function(exists){
            if(exists)
            {
              res.setHeader('Content-disposition', 'attachment; filename=' + fileId);
              res.setHeader('Content-Type', 'application/audio/mpeg3')
                  var rstream = fs.createReadStream(file);
              rstream.pipe(res);
            }
            else
            {
              res.send("Its a 404");
              res.end();
            }
          });


    });

app.get('/list', function(req,res){
      
      console.log("List is reqyested from client");


      var fileId = req.query.id;
      var path = __dirname + '/music';
      var jsonRes = '';

      fs.readdir(path, function(err,items){
              // Sort the new array
            items.sort();

              // Creat the json response
            jsonRes += `{ "list" : "/music", "items" : [`;
            for(var i = 0; i < items.length; i++ ) {
              
              jsonRes += `"${items[i]}"`;
              
              jsonRes += ( i < items.length - 1 ) ? "," : "";
              
            }
            jsonRes += `] }`;

             // Send the response
//            console.log(jsonRes);
            console.log("List sent to client");
            res.send(jsonRes);
            res.end();

          });

    });


app.listen(3003,function(){
      console.log('App listening on port 3003!');
    });
