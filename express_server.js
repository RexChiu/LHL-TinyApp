const express = require("express");
const bodyParser = require("body-parser");
const morgan = require ('morgan');
const cookieParser = require('cookie-parser');

const PORT = 8080;

const urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
}

const app = express();

app.set('view engine', 'ejs');

app.use(cookieParser())

app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('dev'));

app.get("/", (req, res) => {
    res.redirect("/urls/new");
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
    let templateVars = {
        urls: urlDatabase,
        username: req.cookies['username']
    }

    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    let templateVars = {
        username: req.cookies['username']
    }

    res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
    //send 404 not found if id does not exist
    if (urlDatabase[req.params.id] != undefined) {
        let templateVars = {
            shortURL: req.params.id,
            urls: urlDatabase,
            username: req.cookies['username']
        };
        res.render("urls_show", templateVars);
    }
    else {
        
        res.status(404).send('Error: URL not found');
    }
});

app.post("/logout", (req, res) => {
    res.clearCookie("username");

    res.redirect('/urls');
});

app.post("/login", (req, res) => {
    res.cookie("username", req.body.username);

    res.redirect('/urls');
});

app.post("/urls", (req, res) => {
    let longURL = req.body.longURL;
    let shortenedURL = generateRandomString();
    urlDatabase[shortenedURL] = longURL;

    res.redirect(`http://localhost:${PORT}/urls/${shortenedURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
    let shortURL = req.params.id;
    delete urlDatabase[shortURL];

    res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
    let shortURL = req.params.id;
    urlDatabase[shortURL] = req.body.longURL;

    res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
    shortURL = req.params.shortURL;

    let longURL = urlDatabase[shortURL];

    if (longURL != undefined) {
        res.redirect(longURL);
    } else {
        res.status(404).send('Error: URL not found');
    }
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