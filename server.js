const express = require("express");
const {
    getSignatures,
    addSignature,
    autograph,
    fullNames,
    createUser,
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
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.redirect("/petition");
    }
});

app.get("/register", (req, res) => {
    console.log("req.session in register route: ", req.session);
    res.render("register");
});

app.post("/petition", (req, res) => {
    const { firstName, lastName, signature } = req.body;
    addSignature(firstName, lastName, signature).then((data) => {
        console.log("submitted signature");
        console.log("singee ID: ", data.rows[0].id);
        req.session.signatureId = data.rows[0].id;
        res.redirect("thanks");
    });
});

app.post("/register", (req, res) => {
    const { firstName, lastName, email, age, country, password } = req.body;
    hash(password).then((hash) => {
        createUser(firstName, lastName, email, age, country, hash).then(
            (data) => {
                console.log("data.rows[0].id: ", data.rows[0].id);
                req.session.userId = data.rows[0].id;
                res.redirect("/petition");
            }
        );
    });
});

// app.post("/login", (req, res) => {
const userPwFromBody = "mypassword";
const demoHash = "$2a$10$7h7E4/5jOE5x0P5cBvN/4Oqk5s2pkZwFl8aZGD62FpR5g6g6dM4T6";
// take the email from the req.body
// use it to look up the hashed PW from our users table
// then we have the password from req.body and a hashed PW...
compare(userPwFromBody, demoHash).then((match) => {
    // match is a boolean
    console.log("match: ", match);
    // if there is a match, add something to req.session (cookies) and then redirect to the petition route

    // if there is NO match, rerender the login route but with an error message.
    // if the email address IS in our table, we can say the password was wrong
    // if the email address ISN'T, we can say that the user does not exist
});
// });

app.get("/petition", (req, res) => {
    console.log("req.session in peitions route: ", req.session);
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        getSignatures().then((data) => {
            const signeesData = data.rows;
            res.render("petition", {
                title: "Petition",
            });
        });
    }
});

app.get("/thanks", (req, res) => {
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
    req.statusCode = 200;
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

app.listen(8080, () => console.log("listening on 8080..."));
