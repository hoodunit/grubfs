var assert = require('assert');
var _ = require('mori');

var Fsio = require('../../src/client/fsio.js');

describe('Fsio', function(){
  describe('signUp', function(){
  });

  describe('signIn', function(){
  });

  describe('saveNewUserState', function(){
    it("should upload all of the user's grocery items", function(done){
      var items = _.vector(_.hash_map('id', 'rg89qr89428923eqwkew',
                                     'completed', false,
                                     'name', 'test item1'),
                           _.hash_map('id', '988er989qlksdfklxxxx',
                                     'completed', true,
                                     'name', 'test item2'));
      var credentials = _.hash_map('email', 'mytestuser@example.com',
                                   'password', 'mytestpassword');
      var state = _.hash_map('items', items,
                             'credentials', credentials);
      var result = Fsio.saveNewUserState(state);
      
      result.onValue(function(value){
        console.log('value:', value);
        // done();
      });
    });
  });
});
