const express = require("express");
const { getSignatures, addSignature } = require("./db");
const app = express();
const hb = require("express-handlebars");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");

app.use(express.urlencoded());
app.use(cookieParser());
app.use(express.static("./public"));

app.use(
    cookieSession({
        secret: "I love CAFC",
        maxAge: 1000 * 60 * 60 * 24 * 14,
        // two weeks cookie time!
    })
);

app.engine("handlebars", hb());
app.set("view engine", "handlebars");
// res.render with the name of your view file (minus .handebars)

app.get("/", (req, res) => {
    console.log("req.session in slash route: ", req.session);
    req.session.user = "Jamie";
    if (req.cookies.petitionSigned) {
        res.redirect("thanks");
    } else {
        res.redirect("/petition");
    }
});

app.get("/petition", (req, res) => {
    console.log("req.session in peitions route: ", req.session);
    getSignatures().then((data) => {
        // log the data
        // console.log(data.rows);
        const signeesData = data.rows;
        res.render("petition", {
            title: "Petition",
        });
    });
});

app.post("/petition", (req, res) => {
    const { firstName, lastName, signature } = req.body;
    addSignature(firstName, lastName, signature).then((data) => {
        console.log("submitted signature");
        console.log(data.rows[0].id);
        req.session.petitionSigned = true;

        res.redirect("thanks");
    });
});

app.get("/thanks", (req, res) => {
    res.render("thanks");
});

app.get("/signedby", (req, res) => {
    req.statusCode = 200;
    console.log(req.statusCode);
    res.render("signedby");
});

app.listen(8080, () => console.log("listening on 8080..."));
