namespace Lingoal.ui {

  interface Dictionary {
    [index: string]: ConversationUI;
  }

  export class ConversationUIFactory {
    private _conversations: Conversations;
    private _contacts: Contacts;
    private _container: JQuery;
    private _conversationsUI: Dictionary;
    constructor(conversations: Conversations, contacts: Contacts, container: JQuery) {
      var self = this;
      self._conversations = conversations;
      self._container = container;
      self._contacts = contacts;
      self._conversationsUI = {};
      $(self._conversations).on('select', function (e, conversation) {
        self.get(conversation.id, function () {
        });
      });
    }

    show(key: string): void {
      var self = this;
      for (var conv in self._conversationsUI) {
        self._conversationsUI[conv][conv == key ? 'show' : 'hide']();
      }
    }

    get(conversationId: string, cb: any) {
      var self = this;
      var cv = self._conversations.findById(conversationId);
      if (!self._conversationsUI[conversationId]) {
        var conversationUI = new ConversationUI(cv, self._conversations, self._contacts, self._container);
        self._conversationsUI[conversationId] = conversationUI;
      }
      self._conversations.selected = cv;
      self.show(conversationId);
      cb();
    }
  }

  var prefix = 'chat',
    conversationFrameClass = 'conversation-frame',
    messagesClass = 'list-messages',
    messageClass = 'message',
    controlsClass = 'controls',
    txtContainerClass = 'txt-container',
    txtClass = 'txt-message',
    btnClass = 'btn-send';

  var messageData = 'message';
  var unreadItemClass = 'unread-message-icon';
  var unreadItemSel = '.' + unreadItemClass;
  var tmplHeader = '<div class="conversation-header"><div class="avatar-container"><img class="avatar" src="{avatar_src}" /></div><div class="user-status-icon"></div><div class="btn-users-add"></div><div class="message-container"><p class="conversation-name">{conversation_name}</p><p class="user-status">{user_status}</p></div></div>';
  var tmplGroupHeader = '<div class="conversation-header"><div class="avatar-container"><img class="avatar" src="{avatar_src}" /></div><div class="btn-users-add"></div><div class="message-container"><p class="conversation-name">{conversation_name}</p><p class="users-count">{users_count} participants</p></div></div>';
  var tmplItemToMe = '<li class="message"><p class="user-from">{user_from}</p><div class="avatar-container"><img class="avatar" src="{avatar_src}" /></div><div class="time">{message_time}</div><div class="message-container"><p class="bubble left">{message_text}</p><span class="unread-message-icon" /></div></li>';
  var tmplItemFromMe = '<li class="message"><div class="time">{message_time}</div><div class="message-container"><p class="bubble right">{message_text}</p></div></li>';

  export class ConversationUI {
    options: any;
    element: JQuery;
    private _initialized: boolean;
    private _timer: any;
    private _timerFetch: any;
    private _conversation: Conversation;
    private _conversations: Conversations;
    private _contacts: Contacts;
    private _root: JQuery;
    private _messages: JQuery;
    private _controls: JQuery;
    private _txtMsg: JQuery;
    private _btnSend: JQuery;
    private _header: JQuery = null;
    private _addUserList: AddUsers = null;
    private _container: JQuery;
    private _fetching: boolean;
    private _loaded: boolean;

