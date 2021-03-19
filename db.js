const spicedPg = require("spiced-pg");

const db = spicedPg(
    // left hand side for heroku || right hand side for localhost //
    process.env.DATABASE_URL || "postgres:jharding@localhost/petition"
);
// tells spicedPg to tell postgres to look : in the directory : with a password : and a name of a database

// often queries will take input from the user!
// use template strings to include arguments.

module.exports.autograph = function (signatureId) {
    const query = `SELECT signatures.signature AS "signature", users.first_name AS "name"
                    FROM signatures 
                    JOIN users 
                    ON signatures.user_id=users.id
                    WHERE users.id= $1;`;
    // refactor to prevent SQL injection
    const params = [signatureId];
    return db.query(query, params);
};

module.exports.fullNames = function (userId) {
    const query = `SELECT first_name AS "first", last_name AS "last" 
                    FROM users
                    WHERE id = $1;`;
    const params = [userId];
    return db.query(query, params);
};

module.exports.createUser = function (firstName, lastName, email, password) {
    const query = `INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) returning id;`;
    const params = [firstName, lastName, email, password];
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

module.exports.checkForSig = function (userId) {
    const query = `SELECT signature, id FROM signatures WHERE user_id = $1;`;
    const params = [userId];
    return db.query(query, params);
};

module.exports.removeSignature = function (userId) {
    const query = `DELETE FROM signatures WHERE user_id = $1;`;
    const params = [userId];
    return db.query(query, params);
};

module.exports.getPassword = function (email) {
    const query = `SELECT password, id FROM users WHERE email = $1;`;
    const params = [email];
    return db.query(query, params);
};

module.exports.updateProfile = function (
    age = null,
    city = null,
    url = null,
    userId
) {
    const query = `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4);`;
    const params = [age || null, city || null, url || null, userId];
    return db.query(query, params);
};

module.exports.checkUrl = function (url) {
    if (url) {
        if (url.startsWith("https://") || url.startsWith("http://")) {
            return url;
        } else {
            return "https://" + url;
        }
    }
};

module.exports.signersInfo = function () {
    const query = `SELECT users.first_name AS "first", users.last_name AS "last", 
                    user_profiles.city AS "city", user_profiles.age AS "age", user_profiles.url AS "url"
                    FROM signatures
                    LEFT JOIN users
                    ON signatures.user_id = users.id
                    LEFT JOIN user_profiles
                    ON users.id = user_profiles.user_id;`;
    return db.query(query);
};

module.exports.citySigners = function (city) {
    const query = `SELECT users.first_name AS "first", users.last_name AS "last", 
                    user_profiles.age AS "age", user_profiles.url AS "url"
                    FROM signatures
                    LEFT JOIN users
                    ON signatures.user_id = users.id
                    LEFT JOIN user_profiles
                    ON users.id = user_profiles.user_id
                    WHERE LOWER(user_profiles.city) = $1;`;
    const params = [city];
    return db.query(query, params);
};

module.exports.getUserProfile = function (id) {
    const query = `SELECT users.first_name AS "first",
                    users.last_name AS "last",
                    users.email AS "email",
                    user_profiles.age AS "age",
                    user_profiles.city AS "city",
                    user_profiles.url AS "url"
                    FROM users
                    LEFT JOIN user_profiles
                    ON users.id = user_profiles.user_id
                    WHERE users.id = $1;`;
    const params = [id];
    return db.query(query, params);
};

module.exports.updateUsers = function (firstName, lastName, email, userId) {
    const query = `UPDATE users
                    SET first_name = $1, last_name = $2, email = $3
                    WHERE id = $4;`;
    const params = [firstName, lastName, email, userId];
    return db.query(query, params);
};

module.exports.updateUsersPassword = function (
    firstName,
    lastName,
    email,
    userId,
    password
) {
    const query = `UPDATE users
                    SET first_name = $1, last_name = $2, email = $3, password = $5
                    WHERE id = $4;`;
    const params = [firstName, lastName, email, userId, password];
    return db.query(query, params);
};

module.exports.updateOrCreate = function (age, city, url, userId) {
    const query = `INSERT INTO user_profiles (age, city, url, user_id)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_id)
                    DO UPDATE SET age = $1, city = $2, url = $3;`;
    const params = [age || null, city || null, url || null, userId];
    return db.query(query, params);
};

// THREE UPDATE QUERIES FOR EDIT-PROFILE
// update on USERS (first, last, email)
// update on USERS (first, last, email, pw)
// UPDATE on user_profiles (age, city, url)

// updateUser
// updateUserWithPw
// updateUserProf

// in post("/edit") do the logic, and send the appropriate export function

// we run the user_profiles table regardless of whether the user updates that info.

// some users can end up on the edit page without having a row on user_profiles.

// If the user has NOT added a row in user_profiles, we do an UPSERT.

// It attempts to INSERT a row, and if the row exists already, it will UPDATE it.

// INSERT INTO actors (name, age, oscars)
// VALUES ('Penelope', 43, 1)
// on CONFLICT (name) // in the create table command for this column, we can insist that this value is unique.
//                 //  This UNIQUE clause is what allows us to use the CONFLIC property
// DO UPDATE SET age = 43, oscars = 1.
