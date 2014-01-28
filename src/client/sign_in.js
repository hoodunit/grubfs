var React = require('react');
var _ = require('mori');
var Bacon = require('baconjs');

var SignInForm = React.createClass({
  getEmailForm: function(){
    return React.DOM.div({className: 'form-group'},
                         React.DOM.input({className: 'form-control',
                                          type: 'email',
                                          ref: 'email',
                                          placeholder: 'Email address'}));
  },
  getPasswordForm: function(){
    return React.DOM.div({className: 'form-group'},
                         React.DOM.input({className: 'form-control',
                                          type: 'password',
                                          ref: 'password',
                                          placeholder: 'Password'}));
  },
  getConfirmPassForm: function(signingUp){
    if(signingUp){
      return React.DOM.div({className: 'form-group'},
                           React.DOM.input({className: 'form-control',
                                            type: 'password',
                                            ref: 'confirmPass',
                                            placeholder: 'Confirm Password'}));
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
  onSignUpClick: function(){
    if(this.state.signingUp){
      var email = this.refs.email.getDOMNode().value.trim();
      var password = this.refs.password.getDOMNode().value.trim();
      var confirmPass = this.refs.confirmPass.getDOMNode().value.trim();
      console.log('Sign up email:', email, 'pass:', password, 'confirm:', confirmPass);

      var event = _.hash_map('eventType', 'signUp', 
                             'email', email,
                             'password', password);
      outgoingEvents.push(event);
    } else {
      this.setState({signingUp: true});
    }
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
