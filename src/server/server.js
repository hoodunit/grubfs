var express = require('express');
var server = express();
var Bacon = require('baconjs');
  
var serverPath = __dirname;
var rootPath = serverPath + '/../..';

server.configure(function(){
  server.use(express.static(rootPath + '/public'));
});

var port = 8080;
server.listen(port);
console.log('Server running on localhost:' + port);
  
function baconExample(){
  var baconMsgs = Bacon.fromCallback(function(callback) {
    setTimeout(function() {
      callback("Bacon!");
    }, 1000);
  });

  baconMsgs.onValue(function(val){
    console.log("Received message:", val);
  });
}

baconExample();
