var Bacon = require('baconjs');
if(!runningInBrowser()){
var jsdom = require("jsdom");
var $ = require('jquery')(jsdom.jsdom().parentWindow);
} else
{
var $ = require('jquery');
}
var jsSHA = require('jssha');
var _ = require('mori');

var constants = {
  FSIO_BASE_URL: 'https://api-fip.sp.f-secure.com/v2',
  FSIO_DATA_URL: 'https://data-fip.sp.f-secure.com/v2',
  OPERATOR_ID: 67901,
  CRAM_CHALLENGE_URL: '/token/cram/challenge',
  CRAM_CHALLENGE_RESP_URL: '/token/cram/user',
  CRAM_CHALLENGE_RESP_ADMIN_URL: '/token/cram/admin_l2'
};

var errors = {
  OBJECT_ALREADY_EXISTS: 111,
  AUTHENTICATION_INVALID: 104,
  OBJECT_NOT_FOUND: 115,
  HTTP_BAD_REQUEST: 400
};

function signIn(email, password){
  var isAdmin = false;
  return _signIn(email, password, isAdmin);
}

function signInAsAdmin(email, password){
  var isAdmin = true;
  return _signIn(email, password, isAdmin);
}

function _signIn(email, password, isAdmin){
  var challenge = requestAuthorizationChallenge(email);
  var challengeResponse = challenge.map(hashChallenge, password);
  var signInData = Bacon.combineWith(sendChallengeResponse, 
                                     email, challenge, isAdmin, challengeResponse)
                        .flatMapLatest(sendRequest);
  var token = signInData.map('.token');
  
  return token;
}

function requestAuthorizationChallenge(email){
  var url = constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_URL;
  var requestData = {operator_id: constants.OPERATOR_ID, 
                     user_name: email};
  var request = {url: url,
                 type: 'POST',
                 data: JSON.stringify(requestData)};
  var response = sendRequest(request);
  return response.map('.challenge');
}

function hashChallenge(password, challenge){
  var shaObj = new jsSHA(challenge, "B64");
  var hmac = shaObj.getHMAC(password, "TEXT", "SHA-256", "HEX");

  return hmac;
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
  var adminToken = signInAsAdmin(adminUser, adminPass);
  var newUserStatus = createUser(adminToken, username, password);
  return newUserStatus;
}

function createUser(adminToken, username, password){
  var newUserData = adminToken.flatMap(createNewUser, username, password);
  var newUserKey = newUserData.map('.key');
  var newUserAuthKey = Bacon.combineWith(addAuthToUser, adminToken, 
                                         username, password, 
                                         newUserKey).flatMapLatest(sendRequest);
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
  return sendRequest(authRequest);
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
  var adminToken = signInAsAdmin(adminUser, adminPass);
  var userInfo = adminToken.flatMap(_deleteUser, username);

  return userInfo;
}

function _deleteUser(username, adminToken){
  var userKey = '/operators/' + constants.OPERATOR_ID + '/users/uname:' + username;
  var url = constants.FSIO_BASE_URL + '/admin' + userKey;

  var origRequest = {url: url, 
                     type: 'DELETE'};
  var request = setContentLengthIfRunningInNode(origRequest);
  var authRequest = makeAuthorizedRequest(request, adminToken);

  return sendRequest(authRequest);
}

function getUserInfo(username, adminToken){
  var userKey = '/operators/' + constants.OPERATOR_ID + '/users/uname:' + username;
  var url = constants.FSIO_BASE_URL + '/admin' + userKey;

  var request = {url: url,
                 type: 'GET'};

  var authRequest = makeAuthorizedRequest(request, adminToken);
  return sendRequest(request);
}

function uploadFile(username, password, filename, data){
  var token = signIn(username, password);
  var fileUpload = token.flatMap(_uploadFile, filename, data);
  return fileUpload;
}

function _uploadFile(filename, data, token){
  var url = constants.FSIO_DATA_URL + '/data/me/files/' + filename;
  var request = {url: url,
                 type: 'PUT',
                 data: JSON.stringify(data)};
  var authRequest = makeAuthorizedRequest(request, token);

  return sendRequest(authRequest);
}

function getFileInfo(username, password, filename){
  var token = signIn(username, password);
  var fileInfo = token.flatMap(_getFileInfo, filename);
  return fileInfo;
}

