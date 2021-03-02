const bodyParser = require('body-parser');
const ejs = require('ejs');
const express = require('express');
const mongoose = require('mongoose');

const port = 3000;

const app = express();


// Utilize packages
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));


// Home route
app.get('/', function(req, res){
    res.render('home.ejs');
});


// Login route
app.get('/login', function(req, res){
    res.render('login.ejs');
});


// Register route
app.get('/register', function(req, res){
    res.render('register.ejs');
});


// Secrets route
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
