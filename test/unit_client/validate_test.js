/*jshint expr: true*/
// Keep jshint happy about chai statements

var assert = require('assert');

var Validate = require('../../src/shared/validate.js');

describe('Validate', function(){
  describe('validPasswordLength', function(){
    it('should restrict lengths to 10-128', function(){
      assert(!Validate.validPasswordLength('9charactr'));
      assert(Validate.validPasswordLength('goodpassword'));
      assert(Validate.validPasswordLength('tencharact'));
      // 128 chars
      assert(Validate.validPasswordLength('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus a felis pretium purus fermentum hendrerit non quis sem posuere.'));
      // 129 chars
      assert(!Validate.validPasswordLength('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus a felis pretium purus fermentum hendrerit non quis sem posuere.a'));
    });
  });

  describe('validEmail', function(){
    it('should validate some common cases', function(){
      assert(Validate.validEmail('asdf@asdf.com'));
      assert(Validate.validEmail('foo.bar@sub.domain.com'));
      assert(Validate.validEmail('asdf@domain.museum'));
      assert(Validate.validEmail('asdf+bar@domain.fi'));

      assert(Validate.validEmail('niceandsimple@example.com'));
      assert(Validate.validEmail('very.common@example.com'));
      assert(Validate.validEmail('a.little.lengthy.but.fine@dept.example.com'));
      assert(Validate.validEmail('disposable.style.email.with+symbol@example.com'));
      assert(Validate.validEmail('other.email-with-dash@example.com'));
      assert(Validate.validEmail("!#$%&'*+-/=?^_`{}|~@example.org"));

    });
    it('should invalidate some obvious cases', function(){
      assert(!Validate.validEmail('asdf'));
      assert(!Validate.validEmail('asdf@'));
      assert(!Validate.validEmail('asdf@asdf'));
      assert(!Validate.validEmail('@asdf.com'));
      assert(!Validate.validEmail('asdf@asdf.c'));
      assert(!Validate.validEmail('asdf@asdf.com.c'));
    });
  });
});
