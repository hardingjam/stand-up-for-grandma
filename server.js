const express = require("express");
const app = express();
// the express app is created. It's a node server with a lot of functionality.
// part of that is routing.
exports.app = app;
const {
    addSignature,
    autograph,
    fullNames,
    createUser,
    getPassword,
    checkForSig,
    updateProfile,
    checkUrl,
    signersInfo,
    citySigners,
    getUserProfile,
    updateUsers,
    updateUsersPassword,
    updateOrCreate,
    removeSignature,
} = require("./db");
const {
    requireLoggedOutUser,
    requireLoggedInUser,
    requireSignature,
    requireNoSignature,
} = require("./middleware");

const hb = require("express-handlebars");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

var dbUrl =
    process.env.DATABASE_URL ||
    "postgres://petition:password@localhost:5432/petition";

const { hash, compare } = require("./bc");
app.use(cookieParser());
app.use(express.static("./public"));

app.use(
    cookieSession({
        secret: "I love you",
        maxAge: 1000 * 60 * 60 * 24 * 14,
        // two weeks cookie time!
    })
);
app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(csurf());
// rejects POST requests that do not have a valid token

app.use(function (req, res, next) {
    res.set("x-frame-options", "deny");
    res.locals.csrfToken = req.csrfToken();
    // res.locals is an empty object added by express, you can fill it with things you want available to the templates.
    next();
});

app.engine("handlebars", hb());
app.set("view engine", "handlebars");
// res.render with the name of your view file (minus .handebars)

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
    app.locals.fullName = null;
    app.locals.loggedIn = null;
});

// WE can use multiple arguments in get routes, chained together with next()
// in a GET route all functions after the first one will RUN

app.get("/", (req, res) => {
    if (req.session.userId) {
        // .then here and THEN update app.locals, check for that on the renders....
        app.locals.loggedIn = true;
    }
    if (req.session.signatureId) {
        app.locals.signed = true;
        return res.redirect("/thanks");
    } else {
        return res.redirect("/register");
    }
});

app.get("/register", requireLoggedOutUser, (req, res) => {
    if (req.session.userId) {
        res.render("register", {
            registered: true,
            Title: "Register Now",
        });
    } else {
        res.render("register", {
            Title: "Register Now",
        });
    }
});

app.post("/register", requireLoggedOutUser, (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    hash(password).then((hash) => {
        createUser(firstName, lastName, email, hash)
            .then(({ rows }) => {
                req.session.userId = rows[0].id;
                fullNames(req.session.userId)
                    .then(({ rows }) => {
                        app.locals.fullName = rows[0];
                        app.locals.loggedIn = true;
                        res.redirect("/profile");
                    })
                    .catch((err) => {
                        console.log("error in fullNames call: ", err);
                    });
            })
            .catch((err) => {
                console.log("error in registration", err);
                res.render("register", {
                    error: true,
                });
            });
    });
});

app.get("/login", requireLoggedOutUser, (req, res) => {
    res.render("login", {
        Title: "Please Log In",
        email: req.session.email,
    });
});

app.post("/login", requireLoggedOutUser, (req, res) => {
    console.log("posted to Login");
    const { email, password } = req.body;
    req.session.email = email;
    console.log(email);
    getPassword(email)
        .then(({ rows }) => {
            compare(password, rows[0].password).then((match) => {
                console.log("match: ", match);
                if (match) {
                    app.locals.loggedIn = true;
                    req.session.userId = rows[0].id;
                    fullNames(req.session.userId)
                        .then(({ rows }) => {
                            app.locals.fullName = rows[0];
                        })
                        .catch((err) => {
                            console.log("error in fullNames call: ", err);
                        });
                    const user = rows[0].id;
                    checkForSig(user)
                        .then(({ rows }) => {
                            if (rows[0]) {
                                req.session.signatureId = rows[0].id;
                                return res.redirect("/thanks");
                            } else {
                                return res.redirect("/petition");
                            }
                        })
                        .catch((err) => {
                            console.log("error in checkForSig: ", err);
                        });
                } else {
                    res.render("login", {
                        wrongPassword: true,
                        email: email,
                    });
                }
            });
        })
        .catch((err) => {
            console.log("error: ", err);
            res.render("login", {
                noUser: true,
            });
        });
});

