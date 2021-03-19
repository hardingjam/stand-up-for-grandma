// since app is not defined in this file, I cannot perform app methods.
// app is defined in server.js, it is a big JS object.
// it can be exported and required!

const { app } = require("./server");
module.exports.requireLoggedOutUser = function (req, res, next) {
    if (req.session.userId) {
        app.locals.loggedIn = true;
        return res.redirect("/petition");
    }
    next();
};

module.exports.requireLoggedInUser = function (req, res, next) {
    if (!req.session.userId) {
        app.locals.loggedIn = false;
        return res.redirect("/register");
    }
    if (req.session.userId) {
        app.locals.loggedIn = true;
    }
    next();
};

module.exports.requireSignature = function (req, res, next) {
    if (!req.session.signatureId) {
        return res.redirect("/petition");
    }
    next();
};

module.exports.requireNoSignature = function (req, res, next) {
    if (req.session.signatureId) {
        app.locals.signed = true;
        return res.redirect("/thanks");
    }
    next();
};
