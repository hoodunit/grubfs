var React = require('react');
var _ = require('mori');
var Bacon = require('baconjs');

var Util = require('./util.js');

var TopBar = React.createClass({
    render: function() {
        var emptyButton = React.DOM.button({
            className: 'btn btn-danger empty-btn',
            type: 'button',
            onClick: this.handleEmptyClick
        }, 'Dele');

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
      className: 'form-control',
      type: 'text',
      placeholder: '2 tomatoes',
      ref: 'name',
      onKeyPress: this.handleAddEnter
    });
    var addItemInnerBtn = React.DOM.button({
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

var GroceryItem = React.createClass({
  render: function() {
    var checkbox = React.DOM.input({
      type: 'checkbox',
      checked: _.get(this.props.data, 'completed'),
      onClick: this.handleCompletedClick
    });

    var deleteButton = React.DOM.button({
      className: 'btn btn-danger',
      type: 'button',
      onClick: this.handleDeleteClick
    }, 'Delete');

    var text = React.DOM.span({className: 'groceryText',
                               onClick: this.handleHold}, //wrong event! change to taphold
                               _.get(this.props.data, 'name')+' ');

    var touched = _.get(this.props.data, 'touched');

    return React.DOM.div({className: 'groceryItem'},
                         checkbox,
                         text,
                         touched ? deleteButton : null);
  },
  handleCompletedClick: function() {
    var id = _.get(this.props.data, 'id');
    var completed = _.get(this.props.data, 'completed');
    var eventType = 'completeItem';
    var event = _.hash_map('eventType', eventType,
                           'id', id,
                           'completed', completed);
    outgoingEvents.push(event);
  },
  handleHold: function() {
    var event = _.hash_map('eventType', 'holdItem',
                           'id', _.get(this.props.data, 'id'),
                           'touched', _.get(this.props.data, 'touched'));

    outgoingEvents.push(event);
  },
  handleDeleteClick: function() {
    var event = _.hash_map('eventType', 'deleteItem',
                          'id', _.get(this.props.data, 'id'));
    outgoingEvents.push(event);
  }
});

var GroceryList = React.createClass({
  render: function() {
    var itemNodes = _.into_array(_.map(function(item) {
      return GroceryItem({data: item,
                          key: _.get(item, 'id')});
    }, this.props.items));

    return React.DOM.div({
        className: 'groceryList'
      },
      TopBar(),
      AddGroceryItemInput({
//        onAddItem: this.addItem
      }),
      itemNodes
    );
  }
});

var outgoingEvents = new Bacon.Bus();

module.exports = {
  GroceryList: GroceryList,
  outgoingEvents: outgoingEvents
};
