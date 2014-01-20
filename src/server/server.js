var express = require('express');
var server = express();
var Bacon = require('baconjs');

var Fsio = require('./fsio');
  
var serverPath = __dirname;
var rootPath = serverPath + '/../..';

server.configure(function(){
  server.use(express.static(rootPath + '/public'));
  server.use(express.bodyParser());
});

function respond(response, stream){
  var jsonStream = stream.map(JSON.stringify);
  jsonStream.onValue(function(data){
    response.send(data);
  });
  jsonStream.onError(function(data){
    response.send(data);
  });
}

server.post('/event', function(request, response){
  var requestData = request.body;
  console.log('request data:', requestData);
  var result = Fsio.signUp(requestData);
  respond(response, result);
});

var port = 8080;
server.listen(port);
console.log('Server running on localhost:' + port);
  
