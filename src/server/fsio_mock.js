var Bacon = require('baconjs');

function signUp(user){
  return Bacon.once({success: true});
}

module.exports = {
  signUp: signUp
};
