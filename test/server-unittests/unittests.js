var assert = require('assert');
var _ = require('mori');

var Fsio = require('../../src/server/fsio.js');

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

    it('makeChallengeRequest should create request properly', function(){
      var testChallenge = 'testinput';
      var testPassword = 'testkey';
      var expectedResponse = 'eab3c01601aef3d3a806360d8ae33144d50056b53048446e67b8a7409232433d';
      
      var challengeHash = Fsio.test.hashChallenge(testChallenge, testPassword);

      var expected = _.hash_map(
        'challenge', testChallenge,
        'response', expectedResponse
      );

      var actual = Fsio.test.makeChallengeResponse(testChallenge, testPassword);

      assert(_.equals(_.js_to_clj(actual), expected));
    });

    it('hashChallenge should hash challenges correctly', function(){
      var testPassword = 'testkey';
      var testInput = 'testinput';
      var expectedHash = 'eab3c01601aef3d3a806360d8ae33144d50056b53048446e67b8a7409232433d';
      
      var challengeHash = Fsio.test.hashChallenge(testInput, testPassword);
      
      assert.equal(challengeHash, expectedHash);
    });

    it('makeChallengeResponseRequest should create request properly', function(){
      var constants = {
        FSIO_BASE_URL: 'http://example.com/testurl',
        CRAM_CHALLENGE_RESP_URL: '/token/cram/admin_l2',
        USER_NAME: 'testadminuser',
        OPERATOR_ID: '000000'
      };
      
      var data = {operator_id: constants.OPERATOR_ID,
                  user_name: constants.USER_NAME,
                  challenge: 'testChallenge',
                  response: 'testResponse'};

      var expected = _.hash_map(
        'url', constants.FSIO_BASE_URL + constants.CRAM_CHALLENGE_RESP_URL,
        'type', 'POST',
        'contentType', 'application/json; charset=utf-8',
        'data', JSON.stringify(data)
      );

      var actual = Fsio.test.makeChallengeResponseRequest(constants, data);

      assert(_.equals(_.js_to_clj(actual), expected));
    });

    it('makeCreateUserRequest should create request properly', function(){
      var constants = {
        FSIO_BASE_URL: 'http://example.com/testurl',
        OPERATOR_ID: '000000'
      };
      
      var adminToken = 'testadmintoken';

      var data = {
        quota: 524288, // 0.5 MB
        state: 'active'
      };

      var expected = _.hash_map(
        'url', constants.FSIO_BASE_URL + '/admin/operators/' + constants.OPERATOR_ID + '/users',
        'type', 'POST',
        'contentType', 'application/json; charset=utf-8',
        'data', JSON.stringify(data),
        'headers', _.hash_map('authorization', 'FsioToken ' + adminToken)
      );

      var actual = Fsio.test.makeCreateUserRequest(constants, adminToken);

      assert(_.equals(_.js_to_clj(actual), expected));
    });

    it('makeAddAuthRequest should create request properly', function(){
      var constants = {
        FSIO_BASE_URL: 'http://example.com/testurl'
      };

      var data = {
        email: 'testemail',
        password: 'testpassword',
        userKey: '/users/usertestkey',
        adminToken: 'testadmintoken'
      };
      
      var requestData = {
        mechanism: 'cram',
        role: 'user',
        user_name: data.email,
        password: data.password
      };

      var expected = _.hash_map(
        'url', constants.FSIO_BASE_URL + '/admin' + data.userKey + '/authentications',
        'type', 'POST',
        'contentType', 'application/json; charset=utf-8',
        'data', JSON.stringify(requestData),
        'headers', _.hash_map('authorization', 'FsioToken ' + data.adminToken)
      );

      var actual = Fsio.test.makeAddAuthRequest(constants, data);

      assert(_.equals(_.js_to_clj(actual), expected));
    });
  });
});
