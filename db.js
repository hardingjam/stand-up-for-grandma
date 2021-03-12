const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:jharding@localhost/petition");
// tells spicedPg to tell postgres to look : in the directory : with a password : and a name of a database

module.exports.getSignatures = function () {
    console.log("getting signatures");
    return db.query("SELECT * FROM signature;");
};

// often queries will take input from the user!
// use template strings to include arguments.
module.exports.addSignature = function (firstname, lastname, signature) {
    return db.query(
        `INSERT INTO signature (first_name, last_name, signature) VALUES ($1 $2);`,
        // this prevents malicious queries from being entered. Sanitizes the user input
        [firstname, lastname, signature]
    );
};
