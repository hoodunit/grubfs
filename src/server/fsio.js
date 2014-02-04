var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');
var sys = require('sys');
var exec = require('child_process').exec;
var jsSHA = require('jssha');

require('./bacon.ajax');

var constants = {
  FSIO_BASE_URL: process.env.FSIO_API_URL + '/v2',
  OPERATOR_ID: process.env.FSIO_OPERATOR_ID,
  USER_NAME: process.env.FSIO_USER_NAME,
  PASSWORD: process.env.FSIO_PASSWORD,

  CRAM_CHALLENGE_URL: '/token/cram/challenge',
  CRAM_CHALLENGE_RESP_URL: '/token/cram/admin_l2'
};

function signUp(user){
  var adminCreds = signInAsAdmin();
  var adminToken = adminCreds.map('.token');
  var newUserStatus = createUser(adminToken, user);

  return newUserStatus;
}

function signInAsAdmin(){
  var challenge = sendChallengeRequest();
  var response = challenge.map(makeChallengeResponse);
  var signInData = response.map(makeChallengeResponseRequest).ajax();

  return signInData;
}

function sendChallengeRequest(){
  var challengeRequest = makeChallengeRequest(constants);
  var response = Bacon.$.ajax(challengeRequest);
  var challenge = response.map('.challenge');
  return challenge;
}

function makeChallengeRequest(constants){
  var url = constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_URL;
  var requestData = {operator_id: constants.OPERATOR_ID, 
                     user_name: constants.USER_NAME};
  return makeRequest(url, requestData);
}

function makeChallengeResponse(challenge){
  var response = {challenge: challenge, response: hashChallenge(challenge, constants.PASSWORD)};
  return response;
}

function hashChallenge(challenge, password){
  var shaObj = new jsSHA(challenge, "B64");
  var hmac = shaObj.getHMAC(password, "TEXT", "SHA-256", "HEX");

  return hmac;
}


function makeChallengeResponseRequest(data){
  var url = constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_RESP_URL;
  var requestData = {operator_id: constants.OPERATOR_ID, 
                     user_name: constants.USER_NAME,
                     challenge: data.challenge,
                     response: data.response};

  return makeRequest(url, requestData);
}

function createUser(adminToken, user){
  var newUserData = adminToken.map(makeCreateUserRequest).ajax();
  var newUserKey = newUserData.map('.key');

  var newUserInfo = Bacon.combineTemplate({
    email: user.email,
    password: user.password,
    adminToken: adminToken,
    userKey: newUserKey
  });

  var newUserAuthKey = newUserInfo.map(makeAddAuthRequest).ajax().map('.key');

  return newUserAuthKey;
}

function makeCreateUserRequest(adminToken){
  var url = constants.FSIO_BASE_URL + 
    '/admin/operators/' + 
    constants.OPERATOR_ID + 
    '/users';
 
  var quotaInMegabytes = 0.5;
  var quotaInBytes = quotaInMegabytes * 1024 * 1024;
  var requestData = {quota: quotaInBytes,
                     state: 'active'};
  
  return makeAuthorizedRequest(url, requestData, adminToken);
}

function makeAddAuthRequest(data){
  var url = constants.FSIO_BASE_URL + 
    '/admin' +
    data.userKey +
    '/authentications';

  var requestData = {mechanism: 'cram',
                     role: 'user',
                     user_name: data.email,
                     password: data.password};

  return makeAuthorizedRequest(url, requestData, data.adminToken);
}

function makeRequest(url, data){
  return {url: url,
          type: 'POST',
          contentType: 'application/json; charset=utf-8',
          data: JSON.stringify(data)};
          
}

function makeAuthorizedRequest(url, data, adminToken){
  var request = makeRequest(url, data);
  request.headers = {authorization: 'FsioToken ' + adminToken};
  return request;
}

module.exports = {
  constants: constants,
  signUp: signUp,
  test: {
    hashChallenge: hashChallenge,
    makeChallengeRequest: makeChallengeRequest
  }
};


