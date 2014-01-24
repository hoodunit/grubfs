var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');
var jsSHA = require('jssha');
var _ = require('mori');
require('../server/bacon.ajax');

var constants = {
  FSIO_BASE_URL: 'https://api-fip.sp.f-secure.com/v2',
  OPERATOR_ID: 67901,
  CRAM_CHALLENGE_URL: '/token/cram/challenge',
  CRAM_CHALLENGE_RESP_URL: '/token/cram/user'
};

function signUp(event){
  // var requestEvent = _.dissoc(event, 'eventType');
  // var jsonEvent = JSON.stringify(_.clj_to_js(requestEvent));
  // console.log('sending to server:', jsonEvent);

  // var serverUrl = document.location.origin;
  // var eventUrl = serverUrl + '/event';
  // var options = {type: 'POST', 
  //                data: jsonEvent, 
  //                dataType: 'json',
  //                contentType: 'application/json; charset=utf-8'};
  // var response = Bacon.fromPromise($.ajax(eventUrl, options));
  // response.log('response:');
  var email = _.get(event, 'email');
  var password = _.get(event, 'password');
  // var authCredentials = response.flatMap(signIn, email, password);
  var authCredentials = signIn(email, password);
  var signInEvents = authCredentials.map(_.js_to_clj)
    .map(_.hash_map, 
         'eventType', 'signIn', 
         'email', email,
         'credentials');

  return signInEvents;
}

function signIn(email, password){
  var challenge = sendChallengeRequest(email);
  var challengeResponse = challenge.map(hashChallenge, password);
  var signInData = Bacon.combineWith(makeChallengeResponseRequest, 
                                     email, challenge, challengeResponse).ajax();

  challenge.log('challenge:');
  challengeResponse.log('challenge response:');
  signInData.log('signInData:');

  return signInData;
}

function sendChallengeRequest(email){
  var challengeRequest = makeChallengeRequest(email);
  var response = Bacon.$.ajax(challengeRequest);
  var challenge = response.map('.challenge');
  return challenge;
}

function makeChallengeRequest(email){
  var url = constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_URL;
  var requestData = {operator_id: constants.OPERATOR_ID, 
                     user_name: email};
  return makeRequest(url, requestData);
}

function hashChallenge(password, challenge){
  var shaObj = new jsSHA(challenge, "B64");
  var hmac = shaObj.getHMAC(password, "TEXT", "SHA-256", "HEX");

  return hmac;
}

function makeChallengeResponseRequest(email, challenge, challengeResponse){
  var url = constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_RESP_URL;
  var requestData = {operator_id: constants.OPERATOR_ID, 
                     user_name: email,
                     challenge: challenge,
                     response: challengeResponse};

  return makeRequest(url, requestData);
}

function makeRequest(url, data){
  return {url: url,
          type: 'POST',
          contentType: 'application/json; charset=utf-8',
          data: JSON.stringify(data)};
          
}

module.exports = {
  signIn: signIn,
  signUp: signUp
};
