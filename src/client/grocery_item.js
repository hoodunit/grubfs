var React = require('react');
var _ = require('mori');
var Bacon = require('baconjs');

var GroceryItem = React.createClass({
  getInitialState: function(){
    return {
      startx : 0,
      dist : 0,
      tapped : false,
      pressTimer : null,
      editing: false};
  },
  componentDidUpdate: function(prevProps, prevState, rootNode){
    if(this.state.editing && !prevState.editing){
      this.refs.iteminput.getDOMNode().focus();
    }
  },
  render: function() {
    var name = _.get(this.props.data, 'name');
    var isCompleted = _.get(this.props.data, 'completed');
    var touched = _.get(this.props.data, 'touched');

    var itemClass;
    if(isCompleted){
      itemClass = 'groceryItem list-group-item groceryItemComplete';
    } else {
      itemClass = 'groceryItem list-group-item';
    }

    return React.DOM.div({className: itemClass,
                          style: {left: this.state.dist + 'px'},
                          onTouchStart: this.handleTouchStart,
                          onTouchEnd: this.handleTouchEnd,
                          onTouchMove: this.handleTouchMove},
                         this.getCheckbox(isCompleted),
                         this.getText(isCompleted, name),
                         touched ? this.getDeleteButton() : null,
                         this.getItemInput(this.state.editing));
  },
  getCheckbox: function(isCompleted){
    return React.DOM.input({
      type: 'checkbox',
      checked: isCompleted,
      onClick: this.handleCompletedClick
    });
  },
  getDeleteButton: function(){
    return React.DOM.button({
      className: 'btn btn-danger',
      type: 'button',
      onClick: this.handleDeleteClick
    }, 'Delete');
  },
  getItemInput: function(editing){
    var className = editing ? 'itemInput' : 'itemInput display-none';
    var value = editing ? _.get(this.props.data, 'name') : '';

    return React.DOM.input({
        className: className,
        onBlur: this.handleInputBlur,
        onKeyPress: this.handleEditEnter,
        ref: 'iteminput',
        value: value
    });
  }, 
  getText: function(isCompleted, name){
    var textClass = isCompleted ? 'groceryTextComplete' : 'groceryText';

    return React.DOM.span({className: textClass,
                           onClick: this.handleTouchStart},
                          name);
  },
  handleTouchStart : function(event) {
    event.preventDefault();
    console.log('handle touch start:', event);
    var touchedItem = event.changedTouches[0];
    this.setState({
      startx: parseInt(touchedItem.clientX),
      dist: 0,
      tapped: true,
      pressTimer: window.setTimeout(this.setEditing, 750)
    });
  },
  handleTouchMove : function(event) {
    event.preventDefault();
    clearTimeout(this.state.pressTimer);
    var touchedItem = event.changedTouches[0];
    var dist = parseInt(touchedItem.clientX) - this.state.startx;
    this.setState({
      tapped: false,
      dist: dist
    });
  },
  handleTouchEnd : function(event) {
    event.preventDefault();
    var targetWidth = document.getElementById('content').offsetWidth;
    var dist = this.state.dist;
    if(this.state.dist > targetWidth/2) {
      this.sendDeleteEvent();
    } else {
      dist = 0;
      this.getDOMNode().style.left = 0 + 'px';
    }
    if(this.state.tapped) {
      this.sendCompletedEvent();
    }
    clearTimeout(this.state.pressTimer);
    this.setState({
      dist: 0
    });
  },
  setEditing : function() {
    this.setState({editing: true});
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
    this.sendCompletedEvent();
  },
  sendCompletedEvent: function(){
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
    this.sendDeleteEvent();
  },
  sendDeleteEvent: function(){
    var event = _.hash_map('eventType', 'deleteItem',
                          'id', _.get(this.props.data, 'id'));
    console.log(_.get(this.props.data, 'id'));
    outgoingEvents.push(event);
  },
  handleEditEnter : function(e) {
    if(e.keyCode == 13) {this.refs.iteminput.getDOMNode().blur();}
  }
});

var outgoingEvents = new Bacon.Bus();

module.exports = {
  GroceryItem: GroceryItem,
  outgoingEvents: outgoingEvents
};
