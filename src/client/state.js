var _ = require('mori');
var Bacon = require('baconjs');

var Util = require('../shared/util');

var DEBUG = false;

function getInitialState(){
  var localStorageState = getLocalStorageState();

  if(localStorageState === null){
    return getDefaultState();
  } else {
    var deviceId = _.get(localStorageState, 'deviceId');
    if(deviceId === null) {
      deviceId = Util.generateUUID();
    }
    return _.assoc(localStorageState, 'clientState', getDefaultClientState(), 'deviceId', deviceId);
  }
}

function getLocalStorageState(){
  var localState = null;
  var localStateJson = localStorage.getItem('state');
  if(localStateJson !== null) {
    try {
      var localStateObj = JSON.parse(localStateJson);
      localState = _.js_to_clj(localStateObj);
    } catch(e) {
      console.log('Invalid localStorage contents, resetting locally stored state');
      localState = null;
    }
  }
  return localState;
}

function saveStateLocally(state){
  var savedState = _.dissoc(state, 'clientState');
  var stateJson = JSON.stringify(_.clj_to_js(savedState));
  localStorage.setItem('state', stateJson);
}

function getDefaultState(){
  return _.hash_map('items', getDefaultItems(),
                    'deviceId', Util.generateUUID(),
                    'clientState', getDefaultClientState());
}

function getDefaultItems(){
  return _.vector(
    _.hash_map('id', Util.generateUUID(),
               'name', '1 package of tomato puree',
               'completed', false),
    _.hash_map('id', Util.generateUUID(),
               'name', '4 yellow onions',
               'completed', true),
   _.hash_map('id', Util.generateUUID(),
               'name', 'fresh thyme',
               'completed', false),
    _.hash_map('id', Util.generateUUID(),
               'name', 'goat cheese',
               'completed', false),
    _.hash_map('id', Util.generateUUID(),
               'name', 'popcorn',
               'completed', true),
    _.hash_map('id', Util.generateUUID(),
               'name', '2 dl cream',
               'completed', false));
}

function getDefaultClientState(){
  return _.hash_map(
    'signingUp', false,
    'emailError', null,
    'passwordError', null,
    'confirmError', null,
    'signInError', false,
    'signUpError', false,
    'journalId', null);
}

function handleStateChanges(initialState, events, toRemote){
  var changedStates = new Bacon.Bus();
  var state = initialState;
  events.onValue(function(event){
    var oldState = state;
    state = updateStateFromEvent(state, event);
    if(!_.equals(oldState, state)){
      changedStates.push(state);
    }
    if(signedIn(state) ||
       _.equals(_.get(event, 'eventType'), 'signIn') ||
       _.equals(_.get(event, 'eventType'), 'signUp') ||
       _.equals(_.get(event, 'eventType'), 'signOut')){
      var eventWithState = _.assoc(event, 'state', state);
      toRemote.push(eventWithState);
    }
  });
  
  changedStates.onValue(saveStateLocally);
  
  return changedStates;
}

function updateStateFromEvent(oldState, event){
  var eventHandler = getEventHandler(event);

  if(eventHandler){
    var newState = eventHandler(oldState, event);

    if(DEBUG){
      console.log('State handled event:', _.clj_to_js(event));
      console.log('New state:', _.clj_to_js(newState));
    }

    return newState;
  } else {

    if(DEBUG){
      console.log('State ignored event:', _.clj_to_js(event));
      console.log('State:', _.clj_to_js(oldState));
    }

    return oldState;
  }
}

function getEventHandler(event){

  var eventHandlers = _.hash_map('addItem', handleAddItem,
                                 'completeItem', handleCompleteItem,
                                 'emptyList', handleEmptyList,
                                 'deleteItem', handleDeleteItem,
                                 'updateItem', handleUpdateItem,
                                 'signInStatusChange', handleSignInStatusChange,
                                 'signedUp', handleSignedUp,
                                 'signedIn', handleSignedIn,
                                 'signOut', handleSignOut,
                                 'resetState', handleResetState,
                                 'remoteItem', handleRemoteItem,
                                 'remoteItemDelete', handleRemoteItemDelete
                                );
  var eventType = _.get(event, 'eventType');
  var handler = _.get(eventHandlers, eventType);
  return handler;
}

function handleAddItem(oldState, event){
  var newItem = _.hash_map('id', _.get(event, 'id'),
                           'name', _.get(event, 'name'),
                           'completed', _.get(event, 'completed'));
  var newItems = _.conj(_.get(oldState, 'items'), newItem);
  var newState = _.assoc(oldState, 'items', newItems);

  return newState;
}

