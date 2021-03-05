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
const FacebookStrategy = require('passport-facebook').Strategy;

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
    useUnifiedTopology: true,
    useCreateIndex: true
});


// Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secrets: [String]
});


// Passport plugin
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


// Document model
const User = new mongoose.model('User', userSchema);


// PASSPORT CONFIG (with passport-local-mongoose methods) //////////////////////
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


// Google
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/secrets'
    },

    function(accessToken, refreshToken, profile, cb){
        User.findOrCreate({
            googleId: profile.id
        }, function(err, user) {
            return cb(err, user);
        });
    }
));


// Facebook
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: 'http://localhost:3000/auth/facebook/secrets'
    },

    function(accessToken, refreshToken, profile, cb){
        User.findOrCreate({
            facebookId: profile.id
        }, function(err, user){
            return cb(err, user);
        });
    }
));


// PAGE ROUTING ////////////////////////////////////////////////////////////////

// Home route
app.get('/', function(req, res) {
    res.render('home.ejs');
});


// Google OAuth Routes
// On attempt
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
);

// On success or failure
app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res){
    // Successful authentication, redirect to secrets.
        res.redirect('/secrets');
    }
);


// Facebook OAuth Routes
// On attempt
app.get('/auth/facebook',
    passport.authenticate('facebook')
);

// On success or failure
app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res){
        res.redirect('/secrets');
    }
);


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

    // Compose list of all secrets from all users
    User.find({'secrets': {$exists: true, $not: {$size: 0} } }, function(err, foundUsers){
        if (err){
            console.log(err);
        } else {

            const allSecrets = [];

            foundUsers.forEach(function(user){
                user.secrets.forEach(function(secret){
                    allSecrets.push(secret);
                });
            });

            // Shuffle array // TODO: modularize
            for (let i = allSecrets.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allSecrets[i], allSecrets[j]] = [allSecrets[j], allSecrets[i]];
            }
            
            res.render('secrets.ejs', {allSecrets: allSecrets});
        }
    });
});


// Submit route
app.route('/submit')

    .get(function(req, res) {
        if (req.isAuthenticated()) {
            res.render('submit.ejs');
        } else {
            res.redirect('/');
        }
    })

    .post(function(req, res){
        const submittedSecret = req.body.secret;

        User.findById(req.user.id, function(err, foundUser){
            if (err){
                console.log(err);
            } else {
                if (foundUser){
                    foundUser.secrets.push(submittedSecret);
                    foundUser.save(function(){
                        res.redirect('/secrets');
                    });
                }
            }
        });
    });


// Server connection
app.listen(port, function(req, res) {
    console.log("Server started on port " + port);
});
