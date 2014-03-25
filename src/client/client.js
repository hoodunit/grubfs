var _ = require('mori');
var React = require('react');
var Bacon = require('baconjs');

var View = require('./view/view');
var Util = require('./util.js');
var State = require('./state');
var Fsio = require('./fsio');
var FsioAPI = require('../shared/fsio_api');

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

function signOutOnTokenExpiration(error){
  if(error.code === FsioAPI.errors.AUTHORIZATION_INVALID){
    return _.hash_map('eventType', 'signOut');
  } else{
    return Bacon.never();
  }
}

function makeInitEvent() {
  return _.hash_map('eventType', 'initialSync');
}

function initialize(){
  var initialState = State.getInitialState();
  render(initialState);

  var initEvents = new Bacon.Bus();
  var viewEvents = View.outgoingEvents;
  var toRemoteEvents = new Bacon.Bus();
  var fromRemoteEvents = toRemoteEvents.flatMap(Fsio.syncStateWithFsio);
  var signedOutEvents = fromRemoteEvents.errors()
    .mapError(_.identity)
    .flatMap(signOutOnTokenExpiration);
  
  var signedUpEvents = handleSignUpEvents(viewEvents);
  var signedInEvents = handleSignInEvents(viewEvents);

  var toStateEvents = Bacon.mergeAll(viewEvents, signedUpEvents, signedInEvents, 
                                     initEvents, signedOutEvents);
  var changedStates = State.handleStateChanges(initialState, toStateEvents, toRemoteEvents);
  
  changedStates.onValue(render);

  initEvents.push(makeInitEvent());
}


initialize();

