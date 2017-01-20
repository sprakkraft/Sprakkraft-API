namespace Lingoal {

  import Callback = IServer.Callback;

  export interface DataCallback<T> {
    (result: T): void;
  }

  export interface ErrorCallback {
    (error: any): void;
  }

  export interface IUserProvider {
    getContactInfo(id: string, cb: Callback<IServer.User>): void;
  }

  export interface EventCallback {
    (error:any, event:IServer.Event): void;
  }

  export class SocketTransport {
    initialized: boolean;
    options: any;
    _socket: SocketIOClient.Socket;
    _connected: boolean;

    constructor(options?) {
      var self = this;
      self.options = $.extend(true, {}, options);
      self.initialized = false;
      self._connected = false;
    }

    init(): void {
      var self = this;
      if (self.initialized) return;

      self._socket = io(self.options.url);
      self._socket.on('error', function (err) {
        $(self).trigger('error', err);
      });
      self._socket.on('connect_error', function (error) {
        if (self._connected) {
          self._connected = false;
          $(self).trigger('disconnected', error);
        }
      });
      self._socket.on('connect', function (attempts) {
        if (!self._connected) {
          self._connected = true;
          $(self).trigger('connected');
        }
      });
      self._socket.on('reconnect', function (attempts) {
        if (!self._connected) {
          self._connected = true;
          $(self).trigger('connected');
        }
      });
      self.initialized = true;
    }

    on(eventName: string, cb?: DataCallback<any>): void {
      var self = this;
      if (!self.initialized) {
        self.init();
      }
      self._socket.on(eventName, function (data) {
        cb && cb(data);
      });
    }

    send(...args: any[]): void {
      var self = this;
      if (!self.initialized) {
        self.init();
      }
      self._socket.emit.apply(self._socket, arguments);
    }
  }

  export class ChatCore {
    private _userProvider: IUserProvider;
    private _user: string;
    private _token: string;
    private _authenticated: boolean;
    private _raiseSingIn: boolean;
    private _raiseLogin: boolean;
    private _transport: SocketTransport;
    private _enableLog: boolean;
    private _serverUrl: string;

    constructor(serverUrl: string, userProvider: IUserProvider) {
      var self = this;
      self._enableLog = true;
      self._serverUrl = serverUrl;
      self._transport = null;
      self._authenticated = false;
      self._raiseSingIn = true;
      self._raiseLogin = false;
      self._userProvider = userProvider;
      self._init();
    }

    _init(): void {
      var self = this;
      if (!self._transport) {
        self._transport = new SocketTransport({ url: self._serverUrl });
        self._transport.init();
      }
      var transport = self._transport;

      $(transport).on('error', function (event, err) {
        self._callback(err, null, null);
      }).on('connected', function () {
        self._callback(null, 'Connected', null);
        if (self._raiseLogin) {
          $(self).trigger('reconnecting');
        } else {
          $(self).trigger('connected');
        }
      }).on('disconnected', function (event, error) {
        self._callback(error, 'Disconnected', null);
        $(self).trigger('disconnected', error);
      });

      transport.on('contactUpdated', function (cnt: IServer.Contact) {
        if (self._raiseSingIn === cnt.online && self._user && cnt.id.toLowerCase() == self._user.toLowerCase()) {
          self._raiseSingIn = !cnt.online;
          $(self).trigger(cnt.online ? 'signin' : 'signout', cnt.id);
        }
        $(self).trigger('contactUpdated', cnt);
      });

      transport.on('contactInfoUpdated', function (user: IServer.User) {
        $(self).trigger('contactInfoUpdated', user);
      });

      transport.on('eventAdded', function (event: IServer.Event) {
        self._fixEvent(event);
        event.read = event.from == self._user;
        $(self).trigger('eventAdded', event);
      });

      transport.on('eventUpdated', function (event: IServer.Event) {
        self._fixEvent(event);
        $(self).trigger('eventUpdated', event);
      });

      transport.on('eventRead', function (def: IServer.Deferred) {
        self._fixDeferred(def);
        $(self).trigger('eventRead', def);
      });

      transport.on('conversationRead', function (defs: IServer.Deferred[]) {
        self._fixDeferreds(defs);
        $(self).trigger('conversationRead', { data: defs });
      });

      transport.on('contactListUpdated', function (contacts: IServer.ContactList) {
        $(self).trigger('contactListUpdated', contacts);
      });

      transport.on('blockedListUpdated', function (contacts: IServer.ContactList) {
        $(self).trigger('blockedListUpdated', contacts);
      });

      transport.on('participantUpdated', function (conversation: IServer.Conversation) {
        self._fixConversation(conversation);
        $(self).trigger('participantUpdated', conversation);
      });
    }

    _fixDate(date: string | Date): Date {
      var d: any = date;
      return typeof (date) == 'string' ? new Date(d) : d;
    }
    _fixConversation(conversation: IServer.Conversation): void {
      if (!conversation) return;
      conversation.start = this._fixDate(conversation.start);
      conversation.last = this._fixDate(conversation.last);
    }
    _fixConversations(conversations: IServer.Conversation[]): void {
      if (!conversations) return;
      for (var i = 0; i < conversations.length; i++) {
        this._fixConversation(conversations[i]);
      }
    }
    _fixEvent(event: IServer.Event): void {
      if (!event) return;
      event.date = this._fixDate(event.date);
      this._fixConversation(event.cv);
    }
    _fixEvents(events: IServer.Event[]): void {
      if (!events) return;
      for (var i = 0; i < events.length; i++) {
        this._fixEvent(events[i]);
      }
    }
    _fixDeferred(def: IServer.Deferred): void {
      if (!def) return;
      def.date = this._fixDate(def.date);
    }
    _fixDeferreds(defs: IServer.Deferred[]): void {
      if (!defs) return;
      for (var i = 0; i < defs.length; i++) {
        this._fixDeferred(defs[i]);
      }
    }

    private _log(error: any, data: any): void {
      if (error) {
        console.log('Error: ' + JSON.stringify(error));
      }
      if (data) {
        console.log(JSON.stringify(data));
      }
    }

    private _callback<T>(error: any, data: T, cb: Callback<T>): void {
      this._enableLog && this._log(error, data);
      error && $(self).trigger('error', error);
      cb && cb(error, data);
    }

    get authenticated(): boolean {
      return this._authenticated;
    }

    get user(): string {
      return this._user;
    }

    get transport(): SocketTransport {
      return this._transport;
    }

    findContactsInfo(query:Object, cb: Callback<IServer.User[]>): void {
      var self = this;
      self._transport.send('findContactsInfo', query, function (err, user: IServer.User[]) {
        self._callback(err, user, cb);
      });
    }

    signup(user: any, cb?: Callback<IServer.Contact>): void {
      var self = this;
      self._transport.send('signup', user, function (err, contact: IServer.Contact) {
        self._raiseLogin = !err;
        self._authenticated = !err;
        if (!err) {
          self._user = contact.id;
          self._token = contact.token;
        }
        self._callback(err, contact, cb);
      });
    }

    private _updateToken(contact: IServer.Contact): void {
      var self = this;
      if (contact && contact.token) {
        self._token = contact.token;
        $(self).trigger('tokenUpdated');
      }       
    }

    authenticate(publicApiToken: string, cb?: Callback<IServer.Contact>): void {
      var self = this;
      var handshake = {
        userToken: self._token,
        publicApiToken: publicApiToken
      };
      self._transport.send('authenticate', handshake, function (err, contact: IServer.Contact) {
        if (!err) {
          self._updateToken(contact);
          if (self._raiseSingIn) {
            self._raiseSingIn = false;
            $(self).trigger('connected');
          }
        }
        self._callback(err, contact, cb);
      });
    }

    login(userId: any, cb?: Callback<IServer.Contact>): void {
      var self = this;
      if (typeof (userId) == 'string') {
        self._user = userId;
      }
      self._transport.send('login', userId, function (err, contact: IServer.Contact) {
        self._raiseLogin = !err;
        self._authenticated = !err;
        if (!err && !self._user) {
          self._user = contact.id;
          self._updateToken(contact);
        }
        self._callback(err, contact, cb);
      });
    }

    logout(cb?: Callback<IServer.Contact>): void {
      var self = this;
      self._user = null;
      self._token = null;
      self._authenticated = false;
      self._transport.send('logout', function (err, contact: IServer.Contact) {
        self._raiseLogin = false;
        self._callback(err, contact, cb);
      });
    }

    startConversation(props: IServer.ConversationProperties, userIds: string[], userData: any, cb?: Callback<IServer.Event>): void {
      var self = this;
      if (userIds) {
        userIds = userIds.sort();
      }
      self._transport.send('startConversation', props, userIds, userData, function (err, event: IServer.Event) {
        self._fixEvent(event);
        self._callback(err, event, cb);
      });
    }

    updateConversation(conversationId: string, properties: IServer.ConversationProperties, cb?: Callback<IServer.Conversation>): void {
      var self = this;
      self._transport.send('updateConversation', properties, conversationId, function (err, event: IServer.Event) {
        self._fixEvent(event);
        self._callback(err, event.cv, cb);
      });
    }

    getConversations(params: Object, skip: number, limit: number, cb: Callback<IServer.Conversation[]>): void {
      var self = this;
      self._transport.send('getConversations', params, skip, limit, function (err, conversations: IServer.Conversation[]) {
        self._fixConversations(conversations);
        self._callback(err, conversations, cb);
      });
    }

    addMessage(conversationId: string, userData: any, text: string, cb: Callback<IServer.Event>): void {
      var self = this;
      self._transport.send('addMessage', conversationId, userData, text, function (err, event: IServer.Event) {
        self._fixEvent(event);
        self._callback(err, event, cb);
      });
    }

    addComment(eventId: string, text: string, userData: any, cb: Callback<IServer.Event>): void {
      var self = this;
      self._transport.send('addComment', eventId, text, userData, function (err, event: IServer.Event) {
        self._fixEvent(event);
        self._callback(err, event, cb);
      });
    }

    getEvents(conversationId: string, params: Object, skip: number, limit: number, cb: Callback<IServer.Event[]>): void {
      var self = this;
      self._transport.send('getEvents', conversationId, params, skip, limit, function (err, events: IServer.Event[]) {
        self._fixEvents(events);
        self._callback(err, events, cb);
      });
    }

    getRelatedEvents(conversationId: string, eventIds: string[], cb: Callback<IServer.Event[]>): void {
      var self = this;
      if (!conversationId || !eventIds || !eventIds.length) {
        self._callback(null, [], cb);
        return;
      }
      self._transport.send('getRelatedEvents', conversationId, eventIds, function (err, events: IServer.Event[]) {
        self._fixEvents(events);
        self._callback(err, events, cb);
      });
    }

    updateEvent(eventId: string, newText: string, cb: Callback<IServer.Event>): void {
      var self = this;
      self._transport.send('updateEvent', eventId, newText, function (err, event: IServer.Event) {
        self._fixEvent(event);
        self._callback(err, event, cb);
      });
    }

    markEventAsRead(eventId: string, cb: Callback<IServer.Event>): void {
      var self = this;
      self._transport.send('markEventAsRead', eventId, function (err, event: IServer.Event) {
        self._fixEvent(event);
        self._callback(err, event, cb);
      });
    }

    markConversationAsRead(conversationId: string, until: Date, cb?: Callback<IServer.Deferred[]>): void {
      var self = this;
      self._transport.send('markConversationAsRead', conversationId, until, function (err, events: IServer.Deferred[]) {
        self._fixDeferreds(events);
        self._callback(err, events, cb);
      });
    }

    getUnreadEventCount(conversationId: string, cb: Callback<number>): void {
      var self = this;
      self._transport.send('getUnreadEventCount', conversationId, function (err, count: number) {
        self._callback(err, count, cb);
      });
    }

    addParticipants(conversationId: string, userIds: string[], cb?: Callback<IServer.Event>): void {
      var self = this;
      if (userIds) {
        userIds = userIds.sort();
      }
      self._transport.send('addParticipants', conversationId, userIds, function (err, event: IServer.Event) {
        self._fixEvent(event);
        self._callback(err, event, cb);
      });
    }

    removeParticipants(conversationId: string, userIds: string[], cb?: Callback<IServer.Event>): void {
      var self = this;
      if (userIds) {
        userIds = userIds.sort();
      }
      self._transport.send('removeParticipants', conversationId, userIds, function (err, event: IServer.Event) {
        self._fixEvent(event);
        self._callback(err, event, cb);
      });
    }

    updateParticipant(conversationId: string, props: IServer.ParticipantProperties, cb?: Callback<IServer.Conversation>): void {
      var self = this;
      self._transport.send('updateParticipant', conversationId, props, function (err, conversation: IServer.Conversation) {
        self._fixConversation(conversation);
        self._callback(err, conversation, cb);
      });
    }

    addToContactList(userIds: string[], cb?: Callback<IServer.ContactList>): void {
      var self = this;
      self._transport.send('addToContactList', userIds, function (err, contactList: IServer.ContactList) {
        self._callback(err, contactList, cb);
      });
    }
    removeFromContactList(userIds: string[], cb?: Callback<IServer.ContactList>): void {
      var self = this;
      self._transport.send('removeFromContactList', userIds, function (err, contactList: IServer.ContactList) {
        self._callback(err, contactList, cb);
      });
    }

    getContactList(cb: Callback<IServer.ContactList>): void {
      var self = this;
      self._transport.send('getContactList', function (err, contactList: IServer.ContactList) {
        self._callback(err, contactList, cb);
      });
    }

    addToBlockedList(userIds: string[], cb?: Callback<IServer.ContactList>): void {
      var self = this;
      self._transport.send('addToBlockedList', userIds, function (err, contactList: IServer.ContactList) {
        self._callback(err, contactList, cb);
      });
    }

    removeFromBlockedList(userIds: string[], cb?: Callback<IServer.ContactList>): void {
      var self = this;
      self._transport.send('removeFromBlockedList', userIds, function (err, contactList: IServer.ContactList) {
        self._callback(err, contactList, cb);
      });
    }

    getBlockedList(cb: Callback<IServer.ContactList>): void {
      var self = this;
      self._transport.send('getBlockedList', function (err, contactList: IServer.ContactList) {
        self._callback(err, contactList, cb);
      });
    }

    reportAbuse(violator: string, message: string, cb?: Callback<IServer.AbuseReport>): void {
      var self = this;
      self.transport.send('reportAbuse', violator, message, function (err, report) {
        self._callback(err, report, cb);
      });
    }

    getContacts(cb: Callback<IServer.Contact[]>): void {
      var self = this;
      self._transport.send('getContacts', function (err, contacts: IServer.Contact[]) {
        self._callback(err, contacts, cb);
      });
    }

    getSpecificContacts(userIds: string | string[], cb: Callback<IServer.Contact[]>): void {
      var self = this;
      self._transport.send('getSpecificContacts', userIds, function (err, contacts: IServer.Contact[]) {
        self._callback(err, contacts, cb);
      });
    }

    getContactInfo(id: string, cb: Callback<IServer.User>): void {
      var self = this;
      if (self._userProvider) {
        self._userProvider.getContactInfo(id, cb);
      } else {
        self._transport.send('getContactsInfo', id, function (err, user) {
          self._callback(err, user && user[0] ? user[0] : null, cb);
        });
      }
    }

    updateContactInfo(opts: any, cb: Callback<IServer.User>): void {
      var self = this;
      self._transport.send('updateContactInfo', opts, function (err, user) {
        self._callback(err, user, cb);
      });
    }

    analyzeText(data: any, cb: Callback<any>): void {
      var self = this;
      self._transport.send('analyzeText', data, function (err, result) {
        self._callback(err, result, cb);
      });
    }

    translateText(data: any, cb: Callback<any>): void {
      var self = this;
      self._transport.send('translateText', data, function (err, result) {
        self._callback(err, result, cb);
      });
    }

    setWordDifficutly(data: any, cb: Callback<any>): void {
      var self = this;
      self._transport.send('setWordDifficutly', data, function (err, result) {
        self._callback(err, result, cb);
      });
    }

    sendRequest(data: IServer.RequestInfo, cb: Callback<any>): void {
      var self = this;
      self._transport.send('sendRequest', data, function (err, result) {
        self._callback(err, result, cb);
      });
    }

    updateConversationUserData(conversationId: string, userData: Object, createEvent: boolean, cb: Callback<IServer.Event | IServer.Conversation>): void {
      var self = this;
      self._transport.send('updateConversationUserData', conversationId, userData, createEvent, function (err, result) {
        self._callback(err, result, cb);
      });
    }

    updateEventUserData(eventId: string, userData: Object, notifyParticipants: boolean, cb: Callback<IServer.Event>): void {
      var self = this;
      self._transport.send('updateEventUserData', eventId, userData, notifyParticipants, function (err, result) {
        self._callback(err, result, cb);
      });
    }

    setRelatedList(userIds: string | string[], cb: Callback<IServer.ContactList>): void {
      var self = this;
      self._transport.send('setRelatedList', userIds, function (err, contacts: IServer.ContactList) {
        self._callback(err, contacts, cb);
      });
    }
  }
}

namespace Lingoal.utils {
  export function pushItemInSortedArray<T>(items: T[], pos: number, comparer: (a: T, b: T) => number): boolean {
    if (!items || pos == -1 || pos >= items.length || !comparer) return;
    var swap = function(items: any[], i: number, j: number): void {
      var x = items[i];
      items[i] = items[j];
      items[j] = x;
    };
    var item = items[pos];
    var i = pos - 1;
    for (; i >= 0 && comparer(items[i], items[i + 1]) == 1; i--) {
      swap(items, i, i + 1);
    }
    if (i != pos - 1) return true;
    for (i = pos + 1; i < items.length && comparer(items[i], items[i - 1]) == -1; i++) {
      swap(items, i, i - 1);
    }
    return i != pos + 1;
  }

  export function asycnEach<T>(array: T[], action: (array:T[], i: number, callback: () => void) => void, callback?: () => void): void {
    if (!array || !action) {
      callback && callback();
      return;
    }
    var process = function (i: number) {
      if (i < array.length) {
        action(array, i, function () {
          process(i + 1);
        });
      } else {
        callback && callback();
      }
    };
    process(0);
  }
}