    constructor(conversation: Conversation, conversations: Conversations, contacts: Contacts, container: JQuery, options?: any) {
      var self = this;
      self._conversation = conversation;
      self._conversations = conversations;
      self._contacts = contacts;
      self._container = container;
      self.options = $.extend(true, {}, options);
      self.element = $('<div>').appendTo(container);

      self._loaded = false;
      self._fetching = false;
      self._initialized = false;
      self._timer = null;
      self._timerFetch = null;
      self.element.addClass(prefix);
      var root = self._root = $('<div>').addClass(conversationFrameClass);
      self._messages = $('<ul>').addClass(messagesClass);
      var controls = self._controls = $('<div>').addClass(controlsClass);
      var txtMsg = self._txtMsg = $('<div>').addClass(txtClass).attr('contenteditable',"true").attr('spellcheck', "false");
      var txtMsgDiv = $('<div>').addClass(txtContainerClass);
      var btnSend = self._btnSend = $('<div>').addClass(btnClass);
      txtMsgDiv.append(txtMsg);
      controls.append(btnSend).append(txtMsgDiv);
      root.append(self._messages).append(controls);
      self._generateHeader();
      self.element.append(root);

      $(self._conversation.core).on('connected', function () {
        self._txtMsg.removeAttr('disabled');
        self._btnSend.removeAttr('disabled');
        self._header.find('.btn-users-add').removeAttr('disabled');
      }).on('disconnected', function () {
        self._txtMsg.attr('disabled', 'disabled');
        self._btnSend.attr('disabled', 'disabled');
        self._header.find('.btn-users-add').attr('disabled', 'disabled');
      });

      $(self._conversation).on('changed', function (e: JQueryEventObject, conversation: Conversation) {
        self._refreshLogo();
        self._refreshName();
      });

      txtMsg.on('keyup', function (e: JQueryEventObject) {
          if (e.keyCode == 13 && !e.shiftKey) {
            btnSend.click();
          }
      });

      if (window['poly']) {
          if (window.poly.plugin) {
            window.poly.plugin.setConversationId(self._conversation.id);
            if (window.poly.plugin.getLangId() == null) {
              self._conversation.core.getContactInfo(self._conversation.core.user, (err, contact: any) => {
                if (!err && contact.langId) window.poly.plugin.setLangId(contact.langId);
              })
            }
          }

          window['poly'].startParseEditable(txtMsg[0]);
      }

      btnSend.on('click', function (e: JQueryEventObject) {
        self._conversation.send(self._txtMsg.text().replace('\n', '<br/>'), {});
        self._txtMsg.text('').focus();
      });
      self.hide();

      $(self._conversation.messages).on('cleared', function () {
        self._messages.empty();
      }).on('added', function (e: JQueryEventObject, messages: { data: Message[] }) {
        if (!self._loaded) {
          messages = { data: self._conversation.messages.items };
          self._loaded = true;
        }
        $(messages.data).each(function () {
          self._processMessage(this);
        });
      });

      self._conversation.messages.fetch(50, function (err) {
        self._initialized = true;
        self._checkRead();
      });
      self._messages.on('scroll', function () {
        self._checkRead();
        self._fetchPrevMessages();
      });

      var participants = self._conversation ? self._conversation.getActiveParticipants() : null;
      if (participants && participants.length == 1) {
        var contact: Contact = self._contacts.findById(participants[0].id);
        if (contact) {
          $(contact).on('changed', function () {
            self._refreshOnlineStatus();
          });
        } else {
          self._conversation.core.getSpecificContacts(participants[0].id, function (err, contacts) {
            !err && contacts.length && self._refreshOnlineStatus(contacts[0].online);
          });
          $(self._conversation.core).on('contactUpdated', function (e: JQueryEventObject, contact: IServer.Contact) {
            self._refreshOnlineStatus(contact.online);
          });
        }
        self._refreshOnlineStatus();
      }
      self.show();
      $(window).on('focus', function () {
        self._checkRead();
      }).on('blur', function () {
        clearTimeout(self._timer);
      });
    }

    private _fetchPrevMessages() {
      var self = this;
      var messages = self._messages;
      if (self._fetching || !messages.is(':visible')) return;
      clearTimeout(self._timerFetch);
      self._timerFetch = setTimeout(function () {
        var scrollTop = messages.scrollTop();
        var itemHeight = messages.find('.' + messageClass + ':first').height();
        if (scrollTop < 5 * itemHeight) {
          self._fetching = true;
          self._conversation.messages.fetch(50, function (err) {
            self._fetching = false;
          });
        }
      }, 100);
    }

    private _findFirstMessageItem(date: Date): JQuery {
      var self = this;
      var messages = self._messages;
      var minDate: Date = null;
      var item: JQuery = null;
      messages.children().each(function () {
        var msg: Message = $(this).data(messageData);
        if (msg.date > date && (!minDate || msg.date < minDate)) {
          minDate = msg.date;
          item = $(this);
        }
      });
      return item;
    }

    private _refreshOnlineStatus(online?: boolean) {
      var self = this;
      var participants = self._conversation ? self._conversation.getActiveParticipants() : null;
      if (!participants || participants.length != 1) return;
      var refresh = function (online: boolean) {
        var icon = self._header.find('.user-status-icon');
        var status = self._header.find('.user-status');
        if (online) {
          icon.removeClass('offline').addClass('online');
          status.text('Online');
        } else {
          icon.removeClass('online').addClass('offline');
          status.text('Offline');
        }
      };
      if (typeof (online) !== 'undefined') {
        refresh(online);
        return;
      }
      var contact: Contact = self._contacts.findById(participants[0].id);
      refresh(contact ? contact.online : false);
    }

