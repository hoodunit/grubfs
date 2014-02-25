var FsioAPI = require('../../src/shared/fsio_api.js');

function createUser(username, password){
  var adminUser = process.env.FSIO_USER_NAME;
  var adminPass = process.env.FSIO_PASSWORD;
  var newUser = FsioAPI.signUp(username, password, adminUser, adminPass);
  return newUser;
}

function deleteUser(username){
  var adminUser = process.env.FSIO_USER_NAME;
  var adminPass = process.env.FSIO_PASSWORD;
  var response = FsioAPI.deleteUser(username, adminUser, adminPass);
  return response;
}

function randomUser(){
  var randomNum = Math.floor(Math.random() * 1000000000);
  return "testuser" + randomNum + "@example.com";
}
  
module.exports = {
  createUser: createUser,
  deleteUser: deleteUser,
  randomUser: randomUser
};
