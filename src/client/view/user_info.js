var React = require('react');
var _ = require('mori');

var UserInfo = React.createClass({
  render: function(){
    return React.DOM.div({className: 'sign-in-form well well-lg clearfix'}, _.get(this.props, 'email'));
  }
});

module.exports = {
  UserInfo: UserInfo
};