
require('dotenv').config();
const bodyParser = require('body-parser');
const ejs = require('ejs');
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');

const port = process.env.PORT || 3000;

const app = express();


// Utilize packages
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));


// Passport Sessions & Cookies /////////////////////////////////////////////////
app.use(session({
    secret: "thisisasecret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



// MongoDB Connection & Schemas ////////////////////////////////////////////////

// Database uri
mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.set('useCreateIndex', true);


// Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        // required: true
    },
    password: {
        type: String,
        // required: true
    }
});


// Passport plugin
userSchema.plugin(passportLocalMongoose);


// Document model
const User = new mongoose.model('User', userSchema);


// Passport config with passport-local-mongoose methods
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// Express Page Routing ////////////////////////////////////////////////////////

// Home route
app.get('/', function(req, res){
    res.render('home.ejs');
});


// Login route
app.route('/login')

    .get(function(req, res){
        res.render('login.ejs');
    })

    .post(function(req, res){

        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, function(err){
            if (err){
                conosle.log(err);
            } else {
                passport.authenticate('local')(req, res, function(){
                    res.redirect('/secrets');
                });
            }
        });
    });


// Logout route
app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});


// Register route
app.route('/register')

    .get(function(req, res){
        res.render('register.ejs');
    })

    .post(function(req, res){

        User.register({username: req.body.username}, req.body.password, function(err, user){
            if (err){
                console.log(err);
                res.redirect('/register');
            } else {
                passport.authenticate('local')(req, res, function(){
                    res.redirect('/secrets');
                });
            }
        });
    });


// Secrets route
app.get('/secrets', function(req, res){
    if (req.isAuthenticated()){
        res.render('secrets.ejs');
    } else {
        res.redirect('/');
    }
});


// Submit route
app.get('/submit', function(req, res){
    res.render('submit.ejs');
});


// Server connection
app.listen(port, function(req, res){
    console.log("Server started on port " + port);
});
