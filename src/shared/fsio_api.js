var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');
var jsSHA = require('jssha');

require('../shared/bacon.ajax');

var constants = {
  FSIO_BASE_URL: 'https://api-fip.sp.f-secure.com/v2',
  FSIO_DATA_URL: 'https://data-fip.sp.f-secure.com/v2',
  OPERATOR_ID: 67901,
  CRAM_CHALLENGE_URL: '/token/cram/challenge',
  CRAM_CHALLENGE_RESP_URL: '/token/cram/user'
};

function signIn(email, password){
  var challenge = requestAuthorizationChallenge(email);
  var challengeResponse = challenge.map(hashChallenge, password);
  var signInData = Bacon.combineWith(sendChallengeResponse, 
                                     email, challenge, challengeResponse).ajax();

  return signInData;
}

function requestAuthorizationChallenge(email){
  var url = constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_URL;
  var requestData = {operator_id: constants.OPERATOR_ID, 
                     user_name: email};
  var request = makeRequest(url, requestData);
  var response = Bacon.$.ajax(request);
  return response.map('.challenge');
}

function sendChallengeResponse(email, challenge, challengeResponse){
  var url = constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_RESP_URL;
  var requestData = {operator_id: constants.OPERATOR_ID, 
                     user_name: email,
                     challenge: challenge,
                     response: challengeResponse};

  var request = makeRequest(url, requestData);
  return request;
}

function hashChallenge(password, challenge){
  var shaObj = new jsSHA(challenge, "B64");
  var hmac = shaObj.getHMAC(password, "TEXT", "SHA-256", "HEX");

  return hmac;
}

function makeRequest(url, data){
  return {url: url,
          type: 'POST',
          data: JSON.stringify(data)};
          
}

module.exports = {
  signIn: signIn,
  test: {
    hashChallenge: hashChallenge
  }
};
