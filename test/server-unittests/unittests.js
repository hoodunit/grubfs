var assert = require('assert');
var _ = require('mori');
var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');

var Fsio = require('../../src/server/fsio.js');

function spoofAjaxResponses(responses){
  var count = 0;
  Bacon.$.ajax = function(params, abort){
    console.log('my ajax called count', count);
    console.log(params);
    var response = responses[count];
    count += 1;
    return Bacon.once(response);
  };
}

describe('Fsio', function(){
  describe('signUp', function(){
    it('should hash challenges correctly', function(){
      var testPassword = 'testkey';
      var testInput = 'testinput';
      var expectedHash = 'eab3c01601aef3d3a806360d8ae33144d50056b53048446e67b8a7409232433d';
      
      var challengeHash = Fsio.test.hashChallenge(testInput, testPassword);
      
      assert.equal(challengeHash, expectedHash);
    });
  });
});
