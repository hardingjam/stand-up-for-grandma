const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:jharding@localhost/petition");
// tells spicedPg to tell postgres to look : in the directory : with a password : and a name of a database

module.exports.getSignatures = function () {
    console.log("getting signatures");
    return db.query("SELECT * FROM signature;");
};

// often queries will take input from the user!
// use template strings to include arguments.

module.exports.autograph = function (signatureId) {
    const query = `SELECT signature, first_name FROM signature WHERE id = $1;`;
    // refactor to prevent SQL injection
    const params = [signatureId];
    return db.query(query, params);
};

module.exports.fullNames = function () {
    const query = `SELECT first_name, last_name FROM signature;`;
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

module.exports.addSignature = function (firstName, lastName, signature) {
    const query = `INSERT INTO signature (first_name, last_name, signature) VALUES ($1, $2, $3) RETURNING id;`;
    // returning id
    const params = [firstName, lastName, signature];
    return db.query(query, params);
};
