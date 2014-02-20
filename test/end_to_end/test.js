var Bacon = require('baconjs');

var FsioAPI = require('../../src/shared/fsio_api.js');

var baseUrl = 'http://localhost:8080/';

// This is an existing user.
// If it does not exist, tests will fail as this uses
// the actual FSIO API for signing in.
var testUser = {
  email: 'mytestuser@example.com',
  password: 'mytestpassword'
};

function testSignUp(page){
  var adminUser = process.env.FSIO_USER_NAME;
  var adminPass = process.env.FSIO_PASSWORD;
  FsioAPI.deleteUser(testUser.email, adminUser, adminPass).onEnd(function(){
  page
  .open(baseUrl)
  .waitForElement('.email')
  .type('#email', testUser.email)
  .type('#password', testUser.password)
  .click('#signUp')
  .type('#confirmPass', testUser.password)
  .click('#cancelSignUp')
  .assert.doesntExist('#confirmPass', 'Confirm password is not visible after clicking cancel')
  .click('#signUp')
  .type('#confirmPass', testUser.password)
  .click('#signUp')
  .waitForElement('#signOut')
  .assert.doesntExist('#signIn', 'Sign in button is not visible after signing in')
  .assert.doesntExist('#signUp', 'Sign up button is not visible after signing in')
  .click('#signOut')
  .waitForElement('#signIn')
  .assert.visible('#signUp', 'Sign up button is visible after signing out')
  .assert.doesntExist('#signOut', 'Sign out button is not visible after signing out')
  .done();
  });
}

function testSignIn(page){
  page
  .open(baseUrl)
  .waitForElement('.email')
  .type('#email', testUser.email)
  .type('#password', testUser.password)
  .click('#signIn')
  // Using this because waitForElement doesn't work here
  .waitFor(function(){
    return Boolean(document.querySelector('#signOut'));
  }, [], 10000)
  .assert.doesntExist('#signIn', 'Sign in button is not visible after signing in')
  .assert.doesntExist('#signUp', 'Sign up button is not visible after signing in')
  .click('#signOut')
  .waitForElement('#signIn')
  .assert.visible('#signUp', 'Sign up button is visible after signing out')
  .assert.doesntExist('#signOut', 'Sign out button is not visible after signing out')
  .done();
}

function localStorage(page) {
  page
    .open(baseUrl)
    .assert.title().is('Grub', 'Title works')
    .execute(function() {
      localStorage.clear();
    })
    .open(baseUrl)
    .waitForElement('.groceryItem')
    .assert.numberOfElements('.groceryList .groceryItem', 3, '3 items are visible at first')
    .type('#name', 'chocolate box')
    .click('#add')
    .assert.numberOfElements('.groceryList .groceryItem', 4, '4 items are visible after adding')
    .open(baseUrl)
    .assert.numberOfElements('.groceryList .groceryItem', 4, '4 items are visible after reload')
    .execute(function() {
      localStorage.clear();
    })
    .open(baseUrl)
    .assert.numberOfElements('.groceryList .groceryItem', 3, '3 items are visible after localStorage is cleared and page realoaded')
    .done();
}

function clearNAdd(page) {
  page
  .open(baseUrl)
  .waitForElement('.groceryItem')
  .assert.numberOfElements('.groceryList .groceryItem', 3, '3 items are visible at first')
  .click('#clearList')
  .assert.numberOfElements('.groceryList .groceryItem', 0, 'no items are visible after clearing list')
  .type('#name', 'chocolate box')
  .click('#add')
  .assert.numberOfElements('.groceryList .groceryItem', 1, 'one item is visible after one item is added to the cleared list')
  .done();
}

function testDeleteItem(page) {
  page
  .open(baseUrl)
  .execute(function() {
    localStorage.clear();
  })
  .reload()
  .waitForElement('.groceryItem')
  .assert.numberOfElements('.groceryList .groceryItem', 3, '3 items are visible at first')

  // Trigger mousedown on first element to get into editing mode
  .execute(function() {
    var item = document.getElementsByClassName('groceryItem')[0];
    var dispatchMouseEvent = function(target, var_args) {
      var e = document.createEvent("MouseEvents");
      e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
      target.dispatchEvent(e);
    };
    dispatchMouseEvent(item, 'mousedown', true, true);
  })
  .wait(1000)
  .click('.groceryItem .del-btn')
  .assert.numberOfElements('.groceryList .groceryItem', 2, '2 items remain after deleting one')
  .done();
}

module.exports = {
  'list can be cleared and a new item added': clearNAdd,
  'State is persisted in localStorage': localStorage,
  'User can sign up with a new email address': testSignUp,
  'User can sign in with an existing email address': testSignIn,
  'User can delete a grocery item': testDeleteItem
};
