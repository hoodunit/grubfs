var PASSWORD_MIN_LEN = 10;
var PASSWORD_MAX_LEN = 128;

function validPasswordLength(password){
    return (password.length < 10 || password.length > 128);
}

function validEmail(email){
  return (/^[a-z0-9]+([-._][a-z0-9]+)*@([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,4}$/).test(email) &&
    (/^(?=.{1,64}@.{4,64}$)(?=.{6,100}$).*/).test(email);
}


module.exports = {
  PASSWORD_MIN_LEN: PASSWORD_MIN_LEN,
  PASSWORD_MAX_LEN: PASSWORD_MAX_LEN,
  validPasswordLength: validPasswordLength,
  validEmail: validEmail,
};
