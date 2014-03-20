var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');
var jsSHA = require('jssha');
var _ = require('mori');

var FsioAPI = require('../shared/fsio_api');

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
  var serverUrl = document.location.origin;
  var url = serverUrl + '/event';
  var requestData = {email: email, password: password};

  var request = {
    url: url,
    type: 'POST',
    dataType: 'json',
    data: requestData
  };

  return Bacon.$.ajax(request);
}

function signIn(event){
  var email = _.get(event, 'email');
  var password = _.get(event, 'password');

  var token = FsioAPI.signIn(email, password, false);

  var signedInEvents = token.map(_.hash_map, 'token')
    .map(addUserInfoToCredentials, email, password)
    .map(makeSignedInEvent);

  return signedInEvents;
}

function addUserInfoToCredentials(email, password, credentials){
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

function syncStateWithFsio(event){
  var eventHandler = getEventHandler(event);

  if(eventHandler){
    // Trigger handler but do nothing with result
    eventHandler(event).onEnd();
  } else {
    console.log('FSIO ignoring unhandled event:', _.clj_to_js(event));
  }

  return Bacon.never();
}

function getEventHandler(event){
  var eventHandlers = _.hash_map('addItem', handleAddItem,
                                 'completeItem', handleCompleteItem,
                                 'updateItem', handleUpdateItem,
                                 'deleteItem', handleDeleteItem);
  var eventType = _.get(event, 'eventType');
  var handler = _.get(eventHandlers, eventType);
  return handler;
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
  var email = _.get_in(event, ['state', 'credentials', 'email']);
  var password = _.get_in(event, ['state', 'credentials', 'password']);
  var updatedItem = getItemById(_.get_in(event, ['state', 'items']), _.get(event, 'id'));
  return uploadItem(email, password, _.clj_to_js(updatedItem));
}

function handleDeleteItem(event){
  var email = _.get_in(event, ['state', 'credentials', 'email']);
  var password = _.get_in(event, ['state', 'credentials', 'password']);
  var itemId = _.get(event, 'id');
  var filename = 'items/' + itemId;

  var response = FsioAPI.deleteFile(email, password, filename);
  return response;
}

function getItemById(items, id){
  return _.first(_.filter(function(item){
    return _.equals(_.get(item, 'id'), id);
  }, items));
}

function syncItemToServer(email, password, item){
  return uploadItem(email, password, item);
}

function saveNewUserState(state){
  var items = _.clj_to_js(_.get(state, 'items'));
  var email = _.get_in(state, ['credentials', 'email']);
  var password = _.get_in(state, ['credentials', 'password']);

  var result = Bacon.fromArray(items).flatMapLatest(uploadItem, email, password);

  return result;
}

function uploadItem(email, password, item){
  var filename = 'items/' + item.id;
  return FsioAPI.uploadFile(email, password, filename, item);
}


function downloadFileList(event) {
  var credentials = _.get(event, "credentials");
  var username = _.get(credentials, "email");
  var password = _.get(credentials, "password");
  var fileStream = FsioAPI.downloadFileList(username, password);
  return fileStream.map(makeGetInitialStateEvent);
}

function makeGetInitialStateEvent(file) {
  file = file[0] ? file[0] : file;
  return _.hash_map("item", _.js_to_clj(file),
                    "eventType", "getInitialState");
}

function getNotification(event) {
  var credentials = _.get(event, "credentials");
  var username = _.get(credentials, "email");
  var password = _.get(credentials, "password");
  var notification = FsioAPI.getNotification(username, password);
  return notification.flatMap(makeNotificationEvent, credentials);
}

function makeNotificationEvent(credentials, notification) {
  return _.hash_map("notification", notification,
                    "eventType", "notification",
                    "credentials", credentials);
}

function getJournals(initial_sync, journal_id_gt, event) {
  var credentials = _.get(event, "credentials");
  var username = _.get(credentials, "email");
  var password = _.get(credentials, "password");
  var journals = FsioAPI.getJournals(username, password, initial_sync, journal_id_gt);
  return journals.flatMap(makeJournalEvent, credentials);
}

function makeJournalEvent(credentials, journals) {
  return _.hash_map('eventType', 'journal',
                    'journals', journals,
                    'credentials', credentials);
}

function syncFromServer(event) {
  var credentials = _.get(event, "credentials");
  var username = _.get(credentials, "email");
  var password = _.get(credentials, "password");
  var journalsItems = _.get_in(event, ["journals", "items"]);
  console.log('journalsItems');
  console.log(journalsItems);
  var syncStateEvents = Bacon.once();

  _.each(journalsItems, function(journalsItem) {
    var operation = _.get(journalsItem, 'operation');
    var id = _.get(journalsItem, 'key').split('/').pop();
    var filename = 'items/' + id;
    var event;

    if(operation === 'delete') {
      event = _.hash_map('eventType', 'syncDelete',
                             'id', id);
      syncStateEvents = syncStateEvents.merge(Bacon.once(event));
    } else {
      var fileStream = FsioAPI.downloadFile(username, password, filename);
      event = fileStream.map(_makeSyncEvent, operation);
      event.onValue(function(val) {
        console.log('file');
        console.log(val);
      });
      syncStateEvents = syncStateEvents.merge(event);
    }
  });

  return syncStateEvents;
}

function _makeSyncEvent(operation, fileStream) {
  var file = _.js_to_clj(fileStream);
  var event;
  if(operation === 'create') {
    console.log('create');
    event = _.assoc(file, 'eventType', 'syncAdd');
  }
  if(operation === 'update') {
    console.log('update');
    event = _.assoc(file, 'eventType', 'syncUpdate');
  }
  return event;
}

function clearItems(email, password){
  var itemsFile = 'items';
  return FsioAPI.deleteFile(email, password, itemsFile);
}

module.exports = {
  signIn: signIn,
  signUp: signUp,
  syncItemToServer: syncItemToServer,
  clearItems: clearItems,
  saveNewUserState: saveNewUserState,
  downloadFileList: downloadFileList,
  syncStateWithFsio: syncStateWithFsio,
  getNotification: getNotification,
  getJournals: getJournals,
  syncFromServer: syncFromServer,
  test: {
    FsioAPI: FsioAPI
  }
};
