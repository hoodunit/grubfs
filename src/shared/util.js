var Crypto = require('crypto');

function generateUUID() {
    var current_date = (new Date()).valueOf().toString();
    var random = Math.random().toString();
    var num = Crypto.createHash('sha1').update(current_date + random).digest('hex');
    return num;
}


module.exports = {
  generateUUID: generateUUID
};
