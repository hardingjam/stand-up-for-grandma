const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:jharding@localhost/petition");
// tells spicedPg to tell postgres to look : in the directory : with a password : and a name of a database

// often queries will take input from the user!
// use template strings to include arguments.

module.exports.autograph = function (signatureId) {
    const query = `SELECT signatures.signature AS "signature", users.first_name AS "name"
                    FROM signatures JOIN users ON signatures.user_id=users.id
                    WHERE users.id= $1;`;
    // refactor to prevent SQL injection
    const params = [signatureId];
    return db.query(query, params);
};

module.exports.fullNames = function () {
    const query = `SELECT first_name, last_name FROM users;`;
    return db.query(query);
};

module.exports.createUser = function (
    firstName,
    lastName,
    email,
    age,
    country,
    password
) {
    const query = `INSERT INTO users (first_name, last_name, email, age, country, password) VALUES ($1, $2, $3, $4, $5, $6) returning id;`;
    const params = [firstName, lastName, email, age, country, password];
    return db.query(query, params);
};

module.exports.addSignature = function (signature, userId) {
    const query = `INSERT INTO signatures (signature, user_id) VALUES ($1, $2) RETURNING id;`;
    // returning id
    const params = [signature, userId];
    // returning a promise to server.js
    // without return, server.js will not get the data and .thens and .catches will not happen
    return db.query(query, params);
};

module.exports.getPassword = function (email) {
    const query = `SELECT password, id FROM users WHERE email = $1;`;
    const params = [email];
    return db.query(query, params);
};

module.exports.checkForSig = function (userId) {
    const query = `SELECT signature, id FROM signatures WHERE user_id = $1;`;
    const params = [userId];
    return db.query(query, params);
};
