var express = require('express');

var FsioAPI = require('../shared/fsio_api');
  
var server = express();
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
  var result = FsioAPI.signUp(requestData);
  respond(response, result);
});

var port = 8080;
server.listen(port);
console.log('Server running on localhost:' + port);
  
