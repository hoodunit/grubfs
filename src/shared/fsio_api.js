var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');
var jsSHA = require('jssha');
var _ = require('mori');

require('../shared/bacon.ajax');

var constants = {
  FSIO_BASE_URL: 'https://api-fip.sp.f-secure.com/v2',
  FSIO_DATA_URL: 'https://data-fip.sp.f-secure.com/v2',
  OPERATOR_ID: 67901,
  CRAM_CHALLENGE_URL: '/token/cram/challenge',
  CRAM_CHALLENGE_RESP_URL: '/token/cram/user',
  CRAM_CHALLENGE_RESP_ADMIN_URL: '/token/cram/admin_l2'
};

function signIn(email, password, isAdmin){
  var challenge = requestAuthorizationChallenge(email);
  var challengeResponse = challenge.map(hashChallenge, password);
  var signInData = Bacon.combineWith(sendChallengeResponse, 
                                     email, challenge, isAdmin, challengeResponse).ajax();

  return signInData;
}

function requestAuthorizationChallenge(email){
  var url = constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_URL;
  var requestData = {operator_id: constants.OPERATOR_ID, 
                     user_name: email};
  var request = {url: url,
                 type: 'POST',
                 data: JSON.stringify(requestData)};
  var response = Bacon.$.ajax(request);
  return response.map('.challenge');
}

function sendChallengeResponse(email, challenge, isAdmin, challengeResponse){
  var respUrl;
  if(isAdmin){
    respUrl = constants.CRAM_CHALLENGE_RESP_ADMIN_URL;
  } else {
    respUrl = constants.CRAM_CHALLENGE_RESP_URL;
  }
  var url = constants.FSIO_BASE_URL + respUrl;
  var requestData = {operator_id: constants.OPERATOR_ID, 
                     user_name: email,
                     challenge: challenge,
                     response: challengeResponse};

  var request = {url: url,
                 type: 'POST',
                 data: JSON.stringify(requestData)};
  return request;
}

function hashChallenge(password, challenge){
  var shaObj = new jsSHA(challenge, "B64");
  var hmac = shaObj.getHMAC(password, "TEXT", "SHA-256", "HEX");

  return hmac;
}

function signUp(username, password, adminUser, adminPass){
  var isAdmin = true;
  var adminCreds = signIn(adminUser, adminPass, isAdmin);
  var adminToken = adminCreds.map('.token');
  var newUserStatus = createUser(adminToken, username, password);

  return newUserStatus;
}

function createUser(adminToken, username, password){
  var newUserData = adminToken.flatMap(createNewUser, username, password);
  var newUserKey = newUserData.map('.key');
  var newUserAuthKey = Bacon.combineWith(addAuthToUser, adminToken, 
                                         username, password, 
                                         newUserKey).ajax();
  return newUserAuthKey;
}

function createNewUser(username, password, adminToken){
  var url = constants.FSIO_BASE_URL + 
    '/admin/operators/' + 
    constants.OPERATOR_ID + 
    '/users';
 
  var quotaInMegabytes = 0.5;
  var quotaInBytes = quotaInMegabytes * 1024 * 1024;
  var requestData = {quota: quotaInBytes,
                     state: 'active'};

  var request = {url: url,
                 type: 'POST',
                 data: JSON.stringify(requestData)};

  var authRequest = makeAuthorizedRequest(request, adminToken);
  return Bacon.$.ajax(authRequest);
}

function addAuthToUser(adminToken, username, password, userKey){
  var url = constants.FSIO_BASE_URL + '/admin' +
    userKey + '/authentications';

  var requestData = {mechanism: 'cram',
                     role: 'user',
                     user_name: username,
                     password: password};

  var request = {url: url,
                 type: 'POST',
                 data: JSON.stringify(requestData)};

  var authRequest = makeAuthorizedRequest(request, adminToken);
  return authRequest;
}

function deleteUser(username, adminUser, adminPass){
  var isAdmin = true;
  var adminCreds = signIn(adminUser, adminPass, isAdmin);
  var adminToken = adminCreds.map('.token');
  var userInfo = adminToken.flatMap(_deleteUser, username);

  return userInfo;
}

