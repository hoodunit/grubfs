var chai = require('chai');
chai.should();
var _ = require('mori');

var Fsio = require('../../src/client/fsio.js');
var FsioAPI = require('../../src/shared/fsio_api.js');
var Util = require('../util/util');

describe('Fsio', function(){
  describe('saveNewUserState', function(){
    var username;
    var password;

    before(function(done){
      username = Util.randomUser();
      password = "mytestpassword";
      Util.createUser(username, password).onValue(function(){
        done();
      });
    });
    
    after(function(done){
      Util.deleteUser(username).onValue(function(){
        done();
      });
    });

    it('should upload user items as files', function(done){
      var items = _.vector(
        _.hash_map('id', 'testid1',
                   'name', '1 packages of tomato puree',
                   'completed', false),
        _.hash_map('id', 'testid2',
                   'name', '4 yellow onions',
                   'completed', true),
        _.hash_map('id', 'testid3',
                   'name', '2 dl cream',
                   'completed', false));
      
      var credentials = _.hash_map('email', username, 'password', password);

      var state = _.hash_map('items', items,
                             'credentials', credentials);
      
      var response = Fsio.saveNewUserState(state);

      response.onError(function(error){
        console.log('error:', error);
        throw error;
      });

      response.onEnd(function(result){
        done();
      });
    });
  });
describe('syncAddItemToServer', function(){
    var username;
    var password;

    before(function(done){
      username = Util.randomUser();
      password = "mytestpassword";
      Util.createUser(username, password).onValue(function(){
        done();
      });
    });
    
    after(function(done){
      Util.deleteUser(username).onValue(function(){
        done();
      });
    });

    it('should upload item when added to list', function(done){
      var item = _.hash_map('id', 'testid1',
                             'name', '1 packages of tomato puree',
                             'completed', false);
      
      var response = Fsio.syncAddItemToServer(username, password, item);

      response.onError(function(error){
        console.log('error:', error);
        throw error;
      });

      response.onEnd(function(result){
        done();
      });
    });
  });
});
