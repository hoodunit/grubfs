var _ = require('mori');
var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');

var Fsio = require('./fsio');
var Util = require('./util');

function getInitialState(){
  var initialState = getLocalState();

  if(initialState === null){
    initialState = getDefaultState();
  }

  return initialState;
}

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

function handleStateChanges(initialState, events, toRemote){
  var changedStates = new Bacon.Bus();
  var state = initialState;
  events.onValue(function(event){
    var oldState = state;
    state = updateStateFromEvent(state, event);
    if(!_.equals(oldState, state)){
      console.log('stateChanged!!');
      changedStates.push(state);
    }
    if(signedIn(state) && toRemote){
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
    return newState;
  } else {
    console.log('Ignoring unhandled event:', _.clj_to_js(event));
    return oldState;
  }
}

function getEventHandler(event){

  var eventHandlers = _.hash_map('addItem', handleAddItem,
                                 'completeItem', handleCompleteItem,
                                 'emptyList', handleEmptyList,
                                 'deleteItem', handleDeleteItem,
                                 'updateItem', handleUpdateItem,
                                 'signedUp', handleSignedUp,
                                 'signIn', handleSignIn,
                                 'signedIn', handleSignedIn,
                                 'signOut', handleSignOut,
                                 'getInitialState', handleGetInitialState,
                                 'notification', handleNotification,
                                 'syncDelete', handleDeleteItem,
                                 'syncAdd', handleAddItem,
                                 'syncUpdate', handleUpdateItem);
  var eventType = _.get(event, 'eventType');
  var handler = _.get(eventHandlers, eventType);
  return handler;
}

function handleAddItem(oldState, event){
  console.log('add');
  console.log(event);
  var completed = _.has_key(event, 'completed') ? _.get(event, 'completed') : false;
  var newItem = _.hash_map('id', _.get(event, 'id'),
                           'name', _.get(event, 'name'),
                           'completed', completed);
  var oldItems = _.get(oldState, 'items');
  console.log(oldItems);
  var updatedItems = _.filter(function(oldItem){
    return _.get(oldItem, 'id') == _.get(newItem, 'id') ? false : true;
  }, oldItems);
  var newItems = _.conj(updatedItems, newItem);
  var newState = _.assoc(oldState, 'items', newItems);
  console.log(newState);

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
  console.log('delete');
  var id = _.get(event, 'id');
  console.log(event);
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

function handleSignedUp(oldState, event){
  var newState = handleSignedIn(oldState, event);

  // force lazy stream to evaluate using onEnd
  Fsio.saveNewUserState(newState).onEnd();
  
  return newState;
}

function handleSignIn(oldState,event){
  var newState = _.assoc(oldState, "items", _.vector());
  newState = handleSignedIn(newState, event);
  return newState;
}

function handleSignedIn(oldState, event){
  var credentials = _.get(event, 'credentials');
  newState = _.assoc(oldState, 'credentials', credentials);

  return newState;
}

function handleSignOut(oldState, event){
  var newState = _.dissoc(oldState, 'credentials', "items");
  var defaultItems = getDefaultItems();
  newState = _.assoc(newState, "items", defaultItems);
  return newState;
}

function handleGetInitialState(oldState, event) {
  var item = _.get(event, 'item');
  var oldItems = _.get(oldState, 'items');
  var newItems;
  var newState;
  if(item) {
    var updatedItems = _.filter(function(oldItem){
      return _.get(oldItem, 'id') == _.get(item, 'id') ? false : true;
    }, oldItems);
    newItems = _.conj(updatedItems, item);
  } else {
    newItems = oldItems;
  }
  newState = _.assoc(oldState, "items", newItems);

  return newState;
}

function handleNotification(oldState, event) {
  var notification = _.get(event, 'notification');
  var newState = _.assoc(oldState, "notification", notification);
  return newState;
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
  handleDeleteItem: handleDeleteItem,
  handleUpdateItem: handleUpdateItem,
  updateStateFromEvent: updateStateFromEvent
};
