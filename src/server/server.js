var express = require('express');
var server = express();
  
var serverPath = __dirname;
var rootPath = serverPath + '/../..';
var jsPath = serverPath + '/../client';

server.configure(function(){
  server.use('/js', express.static(jsPath));
  server.use(express.static(rootPath + '/public'));
});

var port = 8080;
server.listen(port);
console.log('Server running on localhost:' + port);
