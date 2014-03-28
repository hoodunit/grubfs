var Bacon = require('baconjs');
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
  var eventHandlers = _.hash_map('appInit', handleAppInit,
                                 'signIn', handleSignIn,
                                 'signUp', handleSignUp,
                                 'signedUp', handleSignedUp,
                                 'signedIn', handleSignedIn,
                                 'addItem', handleAddItem,
                                 'completeItem', handleCompleteItem,
                                 'updateItem', handleUpdateItem,
                                 'deleteItem', handleDeleteItem,
                                 'startRealTimeSync', handleStartRealTimeSync,
                                 'notification', handleNotification,
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

function handleAppInit(event){
  return handleAppInitOrSignedIn(event);
}

function resetStateFromRemote(token){
  var resetStateEvents = loadRemoteState(token).map(makeResetStateEvent);
  return resetStateEvents;
}

function loadRemoteState(token){
  var errors = new Bacon.Bus();
  var retryDelays = Bacon.fromArray([100, 1500]);
  var retries = errors.zip(retryDelays, function(error, retryDelay){
    return retryDelay;
  });

  var tries = Bacon.once(0).merge(retries);

  var remoteItems = tries.flatMap(function(delay){
    return Bacon.once().delay(delay).flatMapFirst(FsioAPI.downloadRemoteItems, token);
  });

  var remoteItemsErrors = remoteItems.errors().mapError(_.identity);
  var expectedRemoteItemsErrors = remoteItemsErrors.filter(function(error){
    return error.code === FsioAPI.errors.FILE_SCANNING_INCOMPLETE;
  });

  errors.plug(expectedRemoteItemsErrors);

  return remoteItems.take(1);
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

  var signedInInfo = FsioAPI.signIn(email, password, false);

  var signedInEvents = signedInInfo.skipErrors()
    .map(_.js_to_clj)
    .map(addEmailToCredentials, email)
    .map(makeSignedInEvent);

  var signInFailedEvents = signedInInfo.errors()
                                .mapError(_.js_to_clj)
                                .map(function(){
                                  return _.hash_map('eventType', 'signInStatusChange',
                                                    'signInError', true);
                                });

  return Bacon.mergeAll(signedInEvents, signInFailedEvents);
}

function makeStartRealTimeSyncEvent() {
  return _.hash_map('eventType', 'startRealTimeSync');
}

function checkSignIn(token) {
  return (_.get(token, 'credentials') !== null);
}

function addEmailToCredentials(email, credentials){
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
  
  var signedInInfo = signUpAndSignIn(email, password);

  var signedUpEvents = signedInInfo.skipErrors()
    .map(_.js_to_clj)
    .map(addEmailToCredentials, email)
    .map(makeSignedUpEvent);
  
  var signUpFailedEvents = signedInInfo.errors()
    .mapError(_.js_to_clj)
    .map(function(){
      return _.hash_map('eventType', 'signInStatusChange',
                        'signUpError', true);
    });

  return Bacon.mergeAll(signedUpEvents, signUpFailedEvents);
}

function signUpAndSignIn(email, password){
  var signedUpInfo = ServerAPI.signUp(email, password);
  var signedInInfo = signedUpInfo.flatMapFirst(function(){
    return FsioAPI.signIn(email, password);
  });
  return signedInInfo;
}

function handleSignedIn(event){
  return handleAppInitOrSignedIn(event);
}

function handleAppInitOrSignedIn(event){
  var token = _.get_in(event, ['state', 'credentials', 'token']);
  var resetStateEvents = resetStateFromRemote(token);
  var startRealTimeSyncEvents = resetStateEvents.flatMapFirst(makeStartRealTimeSyncEvent);
  return Bacon.mergeAll(resetStateEvents, startRealTimeSyncEvents);
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

function handleStartRealTimeSync(event){
  var userUuid = _.get_in(event, ['state', 'credentials', 'u_uuid']);
  var token = _.get_in(event, ['state', 'credentials', 'token']);
  var deviceId = _.get_in(event, ['state', 'deviceId']);
  return startListenNotifications(userUuid, deviceId, token);
}

function handleNotification(event){
  var token = _.get_in(event, ['state', 'credentials', 'token']);
  // delay to avoid "File scanning incomplete" error
  var resetStateEvents = Bacon.once().delay(0).flatMap(resetStateFromRemote, token);
  return resetStateEvents;
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

function startListenNotifications(userUuid, deviceId, token) {
  var notifications = new Bacon.Bus();
  var defaultStateId = '';
  listenNotifications(notifications, userUuid, deviceId, defaultStateId, token);
  return notifications;
}

function listenNotifications(notifications, userUuid, deviceId, lastStateId, token){
  var response = FsioAPI.getNextNotification(userUuid, deviceId, lastStateId, token);
  var responsesWithNotification = response.map(stateIdFromNotificationResponse).filter(function(stateId){
    return stateId !== null;
  });
  notifications.plug(responsesWithNotification.map(makeNotificationEvent));
  // long-polling, make new request on response
  response.onValue(function(notificationResponse){
    var newStateId = stateIdFromNotificationResponse(notificationResponse);
    // if notification request returned no new notification use the last id
    var stateId = newStateId ? newStateId : lastStateId;
    listenNotifications(notifications, userUuid, deviceId, stateId, token);
  });
}

function stateIdFromNotificationResponse(notificationResponse){
  return _.get_in(_.js_to_clj(notificationResponse), ['notifications', 0, 'state_id']);
}

function makeNotificationEvent(stateId) {
  var event = _.hash_map('stateId', stateId,
                         'eventType', 'notification');
  return event;
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
