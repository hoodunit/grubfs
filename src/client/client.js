var _ = require('mori');
var React = require('react');
var Bacon = require('baconjs');

var View = require('./view/view');
var Util = require('./util.js');
var State = require('./state');
var Fsio = require('./fsio');

function render(state){
  View.render(state);
}

function isEventType(eventType, event){
  return _.equals(_.get(event, 'eventType'), eventType);
}

function handleSignUpEvents(events){
  var signUpEvents = events.filter(isEventType, 'signUp');
  var signedUpEvents = signUpEvents.flatMap(Fsio.signUp);
  return signedUpEvents;
}

function handleSignInEvents(events){
  var signInEvents = events.filter(isEventType, 'signIn');
  var signedInEvents = signInEvents.flatMap(Fsio.signIn);
  var resetStateEvents = signedInEvents.flatMap(Fsio.loadCurrentRemoteState);
  return signedInEvents.merge(resetStateEvents);
}

function makeInitEvents(initialState) {
  return _.hash_map('credentials', _.get(initialState, 'credentials'), 'eventType', 'init');
}

function initialize(){
  var initialState = State.getInitialState();
  render(initialState);

  var initEvents = Bacon.once(makeInitEvents(initialState));
  
  var resetStateEvents;
  if(State.signedIn(initialState)) {
    resetStateEvents = initEvents.flatMap(Fsio.loadCurrentRemoteState);
  } else {
    resetStateEvents = Bacon.never();
  }
  
  var viewEvents = View.outgoingEvents;
  
  var toRemoteEvents = new Bacon.Bus();
  var fromRemoteEvents = toRemoteEvents.flatMap(Fsio.syncStateWithFsio);
  
  var signedUpEvents = handleSignUpEvents(viewEvents);
  var signedInEvents = handleSignInEvents(viewEvents);

  var toStateEvents = Bacon.mergeAll(viewEvents, signedUpEvents, signedInEvents, resetStateEvents, fromRemoteEvents);
  var changedStates = State.handleStateChanges(initialState, toStateEvents, toRemoteEvents);
  
  changedStates.onValue(render);
}


initialize();

