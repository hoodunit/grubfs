var React = require('react');
var _ = require('mori');
var Bacon = require('baconjs');

var Util = require('./util.js');

var AddGroceryItemInput = React.createClass({
  render: function() {
    var itemNameInput = React.DOM.input({
      className: 'form-control',
      type: 'text',
      placeholder: '2 tomatoes',
      ref: 'name'
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
  }
});

var GroceryItem = React.createClass({
  render: function() {
    var checkbox = React.DOM.input({
      type: 'checkbox',
      checked: this.props.completed,
      onClick: this.handleCompletedClick
    });

    return React.DOM.div({
        className: 'groceryItem'
      },
      checkbox,
      this.props.name);
  },
  handleCompletedClick: function() {
    var id = this.props.id;
    var completed = this.props.completed;
    var eventType = 'completeItem';
    var event = _.hash_map('eventType', eventType,
                           'id', id,
                           'completed', completed);
    outgoingEvents.push(event);
  }
});

var GroceryList = React.createClass({
  render: function() {
    var itemNodes = _.into_array(_.map(function(item) {
      return GroceryItem({
        name: _.get(item, 'name'),
        completed: _.get(item, 'completed'),
        id: _.get(item, 'id'),
        key: _.get(item, 'id')
      });
    }, this.props.items));

    return React.DOM.div({
        className: 'groceryList'
      },
      AddGroceryItemInput({
        onAddItem: this.addItem
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
