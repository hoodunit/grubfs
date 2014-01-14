var React = require('react');
var _ = require('mori');

var sid = 0;

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
      var groceryItem = _.hash_map('itemId', sid++, 'name', itemName,
        'completed', false);
      this.props.onAddItem(groceryItem);
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
    var itemId = this.props.itemId;
    this.props.onCompleteItem(itemId);
    this.props.completed = !this.props.completed;
  }
});

var GroceryList = React.createClass({
  getInitialState: function() {
    return {
      items: this.props.initialItems
    };
  },
  addItem: function(item) {
    var items = this.state.items;
    var updatedItems = _.conj(items, item);
    this.setState({
      items: updatedItems
    });
  },
  completeItem: function(itemId) {
    var items = this.state.items;
    var updatedItems = _.vector();
    _.each(items, function(item) {
      if (_.get(item, 'itemId') == itemId) {
        item = _.update_in(item, ['completed'], function() {
          return !_.get(item, 'completed');
        });
      }
      updatedItems = _.conj(updatedItems, item);
    });
    this.setState({
      items: updatedItems
    });
  },
  render: function() {
    var items = this.state.items;
    var completeItemFunc = this.completeItem;
    var itemNodes = _.into_array(_.map(function(item) {
      return GroceryItem({
        name: _.get(item, 'name'),
        completed: _.get(item, 'completed'),
        itemId: _.get(item, "itemId"),
        onCompleteItem: completeItemFunc
      });
    }, items));

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

function render() {
  var initialItems = _.vector(
    _.hash_map('itemId', sid++, 'name', '1 packages of tomato puree', 'completed', false),
    _.hash_map('itemId', sid++, 'name', '4 yellow onions', 'completed', true),
    _.hash_map('itemId', sid++, 'name', '2 dl cream', 'completed', false));

  var groceryListInitialState = {
    initialItems: initialItems
  };

  React.renderComponent(GroceryList(groceryListInitialState), document.getElementById('content'));
}

module.exports = {
  render: render
};
