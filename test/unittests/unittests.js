var assert = require('assert');
var _ = require('mori');
var client = require('./../../src/client/state.js');

describe('handleAddItem', function(){
  it('should properly add items', function(){
        //create an empty state
        var initialState = _.hash_map('items', _.vector());

        //add a banana
        var newItem = _.hash_map('id', 4,
                           'name', 'a banana');
        var newState = client.handleAddItem(initialState, newItem);

        //check that there is a banana in the list
        var measuredItem = _.nth(_.get(newState,'items'),0);
        assert.equal(_.count(_.get(newState,'items')),1);
        assert.equal(_.get(measuredItem,'name'),'a banana');
        assert.equal(_.get(measuredItem,'id'),'4');
        assert.equal(_.get(measuredItem,'completed'),false);
        assert.equal(_.get(measuredItem,'touched'),false);

        //add coffee
        newItem = _.hash_map('id', 7,
                           'name', 'coffee');
        newState = client.handleAddItem(newState, newItem);

        //check that there is coffee and and a banana in the list
        assert.equal(_.count(_.get(newState,'items')),2);
        measuredItem = _.nth(_.get(newState,'items'),0);
        assert.equal(_.get(measuredItem,'name'),'a banana');
        measuredItem = _.nth(_.get(newState,'items'),1);
        assert.equal(_.get(measuredItem,'name'),'coffee');
        assert.equal(_.get(measuredItem,'id'),'7');
        assert.equal(_.get(measuredItem,'completed'),false);
        assert.equal(_.get(measuredItem,'touched'),false);
    });
});

describe('handleCompleteItem', function(){
  it('should check off completed items', function(){
        //create an empty state
        var initialState = _.hash_map('items', _.vector(
            _.hash_map('id', 0,
                       'name', '1 packages of tomato puree',
                       'completed', false,
                       'touched', false),
            _.hash_map('id', 1,
                       'name', '2 dl cream',
                       'completed', false,
                       'touched', false)));

        //check off tomato puree
        var newEvent = _.hash_map('id', 0,
                           'completed', false);
        var newState = client.handleCompleteItem(initialState, newEvent);

        //check that tomato puree is completed
        var measuredItem = _.nth(_.get(newState,'items'),0);
        assert.equal(_.get(measuredItem,'id'),'0');
        assert.equal(_.get(measuredItem,'completed'),true);
    });
  it('should uncheck completed items', function(){
        //create an empty state
        var initialState = _.hash_map('items', _.vector(
    _.hash_map('id', 0,
               'name', '1 packages of tomato puree',
               'completed', true,
               'touched', false),
    _.hash_map('id', 1,
               'name', '2 dl cream',
               'completed', true,
               'touched', false)));

        //uncheck cream
        var newEvent = _.hash_map('id', 1,
                           'completed', true);
        var newState = client.handleCompleteItem(initialState, newEvent);

        //check that cream is not completed
        var measuredItem = _.nth(_.get(newState,'items'),1);
        assert.equal(_.get(measuredItem,'id'),'1');
        assert.equal(_.get(measuredItem,'completed'),false);

        //check that tomato puree is completed
        var measuredItem = _.nth(_.get(newState,'items'),0);
        assert.equal(_.get(measuredItem,'id'),'0');
        assert.equal(_.get(measuredItem,'completed'),true);

    });
});

describe('handleEmptyList', function(){
  it('should return an empty list', function(){
        //create an empty state
        var emptyList = _.get(client.handleEmptyList(),"items");
        assert.equal(_.count(emptyList),0);
    });
});


describe('handleHoldItem', function(){
  it('should switch touch status of items from false to true', function(){
    var initialState = _.hash_map('items', _.vector(
            _.hash_map('id', 0,
                       'name', '1 packages of tomato puree',
                       'completed', true,
                       'touched', false),
            _.hash_map('id', 1,
                       'name', '2 dl cream',
                       'completed', true,
                       'touched', false)));
    //touch the puree
    var newState = client.handleHoldItem(initialState, _.hash_map('id',0));
    
    //assert
    var measuredItem = _.nth(_.get(newState,'items'),0);
    assert.equal(_.get(measuredItem,'touched'),true);
    measuredItem = _.nth(_.get(newState,'items'),1);
    assert.equal(_.get(measuredItem,'touched'),false);
    });

  it('should switch touch status of items from true to false', function(){

    var initialState = _.hash_map('items', _.vector(
            _.hash_map('id', 0,
                       'name', '1 packages of tomato puree',
                       'completed', true,
                       'touched', false),
            _.hash_map('id', 1,
                       'name', '2 dl cream',
                       'completed', true,
                       'touched', true)));


    //touch the cream
    var newState = client.handleHoldItem(initialState, _.hash_map('id',1));
    
    //assert
    var measuredItem = _.nth(_.get(newState,'items'),0);
    assert.equal(_.get(measuredItem,'touched'),false);
    measuredItem = _.nth(_.get(newState,'items'),1);
    assert.equal(_.get(measuredItem,'touched'),false);
    });
});



describe('handleDeleteItem', function(){
  it('should remove items', function(){
    var initialState = _.hash_map('items', _.vector(
            _.hash_map('id', 0,
                       'name', '1 packages of tomato puree',
                       'completed', true,
                       'touched', false),
            _.hash_map('id', 1,
                       'name', '2 dl cream',
                       'completed', true,
                       'touched', true)));

        //remove cream
        var newEvent = _.hash_map('id',1);
        var newState = client.handleDeleteItem(initialState, newEvent);

        //check that cream is gone
        var measuredItem = _.nth(_.get(newState,'items'),0);
        assert.equal(_.count(_.get(newState,'items')),1);
        assert.equal(_.get(measuredItem,'id'),'0');
    });
});


describe('handleEditItem', function(){
  it('should update item description', function(){
    var initialState = _.hash_map('items', _.vector(
            _.hash_map('id', 0,
                       'name', '1 packages of tomato puree',
                       'completed', true,
                       'touched', false),
            _.hash_map('id', 1,
                       'name', '2 dl cream',
                       'completed', true,
                       'touched', true)));

        //edit cream to vanilla cream
        var newEvent = _.hash_map('id',1,'name','2 dl of vanilla cream');
        var newState = client.handleEditItem(initialState, newEvent);

        //check that editing worked
        var measuredItem = _.nth(_.get(newState,'items'),1);
        assert.equal(_.get(measuredItem,'name'),'2 dl of vanilla cream');
    });
});
