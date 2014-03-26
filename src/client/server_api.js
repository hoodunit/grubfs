var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');

function signUp(email, password){
  var serverUrl = document.location.origin;
  var url = serverUrl + '/event';
  var requestData = {email: email, password: password};

  var request = {
    url: url,
    type: 'POST',
    dataType: 'json',
    data: requestData
  };

  return Bacon.fromPromise($.ajax(request));
}

module.exports = {
  signUp: signUp
};
