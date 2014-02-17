var assert = require('assert');
var _ = require('mori');

var Fsio = require('../../src/client/fsio.js');

describe('Fsio', function(){
  describe('signUp', function(){
    it('makeSignUpRequest should create request for signing up', function(){
      var data = {email: 'testemail',
                  password: 'testpassword'};

      var expected = _.hash_map(
        'url', document.location.origin + '/event',
        'type', 'POST',
        'data', JSON.stringify(data),
        'dataType', 'json'
      );

      var actual = Fsio.test.makeSignUpRequest(data.email, data.password);

      assert(_.equals(_.js_to_clj(actual), expected));
    });
  });

  describe('signIn', function(){
    it('should sign in an existing user', function(done){
      var event = _.hash_map('eventType', 'signIn',
                             'email', 'mytestuser@example.com',
                             'password', 'mytestpassword');

      var expected = _.hash_map('eventType', 'signedIn');
      var signedInEvents = Fsio.signIn(event);

      signedInEvents.onValue(function(event){
        console.log('event:', _.clj_to_js(event));
        assert(_.equals(expected, _.dissoc(event, 'credentials')));
        assert(_.equals(expected, _.dissoc(event, 'credentials')));

        assert(_.has_key(event, 'credentials'));
        var credentials = _.get(event, 'credentials');
        assert(_.has_key(credentials, 'download_token'));
        assert(_.has_key(credentials, 'token'));
        assert(_.has_key(credentials, 'u_uuid'));
        assert(_.has_key(credentials, 'ttl'));
        done();
      });
    });

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
        'data', JSON.stringify(data)
      );

      var actual = Fsio.test.makeChallengeResponseRequest(constants, email, challenge, challengeResponse);

      assert(_.equals(_.js_to_clj(actual), expected));
    });
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
