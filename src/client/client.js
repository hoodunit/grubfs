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

function getResetStateEvents(initialState){
  var initEvents = Bacon.once(makeInitEvents(initialState));
  
  if(State.signedIn(initialState)) {
    return initEvents.flatMap(Fsio.loadCurrentRemoteState);
  } else {
    return Bacon.never();
  }
}

function makeInitEvents(initialState) {
  return _.hash_map('credentials', _.get(initialState, 'credentials'), 'eventType', 'init');
}

function initialize(){
  var initialState = State.getInitialState();
  render(initialState);

  var resetStateEvents = getResetStateEvents(initialState);
  
  var viewEvents = View.outgoingEvents;
  
  var toRemoteEvents = new Bacon.Bus();
  var fromRemoteEvents = toRemoteEvents.flatMap(Fsio.syncStateWithFsio);
  var signedOutEvents = fromRemoteEvents.mapError(function(e) {
    if(e.status == 401){
      return _.hash_map('eventType', 'signOut');
    } else{
      return _.hash_map();
    }
  }).filter(function(event) {
    return _.get(event, 'eventType') == "signOut";
  });
  
  var signedUpEvents = handleSignUpEvents(viewEvents);
  var signedInEvents = handleSignInEvents(viewEvents);

  var toStateEvents = Bacon.mergeAll(viewEvents, signedUpEvents, signedInEvents, 
                                     resetStateEvents, signedOutEvents);
  var changedStates = State.handleStateChanges(initialState, toStateEvents, toRemoteEvents);
  
  changedStates.onValue(render);
}


initialize();

