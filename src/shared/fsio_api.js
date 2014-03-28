var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');
var jsSHA = require('jssha');
var _ = require('mori');

var Util = require('./util');

var constants = {
  FSIO_BASE_URL: 'https://api-fip.sp.f-secure.com/v2',
  FSIO_DATA_URL: 'https://data-fip.sp.f-secure.com/v2',
  FSIO_UEB_URL: 'https://ueb-fip.sp.f-secure.com/v2',
  OPERATOR_ID: 67901,
  CRAM_CHALLENGE_URL: '/token/cram/challenge',
  CRAM_CHALLENGE_RESP_URL: '/token/cram/user',
  CRAM_CHALLENGE_RESP_ADMIN_URL: '/token/cram/admin_l2'
};

var errors = {
  OBJECT_ALREADY_EXISTS: 111,
  AUTHENTICATION_INVALID: 104,
  OBJECT_NOT_FOUND: 115,
  FILE_SCANNING_INCOMPLETE: 126,
  AUTHORIZATION_INVALID: 169,
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
  var signedInInfo = Bacon.combineWith(sendChallengeResponse, 
                                       email, challenge, isAdmin, challengeResponse)
                        .flatMapLatest(sendRequest);  
  return signedInInfo;
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

function signUp(username, password, adminUser, adminPass){
  var signedInInfo = signInAsAdmin(adminUser, adminPass);
  var adminToken = signedInInfo.map('.token');
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

function deleteUser(username, adminToken){
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

function uploadFile(filename, data, token){
  var url = constants.FSIO_DATA_URL + '/data/me/files/' + filename;
  var request = {url: url,
                 type: 'PUT',
                 data: JSON.stringify(data)};
  var authRequest = makeAuthorizedRequest(request, token);

  return sendRequest(authRequest);
}

function getFileInfo(filename, token){
  var url = constants.FSIO_BASE_URL + '/content/me/files/' + filename;
  var request = {url: url,
                 type: 'GET'};
  var authRequest = makeAuthorizedRequest(request, token);

  return sendRequest(authRequest);
}

function downloadFile(filename, token){
  var url = constants.FSIO_DATA_URL + '/data/me/files/' + filename;
  var request = {url: url,
                 type: 'GET'};
  var authRequest = makeAuthorizedRequest(request, token);

  return sendRequest(authRequest).map(JSON.parse);
}

function downloadRemoteItems(token){
  var items = listFolderItems(token).map(".items");
  var folderItemStream = Bacon.combineTemplate({
    token: token,
    items: items
  }).changes();
  var remoteItemsEvents = folderItemStream.flatMap(downloadItemsFromList);
  return remoteItemsEvents;
}

function listFolderItems(token) {
  var url = constants.FSIO_BASE_URL + '/content/me/files/items';
  var request = {url: url,
                 type: 'GET'};
  var authRequest = makeAuthorizedRequest(request, token);

  return sendRequest(authRequest);
}

function downloadItemsFromList(folderItemStream) {
  var token = folderItemStream.token;

  // BaconJS bug? folderItemStream.items instanceof Array == false workaround
  var itemsArray = [];
  folderItemStream.items.forEach(function(item) {
    itemsArray.push(item);
  });
  
  var items = Bacon.fromArray(itemsArray);
  var itemNames = items.map(".full_name");

  var downloadedItems = itemNames.flatMap(function(filename){
    return downloadFile(filename, token);
  });
  
  var downloadedItemsArray = downloadedItems.reduce(_.vector(), _.conj);
  
  return downloadedItemsArray;
}

function deleteFile(filename, token){
  var url = constants.FSIO_BASE_URL + '/content/me/files/' + filename;
  var origRequest = {url: url,
                     type: 'DELETE'};

  var request = setContentLengthIfRunningInNode(origRequest);

  var authRequest = makeAuthorizedRequest(request, token);
  return sendRequest(authRequest);
}

function getNextNotification(userUuid, deviceId, stateId, token){
  var url = constants.FSIO_UEB_URL + '/notification/uid:' + userUuid + '/notifications';
  
  var message = {
    device_id: deviceId,
    include_content_types: [
      'fsio:file'
    ],
    last_seen_notifications: [
      { state_id: stateId,
        content_type: 'fsio:file'
      }
    ],
    keep_alive_threshold: 300
  };

  var origRequest = {
    url: url,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(message)
  };

  var request = setContentLengthIfRunningInNode(origRequest);

  var authRequest = makeAuthorizedRequest(request, token);
  return sendRequest(authRequest);
}

function retrieveJournalEntries(initialSync, journalId, token) {
  var url = constants.FSIO_BASE_URL + 
    '/content/me/journal?' + 
    '&initial_sync=' + initialSync + 
    '&types=file' + 
    '&related_objects=file';

  var origRequest = {
    url: url,
    type: 'GET'
  };

  var authRequest = makeAuthorizedRequest(origRequest, token);
  return sendRequest(authRequest);
}
  
function deleteFilesFromFolder(filename, token){
  var url = constants.FSIO_BASE_URL + '/content/me/files/' + filename + '?name=*';
  var origRequest = {
    url: url,
    type: 'DELETE'
  };

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
  request.cache = false;
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
  downloadRemoteItems: downloadRemoteItems,
  deleteFile: deleteFile,
  getNextNotification: getNextNotification,
  deleteFilesFromFolder: deleteFilesFromFolder,
  getFileInfo: getFileInfo,
  retrieveJournalEntries: retrieveJournalEntries,
  errors: errors,
  test: {
    hashChallenge: hashChallenge
  }
};
