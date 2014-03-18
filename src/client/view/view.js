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
      return UserInfo.UserInfo(this.props.credentials);
    } else {
      return SignIn.SignInForm(this.props.clientState);
    }
  },
  render: function() {
    var groceryState = {items: this.props.items,
                        signedIn: this.props.signedIn};

    return React.DOM.div({}, 
                         React.DOM.div({className: 'col-md-2'}),
                         React.DOM.div({className: 'col-md-5'},
                                       Grocery.GroceryList(groceryState)),
                         React.DOM.div({className: 'col-md-3'},
                                       this.getSignInFormOrUserInfo(this.props.signedIn)),
                         React.DOM.div({className: 'col-md-2'}));
  }
});

var outgoingEvents = Bacon.mergeAll(Grocery.outgoingEvents, SignIn.outgoingEvents);

function render(state) {
  React.initializeTouchEvents(true);
  var signedIn = State.signedIn(state);
  var jsState = _.clj_to_js(state);
  jsState.signedIn = signedIn;
  React.renderComponent(GrubView(jsState), document.getElementById('content'));
}

module.exports = {
  render: render,
  outgoingEvents: outgoingEvents
};
