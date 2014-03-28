var _ = require('mori');
var Bacon = require('baconjs');

var View = require('./view/view');
var State = require('./state');
var Fsio = require('./fsio');

function render(state){
  View.render(state);
}

function makeInitEvent() {
  return _.hash_map('eventType', 'appInit');
}

function initialize(){
  var initialState = State.getInitialState();
  render(initialState);

  var initEvents = new Bacon.Bus();
  var viewEvents = View.outgoingEvents;
  var toRemoteEvents = new Bacon.Bus();
  var fromRemoteEvents = toRemoteEvents.flatMap(Fsio.syncStateWithFsio);
  
  var toStateEvents = Bacon.mergeAll(viewEvents, fromRemoteEvents, initEvents);
  var changedStates = State.handleStateChanges(initialState, toStateEvents, toRemoteEvents);
  
  changedStates.onValue(render);

  initEvents.push(makeInitEvent());
}


initialize();