    private _addMessage(tmplItem: any, contact: IServer.User, text: string, dateStr: string, msg: Message): void {
      var self = this;
      var messages = self._messages;
      var scrolled = (messages.prop("scrollHeight") - messages.scrollTop()) == messages.outerHeight();
      var replaces = {
        '{avatar_src}': contact.avatar,
        '{message_text}': text,
        '{message_time}': dateStr,
        '{user_from}': contact.name || msg.from
      };
      for (var key in replaces) {
        tmplItem = tmplItem.replace(key, replaces[key]);
      }
      var item = $(tmplItem).data(messageData, msg);
      var avatar = item.find('.avatar');
      if (contact.avatar) {
        avatar.removeClass('no-avatar').attr('src', contact.avatar).attr('alt', 'avatar');
      } else {
        avatar.addClass('no-avatar').removeAttr('src').removeAttr('alt');
      }
      var next = self._findFirstMessageItem(msg.date);
      var scrollHeightPrev = messages.prop("scrollHeight");
      next ? item.insertBefore(next) : item.appendTo(messages);
      //Text Analysis
      if (msg.type == 0) {
        if (window.poly) {
          if (window.poly.plugin && window.poly.plugin.getLangId() == null) {
            self._conversation.core.getContactInfo(self._conversation.core.user, (err, contact: any) => {
              if (!err && contact.langId) window.poly.plugin.setLangId(contact.langId);
              window.poly.parse(item.children(".message-container").get(0));
            });
          } else {
            window.poly.parse(item.children(".message-container").get(0));
          }
        }
      }
      msg.read && item.find(unreadItemSel).hide();
      if (scrolled) {
        messages.scrollTop(messages.prop("scrollHeight"));
      } else if (self._fetching) {
        var d = messages.prop("scrollHeight") - scrollHeightPrev;
        messages.scrollTop(messages.scrollTop() + d);
      }
      if (self._initialized) {
        self._checkRead();
      }
    }

    private _processMessage(msg: Message): void {
      var self = this;
      var messages = self._messages;

      var date = msg.date;
      var dateStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      var tmplItem = msg.fromMe ? tmplItemFromMe : tmplItemToMe;
      var text = msg.text;
      if (msg.type == MessageType.Start) {
        msg.markAsRead();
        return;
      } else if (msg.type == MessageType.Join || msg.type == MessageType.Leave) {
        text = "Users " + text + " " + (msg.type == MessageType.Join ? "joined" : "left") + " the conversation";
      }
      var contact = self._contacts.findById(msg.from);
      if (contact) {
        self._addMessage(tmplItem, contact, text, dateStr, msg);
      } else {
        self._conversation.core.getContactInfo(msg.from, function (err, contact: IServer.User) {
          self._addMessage(tmplItem, contact, text, dateStr, msg);
        });
      }
    }

    private _refreshLogo(): void {
      var self = this;
      self._header.toggleClass('group', self._conversation.participants.length > 2);
      var avatar = self._header.find('.avatar');
      var logo = self._conversation.logo;
      if (logo) {
        avatar.removeClass('no-avatar').attr('src', logo).attr('alt', 'avatar');
      } else {
        avatar.addClass('no-avatar').removeAttr('src').removeAttr('alt');
      }
    }

    private _refreshName(): void {
      var self = this;
      self._header.find('.conversation-name').text(self._conversation.name);
    }

    private _generateHeader(): void {
      var self = this;
      var users = self._conversation.getActiveParticipants();
      var tmplHeaderItem = users.length == 1 ? tmplHeader : tmplGroupHeader;
      var replaces = {
        '{avatar_src}': '',
        '{conversation_name}': '',
        '{user_status}': '',
        '{users_count}': users.length
      };
      for (var key in replaces) {
        tmplHeaderItem = tmplHeaderItem.replace(key, replaces[key]);
      }
      if (self._header) {
        self._header.remove();
      }
      self._header = $(tmplHeaderItem);
      self._refreshLogo();
      self._refreshName();
      self._root.prepend(self._header);

      self._header.on('click', '.btn-users-add', function () {
        if (!self._addUserList) {
          self._addUserList = new Lingoal.ui.AddUsers(self._conversation, self._conversations, self._contacts, { container: self._root });
          $(self._addUserList).on('activate', function (e, active) {
            self._header.find('.btn-users-add').toggleClass('active', active);
          });
        }
        self._addUserList.toggle();
      });
    };

    private _checkRead(): void {
      var self = this;
      var messages = self._messages;
      if (!document.hasFocus() || !messages.is(':visible')) return;
      clearTimeout(self._timer);
      self._timer = setTimeout(function () {
        var h = messages.height();
        messages.find('.' + messageClass).each(function () {
          var item = $(this);
          var pos = item.position();
          if (pos.top >= 0 && pos.top + item.height() <= h) {
            var data: Message = item.data(messageData);
            if (!data.read) {
              data.markAsRead(function () {
                item.find(unreadItemSel).fadeOut();
              });
            }
          }
        });
      }, 1000);
    };

    show(): void {
      var self = this;
      self.element.show();
      self._checkRead();
      if (self._messages) {
        self._messages.scrollTop(self._messages.prop("scrollHeight"));
      }
      self._txtMsg.focus();
      $(self).trigger('activate', self._conversation);
    };

    hide(): void {
      var self = this;
      clearTimeout(self._timer);
      self.element.hide();
    };

  } 

}
