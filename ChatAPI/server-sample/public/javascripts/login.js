(function ($) {
  window.Lingoal = window.Lingoal || {};
  
  function Login(options, userProvider) {
    var self = this;
    var opts = self.options = $.extend(true, {}, options);
    self._element = $('<div class="login">');
    self._userProvider = userProvider;
    var lbl = $('<span />').text('Select user: ');
    var txt = $('<select />');
    for (var i = 0; i < userProvider._users.length; i++) {
      var opt = $('<option />').text(userProvider._users[i].name).attr('value', userProvider._users[i].id);
      txt.append(opt);
    }
    var btn = $('<button />').text('Login');
    self._element.append(lbl).append(txt).append(btn);
    self.hide();
    opts.container.append(self._element);
    
    $(opts.core).on('signin', function () { 
      self.hide();
    }).on('reconnecting', function () {
      // 'reconnecting' event occurs when connection to the Chat API thtough socket.io is broken for some reasons.
      // If that happens, connection is restored automatically, but we need to repeat authorization,
      // get authorization token and pass it to the client-side JS chat library.
      getToken(function (err, token) {
        if (err) return alert('Error: ' + err);
        opts.core.authenticate(token);
      });        
    });
    
    txt.on('keyup', function (e) {
      if (e.which == 13) {
        btn.click();
      }
    });

    // Get token authorizing work with Chat API, see code in authorization.ts.
    // It is on the server side and not on the client for security reasons,
    // because it contains credentials authorizing access to Chat API.
    var getToken = function (cb) {
      var req = $.ajax({
        url: '/token',
        method: 'GET'
      });
      req.done(function (res) {
        cb(null, res);
      });
      req.fail(function (jqXHR, err) {
        cb(err);
      });
    };

    btn.click(function () {
      var cred = { userId: txt.val() };
      // Get token authorizing access to Chat API
      getToken(function (err, token) {
        if (err) return alert('Error: ' + err);
        // Pass the token to the client-side JS chat library so it can communicate with Chat API
        cred.publicApiToken = token;
        opts.core.login(cred);
      });      
    });
  }
  
  Login.prototype.show = function () {
    var self = this;
    self._element.show().find('input').focus();
  };
  Login.prototype.hide = function () {
    var self = this;
    self._element.hide();
  };
  
  window.Lingoal.Login = Login;
   
})(jQuery);