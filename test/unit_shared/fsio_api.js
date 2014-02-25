var chai = require('chai');
var assert = chai.assert;
chai.should();

var FsioAPI = require('../../src/shared/fsio_api.js');

describe('shared Fsio API', function(){
  this.timeout(5000);

  describe('signing up', function(){
    it('should return success when a new user is created', function(done){
      var username = randomUser();
      var password = "mytestpassword";
      var adminUser = process.env.FSIO_USER_NAME;
      var adminPass = process.env.FSIO_PASSWORD;

      var response = FsioAPI.signUp(username, password, adminUser, adminPass);
      
      response.onValue(function(value){
        done();
      });

      response.onError(function(error){
        throw error;
      });

      response.onEnd(function(){
        FsioAPI.deleteUser(username, adminUser, adminPass).onEnd();
      });
    });

    it('should return failure if the user already exists', function(done){
      var username = randomUser();
      var password = "mytestpassword";
      var adminUser = process.env.FSIO_USER_NAME;
      var adminPass = process.env.FSIO_PASSWORD;

      var newUser = FsioAPI.signUp(username, password, adminUser, adminPass);
      var response = newUser.flatMap(function(){
        return FsioAPI.signUp(username, password, adminUser, adminPass);
      });
      
      response.onValue(function(value){
        console.log('val:', value);
        throw value;
      });

      response.onError(function(error){
        done();
      });

      response.onEnd(function(){
        FsioAPI.deleteUser(username, adminUser, adminPass).onEnd();
      });
    });
  });

  describe('signing in', function(){
    it('should sign in as existing user', function(done){
      var username = randomUser();
      var password = "mytestpassword";
      var isAdmin = false;

      var adminUser = process.env.FSIO_USER_NAME;
      var adminPass = process.env.FSIO_PASSWORD;
      var newUser = FsioAPI.signUp(username, password, adminUser, adminPass);
      var response = newUser.flatMap(function(){
        return FsioAPI.signIn(username, password, isAdmin);
      });

      response.onValue(function(credentials){
        credentials.download_token.should.exist;
        credentials.token.should.exist;
        credentials.ttl.should.equal(1800);
        credentials.u_uuid.should.exist;
        done();
      });
    });

    it('should hash challenges correctly using a given password', function(){
      var testPassword = 'testkey';
      var testChallenge = 'testchallenge';
      var expectedHash = 'ee55802c5391542cd3963a2f2af2c698df81191f697b4d87af71fe9d48732643';
      
      var challengeHash = FsioAPI.test.hashChallenge(testPassword, testChallenge);
      
      challengeHash.should.equal(expectedHash);
    });

    it('should sign in as an admin', function(done){
      var username = process.env.FSIO_USER_NAME;
      var password = process.env.FSIO_PASSWORD;
      var isAdmin = true;
      
      FsioAPI.signIn(username, password, isAdmin).onValue(function(credentials){
        credentials.download_token.should.exist;
        credentials.token.should.exist;
        credentials.ttl.should.equal(1800);
        credentials.u_uuid.should.exist;
        done();
      });
    });
  });

  describe('delete a user', function(){
    it('should return success when a user is deleted', function(done){
      var username = randomUser();
      var password = "mytestpassword";
      var adminUser = process.env.FSIO_USER_NAME;
      var adminPass = process.env.FSIO_PASSWORD;

      var newUser = FsioAPI.signUp(username, password, adminUser, adminPass);
      var response = newUser.flatMap(function(){
        return FsioAPI.deleteUser(username, adminUser, adminPass);
      });
      
      response.onValue(function(value){
        done();
      });

      response.onError(function(error){
        throw error;
      });
    });
  });
});

function randomUser(){
  var randomNum = Math.floor(Math.random() * 1000000000);
  return "testuser" + randomNum + "@example.com";
}
