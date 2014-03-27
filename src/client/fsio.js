var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');
var _ = require('mori');

var FsioAPI = require('../shared/fsio_api');
var ServerAPI = require('./server_api');

var DEBUG = false;

function syncStateWithFsio(event){
  var eventHandler = getEventHandler(event);

  if(eventHandler){
    var returnedEvents = eventHandler(event);
    var errors = returnedEvents.errors()
      .mapError(_.identity);
    var signedOutEvents = errors.filter(function(error){
      return error.code === FsioAPI.errors.AUTHORIZATION_INVALID;
    }).map(function(){
      return _.hash_map('eventType', 'signOut');
    });
    
    if(DEBUG) console.log('FSIO handled event:', _.clj_to_js(event));

    return returnedEvents.merge(signedOutEvents);
  } else {
    if(DEBUG) console.log('FSIO ignored event:', _.clj_to_js(event));
    return Bacon.never();
  }
}

function getEventHandler(event){
  var eventHandlers = _.hash_map('initialSync', handleInitialSync,
                                 'signIn', handleSignIn,
                                 'signUp', handleSignUp,
                                 'signedUp', handleSignedUp,
                                 'signedIn', handleSignedIn,
                                 'addItem', handleAddItem,
                                 'completeItem', handleCompleteItem,
                                 'updateItem', handleUpdateItem,
                                 'deleteItem', handleDeleteItem,
                                 'emptyList', handleEmptyList);
  var eventType = _.get(event, 'eventType');
  var handler = _.get(eventHandlers, eventType);
  return handler;
}

function signOutOnTokenExpiration(error){
  if(error.code === FsioAPI.errors.AUTHORIZATION_INVALID){
    return _.hash_map('eventType', 'signOut');
  } else{
    return Bacon.never();
  }
}

function handleInitialSync(event){
  var token = _.get_in(event, ['state', 'credentials', 'token']);
  return loadCurrentRemoteState(token);
}

function loadCurrentRemoteState(token){
  var remoteItems = FsioAPI.downloadRemoteItems(token);
  var resetStateEvents = remoteItems.map(makeResetStateEvent);

  return resetStateEvents;
}

function makeResetStateEvent(items){
  var itemData = _.js_to_clj(items);
  var event = _.hash_map('items', itemData, 'eventType', 'resetState');
  return event;
}

function handleSignIn(event){
  return signIn(event);
}

function signIn(event){
  var email = _.get(event, 'email');
  var password = _.get(event, 'password');

  var token = FsioAPI.signIn(email, password, false);

  var signedInEvents = token.skipErrors()
    .map(_.hash_map, 'token')
    .map(addUserInfoToCredentials, email)
    .map(makeSignedInEvent);

  var signInFailedEvents = token.errors()
                                .mapError(_.js_to_clj)
                                .map(function(){
                                  return _.hash_map('eventType', 'signInStatusChange',
                                                    'signInError', true);
                                });

  return Bacon.mergeAll(signedInEvents, signInFailedEvents);
}

function checkSignIn(token) {
  return (_.get(token, 'credentials') !== null);
}

function addUserInfoToCredentials(email, credentials){
  return _.assoc(credentials, 'email', email);
}

function makeSignedUpEvent(credentials){
  return _.hash_map('eventType', 'signedUp',
                    'credentials', credentials);
}

function makeSignedInEvent(credentials){
  return _.hash_map('eventType', 'signedIn',
                    'credentials', credentials);
}

function handleSignUp(event){
  return signUp(event);
}

function signUp(event){
  var email = _.get(event, 'email');
  var password = _.get(event, 'password');
  
  var token = signUpAndSignIn(email, password);

  var signedUpEvents = token.skipErrors()
    .map(_.hash_map, 'token')
    .map(addUserInfoToCredentials, email)
    .map(makeSignedUpEvent);
  
  var signUpFailedEvents = token.errors()
    .mapError(_.js_to_clj)
    .map(function(){
      return _.hash_map('eventType', 'signInStatusChange',
                        'signUpError', true);
    });

  return Bacon.mergeAll(signedUpEvents, signUpFailedEvents);
}

function signUpAndSignIn(email, password){
  var signedUpInfo = ServerAPI.signUp(email, password);
  var token = signedUpInfo.flatMapFirst(function(){
    return FsioAPI.signIn(email, password);
  });
  return token;
}

function handleSignedIn(event){
  var token = _.get_in(event, ['state', 'credentials', 'token']);
  return loadCurrentRemoteState(token);
}

function handleSignedUp(event){
  var state = _.get(event, 'state');
  return saveNewUserState(state).errors();
}

function handleAddItem(event){
  return handleAddedOrUpdatedItem(event);
}

function handleCompleteItem(event){
  return handleAddedOrUpdatedItem(event);
}

function handleUpdateItem(event){
  return handleAddedOrUpdatedItem(event);
}

function handleAddedOrUpdatedItem(event){
  var token = _.get_in(event, ['state', 'credentials', 'token']);
  var updatedItem = getItemById(_.get_in(event, ['state', 'items']), _.get(event, 'id'));
  
  var response = uploadItem(token, _.clj_to_js(updatedItem));
  return response.errors();
}

function handleDeleteItem(event){
  var token = _.get_in(event, ['state', 'credentials', 'token']);
  var itemId = _.get(event, 'id');
  var filename = 'items/' + itemId;

  var response = FsioAPI.deleteFile(filename, token);
  return response.errors();
}

function getItemById(items, id){
  return _.first(_.filter(function(item){
    return _.equals(_.get(item, 'id'), id);
  }, items));
}

function syncItemToServer(token, item){
  return uploadItem(token, item);
}

function saveNewUserState(state){
  var items = _.clj_to_js(_.get(state, 'items'));
  var token = _.get_in(state, ['credentials', 'token']);

  var result = Bacon.fromArray(items).flatMap(uploadItem, token);

  return result;
}

function uploadItem(token, item){
  var filename = 'items/' + item.id;
  return FsioAPI.uploadFile(filename, item, token);
}

function handleEmptyList(event){
  var token = _.get_in(event, ['state', 'credentials', 'token']);
  return clearItems(token).errors();
}

function clearItems(token){
  var itemsFolder = 'items';
  return FsioAPI.deleteFilesFromFolder(itemsFolder, token);
}

module.exports = {
  syncStateWithFsio: syncStateWithFsio,
  test: {
    FsioAPI: FsioAPI,
    saveNewUserState: saveNewUserState,
    syncItemToServer: syncItemToServer,
    clearItems: clearItems
  }
};
