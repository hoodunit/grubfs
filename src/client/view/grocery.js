var React = require('react');
var _ = require('mori');
var Bacon = require('baconjs');

var Util = require('../util');
var GroceryItem = require('./grocery_item');

var TopBar = React.createClass({
  getSignOutButton: function(){
    if(!this.props.signedIn){
      return null;
    }
    var icon = React.DOM.span({
      className: 'glyphicon glyphicon-log-out'
    });
    var button = React.DOM.button({
      className: 'btn btn-default nav-btn',
      type: 'button',
      onClick: this.handleSignOut
    }, icon);
    return button;
  },
  render: function() {
    var emptyButtonIcon = React.DOM.span({
      className: 'glyphicon glyphicon-trash'
    });
    var emptyButton = React.DOM.button({
      className: 'btn btn-default empty-btn nav-btn',
      type: 'button',
      onClick: this.handleEmptyClick
    },emptyButtonIcon);

    return React.DOM.div({className: 'top-bar clearfix'}, 
                         this.getSignOutButton(),
                         emptyButton, 
                         AddGroceryItemInput());
  },
  handleEmptyClick: function() {
    var emptyEvent = _.hash_map('eventType', 'emptyList');
    outgoingEvents.push(emptyEvent);
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
    var itemNodes = _.into_array(_.map(function(item) {
      return GroceryItem.GroceryItem({data: item,
                                      key: _.get(item, 'id')});
    }, this.props.items));

    var groceryList = React.DOM.div({
        className: "groceryList list-group"
    },itemNodes);

    return React.DOM.div({
        className: 'groceryMain'
      },
      TopBar({signedIn: this.props.signedIn}),
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
