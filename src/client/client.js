var _ = require('mori');
var React = require('react');
var Bacon = require('baconjs');
var $ = require('jquery-browserify');

var View = require('./view');
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

function handleSignUp(oldState, event){
  var requestEvent = _.dissoc(event, 'eventType');
  var jsonEvent = JSON.stringify(_.clj_to_js(requestEvent));
  console.log('sending to server:', jsonEvent);

  var serverUrl = document.location.origin;
  var eventUrl = serverUrl + '/event';
  var options = {type: 'POST', 
                 data: jsonEvent, 
                 dataType: 'json',
                 contentType: 'application/json; charset=utf-8'};
  var response = Bacon.fromPromise($.ajax(eventUrl, options));
  response.onValue(function(value){
    console.log('Received response:', arguments);
  });

  return oldState;
}

function getEventHandler(event){
  var eventHandlers = _.hash_map('addItem', handleAddItem,
                                 'completeItem', handleCompleteItem,
                                 'emptyList', handleEmptyList,
                                 'signUp', handleSignUp);
  var eventType = _.get(event, 'eventType');
  var handler = _.get(eventHandlers, eventType);
  return handler;
}

function updateStateFromEvent(oldState, event){
  var eventHandler = getEventHandler(event);

  if(eventHandler){
    console.log('Handle event:', _.clj_to_js(event));
    var newState = eventHandler(oldState, event);
    return newState;
  } else {
    console.log('Ignoring unhandled event:', _.clj_to_js(event));
    return oldState;
  }
}

function initialize(){
  var initialState = getInitialState();
  View.render(initialState);

  var viewEvents = View.outgoingEvents;
  
  var currentState = viewEvents.scan(initialState, updateStateFromEvent);
  var changedStates = currentState.changes();
  changedStates.onValue(saveStateLocally);
  changedStates.onValue(View.render);
}

initialize();

