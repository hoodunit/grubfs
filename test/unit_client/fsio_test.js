/*jshint expr: true*/
// Keep jshint happy about chai statements

var chai = require('chai');
chai.should();
var _ = require('mori');
var Sinon = require('sinon');
var Bacon = require('baconjs');

var Fsio = require('../../src/client/fsio.js');
var FsioAPI = require('../../src/shared/fsio_api.js');
var Util = require('../util/util');

describe('Fsio', function(){
  this.timeout(10000);
  
  describe('Sync new user initial state', function(){
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
      
      FsioAPI.signIn(username, password).onValue(function(token) {
        var credentials = _.hash_map('email', username, 'token', token);
        var state = _.hash_map('items', items,
                               'credentials', credentials);
        var signedUpEvent = _.hash_map('eventType', 'signedUp',
                                       'state', state);
        
        var response = Fsio.syncStateWithFsio(signedUpEvent);

        response.onError(function(error){
          error.should.not.exist;
        });

        response.onEnd(function(result){
          done();
        });
      });
    });
  });

  describe('loadCurrentRemoteState', function(){
    var username;
    var password;
    var credentials;
    var items = _.vector(
      _.hash_map('id', 'testid1',
                 'name', '1 package of tomato puree',
                 'completed', false),
      _.hash_map('id', 'testid2',
                 'name', '4 yellow onions',
                 'completed', true),
      _.hash_map('id', 'testid3',
                 'name', '2 dl cream',
                 'completed', false));

    before(function(done){
      username = Util.randomUser();
      password = "mytestpassword";
      Util.createUser(username, password)
          .flatMap(FsioAPI.signIn, username, password)
          .onValue(function(token){
        credentials = _.hash_map('email', username, 'token', token);

        var state = _.hash_map('items', items,
                               'credentials', credentials);
        var response = Fsio.test.saveNewUserState(state);
        
        response.onEnd(function(result){
          done();
        });
      });
    });
    
    after(function(done){
      Util.deleteUser(username).onValue(function(){
        done();
      });
    });

    it('should return the added items', function(done){
      var state = _.hash_map('credentials', credentials);
      var initEvent = _.hash_map('eventType', 'initialSync',
                                 'state', state);
      // Delay for file scanning
      var resetStateEvent = Bacon.later(2000, null)
        .flatMapFirst(function(){ return Fsio.syncStateWithFsio(initEvent);});

      resetStateEvent.onError(function(error){
        error.should.not.exist;
      });

      resetStateEvent.onValue(function(event){
        var receivedItems = _.get(event, 'items');
        _.each(receivedItems, function(item){
          _.some(_.equals, items).should.equal(true);
        });
        done();
      });
    });
  });

  describe('Sync added items to server', function(){
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

    it('should upload items with syncItemToServer()', function(done){

      var item = {id: 'item1',
                  completed: false,
                  name: 'pizza'};
      var filename = 'items/item1';
      
      
      var result = FsioAPI.signIn(username, password)
        .flatMapFirst(function(token) {
          return Fsio.test.syncItemToServer(token, item);
      });
      
      downloadedFile = result.delay(500)
                             .flatMapFirst(FsioAPI.signIn, username, password)
                             .flatMapFirst(FsioAPI.downloadFile, filename);

      downloadedFile.onValue(function(downloadedFileData){
        downloadedFileData.should.deep.equal(item);
      });
      downloadedFile.onError(function(error){
        error.should.not.exist;
      });
      downloadedFile.onEnd(function(){ 
        done();
      });
    });
  });

  describe('Sync updated items to server', function(){
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

    it('should sync completed or edited items to server', function(done){
      //upload file to server
      var filename = 'items/item11';
      var fileData = {id: 'item11',
                      completed: false,
                      name: 'chicken'};
      var fileKey = '/me/files/items/item11';
      
      
      var uploadedFile = FsioAPI.signIn(username, password)
                                .flatMap(FsioAPI.uploadFile, filename, fileData);

      uploadedFile.onError(function(error){
        error.should.not.exist;
      });
      
      //complete item
      fileData.completed = true;
      uploadedFile = FsioAPI.signIn(username, password).flatMap(function(token) {
        return Fsio.test.syncItemToServer(token, fileData);
      });

      uploadedFile.onError(function(error){
        error.should.not.exist;
      });

      downloadedFile = uploadedFile.delay(500)
        .flatMapFirst(FsioAPI.signIn, username, password)
        .flatMapFirst(FsioAPI.downloadFile, filename);

      downloadedFile.onValue(function(downloadedFileData){
        downloadedFileData.should.deep.equal(fileData);
      });
      downloadedFile.onError(function(error){
        error.should.not.exist;
      });

      //edit item name
      fileData.name = 'chicken breast';
      uploadedFile = FsioAPI.signIn(username, password).flatMap(function(token) {
        return Fsio.test.syncItemToServer(token, fileData);
      });

      uploadedFile.onError(function(error){
        error.should.not.exist;
      });

      downloadedFile = uploadedFile.delay(500)
        .flatMapFirst(FsioAPI.signIn, username, password)
        .flatMapFirst(FsioAPI.downloadFile, filename);

      downloadedFile.onValue(function(downloadedFileData){
        downloadedFileData.should.deep.equal(fileData);
      });
      downloadedFile.onError(function(error){
        error.should.not.exist;
      });
      downloadedFile.onEnd(function(){ 
        done();
      });
    });
  });

  describe('Sync clearing items to server', function(){
    it('should call FSIO API to delete items directory', function(done){
      var token = 'testtoken';
      var stub = Sinon.stub(Fsio.test.FsioAPI, 'deleteFile').returns(Bacon.never());
      var result = Fsio.test.clearItems(token);
      
      result.onEnd(function(){
        stub.calledWith('items', token);
        done();
      });
    });
  });
});
