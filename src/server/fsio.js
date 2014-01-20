var querystring = require('querystring');
var Bacon = require('baconjs');
var request = require('request');
var sys = require('sys');
var exec = require('child_process').exec;

var constants = {
  FSIO_BASE_URL: process.env.FSIO_API_URL + '/v2',
  OPERATOR_ID: process.env.FSIO_OPERATOR_ID,
  USER_NAME: process.env.FSIO_USER_NAME,
  PASSWORD: process.env.FSIO_PASSWORD,

  CRAM_CHALLENGE_URL: '/token/cram/challenge',
  CRAM_CHALLENGE_RESP_URL: '/token/cram/admin_l2'
};

function signUp(data){
  var email = data.email;
  var password = data.password;
  console.log('Received email:', email, 'pass:', password);

  return signInAsAdmin();
}

function signInAsAdmin(){
  var challenge = sendChallengeRequest();
  challenge.log();
  var response = challenge.flatMap(makeChallengeResponse);
  response.log();
  var signInData = response.flatMap(sendChallengeResponse);
  signInData.log();
  return signInData.map(function(){ return {}; });
}

function sendChallengeRequest(){
  var requestData = {operator_id: constants.OPERATOR_ID, 
                     user_name: constants.USER_NAME};
  var requestDataStr = querystring.stringify(requestData);

  var options = {
    url: constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_URL,
    method: 'POST',
    json: requestData
  };

  var response = Bacon.fromNodeCallback(request.post, options);
  var challenge = response.map(function(response){ return response.body.challenge; });
  return challenge;
}

function makeChallengeResponse(challenge){
  var command = 'echo ' + challenge + 
    ' | base64 --decode | openssl sha256 -hmac ' +
    constants.PASSWORD;

  var response = Bacon.fromNodeCallback(exec, command);
  var parsedResponse = response.map(function(val){ return val.split(' ')[1].replace('\n', ''); });

  var finalResponse = parsedResponse.map(function(challengeResponse){
    return {challenge: challenge, response: challengeResponse};
  });

  return finalResponse;
}

function sendChallengeResponse(data){
  var requestData = {operator_id: constants.OPERATOR_ID, 
                     user_name: constants.USER_NAME,
                     challenge: data.challenge,
                     response: data.response};

  var requestDataStr = querystring.stringify(requestData);

  var options = {
    url: constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_RESP_URL,
    method: 'POST',
    json: requestData
  };

  return Bacon.fromCallback(function(callback){
    request.post(options, function(e, r, body){
      callback(body);
    });
  });
}

module.exports = {
  constants: constants,
  signUp: signUp
};


