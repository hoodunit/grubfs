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
  var email = _.get(event, 'email');
  var password = _.get(event, 'password');
  
  var authCredentials = _signUp(email, password);

  var signedUpEvents = authCredentials.map(_.js_to_clj)
    .map(_.hash_map, 
         'eventType', 'signedUp', 
         'email', email,
         'credentials');

  return signedUpEvents;
}

function _signUp(email, password){
  var signUpRequest = makeSignUpRequest(email, password);
  var response = Bacon.fromPromise($.ajax(signUpRequest));
  response.log('Sign up response:');

  var authCredentials = response.flatMap(function(signUpResponse){
    return _signIn(email, password);
  });
  return authCredentials;
}

function makeSignUpRequest(email, password){
  var requestEvent = {email: email, password: password};
  var jsonEvent = JSON.stringify(requestEvent);

  var serverUrl = document.location.origin;
  var eventUrl = serverUrl + '/event';
  var options = {type: 'POST', 
                 data: jsonEvent, 
                 dataType: 'json',
                 contentType: 'application/json; charset=utf-8', 
                 url: eventUrl};
  return options;
}

function signIn(event){
  var email = _.get(event, 'email');
  var password = _.get(event, 'password');

  var authCredentials = _signIn(email, password);
  var signedInEvents = authCredentials.map(_.js_to_clj)
    .map(_.hash_map, 
         'eventType', 'signedIn', 
         'email', email,
         'credentials');
  return signedInEvents;
}

function _signIn(email, password){
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
  console.log('hash challenge:', challenge, 'password:', password);
  console.log('arguments:', arguments);
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

function makeAuthorizedRequest(url, data, token){
  var request = makeRequest(url, data);
  request.headers = {authorization: 'FsioToken ' + adminToken};
  return request;
}

function uploadCompleteState(state){
  console.log('upload state');
  var credentials = _.get(state, 'credentials');
  var token = _.get(credentials, 'token');

  var itemArray = _.clj_to_js(_.get(state, 'items'));
  var items = Bacon.fromArray(itemArray);
  var requests = items.map(makeUploadItemRequest, token);
  var responses = requests.ajax();
  return responses;
}

function makeUploadItemRequest(token, item){
  console.log('item:', item);
  var url = constants.FSIO_BASE_URL + '/data/me/files/items/' + item.id;
  var headers = {
    authorization: 'FsioToken ' + token,
    'x-appearance': 'normal'
  };

  var request = {
    url: url,
    data: JSON.stringify(item),
    contentType: 'application/json; charset=utf-8',
    headers: headers,
    type: 'PUT'
  };
 
  return request;
}

module.exports = {
  signIn: signIn,
  signUp: signUp,
  uploadCompleteState: uploadCompleteState
};
