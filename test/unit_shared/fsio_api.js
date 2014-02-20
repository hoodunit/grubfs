var assert = require('assert');

var FsioAPI = require('../../src/shared/fsio_api.js');

describe('Fsio API', function(){
  describe('signing in', function(){
    it('should return authentication tokens when signing in an existing user', function(done){
      FsioAPI.signIn("mytestuser@example.com", "mytestpassword").onValue(function(creds){
        assert(creds.download_token);
        assert(creds.token);
        assert.equal(creds.ttl, 1800, "TTL should be 1800");
        assert(creds.u_uuid);
        done();
      });
    });

    it('should hash challenges correctly', function(){
      var testPassword = 'testkey';
      var testChallenge = 'testchallenge';
      var expectedHash = 'ee55802c5391542cd3963a2f2af2c698df81191f697b4d87af71fe9d48732643';
      
      var challengeHash = FsioAPI.test.hashChallenge(testPassword, testChallenge);
      
      assert.equal(challengeHash, expectedHash);
    });
  });
});