function _deleteUser(username, adminToken){
  var userKey = '/operators/' + constants.OPERATOR_ID + '/users/uname:' + username;
  var url = constants.FSIO_BASE_URL + '/admin' + userKey;

  var request = {url: url, 
                 type: 'DELETE',
                 headers: {authorization: 'FsioToken ' + adminToken,
                           'content-length': 0}};
  return Bacon.$.ajax(request);
}

function getUserInfo(username, adminToken){
  var userKey = '/operators/' + constants.OPERATOR_ID + '/users/uname:' + username;
  var url = constants.FSIO_BASE_URL + '/admin' + userKey;

  var request = {url: url,
                 type: 'GET'};

  var authRequest = makeAuthorizedRequest(request, adminToken);
  return Bacon.$.ajax(request);
}

function uploadFile(username, password, filename, data){
  var isAdmin = false;
  var credentials = signIn(username, password, isAdmin);
  var token = credentials.map('.token');

  var fileUpload = token.flatMap(_uploadFile, filename, data);
  return fileUpload;
}

function _uploadFile(filename, data, token){
  var url = constants.FSIO_DATA_URL + '/data/me/files/' + filename;
  var request = {url: url,
                 type: 'PUT',
                 data: JSON.stringify(data)};
  var authRequest = makeAuthorizedRequest(request, token);

  return Bacon.$.ajax(authRequest);
}

function getFileInfo(username, password, filename){
  var isAdmin = false;
  var credentials = signIn(username, password, isAdmin);
  var token = credentials.map('.token');

  var fileInfo = token.flatMap(_getFileInfo, filename);
  return fileInfo;
}

function _getFileInfo(filename, token){
  var url = constants.FSIO_BASE_URL + '/content/me/files/' + filename;
  var request = {url: url,
                 type: 'GET'};
  var authRequest = makeAuthorizedRequest(request, token);

  return Bacon.$.ajax(authRequest);
}

function downloadFile(username, password, filename){
  var isAdmin = false;
  var credentials = signIn(username, password, isAdmin);
  var token = credentials.map('.token');

  var downloadedFile = token.flatMap(_downloadFile, filename).map(JSON.parse);
  return downloadedFile;
}

function downloadFileList(credentials){
  var email = _.get(credentials, "email");
  var password = _.get(credentials, "password");
  var token = _.get(credentials, "token");
  console.log(token);
  return Bacon.once(token).flatMap(listFolderItems).map(".items");
}

function downloadFileFromList(credentials, fileList) {
  var token = _.get(credentials, "token");
  var fileStreams = null;
  _.each(_.js_to_clj(fileList), function(item) {
      filename = _.get(item, "full_name");
      if(!fileStreams) {
        fileStreams = Bacon.once(token).flatMap(_downloadFile, filename).map(JSON.parse);
      } else {
        fileStreams = fileStreams.merge(Bacon.once(token).flatMap(_downloadFile, filename).map(JSON.parse));
      }
  });
  return fileStreams;
}

function _downloadFile(filename, token){
  var url = constants.FSIO_DATA_URL + '/data/me/files/' + filename;
  var request = {url: url,
                 type: 'GET'};
  var authRequest = makeAuthorizedRequest(request, token);

  return Bacon.$.ajax(authRequest);
}

function listFolderItems(token) {
  var url = constants.FSIO_BASE_URL + '/content/me/files/items';
  var request = {url: url,
                 type: 'GET'};
  var authRequest = makeAuthorizedRequest(request, token);

  return Bacon.$.ajax(authRequest);
}

function makeUploadItemRequest(authCredentials, item){
  var url = constants.FSIO_DATA_URL + '/data/me/files/items/' + item.id;
  var requestData = item;
  var request = {url: url,
                 type: 'PUT',
                 data: JSON.stringify(requestData),
                 headers: {authorization: 'FsioToken ' + authCredentials.token}};

  return request;
}


function makeAuthorizedRequest(request, token){
  request.headers = {authorization: 'FsioToken ' + token};
  return request;
}

module.exports = {
  signIn: signIn,
  signUp: signUp,
  deleteUser: deleteUser,
  uploadFile: uploadFile,
  downloadFile: downloadFile,
  downloadFileList: downloadFileList,
  downloadFileFromList: downloadFileFromList,
  test: {
    hashChallenge: hashChallenge
  }
};
