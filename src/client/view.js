var Bacon = require('baconjs');
var React = require('react');
var _ = require('mori');

var Grocery = require('./grocery');
var SignIn = require('./sign_in');
var State = require('./state');

var GrubView = React.createClass({
  render: function() {
    var groceryState = {items: _.get(this.props, 'items')};
    var dom;
    if(State.signedIn(this.props)){
      dom = React.DOM.div({}, Grocery.GroceryList(groceryState));
    } else {
      dom = React.DOM.div({}, Grocery.GroceryList(groceryState),
                          SignIn.SignInForm({}));
    }
    return dom;
  }
});

var outgoingEvents = Bacon.mergeAll(Grocery.outgoingEvents, SignIn.outgoingEvents);

function render(state) {
  React.renderComponent(GrubView(state), document.getElementById('content'));
}

module.exports = {
  render: render,
  outgoingEvents: outgoingEvents
};
