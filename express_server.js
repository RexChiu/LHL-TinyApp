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

//view engine
app.set('view engine', 'ejs');

//middleware
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

//routes

//redirect localhost to create new URL
app.get("/", (req, res) => {
    res.redirect("/urls/new");
});

//lists all urls as JSON
app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

//lists all URLs in a prettier format
//passes in username cookie
app.get("/urls", (req, res) => {
    let templateVars = {
        urls: urlDatabase,
        username: req.cookies['username']
    }

    res.render("urls_index", templateVars);
});

//shows create new url page
//passes in username cookie
app.get("/urls/new", (req, res) => {
    let templateVars = {
        username: req.cookies['username']
    }

    res.render("urls_new", templateVars);
});

//shows more detailed info on a particular shortened URL
//passes in username cookie
app.get("/urls/:id", (req, res) => {
    //finds shortURL from database, renders page
    if (urlDatabase[req.params.id] != undefined) {
        let templateVars = {
            shortURL: req.params.id,
            urls: urlDatabase,
            username: req.cookies['username']
        };
        res.render("urls_show", templateVars);
    }
    //send 404 not found if id does not exist
    else {
        
        res.status(404).send('Error: URL not found');
    }
});

//receives request to use shortURL, redirects accordingly
app.get("/u/:shortURL", (req, res) => {
    shortURL = req.params.shortURL;

    let longURL = urlDatabase[shortURL];

    if (longURL != undefined) {
        res.redirect(longURL);
    } else {
        res.status(404).send('Error: URL not found');
    }
});

//receives logout, deletes username from cookie
app.post("/logout", (req, res) => {
    res.clearCookie("username");

    res.redirect('/urls');
});

//recieves login, adds username to cookie
app.post("/login", (req, res) => {
    res.cookie("username", req.body.username);

    res.redirect('/urls');
});

//receives new longURL, generates a shortURL and redirects to show shortURL
app.post("/urls", (req, res) => {
    let longURL = req.body.longURL;
    let shortenedURL = generateRandomString();
    urlDatabase[shortenedURL] = longURL;

    res.redirect(`/urls/${shortenedURL}`);
});

//receives command to delete the URL, deletes from database
app.post("/urls/:id/delete", (req, res) => {
    let shortURL = req.params.id;
    delete urlDatabase[shortURL];

    res.redirect("/urls");
});

//receives command to modify the longURL of a shortURL
app.post("/urls/:id", (req, res) => {
    let shortURL = req.params.id;
    urlDatabase[shortURL] = req.body.longURL;

    res.redirect("/urls");
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

//function to genereate a unique shortURL for any new longURLs
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