app.get("/profile", requireLoggedInUser, (req, res) => {
    console.log(req.session.userId);
    res.render("profile");
});

app.post("/profile", requireLoggedInUser, (req, res) => {
    const { age, city } = req.body;
    const url = checkUrl(req.body.url);
    const userId = req.session.userId;
    updateProfile(age, city, url, userId)
        .then(({ rows }) => {
            console.log(rows);
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error in profile POST route: ", err);
        });
});

app.get("/petition", requireLoggedInUser, requireNoSignature, (req, res) => {
    if (req.session.signatureId) {
        return res.redirect("/thanks");
    } else {
        res.render("petition", {
            title: "Petition",
        });
    }
});

app.post("/petition", requireLoggedInUser, requireNoSignature, (req, res) => {
    const userId = req.session.userId;
    const { signature } = req.body;
    if (signature) {
        addSignature(signature, userId)
            .then(({ rows }) => {
                console.log("submitted signature");
                req.session.signatureId = rows[0].id;
                app.locals.signed = true;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("error: ", err);
            });
    } else {
        res.render("petition", {
            error: true,
        });
    }
});

app.get("/thanks", requireLoggedInUser, requireSignature, (req, res) => {
    autograph(req.session.userId).then(({ rows }) => {
        res.render("thanks", rows[0]);
    });
});

app.post("/thanks", requireLoggedInUser, requireSignature, (req, res) => {
    console.log("removing sig");
    removeSignature(req.session.userId)
        .then((data) => {
            req.session.signatureId = null;
            app.locals.signed = false;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error is delete sig: ", err);
        });
});

app.get("/signedby", requireLoggedInUser, requireSignature, (req, res) => {
    signersInfo().then((data) => {
        res.render("signedby", {
            signers: data.rows,
            helpers: {
                lowerCase(str) {
                    return str.toLowerCase();
                },
                capitalise(str) {
                    return str.charAt(0).toUpperCase() + str.slice(1);
                },
                underscore(str) {
                    return str.replace(/ /g, "_");
                },
            },
        });
    });
});

app.get(
    "/signedby/:city",
    requireLoggedInUser,
    requireSignature,
    (req, res) => {
        const city = req.params.city.toLowerCase().replace(/_/g, " ");
        console.log(city);
        citySigners(city)
            .then((data) => {
                console.log(data.rows);
                res.render("signedby", {
                    signers: data.rows,
                    city: city,
                    helpers: {
                        lowerCase(str) {
                            return str.toLowerCase();
                        },
                        capitalise(str) {
                            let regex = /(^|\s)\S/g;
                            return str.replace(regex, (letter) =>
                                letter.toUpperCase()
                            );
                        },
                        spaceify(str) {
                            return str.replace(/_/g, " ");
                        },
                    },
                });
            })
            .catch((err) => {
                console.log("error in citySigners: ", err);
            });
    }
);

app.get("/privacy", (req, res) => {
    res.render("privacy", {
        Title: "Privacy Policy",
    });
});

app.get("/edit-profile", requireLoggedInUser, (req, res) => {
    console.log(app.locals.loggedIn);
    getUserProfile(req.session.userId).then(({ rows }) => {
        res.render(
            "edit-profile",
            rows[0]
            // render all the current information here.
        );
    });
});

app.post("/edit-profile", requireLoggedInUser, (req, res) => {
    const userId = req.session.userId;
    const { firstName, lastName, email, age, city, password } = req.body;
    const url = checkUrl(req.body.url);
    if (password) {
        hash(password).then((hash) => {
            updateUsersPassword(firstName, lastName, email, userId, hash)
                .then((data) => {
                    updateUsers(firstName, lastName, email, userId).then(
                        (data) => {
                            updateOrCreate(age, city, url, userId)
                                .then((data) => {
                                    res.redirect("/thanks");
                                })
                                .catch((err) => {
                                    console.log("error in update/create ", err);
                                });
                        }
                    );
                })
                .catch((err) => {
                    console.log("error in update profile with password: ", err);
                });
        });
    } else {
        updateUsers(firstName, lastName, email, userId).then((data) => {
            updateOrCreate(age, city, url, userId)
                .then((data) => {
                    res.redirect("/thanks");
                })
                .catch((err) => {
                    console.log("error in update/create ", err);
                });
        });
    }
});

app.listen(process.env.PORT || 8080);
