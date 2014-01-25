var _ = require('mori');
var React = require('react');
var Bacon = require('baconjs');

var View = require('./view');
var Util = require('./util.js');
var State = require('./state');
var Fsio = require('./fsio');

function render(state){
  View.render(state);
}

function isEventType(eventType, event){
  return _.equals(_.get(event, 'eventType'), eventType);
}

function initialize(){
  var initialState = State.getInitialState();
  render(initialState);

  var viewEvents = View.outgoingEvents;

  var signUpEvents = viewEvents.filter(isEventType, 'signUp');
  var signInEvents = signUpEvents.flatMap(Fsio.signUp);

  var stateEvents = viewEvents.merge(signInEvents);
  var changedStates = State.handleStateChanges(initialState, stateEvents);

  changedStates.onValue(render);
}

initialize();

