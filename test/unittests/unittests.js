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
