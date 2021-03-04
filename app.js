require('dotenv').config();
const bodyParser = require('body-parser');
const ejs = require('ejs');
const express = require('express');
const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const port = process.env.PORT || 3000;

const app = express();


// Utilize packages
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
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
    email: String,
    password: String,
    googleId: String
});


// Passport plugin
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


// Document model
const User = new mongoose.model('User', userSchema);


// Passport config with passport-local-mongoose methods
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:3000/auth/google/secrets',
        // userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);

        User.findOrCreate({
            googleId: profile.id
        }, function(err, user) {
            return cb(err, user);
        });
    }
));



// Express Page Routing ////////////////////////////////////////////////////////

// Home route
app.get('/', function(req, res) {
    res.render('home.ejs');
});


// Google OAuth
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });


// Login route
app.route('/login')

    .get(function(req, res) {
        res.render('login.ejs');
    })

    .post(function(req, res) {
        User.findOne({
            username: req.body.username
        }, function(err, foundUser) {
            if (foundUser) {
                const user = new User({
                    username: req.body.username,
                    password: req.body.password
                });

                passport.authenticate('local', function(err, user) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (user) {
                            req.login(user, function(err) {
                                res.redirect('/secrets');
                            });
                        } else {
                            res.redirect('/login');
                        }
                    }
                })(req, res);
            } else {
                res.redirect('/login');
            }
        });
    });


// Logout route
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


// Register route
app.route('/register')

    .get(function(req, res) {
        res.render('register.ejs');
    })

    .post(function(req, res) {

        User.register({
            username: req.body.username
        }, req.body.password, function(err, user) {
            if (err) {
                console.log(err);
                res.redirect('/register');
            } else {
                passport.authenticate('local')(req, res, function() {
                    res.redirect('/secrets');
                });
            }
        });
    });


// Secrets route
app.get('/secrets', function(req, res) {
    if (req.isAuthenticated()) {
        res.render('secrets.ejs');
    } else {
        res.redirect('/');
    }
});


// Submit route
app.get('/submit', function(req, res) {
    res.render('submit.ejs');
});


// Server connection
app.listen(port, function(req, res) {
    console.log("Server started on port " + port);
});
