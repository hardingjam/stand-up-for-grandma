const { genSalt, hash, compare } = require("bcryptjs");

//compares the pasword the user types with with hash in our database
module.exports.compare = compare;

// hash calls genSalt
// then is hashs the password from the user, using the salt and the hash method
module.exports.hash = (password) =>
    genSalt().then((salt) => hash(password, salt));
