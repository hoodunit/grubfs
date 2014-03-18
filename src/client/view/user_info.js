var React = require('react');

var UserInfo = React.createClass({
  render: function(){
    return React.DOM.div({className: 'sign-in-form well well-lg clearfix'}, this.props.email);
  }
});

module.exports = {
  UserInfo: UserInfo
};
