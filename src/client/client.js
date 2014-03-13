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

function combineSignInAndDownload(signedInData, downloadedData) {
    return _.conj(signedInData, downloadedData);
}

function handleSignUpEvents(events){
  var signUpEvents = events.filter(isEventType, 'signUp');
  var signedUpEvents = signUpEvents.flatMap(Fsio.signUp);
  return signedUpEvents;
}

function handleSignInEvents(events){
  var signInEvents = events.filter(isEventType, 'signIn');
  var signedInEvents = signInEvents.flatMap(Fsio.signIn);

  return signedInEvents;
}

function handleGetInitialStateEvents(signedInEvents) {
  var getInitialStateEvents = signedInEvents.flatMap(Fsio.downloadFileList);
  return getInitialStateEvents;
}

function handleNotificationEvents(signedInEvents) {
  var notificationEvents  = signedInEvents.flatMap(Fsio.getNotification);
  return notificationEvents;
}

function initialize(){
  var initialState = State.getInitialState();
  render(initialState);
  
  var viewEvents = View.outgoingEvents;
  
  var toRemoteEvents = new Bacon.Bus();
  var fromRemoteEvents = toRemoteEvents.flatMap(Fsio.syncStateWithFsio);
  
  var signedUpEvents = handleSignUpEvents(viewEvents);
  var signedInEvents = handleSignInEvents(viewEvents);
  var getInitialStateEvents = handleGetInitialStateEvents(signedInEvents);
  var notificationEvents = handleNotificationEvents(signedInEvents);
  
  var toStateEvents = Bacon.mergeAll(viewEvents,
                                     signedUpEvents,
                                     signedInEvents,
                                     fromRemoteEvents,
                                     getInitialStateEvents,
                                     notificationEvents);
  var changedStates = State.handleStateChanges(initialState, toStateEvents, toRemoteEvents);
  
  changedStates.onValue(render);
}


initialize();

