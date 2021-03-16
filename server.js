const express = require("express");
const {
    getSignatures,
    addSignature,
    autograph,
    fullNames,
    createUser,
    login,
    getPassword,
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

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
});

app.get("/", (req, res) => {
    console.log("req.session in slash route: ", req.session);
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        res.redirect("/login");
    }
});

app.get("/register", (req, res) => {
    console.log("userId: ", req.session.userId);
    if (req.session.userId) {
        res.render("register", {
            registered: true,
        });
    } else {
        res.render("register");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    console.log("posted to Login");
    const { email, password } = req.body;
    getPassword(email)
        .then(({ rows }) => {
            compare(password, rows[0].password)
                .then((match) => {
                    console.log("match: ", match);
                    if (match) {
                        console.log("successful login!");
                        req.session.userId = rows[0].id;
                        res.redirect("/petition");
                    } else {
                        res.render("login", {
                            wrongPassword: true,
                        });
                    }
                })
                .catch((err) => {
                    console.log("Wrong password! ", err);
                    res.render("login", {
                        wrongPassword: true,
                    });
                });
        })
        .catch((err) => {
            console.log("error: ", err);
            res.render("login", {
                noUser: true,
            });
        });
});

app.get("/petition", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    }
    console.log("req.session in peitions route: ", req.session);
    res.render("petition", {
        title: "Petition",
    });
});

app.post("/petition", (req, res) => {
    const userId = req.session.userId;
    const { signature } = req.body;
    addSignature(userId, signature).then((data) => {
        console.log("submitted signature");
        req.session.signatureId = data.rows[0].id;
        res.redirect("thanks");
    });
});

app.post("/register", (req, res) => {
    const { firstName, lastName, email, age, country, password } = req.body;
    hash(password).then((hash) => {
        createUser(firstName, lastName, email, age, country, hash)
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

app.get("/thanks", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    }
    const signerId = req.session.signatureId;
    console.log("signerId:", signerId);
    autograph(signerId).then((data) => {
        console.log(data.rows);
        res.render("thanks", {
            title: "Thank you",
            imgUrl: data.rows[0].signature,
            name: data.rows[0].first_name,
        });
    });
});

app.get("/signedby", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    }
    console.log(req.statusCode);
    // the data i want is only the firstnames
    fullNames().then((data) => {
        res.render("signedby", {
            signers: data.rows,
        });
    });
});

app.get("/privacy", (req, res) => {
    res.render("privacy");
});

app.get("*", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    }
});

app.listen(8080, () => console.log("listening on 8080..."));
