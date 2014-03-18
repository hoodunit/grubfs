var React = require('react');

var UserInfo = React.createClass({
  render: function(){
    return React.DOM.div({className: 'user-info'}, this.props.email);
  }
});

module.exports = {
  UserInfo: UserInfo
};
