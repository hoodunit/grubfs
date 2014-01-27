var React = require('react');
var _ = require('mori');
var Bacon = require('baconjs');

var Util = require('./util.js');

var TopBar = React.createClass({
    render: function() {
        var emptyButtonIcon = React.DOM.span({
            className: 'glyphicon glyphicon-trash'
        });
        var emptyButton = React.DOM.button({
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

var GroceryItem = React.createClass({
  startx : 0,
  dist : 0,
  tapped : 0,
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

    var itemInput = React.DOM.input({
        className: 'itemInput display-none',
        onBlur: this.handleInputBlur,
        onKeyPress: this.handleEditEnter,
        ref: 'iteminput'
    });

    var text = React.DOM.span({className: _.get(this.props.data, 'completed') ? 'groceryTextComplete' : 'groceryText',
                               onClick: this.handleInputClick}, //wrong event! change to taphold
                               _.get(this.props.data, 'name')+' ');

    var touched = _.get(this.props.data, 'touched');

    return React.DOM.div({className: _.get(this.props.data, 'completed') ? 'groceryItem list-group-item groceryItemComplete' : 'groceryItem list-group-item',
                         onTouchStart: this.handleTouchStart,
                         onTouchEnd: this.handleTouchEnd,
                         onTouchMove: this.handleTouchMove},
                         checkbox,
                         text,
                         touched ? deleteButton : null,
                         itemInput);
  },
  handleTouchStart : function(e) {
      this.startx = 0;
      this.dist = 0;
      this.tapped = 1;
      var touchedItem = e.changedTouches[0];
      this.startx = parseInt(touchedItem.clientX);
      e.preventDefault();
  },
  handleTouchMove : function(e) {
      this.tapped = 0;
      var touchedItem = e.changedTouches[0];
      this.dist = parseInt(touchedItem.clientX) - this.startx;
      this.getDOMNode().style.left = this.dist + 'px';
      e.preventDefault();
  },
  handleTouchEnd : function(e) {
      var targetWidth = document.getElementById('content').offsetWidth;
      if(this.dist > targetWidth/2) {
        this.handleDeleteClick();
      } else {
        this.getDOMNode().style.left = 0 + 'px';
      }
      if(this.tapped) {
        this.handleInputClick();
      }
      e.preventDefault();
  },
  handleInputClick : function() {
    this.refs.iteminput.getDOMNode().className = 'itemInput';
    this.refs.iteminput.getDOMNode().value = _.get(this.props.data, 'name');
    this.refs.iteminput.getDOMNode().focus();
  },
  handleInputBlur : function() {
    var id = _.get(this.props.data, 'id');
    var name = this.refs.iteminput.getDOMNode().value.trim();
    var eventType = 'editItem';
    var event = _.hash_map('eventType', eventType,
                           'id', id,
                           'name', name);
    outgoingEvents.push(event);
    this.refs.iteminput.getDOMNode().className = 'itemInput display-none';
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
    console.log(_.get(this.props.data, 'id'));
    outgoingEvents.push(event);
  },
  handleEditEnter : function(e) {
    if(e.keyCode == 13) {this.refs.iteminput.getDOMNode().blur();}
  }
});

var GroceryList = React.createClass({
  render: function() {
    var itemNodes = _.into_array(_.map(function(item) {
      return GroceryItem({data: item,
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

module.exports = {
  GroceryList: GroceryList,
  outgoingEvents: outgoingEvents
};
