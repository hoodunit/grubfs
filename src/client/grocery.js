var React = require('react');
var _ = require('mori');
var crypto = require('crypto');

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

    /* Works in the same way as addItem */
    var deleteItemInnerBtn = React.DOM.button({className: 'btn btn-primary',
      type: 'button',
      onClick: this.handleDeleteClick},
      'Delete');
    var deleteItemBtn = React.DOM.span({className: 'input-group-btn'},
     deleteItemInnerBtn);

    return React.DOM.div({
        className: 'input-group'
      },
      itemNameInput,
      addItemBtn,
      deleteItemBtn);
  },
  handleAddClick: function() {
    var itemName = this.refs.name.getDOMNode().value.trim();
    if (itemName) {
      this.refs.name.getDOMNode().value = '';
      var groceryItem = _.hash_map('itemId', sid(), 'name', itemName,
        'completed', false);
      this.props.onAddItem(groceryItem);
    }
  },
  handleDeleteClick: function() {
    this.props.onDeleteItem();}
});

var GroceryItem = React.createClass({
  render: function() {
    var checkbox = React.DOM.input({
      type: 'checkbox',
      checked: this.props.completed,
      onClick: this.handleCompletedClick
    });

    /* this was needed, otherwise 'select' overwrites 'checkbox' */
    var text = React.DOM.span({
      type: 'text',
      onClick: this.handleSelectedClick,
      ref: 'gitem'
    }, this.props.name);

    return React.DOM.div({
        className: 'groceryItem',
      }, checkbox, text);
  },
  handleCompletedClick: function() {
    var itemId = this.props.itemId;
    this.props.onCompleteItem(itemId);
    this.props.completed = !this.props.completed;
  },
  handleSelectedClick: function() {
    console.log(this.props.selected);
    /* This is only to show it works... */
    if (!this.props.selected)
      this.refs.gitem.getDOMNode().style.background = 'yellow';
    else
      this.refs.gitem.getDOMNode().style.background = 'white';

    this.props.onSelectItem(this.props.itemId);
  }
});

var GroceryList = React.createClass({
  getInitialState: function() {
    var localStorageItemsJson = localStorage.getItem("items");
    if(localStorageItemsJson !== null) {
      try {
        var localStorageItems = JSON.parse(localStorageItemsJson);
        return {items: _.js_to_clj(localStorageItems)};
      } catch(e) {
        console.log("invalid localStorage contents, resetting");
      }
    }
    return {
      items: this.props.initialItems
    };
  },
  addItem: function(item) {
    var items = this.state.items;
    var updatedItems = _.conj(items, item);
    localStorage.setItem("items", JSON.stringify(_.clj_to_js(updatedItems)));
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
  deleteItem: function() {
    var items = this.state.items;
    var updatedItems = _.remove(function(x) {return _.get(x,'selected');},
      items);
    this.setState({items: updatedItems});
  },
  selectItem: function(id) {
    var items = this.state.items;
    var updatedItems = _.vector();
    _.each(items, function(item) {
      if (_.get(item, 'itemId') === id) {
        item = _.update_in(item, ['selected'], function() {
          return !_.get(item, 'selected');
        });
      }
      updatedItems = _.conj(updatedItems, item);
    });
    this.setState({items: updatedItems});
  },
  render: function() {
    var items = this.state.items;
    var completeItemFunc = this.completeItem;
    var selectItemFunc = this.selectItem;
    var itemNodes = _.into_array(_.map(function(item) {
      return GroceryItem({
        name: _.get(item, 'name'),
        completed: _.get(item, 'completed'),
        itemId: _.get(item, "itemId"),
        onCompleteItem: completeItemFunc,
        onSelectItem: selectItemFunc,
        selected: _.get(item, 'selected'),
      });
    }, items));

    return React.DOM.div({
        className: 'groceryList'
      },
      AddGroceryItemInput({
        onAddItem: this.addItem,
        onDeleteItem: this.deleteItem
      }),
      itemNodes
    );
  }
});

var sid = function() {
    var current_date = (new Date()).valueOf().toString();
    var random = Math.random().toString();
    var num = crypto.createHash('sha1').update(current_date + random).digest('hex');
    return num;
};

function render() {
  var initialItems = _.vector(
    _.hash_map('itemId', sid(), 'name', '1 packages of tomato puree', 'completed', false,
      'selected', false),
    _.hash_map('itemId', sid(), 'name', '4 yellow onions', 'completed', true,
      'selected', false),
    _.hash_map('itemId', sid(), 'name', '2 dl cream', 'completed', false,
      'selected', false));

  var groceryListInitialState = {
    initialItems: initialItems
  };

  React.renderComponent(GroceryList(groceryListInitialState), document.getElementById('content'));
}

module.exports = {
  render: render
};
