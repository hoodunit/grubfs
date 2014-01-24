var baseUrl = 'http://localhost:8080/';

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
}
};
