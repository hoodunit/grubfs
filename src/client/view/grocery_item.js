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
      editing: false,
      mouseover: false
    };
  },
  componentDidUpdate: function(prevProps, prevState, rootNode){
    if(this.enteringEditState){
      this.refs.iteminput.getDOMNode().focus();
    }
  },
  enteringEditState: function(prevState){
    return (this.state.editing && !prevState.editing);
  },
  exitingEditState: function(prevState){
    return (!this.state.editing && prevState.editing);
  },
  render: function() {
    var name = _.get(this.props.data, 'name');
    var isCompleted = _.get(this.props.data, 'completed');

    var itemClass = 'groceryItem list-group-item';
    if(isCompleted){
      itemClass += ' groceryItemComplete';
    }
    if(this.state.tapped){
      itemClass += ' pressed';
    }

    return React.DOM.div({className: itemClass,
                          style: {left: this.state.dist + 'px'},
                          onTouchStart: this.handleTouchStart,
                          onTouchEnd: this.handleTouchEnd,
                          onTouchMove: this.handleTouchMove,
                          onMouseDown: this.handleMouseDown,
                          onMouseLeave: this.handleMouseLeave,
                          onMouseUp: this.handleMouseUp,
                          onMouseEnter: this.handleMouseEnter},

                         this.getText(isCompleted, name, this.state.editing),
                         this.getDeleteButton(this.state.editing),
                         this.getItemInput(this.state.editing),
                         this.getEditButton(this.state.editing, this.state.mouseover));
  },
  getCheckbox: function(isCompleted){
    return React.DOM.input({
      type: 'checkbox',
      checked: isCompleted,
      onClick: this.handleCompletedClick
    });
  },
  noProp: function(event) {
    event.stopPropagation();
  },
  getDeleteButton: function(editing){
    var baseClass = 'del-btn glyphicon glyphicon-remove';
    var delBtnClass = editing ? baseClass : baseClass + ' display-none';
    var icon = React.DOM.span({
      className: delBtnClass,
      onClick: this.handleDeleteClick,
      ref: 'delbtn',
      dataToggle: 'tooltip',
      dataPlacement: 'top',
      title: 'Delete the item'
    });
    return icon;
  },

  getEditButton: function(editing, mouseover) {
    var baseClass = 'del-btn glyphicon glyphicon-edit pull-right';
    var editBtnClass = (!editing && mouseover) ? baseClass: baseClass + ' display-none';
    var icon = React.DOM.span({
      className: editBtnClass,
      onClick: this.setEditing,
      onMouseUp: this.noProp,
      onMouseDown: this.noProp,
      ref: 'editbtn',
      dataToggle: 'tooltip',
      dataPlacement: 'top',
      title: 'Rename the item'
    });
    return icon;
  },
  getItemInput: function(editing){
    var className = editing ? 'itemInput' : 'itemInput display-none';

    return React.DOM.input({
        className: className,
        onBlur: this.handleInputBlur,
        onKeyPress: this.handleEditEnter,
        ref: 'iteminput',
        defaultValue: _.get(this.props.data, 'name')
    });
  },
  getText: function(isCompleted, name, editing){
    if(editing){
      return null;
    } else {
      var textClass = isCompleted ? 'groceryTextComplete' : 'groceryText';

      return React.DOM.span({className: textClass}, name);
    }
  },
  handleMouseLeave: function(){
    clearTimeout(this.state.pressTimer);
    this.setState({
      dist: 0,
      tapped: false,
      mouseover: false
    });
  }, 
  handleMouseDown: function(event){
    if(!this.state.editing){
      event.preventDefault();
      var mouseX = parseInt(event.pageX);
      this.setSwipeStartPosition(mouseX);
    } else if(this.deleteButtonWasClicked(event)){
      // Avoid handling event here so that it is handled
      // by the delete button handler
      event.preventDefault();
    }
  },
  deleteButtonWasClicked: function(event){
    return (event.target === this.refs.delbtn.getDOMNode());
  },
  handleTouchStart : function(event) {
    if(!this.state.editing){
      event.preventDefault();
      var touchedItem = event.changedTouches[0];
      var startx = parseInt(touchedItem.pageX);
      this.setSwipeStartPosition(startx);
    }
  },
  setSwipeStartPosition: function(startx){
    this.setState({
      startx: startx,
      dist: 0,
      tapped: true,
      pressTimer: window.setTimeout(this.setEditing, 750)
    });
  },
  handleTouchMove : function(event) {
    if(!this.state.editing){
      event.preventDefault();
      var touchedItem = event.changedTouches[0];
      var touchX = touchedItem.pageX;
      this.updateSwipePosition(touchX);
    }
  },
  updateSwipePosition: function(eventX){
    clearTimeout(this.state.pressTimer);
    var dist = eventX - this.state.startx;
    this.setState({
      dist: dist,
      tapped: false
    });
  },
  handleMouseUp: function(event){
    if(!this.state.editing){
      event.preventDefault();
      this.handleSwipeEnd();
    }
  },
  handleTouchEnd: function(event){
    if(!this.state.editing){
      event.preventDefault();
      this.handleSwipeEnd();
    }
  },
  handleSwipeEnd: function(event){
    var targetWidth = document.getElementById('content').offsetWidth;
    if(this.state.dist > targetWidth/2) {
      this.sendDeleteEvent();
    }
    if(this.state.tapped) {
      this.sendCompletedEvent();
    }
    clearTimeout(this.state.pressTimer);
    this.setState({
      dist: 0,
      tapped: false
    });
  },
  setEditing: function(){
    this.setState({editing: true,
                   tapped: false});
  },
  handleInputBlur : function() {
    this.setState({editing: false});
    this.sendUpdateEvent();
  },
  sendUpdateEvent: function(){
    var id = _.get(this.props.data, 'id');
    var name = this.refs.iteminput.getDOMNode().value.trim();
    var eventType = 'updateItem';
    var event = _.hash_map('eventType', eventType,
                           'id', id,
                           'name', name);
    outgoingEvents.push(event);
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
                           'id', _.get(this.props.data, 'id'));

    outgoingEvents.push(event);
  },
  handleDeleteClick: function(e) {
    this.sendDeleteEvent();
  },
  sendDeleteEvent: function(){
    var event = _.hash_map('eventType', 'deleteItem',
                          'id', _.get(this.props.data, 'id'));
    outgoingEvents.push(event);
  },
  handleEditEnter : function(event) {
    if(this.enterWasPressed(event)){
      this.refs.iteminput.getDOMNode().blur();
    }
  },
  enterWasPressed: function(event){
    return (event.keyCode === 13);
  },
  handleMouseEnter: function(event){
    if (!this.state.editing)
      this.setState({mouseover: true});
  }

});

var outgoingEvents = new Bacon.Bus();

module.exports = {
  GroceryItem: GroceryItem,
  outgoingEvents: outgoingEvents
};
