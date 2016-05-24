var express = require('express');
var app = express();
var bodyParser = require('body-parser');
// var mongodb = require('mongodb');
// var path = require('path');
// var httpRequest = require('request');
var jade_bootstrap = require('jade');

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Required if we need to use HTTP query or post parameters

// views is directory for all template files
app.set('views', __dirname + '/views/');
app.set('view engine', 'jade');
app.use('/', express.static(__dirname + '/public'));

// enables cross origin resource sharing
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

app.get('/', function (request, response) {
        response.render('index');
})