const express = require("express");
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
} = require("./db");
const app = express();
const hb = require("express-handlebars");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

const { hash, compare } = require("./bc");
app.use(cookieParser());
app.use(express.static("./public"));

app.use(
    cookieSession({
        secret: "I love CAFC",
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

// LOCAL VARS

app.locals.lowerCase = function (str) {
    return str.toLowerCase();
};

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
});

app.get("/", (req, res) => {
    console.log("req.session in slash route: ", req.session);
    if (req.session.userId) {
        app.locals.fullName = fullNames(req.session.userId);
        if (req.session.signatureId) {
            res.redirect("/thanks");
        } else {
            res.redirect("/petition");
        }
    } else {
        res.redirect("/login");
    }
});

app.get("/register", (req, res) => {
    console.log("userId: ", req.session.userId);
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

app.post("/register", (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    hash(password).then((hash) => {
        createUser(firstName, lastName, email, hash)
            .then(({ rows }) => {
                console.log(rows);
                req.session.userId = rows[0].id;
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("error", err);
                res.render("register", {
                    error: true,
                });
            });
    });
});

app.get("/login", (req, res) => {
    res.render("login", {
        Title: "Please Log In",
    });
});

app.post("/login", (req, res) => {
    console.log("posted to Login");
    const { email, password } = req.body;
    getPassword(email)
        .then(({ rows }) => {
            compare(password, rows[0].password).then((match) => {
                console.log("match: ", match);
                if (match) {
                    console.log("successful login!");
                    req.session.userId = rows[0].id;
                    const user = rows[0].id;
                    checkForSig(user)
                        .then(({ rows }) => {
                            if (rows[0]) {
                                req.session.signatureId = rows[0].id;
                                res.redirect("/thanks");
                            } else {
                                res.redirect("/petition");
                            }
                        })
                        .catch((err) => {
                            console.log("error in checkForSig: ", err);
                        });
                } else {
                    res.render("login", {
                        wrongPassword: true,
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

app.get("/profile", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        console.log(req.session.userId);
        res.render("profile");
    }
});

app.post("/profile", (req, res) => {
    const { age, city } = req.body;
    const url = checkUrl(req.body.url);
    const userId = req.session.userId;
    updateProfile(age, city, url, userId)
        .then(({ rows }) => {
            console.log(rows);
            res.redirect("/");
        })
        .catch((err) => {
            console.log("error in profile POST route: ", err);
        });
});

app.get("/petition", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    }
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            title: "Petition",
        });
    }
});

app.post("/petition", (req, res) => {
    const userId = req.session.userId;
    const { signature } = req.body;
    addSignature(signature, userId)
        .then((data) => {
            console.log("submitted signature");
            req.session.signatureId = data.rows[0].id;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("error: ", err);
        });
});

app.get("/thanks", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    }
    autograph(req.session.userId).then(({ rows }) => {
        console.log(rows[0]);
        const { name, signature } = rows[0];
        res.render("thanks", {
            title: "Thank you!",
            name: name,
            autograph: signature,
        });
    });
});

app.get("/signedby", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        signersInfo().then((data) => {
            console.log(data.rows);
            res.render("signedby", {
                signers: data.rows,
            });
        });
    }
});

app.get("/privacy", (req, res) => {
    res.render("privacy", {
        Title: "Privacy Policy",
    });
});

app.get("*", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    }
});

app.listen(8080, () => console.log("listening on 8080..."));
