var assert = require('assert');

var FsioAPI = require('../../src/shared/fsio_api.js');

describe('Fsio API', function(){
  describe('requestAuthorizationChallenge', function(){
    it('should return a challenge and a hash type', function(done){
      var email = 'mytestuser@example.com';

      FsioAPI.requestAuthorizationChallenge(email).onValue(function(challengeResponse){
        assert(challengeResponse.challenge !== null && challengeResponse.challenge !== undefined);
        assert(challengeResponse.hash !== null && challengeResponse.hash !== undefined);
        done();
      });
    });
  });
});