function _getFileInfo(filename, token){
  var url = constants.FSIO_BASE_URL + '/content/me/files/' + filename;
  var request = {url: url,
                 type: 'GET'};
  var authRequest = makeAuthorizedRequest(request, token);

  return sendRequest(authRequest);
}

function downloadFile(username, password, filename){
  var token = signIn(username, password);
  var downloadedFile = token.flatMap(_downloadFile, filename).map(JSON.parse);
  return downloadedFile;
}

function downloadFileList(username, password){
  var token = signIn(username, password);

  var items = token.flatMap(listFolderItems).map(".items");
  var folderItemStream = Bacon.combineTemplate({
    token: token,
    items: items
  }).changes();
  var signedInEventsNew = folderItemStream.flatMap(downloadFileFromList);
  return signedInEventsNew;
}

function listFolderItems(token) {
  var url = constants.FSIO_BASE_URL + '/content/me/files/items';
  var request = {url: url,
                 type: 'GET'};
  var authRequest = makeAuthorizedRequest(request, token);

  return sendRequest(authRequest);
}

function downloadFileFromList(folderItemStream) {
  var fileList = _.js_to_clj(folderItemStream.items);
  var token = folderItemStream.token;
  var fileStream = null;
  _.each(_.js_to_clj(fileList), function(item) {
      var filename = _.get(item, "full_name");
      if(!fileStream) {
        fileStream = Bacon.once(token).flatMap(_downloadFile, filename).map(JSON.parse);
      } else {
        fileStream = fileStream.merge(Bacon.once(token).flatMap(_downloadFile, filename).map(JSON.parse));
      }
  });
  return fileStream;
}

function _downloadFile(filename, token){
  var url = constants.FSIO_DATA_URL + '/data/me/files/' + filename;
  var request = {url: url,
                 type: 'GET'};
  var authRequest = makeAuthorizedRequest(request, token);

  return sendRequest(authRequest);
}

function deleteFile(username, password, filename){
  var token = signIn(username, password);
  var deletedFile = token.flatMap(_deleteFile, filename);

  return deletedFile;
}

function _deleteFile(filename, token){
  var url = constants.FSIO_BASE_URL + '/content/me/files/' + filename;
  var origRequest = {url: url,
                     type: 'DELETE'};

  var request = setContentLengthIfRunningInNode(origRequest);

  var authRequest = makeAuthorizedRequest(request, token);
  return sendRequest(authRequest);
}

// Hackish workaround to get some requests to work on both browser and Node.
// FSIO requires content-length header for some requests.
// Browser automatically sets this and does not allow you to set it.
// JQuery on Node.js does not set it if you have no data.
// So for tests we must set content-length and for the browser we must not.
function setContentLengthIfRunningInNode(request){
  if(!runningInBrowser()){
    request.headers = request.headers || {};
    request.headers['content-length'] = 0;
  }
 return request;
}

function runningInBrowser(){
  var inBrowser = false;
  try {
    inBrowser = !!window;
  } catch (e){
  }
  return inBrowser;
}

function makeAuthorizedRequest(request, token){
  request.headers = request.headers || {};
  request.headers.authorization = 'FsioToken ' + token;
  return request;
}

function sendRequest(request){
  var response = Bacon.fromPromise($.ajax(request));
  return parseFsioErrors(response);
}

function parseFsioErrors(response){
  var errors = response.errors();
  var parsedErrors = errors.mapError(function(error){
    var errorData;
    try {
      errorData = JSON.parse(error.responseText);
    } catch(e){
      errorData = {text: error.responseText};
    }
    errorData.httpCode = error.status;
    return errorData;
  }).flatMap(function(error){
    return new Bacon.Error(error);
  });

  return response.skipErrors().merge(parsedErrors);
}

module.exports = {
  signIn: signIn,
  signInAsAdmin: signInAsAdmin,
  signUp: signUp,
  deleteUser: deleteUser,
  uploadFile: uploadFile,
  downloadFile: downloadFile,
  downloadFileList: downloadFileList,
  deleteFile: deleteFile,
  getFileInfo: getFileInfo,
  errors: errors,
  test: {
    hashChallenge: hashChallenge
  }
};
