var Bacon = require('baconjs');
var React = require('react');
var _ = require('mori');

var Grocery = require('./grocery');
var SignIn = require('./sign_in');

var GrubView = React.createClass({
  render: function() {
    var groceryState = {items: _.get(this.props, 'items')};
    return React.DOM.div({},
                         Grocery.GroceryList(groceryState),
                         SignIn.SignInForm({}));
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
