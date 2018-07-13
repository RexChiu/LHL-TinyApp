const express = require("express");
const bodyParser = require("body-parser");
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const PORT = 8080;

const urlDatabase = {
    "CatsURL": {
        shortURL: "CatsURL",
        longURL: "http://www.lighthouselabs.ca",
        userID: "Cats",
        numVisited: 4
    },
    "FluffyCatsURL": {
        shortURL: "FluffyCatsURL",
        longURL: "http://www.cats.ca",
        userID: "Cats",
        numVisited: 45
    },
    "DogsURL": {
        shortURL: "DogsURL",
        longURL: "http://www.google.com",
        userID: "Dogs",
        numVisited: 7
    }
};

const users = {
    "Cats": {
        id: "Cats",
        email: "Cats",
        password: "$2a$10$pqsXXKoQmBuaKQ.Tg0RJ/eafwvr3pF49IMi6ovoq8fRwwVBPE6r0K"
    },
    "Dogs": {
        id: "Dogs",
        email: "Dogs",
        password: "$2a$10$phBSKcWhdBUYjnwh4vmIyO72DTBT0fAVgWLe8qRyF1vug2eu6mnXK"
    }
};

const app = express();

//view engine
app.set('view engine', 'ejs');

//middleware
app.use(cookieSession({
    name: 'session',
    keys: ["Cats Rule The World"],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

//debugging code
app.use(function (req, res, next) {
    console.log(req.method + ": " + req.path);
    console.log(req.cookies);
    console.log('- - - - - - - - - - - - - -');
    console.log(users);
    console.log('- - - - - - - - - - - - - -');
    console.log(urlDatabase);
    console.log('###########################');
    next();
});

//routes

//redirect localhost to create new URL
app.get("/", (req, res) => {
    let user_id = req.session.user_id;

    //if not logged in, redirect to login page
    //otherwise show user's urls
    if (user_id === undefined) {
        res.redirect("/login");
    } else {
        res.redirect("/urls");
    }
});

//lists all URLs in a prettier format
//passes in username session
app.get("/urls", (req, res) => {
    let user_id = req.session.user_id;

    //if user is not logged in, send error message saying they should login first
    if (user_id === undefined) {
        res.status(400).send("Login to display your URLs");
        return;
    }

    let urlList = urlsForUser(user_id);

    let templateVars = {
        urls: urlList,
        users: users,
        cookie: req.session
    }

    res.render("urls_index", templateVars);
});

//shows create new url page
//passes in username session
app.get("/urls/new", (req, res) => {
    let user_id = req.session.user_id;

    //only allows a logged in user to register new urls, otherwise redirects to login page
    if (isLoggedIn(user_id)) {
        let templateVars = {
            users: users,
            cookie: req.session
        };

        res.render("urls_new", templateVars);
    } else {
        res.redirect("/login");
    }
});

//shows more detailed info on a particular shortened URL
//passes in username session
app.get("/urls/:id", (req, res) => {
    let user_id = req.session.user_id;

    //only allows a logged in user to see urls
    if (isLoggedIn(user_id)) {
        //finds shortURL from database, renders page
        if (urlDatabase[req.params.id] != undefined) {
            //if userID does not match the owner of the URL, display error
            if (urlDatabase[req.params.id].userID != user_id) {
                res.status(403).send("User authorized to view this URL!");
                return;
            }
            let templateVars = {
                shortURL: req.params.id,
                urls: urlDatabase,
                users: users,
                cookie: req.session
            };
            res.render("urls_show", templateVars);
        }
        //send 404 not found if id does not exist
        else {
            res.status(404).send('Error: URL not found!');
        }
    } else {
        res.status(401).send("User not logged in!");
    }
});

//receives request to use shortURL, redirects accordingly
app.get("/u/:shortURL", (req, res) => {
    let shortURL = req.params.shortURL;

    if (urlDatabase[shortURL] === undefined) {
        res.status(404).send('Error: URL not found');
        return;
    }

    let longURL = urlDatabase[shortURL].longURL;

    //increment numVisited counter
    urlDatabase[shortURL].numVisited += 1;
    res.redirect(longURL);
});

//receives get request to register
app.get("/register", (req, res) => {
    let templateVars = {
        users: users,
        cookie: req.session
    };
    res.render("register", templateVars);
});

//receives get request to login
app.get("/login", (req, res) => {
    let templateVars = {
        users: users,
        cookie: req.session
    };
    res.render("login", templateVars);
});

//receives post request to register with credentials
app.post("/register", (req, res) => {
    let templateVars = {
        users: users,
        cookie: req.session
    };

    let inputEmail = req.body.email;
    let inputPassword = req.body.password;

    //error checking for registration
    if (inputEmail === "" || inputPassword === "") {
        res.status(400).send("Email or Password cannot be empty strings!");
        return;
    }
    //checks if email exists already
    for (let key in users) {
        if (inputEmail == users[key].email) {
            res.status(400).send("Email already exists!");
            return;
        }
    }

    let newUser = {};
    newUser.id = generateRandomString();
    newUser.email = inputEmail;
    newUser.password = bcrypt.hashSync(inputPassword, 10);

    users[newUser.id] = newUser;

    req.session.user_id = newUser.id;
    res.redirect("/urls");
});

//receives logout, deletes username from session
app.post("/logout", (req, res) => {
    req.session = null;

    res.redirect('/login');
});

//recieves login post, tries to login user
app.post("/login", (req, res) => {
    let userExists = false;
    let passwordMatch = false;
    let inputEmail = req.body.email;
    let inputPassword = req.body.password;
    let userId = null;

    //checks if email exists 
    for (let key in users) {
        if (users[key].email == inputEmail) {
            userExists = true;
            userId = users[key].id;
        }
    }
    if (userExists == false) {
        res.status(403).send("Email does not exist");
        return;
    }

    for (let key in users) {
        // if (users[key].password == inputPassword){
        if (bcrypt.compareSync(inputPassword, users[key].password)) {
            passwordMatch = true;
        }
    }
    if (passwordMatch == false) {
        res.status(403).send("Password does not match");
        return;
    }

    req.session.user_id = userId;
    res.redirect("/urls");
});

//receives new longURL, generates a shortURL and redirects to show shortURL
app.post("/urls", (req, res) => {
    let user_id = req.session.user_id;

    //only allows a logged in user to post a new longURL
    if (isLoggedIn(user_id)) {
        let longURL = req.body.longURL;
        let shortenedURL = generateRandomString();
        urlDatabase[shortenedURL] = {};
        urlDatabase[shortenedURL].shortURL = shortenedURL;
        urlDatabase[shortenedURL].longURL = longURL;
        urlDatabase[shortenedURL].userID = req.session.user_id;
        urlDatabase[shortenedURL].numVisited = 0;
    
        res.redirect(`/urls/${shortenedURL}`);
    } else {
        res.status(401).send("User not logged in!");
    }
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
    urlDatabase[shortURL].longURL = req.body.longURL;

    res.redirect(`/urls/${shortURL}`);
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

//function to check if the user_id is in the users database
function isLoggedIn(user_id) {
    //if user_id is undefined (not logged in), immediately return false
    if (user_id === undefined){
        return false;
    }
    //loop through users and see if user_id is in database
    for (let key in users) {
        if (users[key].id == user_id) {
            return true;
        }
    }
    return false;
}

//function to return the URLs of a userID
function urlsForUser(id) {
    let urlsList = {};

    for (let key in urlDatabase) {
        if (urlDatabase[key].userID == id) {
            urlsList[key] = urlDatabase[key];
        }
    }

    return urlsList;
}