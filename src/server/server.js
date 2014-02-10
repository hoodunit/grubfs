var express = require('express');

var Fsio = require('./fsio');
  
var server = express();
var serverPath = __dirname;
var rootPath = serverPath + '/../..';

function useMockAPIIfTestServer(){
  var commandLineArgs = process.argv;
  for(var i = 0; i < commandLineArgs.length; i++){
    if(commandLineArgs[i] === 'test-server'){
      Fsio = require('./fsio_mock');
      console.log('Using mock FSIO API for testing');
      return;
    }
  }
}

useMockAPIIfTestServer();

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
  var result = Fsio.signUp(requestData);
  respond(response, result);
});

var port = 8080;
server.listen(port);
console.log('Server running on localhost:' + port);
  
