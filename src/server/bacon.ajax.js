/**
 * Extends Baconjs and jQuery to make chaining ajax calls easier.
 * Credits go to the bacon.jquery project here:
 * https://github.com/baconjs/bacon.jquery
 */

var Bacon = require('baconjs');
var $ = require('jquery-node-browserify');

Bacon.$.ajax = function(params, abort){
  return Bacon.fromPromise($.ajax(params, abort));
};

Bacon.Observable.prototype.ajax = function(){
  return this.flatMapLatest(Bacon.$.ajax);
};
