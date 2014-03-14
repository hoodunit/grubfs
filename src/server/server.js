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
    response.send(data.httpCode, data);
  });
}

server.post('/event', function(request, response){
  var adminUser = process.env.FSIO_USER_NAME;
  var adminPass = process.env.FSIO_PASSWORD;

  var requestData = request.body;
  var email = requestData.email;
  var password = requestData.password;

  var result = FsioAPI.signUp(email, password, adminUser, adminPass);
  respond(response, result);
});

var port = 8080;
server.listen(port);
console.log('Server running on localhost:' + port);
  
