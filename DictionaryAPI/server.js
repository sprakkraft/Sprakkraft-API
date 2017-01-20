// This is an example server based on node.js express, serving
// the sample website content and sending requests to Dictionary API.
// As with most APIs, Dictionary API is better to use on the server and not on the client,
// because you don't want to expose your credentials a sAPI user in client code that is usually open to everyone.

// Although this example is in node.js JavaScript, you can can implement the server using any tool and language.

var express = require('express');
var path = require('path');
var axios = require('axios');

var app = express();

// serving static content
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname+'/index.html'));
});
app.use('/samples', express.static('./samples'));
app.use('/built', express.static('./built'));
app.use('/styles', express.static('./styles'));
app.use('/test', express.static('./test'));
app.use('/bower_components', express.static('./bower_components'));

// Setting up Språkkraft Dictionary API
var dictionaryApiUrl = 'http://lrcmain.brainglass.com/'; 
// These credentials are for testing purposes only.
// Request real credentials if you want to use Dictionary API. 
var credentials = {
    clientId: '5752f6ebf9f1aba26deb56b9',
    secret: 'yW6mY0AWVUqYz7D7'
};

var token = null;

// Initial axios instance is created without Authorization header. It is replaced with a new instance
// with Authorization header upon receiving the token.
var ax = createAx();

function createAx(token) {
    var headers = {
        'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'
    }
    if (token) {
        headers.Authorization = token;
    }
    return axios.create({
        baseURL: dictionaryApiUrl,
        withCredentials: true,
        headers
    });
}

function apiSetup(callback) {
    ax.post('oauth/token/', 'grant_type=client_credentials', {
        auth: {
            username: credentials.clientId,
            password: credentials.secret
        }
    }).then(res => {
        ax = createAx(res.data.token_type + ' ' + res.data.access_token);
        callback();
    })
}

// calling Sprakkraft Dictionary API 
app.get('/api/analyze/', (req, res) => {
    if (!token) {
        apiSetup(function () {
            analyze(req, res);
        });
    } else {
        analyze(req, res);
    }
});

app.get('/api/translate/', (req, res) => {
    if (!token) {
        apiSetup(function () {
            translate(req, res);
        });
    } else {
        translate(req, res);
    }
});

function analyze(req, res) {
    ax.get('analyze/text-data', {params: {text: req.query.text}}).then((response) => {
        res.send(response.data);
    }).catch(err => {
        console.log('Error in analyze: ' + err);
    });	
}

function translate(req, res) {
    ax.get('dictionary/translation', {
        params: {
            toLanguage: req.query.toLanguage || 'en',
            lemma: req.query.lemma || '',
            word: req.query.word || '',
            partOfSpeech: req.query.partOfSpeech || '',
            phrase: req.query.phrase,
            getDefinitions: req.query.getDefinitions || 'false'
        }        
    }).then((response) => {
        res.send(response.data);
    }).catch(err => {
        console.log('Error in translate: ' + err);
    });	
}

// starting server
app.listen(3200);
console.log('Listening on port 3200');

// to see the sample web page, open a browser at http://localhost:3200
