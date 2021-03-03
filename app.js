
require('dotenv').config();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const ejs = require('ejs');
const express = require('express');
const mongoose = require('mongoose');

const port = 3000;
const saltRounds = 10;

const app = express();


// Utilize packages
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));


// MongoDB Connection & Schemas ////////////////////////////////////////////////

// Connection uri
mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


// Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});


// Document model
const User = new mongoose.model('User', userSchema);


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

        const username = req.body.username;
        const password = req.body.password;

        User.findOne({email: username}, function(err, foundUser){
            if (err) {
                console.log(err);

            } else if (foundUser) {
                bcrypt.compare(password, foundUser.password, function(err, result){
                    if (result === true){
                        res.render('secrets.ejs');
                    }
                });
            }
        });
    });


// Register route
app.route('/register')

    .get(function(req, res){
        res.render('register.ejs');
    })

    .post(function(req, res){

        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

            const newUser = new User({
                email: req.body.username,
                password: hash
            });

            newUser.save(function(err){
                if (err) {
                    console.log(err);
                } else {
                    res.render('secrets.ejs');
                }
            });
        });
    });


// TEMP Secrets route
app.get('/secrets', function(req, res){
    res.render('secrets.ejs');
});


// Submit route
app.get('/submit', function(req, res){
    res.render('submit.ejs');
});


// Server connection
app.listen(port, function(req, res){
    console.log("Server started on port " + port);
});
