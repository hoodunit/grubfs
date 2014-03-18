var React = require('react');
var _ = require('mori');

var UserInfo = React.createClass({
  render: function(){
    console.log(this.props);
    return React.DOM.div({className: 'user-info'}, this.props.email);
  }
});

module.exports = {
  UserInfo: UserInfo
};