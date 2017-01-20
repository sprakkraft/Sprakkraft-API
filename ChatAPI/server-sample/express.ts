/// <reference path="typings/index.d.ts" />

import Path = require('path');
import Express = require('express');
import Http = require('http');
import Config = require('./config');
import Authorization = require('./authorization');

export class ExpressApplication {

  server: Object;
  http: Http.Server;
  config: Config.Config;
  express: Express.Express;
  authorization: Authorization.Authorization;

  constructor(config?: Config.Config) {

    this.express = Express();
    this.http = Http.createServer(this.express);
    this.config = config || new Config.Config();
    this.authorization = new Authorization.Authorization();

    // serve JS files with client code of this sample
    this.express.use(Express.static(Path.join(__dirname, 'public')));
    // serve JS files of the client-side JS chat library
    this.express.use('/client', Express.static(Path.join(__dirname, '../client')));

    var router = Express.Router();
    // Get token authorizing work with Chat API, see code in authorization.ts.
    // It must be on the server side and not on the client for security reasons,
    // because it contains credentials authorizing access to Chat API.
    router.get('/token', (req, res, next) => {
      this.authorization.getToken((err, token) => {
        if (err) return res.status(500).send(err);
        res.send(token);
      });
    });
    this.express.use(router);
  }

  start() {
    this.http.listen(this.config.serverPort, () => {
      console.log(new Date().toISOString() + ': listening on port:' + this.config.serverPort);
    });
  }

}
