var $ = require('jquery-browserify');
var Bacon = require('baconjs');
  
function baconExample(){
  var mouseClicks = $("h1").asEventStream("click");

  mouseClicks.onValue(function() {
    console.log("Mouse clicked");
  });
}
  
baconExample();

console.log("JavaScript loaded");
