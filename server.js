const express = require("express");
const { getSignatures, addSignature } = require("./db");
const app = express();
const hb = require("express-handlebars");

app.use(express.urlencoded());

app.use(express.static("./public"));
// set your view engine to handlebars!!

app.engine("handlebars", hb());
app.set("view engine", "handlebars");
// res.render with the name of your view file (minus .handebars)

app.get("/", (req, res) => {
    getSignatures().then((data) => {
        console.log(data.rows);
        res.render("petition", {
            title: "Petition",
        });
    });
});

app.post("/", (req, res) => {
    const { firstName, lastName } = req.body;
    addSignature(firstName, lastName).then((data) => console.log(data));
});

app.get("/thanks", (req, res) => {
    res.json({ success: true });
});

app.get("/thanks", (req, res) => {
    res.json({ success: true });
});

// app.get("/signers", (req, res) => {
//     res.render("signers"), {
//          signers: //signers from database

app.listen(8080, () => console.log("listening on 8080..."));
