var React = require('react');
var _ = require('mori');
var Bacon = require('baconjs');

var Util = require('../util');
var GroceryItem = require('./grocery_item');
var UserInfo = require('./user_info');

var ControlBar = React.createClass({
  render: function() {
    var emptyButtonIcon = React.DOM.span({
      className: 'glyphicon glyphicon-trash'
    });
    var emptyButton = React.DOM.button({
      className: 'btn btn-default empty-btn nav-btn',
      id: 'clearList',
      type: 'button',
      dataToggle: 'tooltip',
      dataPlacement: 'top',
      title: 'Clear all items',
      onClick: this.handleEmptyClick
    },emptyButtonIcon);

    return React.DOM.div({className: 'top-bar clearfix'}, 
                         emptyButton, 
                         AddGroceryItemInput());
  },
  handleEmptyClick: function() {
    var emptyEvent = _.hash_map('eventType', 'emptyList');
    outgoingEvents.push(emptyEvent);
  }
});

var UserBar = React.createClass({
  getSignOutButton: function(){
    if(!this.props.signedIn){
      return null;
    }
    var icon = React.DOM.span({
      className: 'glyphicon glyphicon-log-out',
    });
    var button = React.DOM.button({
      className: 'btn btn-default nav-btn',
      id: 'signOut',
      type: 'button',
      onClick: this.handleSignOut,
      dataToggle: 'tooltip',
      dataPlacement: 'top',
      title: 'Sign out'
    }, icon);
    return button;
  },
  render: function() {
    return React.DOM.div({className: 'top-bar clearfix'}, 
                         this.getSignOutButton(),
                         UserInfo.UserInfo({email: this.props.email}));
  },
  handleSignOut: function() {
    var event = _.hash_map('eventType', 'signOut');
    outgoingEvents.push(event);
  }
});

var AddGroceryItemInput = React.createClass({
  render: function() {
    var itemNameInput = React.DOM.input({
      id: 'name',
      className: 'form-control',
      type: 'text',
      placeholder: 'What do you need?',
      ref: 'name',
      onKeyPress: this.handleAddEnter
    });
    var addItemInnerBtn = React.DOM.button({
        id: 'add',
        className: 'btn btn-primary',
        type: 'button',
        onClick: this.handleAddClick
      },
      'Add');
    var addItemBtn = React.DOM.span({
        className: 'input-group-btn'
      },
      addItemInnerBtn);
    return React.DOM.div({
        className: 'input-group'
      },
      itemNameInput,
      addItemBtn);
  },
  handleAddClick: function() {
    var itemName = this.refs.name.getDOMNode().value.trim();
    if (itemName) {
      this.refs.name.getDOMNode().value = '';
      var addItemEvent = _.hash_map('eventType', 'addItem',
                                    'id', Util.generateUUID(),
                                    'name', itemName);
      outgoingEvents.push(addItemEvent);
      this.refs.name.getDOMNode().focus();
    }
  },
  handleAddEnter: function(e) {
    //13: Enter key
    if (e.keyCode==13) {this.handleAddClick();}
  }
});

var GroceryList = React.createClass({
  render: function() {
    var itemsSorted = _.sort(function(a, b) {
      return _.get(a, 'completed') - _.get(b, 'completed');
    }, this.props.items);

    var itemNodes = _.into_array(_.map(function(item) {
      return GroceryItem.GroceryItem({data: item,
                                      key: _.get(item, 'id')});
    }, itemsSorted));

    var groceryList = React.DOM.div({
        className: "groceryList list-group"
    },itemNodes);

    return React.DOM.div({
        className: 'groceryMain'
      },
      UserBar({signedIn: this.props.signedIn, email: this.props.email}),
      ControlBar(),
      groceryList
    );
  }
});

var outgoingEvents = new Bacon.Bus();
outgoingEvents.plug(GroceryItem.outgoingEvents);

module.exports = {
  GroceryList: GroceryList,
  outgoingEvents: outgoingEvents
};
