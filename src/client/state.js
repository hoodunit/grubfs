var _ = require('mori');
var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');

var Fsio = require('./fsio');
var Util = require('./util');

function getLocalState(){
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
  var stateJson = JSON.stringify(_.clj_to_js(state));
  localStorage.setItem('state', stateJson);
}

function getDefaultState(){
  return _.hash_map('items', getDefaultItems());
}

function getDefaultItems(){
  return _.vector(
    _.hash_map('id', Util.generateUUID(),
               'name', '1 packages of tomato puree',
               'completed', false,
               'touched', false),
    _.hash_map('id', Util.generateUUID(),
               'name', '4 yellow onions',
               'completed', true,
               'touched', false),
    _.hash_map('id', Util.generateUUID(),
               'name', '2 dl cream',
               'completed', false,
               'touched', false));
}


function getInitialState(){
  var initialState = getLocalState();

  if(initialState === null){
    initialState = getDefaultState();
  }

  return initialState;
}

function handleAddItem(oldState, event){
  var newItem = _.hash_map('id', _.get(event, 'id'),
                           'name', _.get(event, 'name'),
                           'completed', false,
                           'touched', false);
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

function handleEmptyList() {
  return _.hash_map('items', _.vector());
}

function handleHoldItem(oldState, event) {
  var id = _.get(event, 'id');
  var items = _.get(oldState, 'items');

  /* Not inventing the wheel again.. */
  var updatedItems = _.map(function(item) {
    if (_.get(item, 'touched'))
      return _.assoc(item, 'touched', false);    
    else if (_.get(item, 'id') == id)
      return _.assoc(item, 'touched', true);
    else
      return item;
  }, items);

  var newState = _.assoc(oldState, 'items', updatedItems);
  return newState;
}

function handleDeleteItem(oldState, event) {
  var id = _.get(event, 'id');
  var items = _.get(oldState, 'items');

  var updatedItems = _.remove(function(item) {
    return _.get(item, 'id') == id;},
    items);

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

function handleSignedUp(oldState, event){
  var newState = handleSignedIn(oldState, event);
  
  return newState;
}

function handleSignedIn(oldState, event){
  var credentials = _.get(event, 'credentials');
  var newState = _.assoc(oldState, 'credentials', credentials);
  
  return newState;
}

function handleSignOut(oldState, event){
  var newState = _.dissoc(oldState, 'credentials');
  return newState;
}

function getEventHandler(event){
  var eventHandlers = _.hash_map('addItem', handleAddItem,
                                 'completeItem', handleCompleteItem,
                                 'emptyList', handleEmptyList,
                                 'holdItem', handleHoldItem,
                                 'deleteItem', handleDeleteItem,
                                 'updateItem', handleUpdateItem,
                                 'signedUp', handleSignedUp,
                                 'signedIn', handleSignedIn,
                                 'signOut', handleSignOut);
  var eventType = _.get(event, 'eventType');
  var handler = _.get(eventHandlers, eventType);
  return handler;
}

function updateStateFromEvent(oldState, event){
  var eventHandler = getEventHandler(event);

  if(eventHandler){
    var newState = eventHandler(oldState, event);
    return newState;
  } else {
    console.log('Ignoring unhandled event:', _.clj_to_js(event));
    return oldState;
  }
}

function handleStateChanges(initialState, events){
  var currentState = events.scan(initialState, updateStateFromEvent);
  var changedStates = currentState.changes();
  changedStates.onValue(saveStateLocally);
  return changedStates;
}

function signedIn(state){
  return _.get(state, 'credentials') !== null;
}

module.exports = {
  handleStateChanges: handleStateChanges,
  getInitialState: getInitialState,
  handleAddItem: handleAddItem,
  signedIn: signedIn,
  handleCompleteItem: handleCompleteItem,
  handleEmptyList: handleEmptyList,
  handleHoldItem: handleHoldItem,
  handleDeleteItem: handleDeleteItem,
  handleUpdateItem: handleUpdateItem,
  updateStateFromEvent: updateStateFromEvent
};
