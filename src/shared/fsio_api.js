var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');
require('../shared/bacon.ajax');

var constants = {
  FSIO_BASE_URL: 'https://api-fip.sp.f-secure.com/v2',
  FSIO_DATA_URL: 'https://data-fip.sp.f-secure.com/v2',
  OPERATOR_ID: 67901,
  CRAM_CHALLENGE_URL: '/token/cram/challenge',
  CRAM_CHALLENGE_RESP_URL: '/token/cram/user'
};

function requestAuthorizationChallenge(email){
  var url = constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_URL;
  var requestData = {operator_id: constants.OPERATOR_ID, 
                     user_name: email};
  var request = makeRequest(url, requestData);

  return Bacon.$.ajax(request);
}

function makeRequest(url, data){
  return {url: url,
          type: 'POST',
          data: JSON.stringify(data)};
          
}

module.exports = {
  requestAuthorizationChallenge: requestAuthorizationChallenge
};
