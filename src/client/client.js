var _ = require('mori');
var React = require('react');
var Bacon = require('baconjs');

var View = require('./view/view');
var Util = require('./util.js');
var State = require('./state');
var Fsio = require('./fsio');

var LAST_SEEN_JOURNAL_ID;
var LAST_SEEN_STATE_ID;

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

function listenNotification(preNotification) {
  var notificationEvents = Fsio.getNotification(preNotification);
  var preStateId = _.get_in(preNotification, ['notification', 'notifications', 0, 'state_id']);

  setTimeout(syncFromServer, 1000, preNotification);

  LAST_SEEN_STATE_ID = preStateId;

  notificationEvents.onValue(function(notification) {
    listenNotification(notification);
  });
}

function syncFromServer(event) {
  var initialState = State.getInitialState();
  var journalEvent = Bacon.once(event).flatMap(Fsio.getJournals, false, LAST_SEEN_JOURNAL_ID);
  journalEvent.onValue(function(journals) {
    var newJournalId = _.get(_.last(_.get_in(journals, ['journals', 'items'])), 'journal_id');
    LAST_SEEN_JOURNAL_ID = newJournalId ? newJournalId : LAST_SEEN_JOURNAL_ID;

    var syncStateEvents = Fsio.syncFromServer(journals);
syncStateEvents.onValue(function(val) {
  console.log('syncStateEvents');
  console.log(val);
});
    /*syncStateEvents.onValue(function(val) {*/
      //console.log('syncStateEvents');
      //console.log(val);
    /*});*/
    var changedStates = State.handleStateChanges(initialState, syncStateEvents);
    changedStates.onValue(render);
  });
}

function initialize(){
  var initialState = State.getInitialState();
  render(initialState);

  var viewEvents = View.outgoingEvents;

  var toRemoteEvents = new Bacon.Bus();
  var fromRemoteEvents = toRemoteEvents.flatMap(Fsio.syncStateWithFsio);

  var signedUpEvents = handleSignUpEvents(viewEvents);
  var signedInEvents = handleSignInEvents(viewEvents);
  var getInitialStateEvents = signedInEvents.flatMap(Fsio.downloadFileList);

  var notificationEvents = signedInEvents.flatMap(Fsio.getNotification);
  notificationEvents.onValue(function(notification) {
    listenNotification(notification);
  });

  var journalEvent = signedInEvents.flatMap(Fsio.getJournals, true, LAST_SEEN_JOURNAL_ID);
  journalEvent.onValue(function(journals) {
    LAST_SEEN_JOURNAL_ID = _.get_in(journals, ['journals', 'journal_max']) - 1;
  });

  var toStateEvents = Bacon.mergeAll(viewEvents,
                                     signedUpEvents,
                                     signedInEvents,
                                     fromRemoteEvents,
                                     getInitialStateEvents);
  var changedStates = State.handleStateChanges(initialState, toStateEvents, toRemoteEvents);

  changedStates.onValue(render);
}


initialize();

