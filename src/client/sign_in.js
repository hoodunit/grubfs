var React = require('react');
var _ = require('mori');
var Bacon = require('baconjs');

var Validate = require('../shared/validate');

var SignInForm = React.createClass({
  getInitialState: function(){
    return {signingUp: false, 
            emailError: null,
            passwordError: null,
            confirmError: null};
  },
  componentDidUpdate: function(prevProps, prevState, rootNode){
    if(prevState.signingUp === false && this.state.signingUp === true){
      this.refs.confirmPass.getDOMNode().focus();
    }
  },
  render: function(){
    var signingUp = this.state.signingUp;
    return React.DOM.form({className: 'sign-in-form well well-lg clearfix'},
                          this.getEmailForm(),
                          this.getPasswordForm(),
                          this.getConfirmPassForm(signingUp),
                          this.getButtons(signingUp));
  },
  getEmailForm: function(){
    return this.getInputForm('email', 'email', 'Email address', this.state.emailError);
  },
  getPasswordForm: function(){
    return this.getInputForm('password', 'password', 'Password', this.state.passwordError);
  },
  getConfirmPassForm: function(signingUp){
    if(signingUp){
      return this.getInputForm('password', 'confirmPass', 'Confirm Password', this.state.confirmError);
    } else {
      return null;
    }
  },
  getInputForm: function(type, ref, placeholder, errorMsg){
    var hasErrorClass;
    var label;
    if(errorMsg){
      hasErrorClass = 'has-error';
      label = React.DOM.label({className: 'control-label',
                               htmlFor: ref},
                              errorMsg);
    } else {
      hasErrorClass = '';
      label = null;
    }
    return React.DOM.div({className: 'form-group ' + hasErrorClass,
                          onKeyPress: this.onInputKeyUp},
                         label,
                         React.DOM.input({className: 'form-control',
                                          type: type,
                                          ref: ref,
                                          id: ref,
                                          placeholder: placeholder}));
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
  onInputKeyUp: function(event){
    if(this.enterWasPressed(event)){
      if(this.state.signingUp){
        this.validateInputAndSignUp();
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
        this.validateInputAndSignUp();
    } else {
      this.setState({signingUp: true});
    }
  },
  validateInputAndSignUp: function(){
    var email = this.refs.email.getDOMNode().value.trim();
    var password = this.refs.password.getDOMNode().value.trim();
    var confirmPass = this.refs.confirmPass.getDOMNode().value.trim();
    
    if(this.validateSignUpInput(email, password, confirmPass)){
      this.sendSignUpEvent(email, password, confirmPass);
    }
  },
  validateSignUpInput: function(email, password, confirmPass){
    var valid = true;
    var passwordError = null;
    var confirmError = null;
    var emailError = null;
    if(Validate.validPasswordLength(password)){
      valid = false;
      passwordError = 'Length: ' + 
        Validate.PASSWORD_MIN_LEN + '-' +
        Validate.PASSWORD_MAX_LEN + ' characters';
    }
    if(password !== confirmPass){
      valid = false;
      confirmError = 'Must match password.';
    }
    if(!Validate.validEmail(email)){
      valid = false;
      emailError = 'Invalid email address.';
    }
    this.setState({passwordError: passwordError,
                   confirmError: confirmError,
                   emailError: emailError});
    return valid;
  },
  sendSignUpEvent: function(email, password, confirmPass){
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
  onCancelClick: function(){
    this.setState({signingUp: false,
                   emailError: null,
                   passwordError: null,
                   confirmError: null});
  }
});

var outgoingEvents = new Bacon.Bus();

module.exports = {
  SignInForm: SignInForm,
  outgoingEvents: outgoingEvents
};
