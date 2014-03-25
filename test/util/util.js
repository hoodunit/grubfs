var FsioAPI = require('../../src/shared/fsio_api.js');

var adminUser = process.env.FSIO_USER_NAME;
var adminPass = process.env.FSIO_PASSWORD;

function createUser(username, password){
  var newUser = FsioAPI.signUp(username, password, adminUser, adminPass);
  return newUser;
}

function deleteUser(username){
  var response = FsioAPI.signInAsAdmin(adminUser, adminPass)
                        .flatMapFirst(FsioAPI.deleteUser, username);
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
