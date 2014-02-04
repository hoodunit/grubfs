var Bacon = require('baconjs');

var baseUrl = 'http://localhost:8080/';

function testSignUp(page){
  page
  .open(baseUrl)
  .waitForElement('.email')
  .type('#email', 'asdf@asdf.com')
  .type('#password', 'testpassword')
  .click('#signUp')
  .type('#confirmPass', 'testpassword')
  .click('#cancelSignUp')
  .assert.doesntExist('#confirmPass', 'Confirm password is not visible after clicking cancel')
  .click('#signUp')
  .type('#confirmPass', 'testpassword')
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
'User can sign up with a new email address': testSignUp
};
