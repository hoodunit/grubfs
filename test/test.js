var Bacon = require('baconjs');

var baseUrl = 'http://localhost:8080/';

// This is an an existing user.
// If it does not exist, tests will fail as this uses
// the actual FSIO API for signing in.
var testUser = {
  email: 'mytestuser@example.com',
  password: 'mytestpassword'
};

// Server must be running with mocked FSIO API or it will fail.
function testSignUp(page){
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

module.exports = {

'State is persisted in localStorage': function (page) {
  page
    .open(baseUrl)
    .assert.title().is('Grub', 'Title works')
    .execute(function() {
      localStorage.clear();
    })
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
},

'list can be cleared and a new item added': function (page) {
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
}, 

'User can sign up with a new email address': testSignUp,
'User can sign in with an existing email address': testSignIn
};
