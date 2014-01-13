module.exports = {
'Basic HTML site title correct': function (test) {
  test
    .open('test/basic.html')
    .assert.title().is('Sanity test', 'Title works')
    .done();
}
};
