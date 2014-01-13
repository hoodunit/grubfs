var React = require('react');
var _ = require('mori');

var AddGroceryItemInput = React.createClass({
  render: function(){
    var itemNameInput = React.DOM.input({className: 'form-control',
                                        type: 'text',
                                        placeholder: '2 tomatoes',
                                        ref: 'name'});
    var addItemInnerBtn = React.DOM.button({className: 'btn btn-primary',
                                            type: 'button',
                                            onClick: this.handleAddClick},
                                           'Add');
    var addItemBtn = React.DOM.span({className: 'input-group-btn'},
                                    addItemInnerBtn);
    return React.DOM.div({className: 'input-group'},
                         itemNameInput,
                         addItemBtn);
  },
  handleAddClick: function(){
    var itemName = this.refs.name.getDOMNode().value.trim();
    if(itemName){
      this.refs.name.getDOMNode().value = '';
      var groceryItem = _.hash_map('name', itemName,
                                   'completed', false);
      this.props.onAddItem(groceryItem);
    }
  }
});

var GroceryItem = React.createClass({
  render: function(){
    return React.DOM.div({className: 'groceryItem'},
                          React.DOM.input({type: 'checkbox',
                                           checked: this.props.completed}),
                          this.props.name);
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
    return {items: this.props.initialItems};
  },
  addItem: function(item){
    var items = this.state.items;
    var updatedItems = _.conj(items, item);
    this.setState({items: updatedItems});
    localStorage.setItem("items", JSON.stringify(_.clj_to_js(updatedItems)));
  },
  render: function() {
    var items = this.state.items;
    var itemNodes = _.into_array(_.map(function(item) {
      return GroceryItem({name: _.get(item, 'name'),
                          completed: _.get(item, 'completed')});
    }, items));

    return React.DOM.div({className: 'groceryList'},
                         AddGroceryItemInput({onAddItem: this.addItem}),
                         itemNodes
    );
  }
});
  
function render(){
  var initialItems = _.vector(
    _.hash_map('name', '2 packages of tomato puree', 'completed', false),
    _.hash_map('name', '4 yellow onions', 'completed', true),
    _.hash_map('name', '2 dl cream', 'completed', false));

  var groceryListInitialState = {initialItems: initialItems};

  React.renderComponent(GroceryList(groceryListInitialState), document.getElementById('content'));
}

module.exports = {
  render: render
};
