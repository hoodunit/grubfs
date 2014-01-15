var _ = require('mori');
var React = require('react');

var Grocery = require('./grocery');
var Util = require('./util.js');

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
  var initialItems = _.vector(
    _.hash_map('id', Util.generateUUID(),
               'name', '1 packages of tomato puree',
               'completed', false),
    _.hash_map('id', Util.generateUUID(),
               'name', '4 yellow onions',
               'completed', true),
    _.hash_map('id', Util.generateUUID(),
               'name', '2 dl cream',
               'completed', false));
  return _.hash_map('items', initialItems);
}

function getInitialState(){
  var initialState = getLocalState();

  if(initialState === null){
    initialState = getDefaultState();
  }

  return initialState;
}

function render(state) {
  var groceryState = {items: _.get(state, 'items')};
  React.renderComponent(Grocery.GroceryList(groceryState), document.getElementById('content'));
}

function handleAddItem(oldState, event){
  var newItem = _.hash_map('id', _.get(event, 'id'),
                           'name', _.get(event, 'name'),
                           'completed', false);
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

function handleGroceryEvent(oldState, event){
  var eventHandlers = _.hash_map('addItem', handleAddItem,
                                 'completeItem', handleCompleteItem,
                                 'emptyList', handleEmptyList);
  var eventType = _.get(event, 'eventType');
  var handler = _.get(eventHandlers, eventType);

  if(handler !== null){
    console.log('Handle event:', _.clj_to_js(event));
    return handler(oldState, event);
  } else {
    console.log('Ignoring unhandled event:', _.clj_to_js(event));
    return oldState;
  }
}

function handleGroceryEvents(state){
  Grocery.outgoingEvents.onValue(function(event){
    state = handleGroceryEvent(state, event);
    saveStateLocally(state);
    render(state);
  });
}

function initialize(){
  var initialState = getInitialState();
  render(initialState);
  handleGroceryEvents(initialState);
}

initialize();