function handleCompleteItem(oldState, event){
  var id = _.get(event, 'id');
  var completed = !_.get(event, 'completed');
  var items = _.get(oldState, 'items');
  var updatedItems = _.map(function(item){
    if(_.get(item, 'id') == id){
      return _.assoc(item, 'completed', completed);
    } else {
      return item;
    }
  }, items);
  var newState = _.assoc(oldState, 'items', updatedItems);

  return newState;
}

function handleEmptyList(oldState, event) {
  return _.assoc(oldState, 'items', _.vector());
}

function handleDeleteItem(oldState, event) {
  var id = _.get(event, 'id');
  var items = _.get(oldState, 'items');

  var updatedItems = _.remove(function(item) {
    return _.get(item, 'id') === id;
  }, items);

  var newState = _.assoc(oldState, 'items', updatedItems);

  return newState;
}

function handleUpdateItem(oldState, event) {
  var id = _.get(event, 'id');
  var items = _.get(oldState, 'items');
  var name = _.get(event, 'name');
  var updatedItems = _.map(function(item){
    if(_.get(item, 'id') == id){
      return _.assoc(item, 'name', name);
    } else {
      return item;
    }
  }, items);
  var newState = _.assoc(oldState, 'items', updatedItems);

  return newState;
}

function handleSignInStatusChange(oldState, event){
  var oldClientState = _.get(oldState, 'clientState');
  var newData = _.dissoc(event, 'eventType');
  var mergedClientState = _.conj(oldClientState, newData);
  
  var newClientState;
  if(_.get(mergedClientState, 'signingUp')){
    newClientState = _.assoc(mergedClientState, 'signInError', false);
  } else {
    newClientState = _.assoc(mergedClientState,
                             'emailError', null,
                             'passwordError', null,
                             'confirmError', null);
  }
  var newState = _.assoc(oldState, 'clientState', newClientState);
  return newState;
}

function handleSignedUp(oldState, event){
  var credentials = _.get(event, 'credentials');
  var newState = _.assoc(oldState,
                         'credentials', credentials,
                         'clientState', getDefaultClientState());
  
  return newState;
}

function handleSignedIn(oldState, event){
  var credentials = _.get(event, 'credentials');
  var newState = _.assoc(oldState,
                         'credentials', credentials,
                         'items', _.vector(),
                         'clientState', getDefaultClientState());

  return newState;
}

function handleSignOut(oldState, event){
  var newState = _.dissoc(oldState, 'credentials', "items");
  var defaultItems = getDefaultItems();
  newState = _.assoc(newState, "items", defaultItems);
  return newState;
}

function handleResetState(oldState, event){
  var newState = _.assoc(oldState, 'items', _.get(event, 'items'));
  return newState;
}

function handleRemoteItem(oldState, event){
  var oldItems = _.get(oldState, 'items');
  var oldClientState = _.get(oldState, 'clientState');

  var newJournalId = newestJournalId(oldState, event);

  var newItem = _.get(event, 'item');

  var id = _.get(newItem, 'id');
  var updatedItems = _.remove(function(item) {
    return _.get(item, 'id') === id;
  }, oldItems);

  var newItems = _.conj(updatedItems, newItem);
  var newClientState = _.assoc(oldClientState, 'journalId', newJournalId);
  var newState = _.assoc(oldState,
                         'clientState', newClientState,
                         'items', newItems);
  return newState;
}

function handleRemoteItemDelete(oldState, event){
  var oldItems = _.get(oldState, 'items');
  var oldClientState = _.get(oldState, 'clientState');

  var newJournalId = newestJournalId(oldState, event);

  var id = _.get(event, 'id');
  var newItems = _.remove(function(item) {
    return _.get(item, 'id') === id;
  }, oldItems);

  var newClientState = _.assoc(oldClientState, 'journalId', newJournalId);
  var newState = _.assoc(oldState,
                         'clientState', newClientState,
                         'items', newItems);
  return newState;
}

function newestJournalId(state, event){
  return Math.max(_.get_in(state, ['clientState', 'journalId']), _.get(event, 'journalId'));
}

function signedIn(state){
  return (_.get(state, 'credentials') !== null);
}

module.exports = {
  handleStateChanges: handleStateChanges,
  getInitialState: getInitialState,
  handleAddItem: handleAddItem,
  signedIn: signedIn,
  handleCompleteItem: handleCompleteItem,
  handleEmptyList: handleEmptyList,
  handleDeleteItem: handleDeleteItem,
  handleUpdateItem: handleUpdateItem,
  updateStateFromEvent: updateStateFromEvent
};
