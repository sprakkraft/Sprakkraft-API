import Config = require('./config');
import Application = require('./express');

var config = new Config.Config();
var app = new Application.ExpressApplication(config);
app.start();


