var _ = require('mori');
var React = require('react');

var State = require('./state');
var Grocery = require('./view/grocery');

function render(state) {
  var groceryState = {items: _.get(state, 'items')};
  React.initializeTouchEvents(true);
  React.renderComponent(Grocery.GroceryList(groceryState), document.getElementById('content'));
}

function initialize(){
  var initialState = State.getInitialState();
  render(initialState);

  var viewEvents = Grocery.outgoingEvents;
  var changedStates = State.handleStateChanges(initialState, viewEvents);

  changedStates.onValue(render);
}

initialize();

