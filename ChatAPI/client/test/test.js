(function ($) {

  $(document).ready(function() {
    var socket = io();
    var cookieName = 'userToken';
    var cookieOpts = { path: '' };
    var linode = window.location.port == 3101;
    var publicApiUrl = 'http://li544-167.members.linode.com/oauth/chat-token';
    var testClient = { id: '5752f6ebf9f1aba26deb56b9', secret: 'yW6mY0AWVUqYz7D7' }; // test client on linode server
    var cvId, captcha;
    
    if (linode) {
      $('#signup').hide();
      $('#login').hide();
      $('#findContactsInfo').hide();
      $('#updateContactInfo').hide();
    } else {
      $('.g-recaptcha').hide();
      $('#signup-linode').hide();
      $('#login-linode').hide();
      $('#findContactsInfo-linode').hide();
      $('#updateContactInfo-linode').hide();
      $('#setWordDifficutly').hide();
      $('#sendRequest').hide();
    }
    
    window.gotCaptchaCode = function (code) {
      captcha = code;
    };
    
    socket.on('connect', function () {
      if (!$('#authenticate').prop('checked')) return log('connect', {});
      authenticate({ userToken: Cookies.get(cookieName, cookieOpts) }, function (err, cnt) {
        log('connect', err ? { error: err } : (cnt || undefined));
        setUser(cnt);
      });
    });
    
    socket.on('error', function (err) {
      log('error', err);
    });
    
    socket.on('disconnect', function () {
      log('disconnect', {});
      setUser(null);
    });
    
    socket.on('reconnect', function (attempt) {
      log('reconnect', attempt);
    });
    
    socket.on('reconnect_attempt', function () {
      log('reconnect_attempt', {});
    });
    
    socket.on('reconnecting', function (attempt) {
      log('reconnecting', attempt);
    });
    
    socket.on('reconnect_error', function (err) {
      log('reconnect_error', err);
    });
    
    socket.on('reconnect_failed', function () {
      log('reconnect_failed', {});
    });
    
    socket.on('eventAdded', function (ev) {
      log('eventAdded', ev);
    });
    
    socket.on('eventUpdated', function (ev) {
      log('eventUpdated', ev);
    });
    
    socket.on('eventRead', function (def) {
      log('eventRead', def);
    });
    
    socket.on('conversationRead', function (defs) {
      log('conversationRead', defs);
    });
    
    socket.on('contactUpdated', function (cnt) {
      log('contactUpdated', cnt);
    });
    
    socket.on('contactListUpdated', function (cl) {
      log('contactListUpdated', cl);
    });
    
    socket.on('blockedListUpdated', function (bl) {
      log('blockedListUpdated', bl);
    });
    
    socket.on('contactInfoUpdated', function (user) {
      log('contactInfoUpdated', user);
    });
    
    socket.on('participantUpdated', function (cv) {
      log('participantUpdated', cv);
    });
    
    $('#authenticate').on('change', function () {
      if (!$('#authenticate').prop('checked')) return;
      authenticate({ userToken: Cookies.get(cookieName, cookieOpts) }, function (err, cnt) {
        log('authenticate', err ? { error: err } : (cnt || undefined));
        setUser(cnt);
      });
    });

    $('#signup').on('click', function () {
      showDialog({
        title: 'signup', fields: {
          userId: '', 
          clientId: 'optional', 
          clientSecret: 'optional'
        }
      }, function (res) {
        if (!res) return;
        var cred = { userId: res.userId };
        var client = Object.create(testClient);
        if (res.clientId) client.id = res.clientId;
        if (res.clientSecret) client.secret = res.clientSecret
        getPublicApiToken(publicApiUrl, client, function (err, token) {
          if (err) return log('Error', err);
          cred.publicApiToken = token;
          socket.emit('signup', cred, function (err, cnt) {
            if (err) return log('Error', err);
            setUser(cnt);
          });
        });
      });
    });
    
    $('#signup-linode').on('click', function () {
      showDialog({
        title: 'signup-linode', fields: {
          email: '', 
          password: '', 
          name: '',
          language: {
            name: '',
            level: '',
            l1: ''
          }
        }
      }, function (cred) {
        if (!cred) return;
        cred.captcha = captcha;
        socket.emit('signup', cred, function (err, cnt) {
          grecaptcha.reset();
          if (err) return log('Error', err);
          setUser(cnt);
        });
      });
    });
    
    $('#login').on('click', function () {
      showDialog({
        title: 'login', fields: {
          userId: '', 
          clientId: 'optional', 
          clientSecret: 'optional'
        }
      }, function (res) {
        if (!res) return;
        var cred = { userId: res.userId };
        var client = Object.create(testClient);
        if (res.clientId) client.id = res.clientId;
        if (res.clientSecret) client.secret = res.clientSecret
        getPublicApiToken(publicApiUrl, client, function (err, token) {
          if (err) return log('Error', err);
          cred.publicApiToken = token;
          socket.emit('login', cred, function (err, cnt) {
            if (err) return log('Error', err);
            setUser(cnt);
            setConversation($('#cvId').val());
          });
        });
      }); 
    });
    
    $('#login-linode').on('click', function () {
      showDialog({
        title: 'login-linode', fields: {
          email: '', 
          password: ''
        }
      }, function (cred) {
        if (!cred) return;
        socket.emit('login', cred, function (err, cnt) {
          grecaptcha.reset();
          if (err) return log('Error', err);
          setUser(cnt);
          setConversation($('#cvId').val());
        });
      });
    });
    
    $('#logout').on('click', function () {
      socket.emit('logout', function(err) {
        if (err) return log('Error', err);
        Cookies.remove(cookieName, cookieOpts);
        setUser(null);
        setConversation('');
      });
    });

    $('#findContactsInfo').on('click', function () {
      socket.emit('findContactsInfo', {}, function (err, user) {
        if (err) return log('Error', err);
        log('findContacstInfo', user);
      });
    });
    
    $('#findContactsInfo-linode').on('click', function () {
      showDialog({
        title: 'findContactsInfo-linode', fields: {
          conditions: {}, 
          skip: 'optional',
          limit: 'optional',
          sort: null
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('findContactsInfo', opts, function (err, users) {
          if (err) return log('Error', err);
          log('findContacstInfo', users);
        });
      });
    });
    
    $('#getContactsInfo').on('click', function () {
      showDialog({
        title: 'getContactsInfo', fields: {
          contactIds: []
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('getContactsInfo', opts.contactIds, function (err, users) {
          if (err) return log('Error', err);
          log('getContactsInfo', users);
        });
      });
    });
    
    $('#updateContactInfo').on('click', function () {
      socket.emit('updateContactInfo', {}, function (err, user) {
        if (err) log('Error', err);
        if (!user) log('updateContactInfo', user);
      });
    });
    
    $('#updateContactInfo-linode').on('click', function () {
      showDialog({
        title: 'updateContactInfo-linode', fields: {
          useChat: true,
          name: 'optional',
          password: 'optional',
          oldPassword: 'optional',
          language: {
            level: 'optional',
            l1: 'optional'
          },
          avatar: 'optional',
          country: 'optional',
          city: 'optional',
          interests: ['optional'],
          bio: 'optional',
          knownLangs: ['optional {&quot;name&quot;: &quot;...&quot;, &quot;level&quot;: &quot;...&quot;}']
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('updateContactInfo', opts, function (err, user) {
          if (err) return log('Error', err);
          if (!user) log('updateContactInfo', user);
        });
      });
    });
    
    $('#startConversation').on('click', function () {
      showDialog({
        title: 'startConversation', fields: {
          userIds: [],
          props: {
            name: 'optional', 
            image: 'optional'
          },
          userData: {}
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('startConversation', opts.props, opts.userIds, opts.userData, function (err, ev) {
          if (err) return log('Error', err);
          setConversation(ev.cvId);
        });
      });
    });

    $('#updateConversation').on('click', function () {
      showDialog({
        title: 'updateConversation', fields: {
          name: 'optional', 
          image: 'optional'
        }
      }, function (props) {
        if (!props) return;
        socket.emit('updateConversation', cvId, props, function (err) {
          if (err) log('Error', err);
        });
      });
    });

    $('#updateConversationUserData').on('click', function () {
      showDialog({
        title: 'updateConversationUserData', fields: {
          userData: {}, 
          createEvent: true
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('updateConversationUserData', cvId, opts.userData, opts.createEvent, function (err, res) {
          if (err) return log('Error', err);
          if (!opts.createEvent) log('updateConversationUserData', res);
        });
      });
    });
    
    $('#getConversations').on('click', function () {
      showDialog({
      title: 'getConversations', fields: {
          opts: {}
        }
      }, function (res) {
        if (!res) return;
        socket.emit('getConversations', res.opts, null, null, function (err, cvs) {
          if (err) return log('Error', err);
          log('getConversations', cvs);
        });
      });
    });

    $('#addParticipants').on('click', function () {
      showDialog({
        title: 'addParticipants', fields: {
          userIds: []
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('addParticipants', cvId, opts.userIds, function (err) {
          if (err) log('Error', err);
        });
      });
    });

    $('#removeParticipants').on('click', function () {
      showDialog({
        title: 'removeParticipants', fields: {
          userIds: []
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('removeParticipants', cvId, opts.userIds, function (err) {
          if (err) log('Error', err);
        });
      });
    });

    $('#updateParticipant').on('click', function () {
      showDialog({
        title: 'updateParticipant', fields: {
          hidden: false 
        }
      }, function (props) {
        if (!props) return;
        socket.emit('updateParticipant', cvId, props, function (err) {
          if (err) log('Error', err);
        });
      });
    });
    
    $('#addMessage').on('click', function () {
      showDialog({
        title: 'addMessage', fields: {
          text: '',
          userData: null
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('addMessage', cvId, opts.text, opts.userData, function (err) {
          if (err) log('Error', err);
        });
      });
    });

    $('#addComment').on('click', function () {
      showDialog({
        title: 'addComment', fields: {
          evId: '',
          text: '',
          userData: null
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('addComment', opts.evId, opts.text, opts.userData, function (err) {
          if (err) log('Error', err);
        });
      });
    });
    
    $('#updateEvent').on('click', function () {
      showDialog({
        title: 'updateEvent', fields: {
          evId: '',
          text: '',
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('updateEvent', opts.evId, opts.text, function (err) {
          if (err) log('Error', err);
        });
      });
    });
    
    $('#updateEventUserData').on('click', function () {
      showDialog({
        title: 'updateEventUserData', fields: {
          evId: '',
          userData: null,
          notifyParticipants: false
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('updateEventUserData', opts.evId, opts.userData, opts.notifyParticipants || false, function (err, ev) {
          if (err) return log('Error', err);
          if (!opts.notifyParticipants) return log('updateEventUserData', ev);
        });
      });
    });
    
    $('#markEventAsRead').on('click', function () {
      showDialog({
        title: 'markEventAsRead', fields: {
          evId: ''
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('markEventAsRead', opts.evId, function (err, def) {
          if (err) log('Error', err);
        });
      });
    });

    $('#markConversationAsRead').on('click', function() {
      socket.emit('markConversationAsRead', cvId, new Date(), function(err, defs) {
        if (err) log('Error', err);
      });
    });

    $('#getEvents').on('click', function() {
      socket.emit('getEvents', cvId, null, null, null, function(err, evs) {
        if (err) return log('Error', err);
        log('getEvents', evs);
      });
    });

    $('#getRelatedEvents').on('click', function () {
      showDialog({
        title: 'getRelatedEvents', fields: {
          evIds: []
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('getRelatedEvents', cvId, opts.evIds, function (err, evs) {
          if (err) return log('Error', err);
          log('getRelatedEvents', evs);
        });
      });
    });
    
    $('#getUnreadEventCount').on('click', function() {
      socket.emit('getUnreadEventCount', cvId, function(err, count) {
        if (err) return log('Error', err);
        log('getUnreadEventCount', count);
      });
    });
		
    $('#addToContactList').on('click', function () {
      showDialog({
        title: 'addToContactList', fields: {
          userIds: []
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('addToContactList', opts.userIds, function (err, cl) {
          if (err) log('Error', err);
        });
      });
    });

    $('#removeFromContactList').on('click', function () {
      showDialog({
        title: 'removeFromContactList', fields: {
          userIds: []
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('removeFromContactList', opts.userIds, function (err, cl) {
          if (err) log('Error', err);
        });
      });
    });
		
	  $('#getContactList').on('click', function () {
		  socket.emit('getContactList', function (err, cl) {
			  if (err) return log('Error', err);
			  log('getContactList', cl);
		  });
	  });

    $('#addToBlockedList').on('click', function () {
      showDialog({
        title: 'addToBlockedList', fields: {
          userIds: []
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('addToBlockedList', opts.userIds, function (err, bl) {
          if (err) log('Error', err);
        });
      });
    });
    
    $('#removeFromBlockedList').on('click', function () {
      showDialog({
        title: 'removeFromBlockedList', fields: {
          userIds: []
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('removeFromBlockedList', opts.userIds, function (err, bl) {
          if (err) log('Error', err);
        });
      });
    });
    
    $('#getBlockedList').on('click', function () {
      socket.emit('getBlockedList', function (err, bl) {
        if (err) return log('Error', err);
        log('getBlockedList', bl);
      });
    });
    
    $('#setRelatedList').on('click', function () {
      showDialog({
        title: 'setRelatedList', fields: {
          userIds: []
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('setRelatedList', opts.userIds, function (err, rl) {
          if (err) return log('Error', err);
          log('setRelatedList', rl);
        });
      });
    });
    
    $('#reportAbuse').on('click', function () {
      showDialog({
        title: 'reportAbuse', fields: {
          violator: '',
          message: ''
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('reportAbuse', opts.violator, opts.message, function (err, ar) {
          if (err) return log('Error', err);
          log('reportAbuse', ar);
        });
      });
    });
    
    $('#getContacts').on('click', function () {
      socket.emit('getContacts', function (err, cnts) {
        if (err) return log('Error', err);
        log('getContacts', cnts);
      });
    });
    
    $('#getSpecificContacts').on('click', function () {
      showDialog({
        title: 'getSpecificContacts', fields: {
          userIds: []
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('getSpecificContacts', opts.userIds, function (err, cnts) {
          if (err) return log('Error', err);
          log('getSpecificContacts', cnts);
        });
      });
    });
    
    $('#setConversation').on('click', function () {
      showDialog({
        title: 'setConversation', fields: {
          cvId: ''
        }
      }, function (opts) {
        if (!opts) return;
        setConversation(opts.cvId);
      });
    });
    
    $('#analyzeText').on('click', function () {
      var fields = { text: '' };
      if (linode) fields.langid = 'optional';
      showDialog({
        title: 'analyzeText', fields: fields
      }, function (opts) {
        if (!opts) return;
        socket.emit('analyzeText', opts, function (err, res) {
          if (err) return log('Error', err);
          log('analyzeText', res);
        });
      });
    });
    
    $('#translateText').on('click', function () {
      var fields = {
        lemma: 'optional if phrase filled',
        phrase: 'optional if lemma filled',
        toLanguage: '',
        word: 'optional',
        partOfSpeach: 'optional'
      };
      if (linode) fields.langid = 'optional';
      showDialog({
        title: 'translateText', fields: fields
      }, function (opts) {
        if (!opts) return;
        socket.emit('translateText', opts, function (err, res) {
          if (err) return log('Error', err);
          log('translateText', res);
        });
      });
    });
    
    $('#setWordDifficutly').on('click', function () {
      showDialog({
        title: 'setWordDifficutly', fields: {
          word: '',
          difficulty: '',
          langid: ''
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('setWordDifficutly', opts, function (err, res) {
          if (err) return log('Error', err);
          log('setWordDifficutly', res);
        });
      });
    });
    
    $('#sendRequest').on('click', function () {
      showDialog({
        title: 'sendRequest', fields: {
          opts: {
            method: '',
            path: ''
          },
          data: null
        }
      }, function (opts) {
        if (!opts) return;
        socket.emit('sendRequest', opts, function (err, res) {
          if (err) return log('Error', err);
          log('sendRequest', res);
        });
      });
    });
    
    var authenticate = function (handshake, cb) {
      if (linode) {
        socket.emit('authenticate', handshake, cb);
      } else {
        getPublicApiToken(publicApiUrl, Object.create(testClient), function (err, token) {
          if (err) return cb(err);
          handshake.publicApiToken = token;
          socket.emit('authenticate', handshake, cb);
        });
      }
    };
    
    var getPublicApiToken = function (url, client, cb) {
      var code = btoa(client.id + ':' + client.secret);
      var req = $.ajax({
        url: url,
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + code,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: 'grant_type=client_credentials'
      });
      req.done(function (res) {
        cb(null, res['access_token']);
      });
      req.fail(function (jqXHR, err) {
        cb(err);
      });
    };
    
    var setUser = function (cnt) {
      if (cnt && cnt.token)
        Cookies.set(cookieName, cnt.token, cookieOpts);
      $('#userId').val(cnt ? cnt.id : '');
    };
    
    var setConversation = function (id) {
      cvId = id;
      $('#cvId').val(cvId);
    };

    var log = function (title, data) {
      var div = $('<div><h4>' + title + '</h4></div>');
      $('#log').prepend(div);
      if (!Array.isArray(data)) {
        div.append('<div/>' + JSON.stringify(data) + '</div>');
      } else {
        if (data.length == 0) div.append('<span>[</span>');
        data.forEach(function (item, i) {          
          div.append('<div/>' + (i == 0 ? '<span>[</span>' : '') + JSON.stringify(item) + '</div>');
        });
        div.append('<span>]</span>');
      }
    };

    var showDialog = function (opts, cb) {
      
      var dialog = $('#dialog').dialog({
        title: opts.title,
        position: {
          at: 'center top',
        },
        autoOpen: false,
        width: 400,
        modal: true,
        buttons: {
          OK: function () {
            ok();
            dialog.dialog('close');
          },
          Cancel: function () {
            dialog.dialog('close');
            cb(null);
          }
        },
        close: function () {
          dialog.dialog('destroy');
          dialog.empty();
        }
      });
      
      var addProperty = function (cb) {
        var pd = $('#addProp').dialog({
          title: 'Add Property',
          position: {
            of: dialog
          },
          autoOpen: false,
          width: 250,
          modal: true,
          buttons: {
            OK: function () {
              cb($('#dgp-propName').val());
              pd.dialog('close');
            },
            Cancel: function () {
              pd.dialog('close');
              cb(null);
            }
          },
          close: function () {
            pd.dialog('destroy');
            pd.empty();
          }
        });
        
        var form = $('<form></form>');
        form.on("submit", function (event) {
          event.preventDefault();
          cb($('#dgp-propName').val());
          pd.dialog('close');
        });
        
        var fields = $('<fieldset></fieldset>');
        fields.append($('<label for="dgp-propName">Property Name</label>'));
        fields.append($('<input id="dgp-propName" type="text" class="text ui-widget-content"/>'));
        form.append(fields);
        form.append($('<input type="submit" tabindex="-1" style="position:absolute; top:-1000px">'));
        pd.append(form);
        pd.dialog('open');
      }
      
      var ok = function () {
        var res = {};
        for (var key in opts.fields) {
          if (Array.isArray(opts.fields[key])) {
            var array = [];
            $('#dg-' + key).children('input').each(function (idx, field) {
              var val = $(this).val();
              if (val) {
                if (val.substr(0, 1) == '{') val = JSON.parse(val);
                array.push(val);
              }
            });
            if (array.length) res[key] = array;
          } else if (typeof (opts.fields[key]) == 'object') {
            $('#dg-' + key).children('input').each(function (idx, field) {
              var subkey = $(this).attr('id').split('-')[2];
              var val = $(this).val();
              if (val) {
                if (!res[key]) res[key] = {};
                if (val.substr(0, 1) == '{') val = JSON.parse(val);
                res[key][subkey] = val;
              }
            });
          } else if (typeof (opts.fields[key]) == 'boolean') {
            res[key] = $('#dg-' + key).prop("checked");
          } else {
            var val = $('#dg-' + key).val();
            if (val) {
              if (val.substr(0, 1) == '{') val = JSON.parse(val);
              res[key] = val;
            }
          }
        }
        cb(res);
      };
      
      var form = $('<form></form>');
      form.on("submit", function (event) {
        event.preventDefault();
        ok();
        dialog.dialog('close');
      });
      
      var fields = $('<fieldset></fieldset>');
      for (var key in opts.fields) {
        if (Array.isArray(opts.fields[key])) {
          var area = $('<div></div>');
          area.append($('<label for="dg-' + key + '-0">' + key + '</label>'));
          var div = $('<div id="dg-' + key + '"></div>');
          var def = opts.fields[key].length ? opts.fields[key][0] : '';
          div.append($('<input id="dg-' + key + '-0" placeholder="' + def + '" type="text" class="text ui-widget-content"/>'));
          area.append(div);
          area.append($('<button id="' + 'add-dg-' + key + '" type="button" class="ui-button ui-widget add">+</button>').on('click', function () {
            var id = $(this).attr('id');
            var key = id.substr(7);
            var def = opts.fields[key].length ? opts.fields[key][0] : '';
            var input = $('<input placeholder="' + def + '" type="text" class="text ui-widget-content"/>');
            $('#' + $(this).attr('id').substr(4)).append(input);
            input.focus();
          }));
          fields.append(area);
        } else if (typeof (opts.fields[key]) == 'object') {
          var area = $('<div></div>');
          if (opts.fields[key] == null) {
            area.append($('<label id="lbl-dg-' + key + '">' + key + ' (optional)</label>'));
          } else if (Object.keys(opts.fields[key]).length == 0) {
            area.append($('<label id="lbl-dg-' + key + '">' + key + '</label>'));
          }
          var div = $('<div id="dg-' + key + '"></div>');
          for (var subkey in opts.fields[key]) {
            div.append($('<label for="dg-' + key + '-' + subkey + '">' + key + '.' + subkey + '</label>'));
            div.append($('<input id="dg-' + key + '-' + subkey + '" placeholder="' + opts.fields[key][subkey] + '" type="text" class="text ui-widget-content"/>'));
          }
          area.append(div);
          if (opts.fields[key] == null || Object.keys(opts.fields[key]).length == 0) {
            area.append($('<button id="' + 'add-dg-' + key + '" type="button" class="ui-button ui-widget add">+</button>').on('click', function () {
              var id = $(this).attr('id');
              var key = id.substr(7);
              var div = $('#' + id.substr(4));
              addProperty(function (subkey) {
                if (!subkey) return;
                $('#lbl-dg-' + key).remove();
                div.append($('<label for="dg-' + key + '-' + subkey + '">' + key + '.' + subkey + '</label>'));
                var input = $('<input id="dg-' + key + '-' + subkey + '" type="text" class="text ui-widget-content"/>');
                div.append(input);
                input.focus();
              });
            }));
          }
          fields.append(area);
        } else if (typeof (opts.fields[key]) == 'boolean') {
          var area = $('<div></div>');
          area.append($('<input id="dg-' + key + '" type="checkbox" checked="' + (opts.fields[key] ? "checked" : "") + '"/>'));
          area.append($('<label for="dg-' + key + '">' + key + '</label>'));
          fields.append(area);
        } else {
          fields.append($('<label for="dg-' + key + '">' + key + '</label>'));
          fields.append($('<input id="dg-' + key + '" placeholder="' + opts.fields[key] + '" type="text" class="text ui-widget-content"/>'));
        }
      }

      form.append(fields);
      form.append($('<input type="submit" tabindex="-1" style="position:absolute; top:-1000px">'));
      dialog.append(form);
      dialog.dialog('open');
    };

  });
})(jQuery);
