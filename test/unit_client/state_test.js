var assert = require('assert');
var _ = require('mori');
var State = require('./../../src/client/state.js');

describe('state', function(){

  describe('handleAddItem', function(){
    it('should properly add items', function(){
      //create an empty state
      var initialState = _.hash_map('items', _.vector());

      //add a banana
      var newItem = _.hash_map('id', 4,
                               'name', 'a banana');
      var newState = State.handleAddItem(initialState, newItem);

      //check that there is a banana in the list
      var measuredItem = _.nth(_.get(newState,'items'),0);
      assert.equal(_.count(_.get(newState,'items')),1);
      assert.equal(_.get(measuredItem,'name'),'a banana');
      assert.equal(_.get(measuredItem,'id'),'4');
      assert.equal(_.get(measuredItem,'completed'),false);

      //add coffee
      newItem = _.hash_map('id', 7,
                           'name', 'coffee');
      newState = State.handleAddItem(newState, newItem);

      //check that there is coffee and and a banana in the list
      assert.equal(_.count(_.get(newState,'items')),2);
      measuredItem = _.nth(_.get(newState,'items'),0);
      assert.equal(_.get(measuredItem,'name'),'a banana');
      measuredItem = _.nth(_.get(newState,'items'),1);
      assert.equal(_.get(measuredItem,'name'),'coffee');
      assert.equal(_.get(measuredItem,'id'),'7');
      assert.equal(_.get(measuredItem,'completed'),false);
    });
  });

  describe('handleCompleteItem', function(){
    it('should check off completed items', function(){
      //create an empty state
      var initialState = _.hash_map('items', _.vector(
        _.hash_map('id', 0,
                   'name', '1 packages of tomato puree',
                   'completed', false),
        _.hash_map('id', 1,
                   'name', '2 dl cream',
                   'completed', false)));

      //check off tomato puree
      var newEvent = _.hash_map('id', 0,
                                'completed', false);
      var newState = State.handleCompleteItem(initialState, newEvent);

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
                   'completed', true),
        _.hash_map('id', 1,
                   'name', '2 dl cream',
                   'completed', true)));

      //uncheck cream
      var newEvent = _.hash_map('id', 1,
                                'completed', true);
      var newState = State.handleCompleteItem(initialState, newEvent);

      //check that cream is not completed
      var measuredItem = _.nth(_.get(newState,'items'),1);
      assert.equal(_.get(measuredItem,'id'),'1');
      assert.equal(_.get(measuredItem,'completed'),false);

      //check that tomato puree is completed
      measuredItem = _.nth(_.get(newState,'items'),0);
      assert.equal(_.get(measuredItem,'id'),'0');
      assert.equal(_.get(measuredItem,'completed'),true);

    });
  });

  describe('handleEmptyList', function(){
    it('should return an empty list', function(){
      //create an empty state
      var emptyList = _.get(State.handleEmptyList(),"items");
      assert.equal(_.count(emptyList),0);
    });
  });


  describe('handleDeleteItem', function(){
    it('should remove items', function(){
      var initialState = _.hash_map('items', _.vector(
        _.hash_map('id', 0,
                   'name', '1 packages of tomato puree',
                   'completed', true),
        _.hash_map('id', 1,
                   'name', '2 dl cream',
                   'completed', true)));

      //remove cream
      var newEvent = _.hash_map('id',1);
      var newState = State.handleDeleteItem(initialState, newEvent);

      //check that cream is gone
      var measuredItem = _.nth(_.get(newState,'items'),0);
      assert.equal(_.count(_.get(newState,'items')),1);
      assert.equal(_.get(measuredItem,'id'),'0');
    });
  });


  describe('handleUpdateItem', function(){
    it('should update item description', function(){
      var initialState = _.hash_map('items', _.vector(
        _.hash_map('id', 0,
                   'name', '1 packages of tomato puree',
                   'completed', true),
        _.hash_map('id', 1,
                   'name', '2 dl cream',
                   'completed', true)));

      //edit cream to vanilla cream
      var newEvent = _.hash_map('id',1,'name','2 dl of vanilla cream');
      var newState = State.handleUpdateItem(initialState, newEvent);

      //check that editing worked
      var measuredItem = _.nth(_.get(newState,'items'),1);
      assert.equal(_.get(measuredItem,'name'),'2 dl of vanilla cream');
    });
  });

  describe('signedIn event', function(){
    it('should add credentials to state', function(){
      var initialState = _.hash_map('items', _.vector());
      var testCredentials = _.hash_map('token', 'testtoken',
                                       'download_token', 'testdownloadtoken',
                                       'email', 'testemail',
                                       'password', 'testpassword');
      var event = _.hash_map('eventType', 'signedIn', 'credentials', testCredentials);

      var newState = State.updateStateFromEvent(initialState, event);

      assert.equal(_.get(newState,'credentials'), testCredentials);
    });
  });

  describe('signedUp event', function(){
    it('should add credentials to state', function(){
      var initialState = _.hash_map('items', _.vector());
      var testCredentials = _.hash_map('token', 'testtoken',
                                       'download_token', 'testdownloadtoken',
                                       'email', 'testemail',
                                       'password', 'testpassword');
      var event = _.hash_map('eventType', 'signedUp', 'credentials', testCredentials);

      var newState = State.updateStateFromEvent(initialState, event);

      assert.equal(_.get(newState,'credentials'), testCredentials);
    });
  });

  describe('signOut event', function(){
    it('should remove credentials from state', function(){
      var testCredentials = _.hash_map('token', 'testtoken',
                                       'download_token', 'testdownloadtoken',
                                       'email', 'testemail',
                                       'password', 'testpassword');
      var initialState = _.hash_map('credentials', testCredentials);
      var event = _.hash_map('eventType', 'signOut');

      var newState = State.updateStateFromEvent(initialState, event);

      assert.equal(_.get(newState,'credentials'), null);
    });
  });
});
