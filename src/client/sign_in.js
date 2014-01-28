var React = require('react');
var _ = require('mori');
var Bacon = require('baconjs');

var SignInForm = React.createClass({
  getInputForm: function(type, ref, placeholder){
    return React.DOM.div({className: 'form-group',
                          onKeyPress: this.onInputKeyUp},
                         React.DOM.input({className: 'form-control',
                                          type: type,
                                          ref: ref,
                                          placeholder: placeholder}));
  }, 
  getEmailForm: function(){
    return this.getInputForm('email', 'email', 'Email address');
  },
  getPasswordForm: function(){
    return this.getInputForm('password', 'password', 'Password');
  },
  getConfirmPassForm: function(signingUp){
    if(signingUp){
      return this.getInputForm('password', 'confirmPass', 'Confirm Password');
    } else {
      return null;
    }
  },
  getSignUpButton: function(){
    return React.DOM.button({className: 'btn btn-success',
                             type: 'button',
                             onClick: this.onSignUpClick},
                            "Sign Up");
  },
  getSignInButton: function(){
    return React.DOM.button({className: 'btn btn-primary',
                             type: 'button',
                             onClick: this.onSignInClick},
                            "Sign In");
  },
  getCancelButton: function(){
    return React.DOM.button({className: 'btn btn-default',
                             type: 'button',
                             onClick: this.onCancelClick},
                            "Cancel");
  },
  getButtons: function(signingUp){
    if(signingUp){
      return React.DOM.div({className: 'pull-right'}, 
                           this.getCancelButton(), 
                           this.getSignUpButton());
    } else {
      return React.DOM.div({className: 'pull-right'}, 
                           this.getSignUpButton(), 
                           this.getSignInButton());
    }
  },
  getInitialState: function(){
    return {signingUp: false};
  },
  render: function(){
    var signingUp = this.state.signingUp;
    return React.DOM.form({className: 'sign-in-form well well-lg clearfix'},
                          this.getEmailForm(),
                          this.getPasswordForm(),
                          this.getConfirmPassForm(signingUp),
                          this.getButtons(signingUp));
  },
  onInputKeyUp: function(event){
    if(this.enterWasPressed(event)){
      if(this.state.signingUp){
        this.sendSignUpEvent();
      } else {
        this.sendSignInEvent();
      }
    }
  },
  enterWasPressed: function(event){
    var ENTER_KEYCODE = 13;
    return event.keyCode === ENTER_KEYCODE;
  },
  onSignUpClick: function(){
    if(this.state.signingUp){
      this.sendSignUpEvent();
    } else {
      this.setState({signingUp: true});
    }
  },
  sendSignUpEvent: function(){
    var email = this.refs.email.getDOMNode().value.trim();
    var password = this.refs.password.getDOMNode().value.trim();
    var confirmPass = this.refs.confirmPass.getDOMNode().value.trim();
    console.log('Sign up email:', email, 'pass:', password, 'confirm:', confirmPass);

    var event = _.hash_map('eventType', 'signUp', 
                           'email', email,
                           'password', password);
    outgoingEvents.push(event);
  },
  sendSignInEvent: function(){
    var email = this.refs.email.getDOMNode().value.trim();
    var password = this.refs.password.getDOMNode().value.trim();
    console.log('Sign in email:', email, 'pass:', password);

    var event = _.hash_map('eventType', 'signIn', 
                           'email', email,
                           'password', password);
    outgoingEvents.push(event);
  },
  componentDidUpdate: function(prevProps, prevState, rootNode){
    if(prevState.signingUp === false && this.state.signingUp === true){
      this.refs.confirmPass.getDOMNode().focus();
    }
  },
  onCancelClick: function(){
    this.setState({signingUp: false});
  }
});

var outgoingEvents = new Bacon.Bus();

module.exports = {
  SignInForm: SignInForm,
  outgoingEvents: outgoingEvents
};
