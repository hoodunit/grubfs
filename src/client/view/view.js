var Bacon = require('baconjs');
var React = require('react');
var _ = require('mori');

var Grocery = require('./grocery');
var SignIn = require('./sign_in');
var UserInfo = require('./user_info');
var State = require('../state');

var GrubView = React.createClass({
  getSignInFormOrUserInfo: function(signedIn){
    if(signedIn){
      return UserInfo.UserInfo(_.get(this.props, 'credentials'));
    } else {
      return SignIn.SignInForm({});
    }
  },
  render: function() {
    var signedIn = State.signedIn(this.props);
    var groceryState = {items: _.get(this.props, 'items'),
                        signedIn: signedIn};

    return React.DOM.div({}, 
                         React.DOM.div({className: 'col-md-2'}),
                         React.DOM.div({className: 'col-md-5'},
                                       Grocery.GroceryList(groceryState)),
                         React.DOM.div({className: 'col-md-3'},
                                       this.getSignInFormOrUserInfo(signedIn)),
                         React.DOM.div({className: 'col-md-2'}));
  }
});

var outgoingEvents = Bacon.mergeAll(Grocery.outgoingEvents, SignIn.outgoingEvents);

function render(state) {
  React.initializeTouchEvents(true);
  React.renderComponent(GrubView(state), document.getElementById('content'));
}

module.exports = {
  render: render,
  outgoingEvents: outgoingEvents
};
