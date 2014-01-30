var React = require('react');
var _ = require('mori');
var Bacon = require('baconjs');

var Util = require('./util');
var GroceryItem = require('./grocery_item');

var TopBar = React.createClass({
    render: function() {
        var emptyButtonIcon = React.DOM.span({
            className: 'glyphicon glyphicon-trash'
        });
        var emptyButton = React.DOM.button({
            id: 'clearlist',
            className: 'btn btn-default empty-btn',
            type: 'button',
            onClick: this.handleEmptyClick
        },emptyButtonIcon);

        return React.DOM.div({
            className: 'top-bar clearfix'
        }, emptyButton);
    },

    handleEmptyClick: function() {
      var emptyEvent = _.hash_map('eventType', 'emptyList');
      outgoingEvents.push(emptyEvent);
    }
});

var AddGroceryItemInput = React.createClass({
  render: function() {
    var itemNameInput = React.DOM.input({
      id: 'name',
      className: 'form-control',
      type: 'text',
      placeholder: '2 tomatoes',
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
      TopBar(),
      AddGroceryItemInput({
//        onAddItem: this.addItem
      }),
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
