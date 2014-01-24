var _ = require('mori');
var React = require('react');
var Bacon = require('baconjs');

var View = require('./view');
var Util = require('./util.js');
var State = require('./state');

function render(state){
  View.render(state);
}

function initialize(){
  var initialState = State.getInitialState();
  render(initialState);

  var viewEvents = View.outgoingEvents;
  var changedStates = State.handleStateChanges(initialState, viewEvents);

  changedStates.onValue(render);
}

initialize();

