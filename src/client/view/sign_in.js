var React = require('react');
var _ = require('mori');
var Bacon = require('baconjs');
var State = require('../state');
var $ = require('jquery-node-browserify');

var Validate = require('../../shared/validate');

var SignInForm = React.createClass({
  componentDidUpdate: function(prevProps, prevState, rootNode){
    if(prevProps.signingUp === false && this.props.signingUp === true){
      this.refs.confirmPass.getDOMNode().focus();
    }
  },
  render: function(){
    var signingUp = this.props.signingUp;
    return React.DOM.form({className: 'sign-in-form well well-lg clearfix'},
                          this.getEmailForm(),
                          this.getPasswordForm(),
                          this.getConfirmPassForm(signingUp),
                          this.getButtons(signingUp));
  },
  getEmailForm: function(){
    var error;
    if(this.props.signingUp && this.props.signUpError){
      error = "Invalid email address or password.";
    } else if(!this.props.signingUp && this.props.signInError){
      error = "Invalid email address or password.";
    } else {
      error = this.props.emailError;
    }
    return this.getInputForm('email', 'email', 'Email address', error);
  },
  getPasswordForm: function(){
    return this.getInputForm('password', 'password', 'Password', this.props.passwordError);
  },
  getConfirmPassForm: function(signingUp){
    if(signingUp){
      return this.getInputForm('password', 'confirmPass', 'Confirm Password', this.props.confirmError);
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
                             id: 'signUp',
                             type: 'button',
                             onClick: this.onSignUpClick},
                            "Sign Up");
  },
  getSignInButton: function(){
    return React.DOM.button({className: 'btn btn-primary',
                             id: 'signIn',
                             type: 'button',
                             onClick: this.onSignInClick},
                            "Sign In");
  },
  getCancelButton: function(){
    return React.DOM.button({className: 'btn btn-default',
                             id: 'cancelSignUp',
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
      if(this.props.signingUp){
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
    if(this.props.signingUp){
        this.validateInputAndSignUp();
      } else {
        this.sendSignInStatusChangeEvent({signingUp: true});
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
    if(!Validate.validPasswordLength(password)){
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
    this.sendSignInStatusChangeEvent({passwordError: passwordError,
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
  onSignInClick: function(){
    this.sendSignInEvent();
  },
  sendSignInEvent: function(){
    var email = this.refs.email.getDOMNode().value.trim();
    var password = this.refs.password.getDOMNode().value.trim();

    var event = _.hash_map('eventType', 'signIn', 
                           'email', email,
                           'password', password);
    outgoingEvents.push(event);
  },
  onCancelClick: function(){
    this.sendSignInStatusChangeEvent({signingUp: false,
                                      emailError: null,
                                      passwordError: null,
                                      confirmError: null});
  },
  sendSignInStatusChangeEvent: function(data){
    var event = _.assoc(_.js_to_clj(data), 'eventType', 'signInStatusChange');
    outgoingEvents.push(event);
  }
});

var outgoingEvents = new Bacon.Bus();

module.exports = {
  SignInForm: SignInForm,
  outgoingEvents: outgoingEvents
};
