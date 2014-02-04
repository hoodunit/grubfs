var assert = require('assert');
var _ = require('mori');

var Fsio = require('../../src/client/fsio.js');

describe('Fsio', function(){
  describe('signIn', function(){
    it('makeChallengeRequest should create request properly', function(){
      var constants = {
        FSIO_BASE_URL: 'http://example.com/testurl',
        CRAM_CHALLENGE_URL: '/token/cram/challenge',
        OPERATOR_ID: '000000'
      };

      var email = 'testemail';

      var data = {operator_id: constants.OPERATOR_ID,
                  user_name: email};

      var expected = _.hash_map(
        'url', constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_URL,
        'type', 'POST',
        'contentType', 'application/json; charset=utf-8',
        'data', JSON.stringify(data)
      );

      var actual = Fsio.test.makeChallengeRequest(constants, email);

      assert(_.equals(_.js_to_clj(actual), expected));
    });

    it('hashChallenge should hash challenges correctly', function(){
      var testPassword = 'testkey';
      var testChallenge = 'testchallenge';
      var expectedHash = 'ee55802c5391542cd3963a2f2af2c698df81191f697b4d87af71fe9d48732643';
      
      var challengeHash = Fsio.test.hashChallenge(testPassword, testChallenge);
      
      assert.equal(challengeHash, expectedHash);
    });

    it('makeChallengeResponseRequest should create request properly', function(){
      var constants = {
        FSIO_BASE_URL: 'http://example.com/testurl',
        CRAM_CHALLENGE_RESP_URL: '/token/cram/admin_l2',
        OPERATOR_ID: '000000'
      };
      
      var email = constants.USER_NAME;
      var challenge = 'testchallenge';
      var challengeResponse = 'testresponse';

      var data = {operator_id: constants.OPERATOR_ID, 
                  user_name: email,
                  challenge: challenge,
                  response: challengeResponse};

      var expected = _.hash_map(
        'url', constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_RESP_URL,
        'type', 'POST',
        'contentType', 'application/json; charset=utf-8',
        'data', JSON.stringify(data)
      );

      var actual = Fsio.test.makeChallengeResponseRequest(constants, email, challenge, challengeResponse);

      assert(_.equals(_.js_to_clj(actual), expected));
    });
  });
});
