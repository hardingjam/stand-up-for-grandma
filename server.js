const express = require("express");
const { getSignatures, addSignature, autograph, fullNames } = require("./db");
const app = express();
const hb = require("express-handlebars");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

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
    req.session.user = "Jamie";
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.redirect("/petition");
    }
});

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

app.post("/petition", (req, res) => {
    const { firstName, lastName, signature } = req.body;
    addSignature(firstName, lastName, signature).then((data) => {
        console.log("submitted signature");
        console.log("singee ID: ", data.rows[0].id);
        req.session.signatureId = data.rows[0].id;
        res.redirect("thanks");
    });
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
