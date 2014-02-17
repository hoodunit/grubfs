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
    .map(addUserInfoToCredentials, email, password)
    .map(makeSignedUpEvent);

  return signedUpEvents;
}

function _signUp(email, password){
  var signUpRequest = makeSignUpRequest(email, password);
  var response = Bacon.fromPromise($.ajax(signUpRequest));

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
         'password', password,
         'credentials');
  return signedInEvents;
}

function _signIn(email, password){
  var challenge = sendChallengeRequest(email);
  var challengeResponse = challenge.map(hashChallenge, password);
  var signInData = Bacon.combineWith(makeChallengeResponseRequest, 
                                     constants, email, challenge, challengeResponse).ajax();

  // challenge.log('challenge:');
  // challengeResponse.log('challenge response:');
  // signInData.log('signInData:');

  return signInData;
}

function sendChallengeRequest(email){
  var challengeRequest = makeChallengeRequest(constants, email);
  var response = Bacon.$.ajax(challengeRequest);
  var challenge = response.map('.challenge');
  return challenge;
}

function makeChallengeRequest(constants, email){
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

function makeChallengeResponseRequest(constants, email, challenge, challengeResponse){
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
          data: JSON.stringify(data)};
          
}

function addUserInfoToCredentials(email, password, credentials){
  console.log('addUserInfo email:', email, 'pass:', password, 'creds:', _.clj_to_js(credentials));
  return _.assoc(credentials,
                 'email', email,
                 'password', password);
}

function makeSignedUpEvent(credentials){
  console.log('makesignedup:', _.clj_to_js(credentials));
  return _.hash_map('eventType', 'signedUp',
                    'credentials', credentials);
}

function syncStateToFsio(stateDiff){
  console.log('stateDiff:', _.clj_to_js(stateDiff));
}

function saveNewUserState(state){
  var items = _.clj_to_js(_.get(state, 'items'));
  var email = _.get_in(state, ['credentials', 'email']);
  var password = _.get_in(state, ['credentials', 'password']);

  var authCredentials = _signIn(email, password);
  var result = authCredentials.flatMap(function(authCredentials){
    console.log('items:', items);
    return Bacon.fromArray(items).flatMapLatest(uploadItemToFsio, authCredentials);
  });
  
  return result;
}

function uploadItemToFsio(authCredentials, item){
  console.log('upload item:', item);
  console.log('credentials:', authCredentials);
  return item;
}

module.exports = {
  signIn: signIn,
  signUp: signUp,
  saveNewUserState: saveNewUserState,
  syncStateToFsio: syncStateToFsio,
  test: {
    makeSignUpRequest: makeSignUpRequest,
    makeChallengeRequest: makeChallengeRequest,
    hashChallenge: hashChallenge,
    makeChallengeResponseRequest: makeChallengeResponseRequest
  }
};
