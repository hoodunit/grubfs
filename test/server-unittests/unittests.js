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
  describe('signInAsAdmin', function(){
    it('makeChallengeRequest should create request properly', function(){
      var constants = {
        FSIO_BASE_URL: 'http://example.com/testurl',
        CRAM_CHALLENGE_URL: '/token/cram/challenge',
        USER_NAME: 'testadminuser',
        OPERATOR_ID: '000000'
      };

      var data = {operator_id: constants.OPERATOR_ID,
                  user_name: constants.USER_NAME};

      var expected = _.hash_map(
        'url', constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_URL,
        'type', 'POST',
        'contentType', 'application/json; charset=utf-8',
        'data', JSON.stringify(data)
      );

      var actual = Fsio.test.makeChallengeRequest(constants);

      assert(_.equals(_.js_to_clj(actual), expected));
    });

    it('hashChallenge should hash challenges correctly', function(){
      var testPassword = 'testkey';
      var testInput = 'testinput';
      var expectedHash = 'eab3c01601aef3d3a806360d8ae33144d50056b53048446e67b8a7409232433d';
      
      var challengeHash = Fsio.test.hashChallenge(testInput, testPassword);
      
      assert.equal(challengeHash, expectedHash);
    });
  });
});
