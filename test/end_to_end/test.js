var Bacon = require('baconjs');

var FsioAPI = require('../../src/shared/fsio_api.js');

var baseUrl = 'http://localhost:8080/';

var testUser = {
  email: 'mytestuser@example.com',
  password: 'mytestpassword'
};

function clearAndAdd(page) {
  page
  .open(baseUrl)
  .waitForElement('.groceryItem')
  .assert.numberOfElements('.groceryList .groceryItem', 6, '6 items are visible at first')
  .click('#clearList')
  .assert.numberOfElements('.groceryList .groceryItem', 0, 'no items are visible after clearing list')
  .type('#name', 'chocolate box')
  .click('#add')
  .assert.numberOfElements('.groceryList .groceryItem', 1, 'one item is visible after one item is added to the cleared list')
  .done();
}

function deleteItem(page) {
  page
  .open(baseUrl)
  .execute(function() {
    localStorage.clear();
  })
  .open(baseUrl)
  .waitForElement('.groceryItem')
  .assert.numberOfElements('.groceryList .groceryItem', 6, '6 items are visible at first')

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
  .assert.numberOfElements('.groceryList .groceryItem', 5, '5 items remain after deleting one')
  .done();
}

function editItem(page) {
  page
  .open(baseUrl)
  .execute(function() {
    localStorage.clear();
  })
  .open(baseUrl)
  .waitForElement('.groceryItem')
  .assert.text('.groceryItem', '1 package of tomato puree', 'the first item has the correct name')
  .execute(function() {
    var item = document.getElementsByClassName('pull-right')[0];
    var dispatchMouseEvent = function(target, var_args) {
      var e = document.createEvent("MouseEvents");
      e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
      target.dispatchEvent(e);    
    };
    dispatchMouseEvent(item, 'click', true, true);
  })
  .wait(1000)
  .waitForElement('.groceryItem')
  .type('.itemInput', 'bifteck aux pommes frites')
  .sendKeys('body', '\uE007') //007!
  .assert.text('.groceryItem', 'bifteck aux pommes frites', 'text edit works correctly')
  .done();
}

function signUp(page){
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

function signIn(page){
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

function signOutOnTokenExpiration(page){
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
  .execute(function() {
    var stateJSON = localStorage.getItem('state');
    var state = JSON.parse(stateJSON);
    state.credentials.token = 'invalidtoken';
    var newStateJSON = JSON.stringify(state);
    localStorage.setItem('state', newStateJSON);
  })
  .open(baseUrl)
  .assert.visible('#signUp', 'User is signed out as sign up button is visible')
  .assert.doesntExist('#signOut', 'User is signed out as sign out button is not visible')
  .done();
}

function saveInLocalStorage(page) {
  page
    .open(baseUrl)
    .assert.title().is('Grub', 'Title works')
    .execute(function() {
      localStorage.clear();
    })
    .open(baseUrl)
    .waitForElement('.groceryItem')
    .assert.numberOfElements('.groceryList .groceryItem', 6, '6 items are visible at first')
    .type('#name', 'chocolate box')
    .click('#add')
    .assert.numberOfElements('.groceryList .groceryItem', 7, '7 items are visible after adding')
    .open(baseUrl)
    .assert.numberOfElements('.groceryList .groceryItem', 7, '7 items are visible after reload')
    .execute(function() {
      localStorage.clear();
    })
    .open(baseUrl)
    .assert.numberOfElements('.groceryList .groceryItem', 6, '6 items are visible after localStorage is cleared and page realoaded')
    .done();
}

module.exports = {
  // 'User can clear the list and add a new item': clearAndAdd,
  // 'User can delete a grocery item': deleteItem,
  // 'User can edit a grocery item (desktop)': editItem,
  // 'User can sign up with a new email address': signUp,
  // 'User can sign in with an existing email address': signIn,
  'User is signed out if token expires': signOutOnTokenExpiration
  // 'State is persisted in localStorage': saveInLocalStorage
};
