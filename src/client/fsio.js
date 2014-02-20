var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');
var jsSHA = require('jssha');
var _ = require('mori');

var FsioAPI = require('../shared/fsio_api');

var constants = {
  FSIO_BASE_URL: 'https://api-fip.sp.f-secure.com/v2',
  FSIO_DATA_URL: 'https://data-fip.sp.f-secure.com/v2',
  OPERATOR_ID: 67901,
  CRAM_CHALLENGE_URL: '/token/cram/challenge',
  CRAM_CHALLENGE_RESP_URL: '/token/cram/user'
};

function signUp(event){
  var email = _.get(event, 'email');
  var password = _.get(event, 'password');
  
  var authCredentials = FsioAPI.signUp(email, password);

  var signedUpEvents = authCredentials.map(_.js_to_clj)
    .map(addUserInfoToCredentials, email, password)
    .map(makeSignedUpEvent);

  return signedUpEvents;
}

function signIn(event){
  var email = _.get(event, 'email');
  var password = _.get(event, 'password');

  var authCredentials = FsioAPI.signIn(email, password);

  var signedInEvents = authCredentials.map(_.js_to_clj)
    .map(addUserInfoToCredentials, email, password)
    .map(makeSignedInEvent);

  return signedInEvents;
}

function addUserInfoToCredentials(email, password, credentials){
  console.log('addUserInfo email:', email, 'pass:', password, 'creds:', _.clj_to_js(credentials));
  return _.assoc(credentials,
                 'email', email,
                 'password', password);
}

function makeSignedUpEvent(credentials){
  return _.hash_map('eventType', 'signedUp',
                    'credentials', credentials);
}

function makeSignedInEvent(credentials){
  return _.hash_map('eventType', 'signedIn',
                    'credentials', credentials);
}

function saveNewUserState(state){
  var items = _.clj_to_js(_.get(state, 'items'));
  var email = _.get_in(state, ['credentials', 'email']);
  var password = _.get_in(state, ['credentials', 'password']);

  var authCredentials = FsioAPI.signIn(email, password);
  var result = authCredentials.flatMap(function(authCredentials){
    console.log('items:', items);
    return Bacon.fromArray(items).flatMapLatest(uploadItemToFsio, authCredentials);
  });
  
  return result;
}

function uploadItemToFsio(authCredentials, item){
  console.log('upload item:', item);
  console.log('credentials:', authCredentials);
  var uploadRequest = makeUploadItemRequest(authCredentials, item);
  var result = Bacon.$.ajax(uploadRequest);
  return result;
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

module.exports = {
  signIn: signIn,
  signUp: signUp,
  saveNewUserState: saveNewUserState
};
