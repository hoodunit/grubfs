/*jshint expr: true*/
// Keep jshint happy about chai statements

var chai = require('chai');
chai.should();

var FsioAPI = require('../../src/shared/fsio_api.js');
var Util = require('../util/util');

describe('shared Fsio API', function(){
  this.timeout(5000);

  describe('signing up', function(){
    it('should return success when a new user is created', function(done){
      var username = Util.randomUser();
      var password = "mytestpassword";
      var adminUser = process.env.FSIO_USER_NAME;
      var adminPass = process.env.FSIO_PASSWORD;

      var response = FsioAPI.signUp(username, password, adminUser, adminPass);

      response.onError(function(error){
        error.should.not.exist;
      });

      response.onEnd(function(){
        FsioAPI.deleteUser(username, adminUser, adminPass).onEnd(done);
      });
    });

    it('should return failure if the user already exists', function(done){
      var username = Util.randomUser();
      var password = "mytestpassword";
      var adminUser = process.env.FSIO_USER_NAME;
      var adminPass = process.env.FSIO_PASSWORD;

      var newUser = FsioAPI.signUp(username, password, adminUser, adminPass);
      var response = newUser.flatMap(function(){
        return FsioAPI.signUp(username, password, adminUser, adminPass);
      });
      
      response.onValue(function(value){
        value.should.not.exist;
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
      var username = Util.randomUser();
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
      var username = Util.randomUser();
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
        error.should.not.exist;
      });
    });
  });

  describe('upload file', function(){
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

    it('should upload a file to the server', function(done){
      var filename = 'items/testfileid'
      var fileData = {id: 'testfileid',
                      completed: false,
                      name: 'test item'};
      var fileKey = '/me/files/items/testfileid';
      
      var uploadedFileInfo = FsioAPI.uploadFile(username, password, filename, fileData);

      uploadedFileInfo.onValue(function(uploadedFileData){
        uploadedFileData.object_type.should.exist;
        uploadedFileData.sha256.should.exist;
        uploadedFileData.version_id.should.exist;
        uploadedFileData.key.should.equal(fileKey);
      });
    
      // Delay by one second to allow time for file scanning on FSIO
      // Else may return error "File scanning incomplete"
      var downloadedFile = uploadedFileInfo.delay(1500).flatMap(FsioAPI.downloadFile, username, 
                                                                password, filename);

      downloadedFile.onValue(function(downloadedFileData){
        downloadedFileData.should.deep.equal(fileData);
      });

      downloadedFile.onError(function(error){
        error.should.deep.equal(fileData);
      });
      
      downloadedFile.onEnd(function(){ 
        done();
      });
    });
  });

  describe('delete file', function(){
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

    it('should delete a file from the server', function(done){
      var filename = 'items/item2'
      var fileData = {id: 'item2',
                      completed: false,
                      name: 'item'};
      var fileKey = '/me/files/items/item2';
      
      var uploadedFileInfo = FsioAPI.uploadFile(username, password, filename, fileData);

      uploadedFileInfo.onValue(function(uploadedFileData){
        uploadedFileData.object_type.should.exist;
        uploadedFileData.sha256.should.exist;
        uploadedFileData.version_id.should.exist;
        uploadedFileData.key.should.equal(fileKey);
      });
    
      var deletedFileInfo = FsioAPI.deleteFile(username, password, filename);
 
      var downloadedFileInfo = deletedFileInfo.delay(1500).flatMap(FsioAPI.downloadFile, username, 
                                                                password, filename);

      downloadedFileInfo.onError(function(error){
        error.should.not.deep.equal(fileData);
      });
      
      downloadedFileInfo.onEnd(function(){ 
        done();
      });
    });
  });
});
