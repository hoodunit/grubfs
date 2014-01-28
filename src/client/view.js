var Bacon = require('baconjs');
var React = require('react');
var _ = require('mori');

var Grocery = require('./grocery');
var SignIn = require('./sign_in');
var State = require('./state');

var GrubView = React.createClass({
  getSignInForm: function(signedIn){
    if(signedIn){
      return null;
    } else {
      return SignIn.SignInForm({});
    }
  },
  render: function() {
    var signedIn = State.signedIn(this.props);
    var groceryState = {items: _.get(this.props, 'items'),
                        signedIn: signedIn};

    return React.DOM.div({}, 
                         React.DOM.div({className: 'col-sm-2'}),
                         React.DOM.div({className: 'col-sm-5'},
                                       Grocery.GroceryList(groceryState)),
                         React.DOM.div({className: 'col-sm-3'},
                                       this.getSignInForm(signedIn)),
                         React.DOM.div({className: 'col-sm-2'}));
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
