/// <reference path="typings/index.d.ts" />

import Http = require('http');

class AuthorizationConfig {
  host: string = 'lrcmain.brainglass.com'; // API URL
  port: number = 80;
  path: string = '/oauth/chat-token'; // path for the getToken request
  
  // key and secret are credentials for access to Chat API. 
  // These credentials are for testing purposes only.
  // Request real credentials if you want to use Dictionary API.
  key: string = '5752f6ebf9f1aba26deb56b9';
  secret: string = 'yW6mY0AWVUqYz7D7';
  
  payload: string = 'grant_type=client_credentials';
  oauthCode: string = new Buffer(this.key + ':' + this.secret).toString('base64');
}

// Get token authorizing work with Chat API.
// It is on the server side and not on the client for security reasons,
// because it contains credentials authorizing access to Chat API.
export class Authorization {
  
  private authorizationConfig = new AuthorizationConfig();

  getToken(cb: (err: any, result: string) => void): void {
    var opts = {
      hostname: this.authorizationConfig.host,
      port: this.authorizationConfig.port,
      path: this.authorizationConfig.path,
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + this.authorizationConfig.oauthCode,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(this.authorizationConfig.payload)
      }
    };
    var req = Http.request(opts, (res) => {
      res.setEncoding('utf8');
      var result: string = '';
      res.on('data', (data) => {
        result += data;
      });
      res.on('end', () => {
        if (res.statusCode != 200)
          return cb && cb(result, null);
        try {          
          cb && cb(null, JSON.parse(result)['access_token']);
        } catch (err) {
          cb && cb(err, null);
        }
      });
    });
    req.on('error', (err) => {
      cb && cb(err, null);
    });
    req.end(this.authorizationConfig.payload);
  }
}