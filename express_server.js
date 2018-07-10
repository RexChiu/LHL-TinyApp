const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");

app.set('view engine', 'ejs');

const urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
}

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("urls_new");
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
    res.render("urls_index", { urls: urlDatabase });
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
    let templateVars = {
        shortURL: req.params.id,
        urls: urlDatabase
    };
    res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
    let longURL = req.body.longURL;
    let shortenedURL = generateRandomString();
    urlDatabase[shortenedURL] = longURL;
    console.log(shortenedURL, longURL);
    res.redirect(`http://localhost:8080/urls/${shortenedURL}`);
});

app.get("/u/:shortURL", (req, res) => {
    shortURL = req.params.shortURL;
    console.log(urlDatabase[shortURL]);
    let longURL = urlDatabase[shortURL];
    res.redirect(longURL);
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
    let stringLength = 6;
    let characterSet = "0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
    let randomString = "";

    for (let i = 0; i < stringLength; i++) {
        let randomIndex = Math.floor(Math.random() * (characterSet.length - 1 - 0 + 1)) + 0;
        randomString += characterSet.charAt(randomIndex);
    }

    return randomString;
}