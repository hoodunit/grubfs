var React = require('react');
var _ = require('mori');
var Bacon = require('baconjs');

var SignInForm = React.createClass({
  render: function(){
    var emailForm = React.DOM.div({className: 'form-group'},
                                  React.DOM.input({className: 'form-control',
                                                   type: 'email',
                                                   ref: 'email',
                                                   placeholder: 'Email address'}));
    var passwordForm = React.DOM.div({className: 'form-group'},
                                     React.DOM.input({className: 'form-control',
                                                      type: 'password',
                                                      ref: 'password',
                                                      placeholder: 'Password'}));

    var confirmPassForm = React.DOM.div({className: 'form-group'},
                                        React.DOM.input({className: 'form-control',
                                                         type: 'password',
                                                         ref: 'confirmPass',
                                                         placeholder: 'Confirm Password'}));

    var submitButton = React.DOM.button({className: 'btn btn-default',
                                         type: 'button',
                                         onClick: this.onSignUpClick},
                                        "Sign Up");

    return React.DOM.form({className: 'well well-lg'}, 
                          emailForm,
                          passwordForm,
                          confirmPassForm,
                          submitButton);
  },
  onSignUpClick: function(){
    var email = this.refs.email.getDOMNode().value.trim();
    var password = this.refs.password.getDOMNode().value.trim();
    var confirmPass = this.refs.confirmPass.getDOMNode().value.trim();
    console.log('Sign up email:', email, 'pass:', password, 'confirm:', confirmPass);

    var event = _.hash_map('eventType', 'signUp', 
                           'email', email,
                           'password', password);
    outgoingEvents.push(event);
  }
});

var outgoingEvents = new Bacon.Bus();

module.exports = {
  SignInForm: SignInForm,
  outgoingEvents: outgoingEvents
};
