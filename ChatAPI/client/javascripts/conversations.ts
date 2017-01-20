namespace Lingoal {

  export interface IListItem {
    id: string;
  }
  export interface IList{
    items: IListItem[];
    selected: IListItem;
  }

  export interface ConversationCallback {
    (error: any, result: Conversation): void;
  }

  export class ConversationProps {
    protected _name: string;
    protected _image: string;
    constructor();
    constructor(props: IServer.ConversationProperties);
    constructor(props?: IServer.ConversationProperties) {
      this._name = props ? props.name : '';
      this._image = props ? props.image : '';
    }
    private _triggerChanged(): void {
      $(this).trigger('changed', this);
    }
    get name(): string {
      return this._name;
    }
    set name(value: string) {
      if (this._name != value) {
        this._name = value;
        this._triggerChanged();
      }
    }
    get image(): string {
      return this._image;
    }
    set image(value: string) {
      if (this._image != value) {
        this._image = value;
        this._triggerChanged();
      }
    }
    update(props: IServer.ConversationProperties, raiseChanged: boolean): boolean {
      if (!props) return;
      if (this._name != props.name || this._image != props.image) {
        this._name = props.name;
        this._image = props.image;
        raiseChanged && this._triggerChanged();
        return true;
      }
      return false;
    }
  }

  export class Participant      {
    protected _id: string;
    protected _active: boolean;
    protected _hidden: boolean;
    protected _contact: Contact;
    constructor(contacts: Contacts, participant: IServer.Participant) {
      var self = this;
      this._id = participant.id;
      this._active = participant.active;
      this._hidden = participant.hidden;
      contacts.getContactInfo(this._id, function (err, contact: Contact) {
        contacts._addToAll(contact);
        self._contact = contact;
      });
    }
    private _triggerChanged(): void {
      $(this).trigger('changed', this);
    }
    get id(): string {
      return this._id;
    }
    get active(): boolean {
      return this._active;
    }
    set active(value: boolean) {
      if (this._active != value) {
        this._active = value;
        this._triggerChanged();
      }
    }
    get hidden(): boolean {
      return this._hidden;
    }
    set hidden(value: boolean) {
      if (this._hidden != value) {
        this._hidden = value;
        this._triggerChanged();
      }
    }
    get contact(): Contact {
      return this._contact;
    }
    update(props: IServer.Participant, raiseChanged: boolean): boolean {
      if (!props || (this._active == props.active && this._hidden == props.hidden)) return false;
      this._active = props.active;
      this._hidden = props.hidden;
      raiseChanged && this._triggerChanged();
      return true;
    }
  }

  export class Conversation implements IListItem {
    protected _id: string;
    protected _start: Date;
    protected _last: Date;
    protected _props: ConversationProps;
    protected _participants: Participant[];
    protected _unread: number;
    protected _core: ChatCore;
    protected _contacts: Contacts;
    protected _messages: Messages;
    protected _userData: any;
    protected _me: Participant;

    constructor(core: ChatCore, contacts: Contacts, cv: IServer.Conversation) {
      var self = this;
      self._core = core;
      self._contacts = contacts;
      self._id = cv.id;
      self._participants = [];
      for (var i = 0; i < cv.participants.length; i++) {
        self._participants[i] = self._createParticipant(cv.participants[i]);
      }
      self._start = cv.start;
      self._last = cv.last;
      self._props = new ConversationProps(cv.props);
      self._unread = cv.unread;
      self._userData = cv.userData;
      self._messages = new Messages(self);
      self._getMeParticipant();
      $(self._props).on('changed', function () {
        self._triggerChanged();
      });
      $(self._core).on('eventAdded', function (error, data: IServer.Event) {
        var convID = data.cvId || data.cv.id;
        if (convID != self.id) return;
        if (data.type == IServer.EventType.Join || data.type == IServer.EventType.Leave || data.type == IServer.EventType.Change) {
          self._triggerChanged();
        }
      });

    }
    protected _createParticipant(participant: IServer.Participant) {
      return new Participant(this._contacts, participant);
    }
    private _triggerChanged(): void {
      $(this).trigger('changed', this);
    }

    get messages(): Messages { return this._messages; }
    get core(): ChatCore { return this._core; }
    get id(): string { return this._id; }
    get start(): Date { return this._start; }
    get last(): Date { return this._last; }
    set last(value: Date) {
      var self = this;
      if (self._last < value) {
        self._last = value;
        $(self).trigger('lastChanged', self);
      }
    }
    get props(): ConversationProps { return this._props; }
    get me(): Participant { return this._me; }
    get participants(): Participant[] { return this._participants; }
    get unread(): number { return this._unread; }
    set unread(value: number) {
      if (this._unread != value) {
        this._unread = value;
        this._triggerChanged();
        $(this).trigger('unreadChanged', this);
      }
    }
    get name(): string {
      var self = this;
      if (self.props && self.props.name) return self.props.name;
      var arr: string[] = [];
      var particapants = self.getActiveParticipants();
      for (var i = 0; i < particapants.length; i++) {
        particapants[i].contact && arr.push(particapants[i].contact.name);
      }
      return arr.join(', ');
    }

    get logo(): string {
      var self = this;
      if (self.props && self.props.image) return self.props.image;
      if (self.participants.length == 2) {
        var participants = self.getActiveParticipants();
        return participants.length == 1 ? participants[0].contact.avatar : null;
      }
      return null;
    }

    get userData(): any { return this._userData; }

    get hidden(): boolean { return this.me ? this.me.hidden : false; }

    getActiveParticipants(): Participant[] {
      var self = this;
      var arr: Participant[] = [];
      for (var i = 0; i < self._participants.length; i++) {
        if (self._participants[i].active && self._participants[i].id != self._core.user) {
          arr.push(self._participants[i]);
        }
      }
      return arr;
    }

    addParticipants(userIds: string[], callback?: ErrorCallback): void {
      var self = this;
      self._core.addParticipants(self.id, userIds, function (err, event: IServer.Event) {
        callback && callback(err);
      });
    }
    removeParticipants(userIds: string[], callback?: ErrorCallback): void {
      var self = this;
      self._core.removeParticipants(self.id, userIds, function (err, event: IServer.Event) {
        callback && callback(err);
      });
    }
    send(message: string, userData: any, callback?: EventCallback): void {
      var self = this;
      self._core.addMessage(self.id, message, userData, function (err, event: IServer.Event) {
        callback && callback(err, event);
      });
    }
    markAsRead(callback?: ErrorCallback): void {
      var self = this;
      self._core.markConversationAsRead(self.id, null, function (err, data: IServer.Deferred[]) {
        if (!err) {
          self.unread = 0;
        }
        $(self).trigger('read', self);
        callback && callback(err);
      });
    }
    updateUserData(userData: Object, createEvent: boolean, callback?: ErrorCallback): void {
      var self = this;
      self._core.updateConversationUserData(self.id, userData, createEvent, function (err, data: IServer.Event | IServer.Conversation) {
        if (!err && !createEvent) {
          self.update(<IServer.Conversation>data, true);
        }
        callback && callback(err);
      });
    }
    setHidden(hidden: boolean, callback?: ErrorCallback): void {
      var self = this;
      self._core.updateParticipant(self.id, { hidden: hidden }, function (err, conversation: IServer.Conversation) {
        callback && callback(err);
      });
    }
    change(props: ConversationProps, callback?: ErrorCallback): void {
      var self = this;
      self._core.updateConversation(self._id, props, function (err, cv: IServer.Conversation) {
        callback && callback(err);
      });
    }
    update(props: IServer.Conversation, raiseChanged: boolean): boolean {
      if (!props) return;
      var changed = false;
      if (props.unread != null && this.unread != props.unread) {
        this._unread = props.unread;
        $(this).trigger('unreadChanged', this);
        changed = true;
      }
      if (JSON.stringify(this._userData) !== JSON.stringify(props.userData)) {
        this._userData = props.userData;
        changed = true;
      }
      var changedProps = this.props.update(props.props, false);
      if (raiseChanged && (changed || changedProps)) {
        this._triggerChanged();
      }
      return changedProps || changed;
    }

    _addParticipants(userIds: string[]) {
      var self = this;
      for (var i = 0; i < userIds.length; i++) {
        self._participants.push(self._createParticipant({
          id: userIds[i],
          active: true
        }));
      }
    }

    _removeParticipants(userIds: string[]) {
      var self = this;
      for (var i = 0; i < self._participants.length; i++) {
        if ($.inArray(self._participants[i].id, userIds) != -1) {
          self._participants.splice(i, 1);
        }
      }
    }

    _getMeParticipant() {
      var self = this;
      if (self._contacts.me && self._participants) {
        for (var i = 0; i < self._participants.length; i++) {
          if (self._participants[i].id == self._contacts.me.id) {
            self._me = self._participants[i];
            break;
          }
        }
      }
    }
  }

  export class Conversations implements IList {
    protected _initialized: boolean;
    protected _sorted: boolean;
    protected _selected: Conversation;
    protected _core: ChatCore;
    protected _contacts: Contacts;
    items: Conversation[];
    constructor(core: ChatCore, contacts: Contacts) {
      var self = this;
      self._core = core;
      self._contacts = contacts;
      self.items = [];
      self._initialized = false;
      self._core.authenticated && self._refresh();
      self._selected = null;
      self._sorted = true;
      $(self._core).on('signin', function (event, user: string) {
        self._refresh();
      }).on('connected', function () {
        self._core.authenticated && self._refresh();
      });
      $(self._core).on('signout', function (event, user: string) {
        self.items = [];
        self._triggerChanged();
      });
      $(self._core).on('eventRead', function (event: JQueryEventObject, data: IServer.Deferred) {
        var conversation = self.findById(data.cvId);
        var msg = conversation ? conversation.messages.findById(data.evId, true) : null;
        if (msg) {
          msg.read = true;
        }
      });
      $(self._core).on('participantUpdated', function (event: JQueryEventObject, data: IServer.Conversation) {
        var conversation = self.findById(data.id);
        if (!conversation) return; 
        for (var i = 0; i < data.participants.length; i++) {
          if (data.participants[i].id == conversation.me.id) {
            conversation.me.update(data.participants[i], true);
            self._triggerChanged();
            break;
          }
        }
      });
      $(self._core).on('conversationRead', function (defs: { data: IServer.Deferred[] }) {
        //todo
        var items = defs.data;
        var conversation = items && items.length ? self.findById(items[0].cvId) : null;
        if (conversation) {
          for (var i = 0; i < defs.data.length; i++) {
            var msg = conversation.messages.findById(defs.data[i].evId, true);
            if (msg) {
              msg.read = true;
            }
          }
        }
        //$(self).trigger('conversationRead', { data: defs });
      });
      $(self._core).on('eventAdded', function (event: JQueryEventObject, data: IServer.Event) {
        if (data && data.cvId) {
          var conversation = self.findById(data.cvId);
          if (conversation) {
            if (data.type == IServer.EventType.Change) {
              if (data.content && data.content.props) {
                conversation.props.update(data.content.props, true);
              } else {
                conversation.update(data.cv, true);
              }
            } else if (data.type == IServer.EventType.Join) {
              conversation._addParticipants(data.content.userIds);
            } else if (data.type == IServer.EventType.Leave) {
              conversation._removeParticipants(data.content.userIds);
            }
          } else {
            if (data.type == IServer.EventType.Join || data.type == IServer.EventType.Start) {
              self._core.getConversations({ id: data.cvId }, null, null, function (err, conversations: IServer.Conversation[]) {
                self._refreshItems(conversations);
              });
              return;
            }
          }
          if (data.from != self._core.user) {
            if (conversation) {
              conversation.unread++;
            } else {
              self._core.getConversations({ id: data.cvId }, null, null, function(err, conversations: IServer.Conversation[]) {
                self._refreshItems(conversations);
              });
              return;
            }
          }
        }
      });
    }

    protected _createConversation(cv: IServer.Conversation): Conversation {
      return new Conversation(this._core, this._contacts, cv);
    }

    private _loadContactsForConversations(conversations: IServer.Conversation[], callback?: () => void) {
      var self = this;
      var keys = {};
      var ids: string[] = [];
      for (var i = 0; i < conversations.length; i++) {
        var participants = conversations[i].participants;
        for (var j = 0; j < participants.length; j++) {
          if (!keys[participants[j].id]) {
            keys[participants[j].id] = true;
            ids.push(participants[j].id);
          }
        }
      }
      keys = null;
      var loadContact = function (ids: string[], i: number, callback: () => void) {
        self._contacts.getContactInfo(ids[i], function (err, contact: Contact) {
          self._contacts._addToAll(contact);
          callback();
        });
      };
      Lingoal.utils.asycnEach<string>(ids, loadContact, function () {
        callback();
      });
    }

    private _refreshItems(conversations: IServer.Conversation[], callback?: () => void): void {
      var self = this;
      self._loadContactsForConversations(conversations, function () {
        self._refreshItemsImpl(conversations);
        callback && callback();
      });
    }

    private _refreshItemsImpl(conversations: IServer.Conversation[]): void {
      var self = this;
      var ids = {};
      var changed: boolean = false;

      conversations = conversations || [];

      // add new conversations and/or update existing ones
      for (var i = 0; i < conversations.length; i++) {
        var cv = conversations[i];
        var conversation: Conversation = self.findById(cv.id);
        var cvProps = cv.props || {};
        if (!conversation) {
          conversation = self._createConversation(cv);
          $(conversation).on('lastChanged', function (e: JQueryEventObject, cv: Conversation) {
            self._updateSort(cv);
          });
          self.items.push(conversation);
          changed = true;
        } else {
          conversation.update(cv, true);
        }
        ids[cv.id] = true;
      }
      // removed conversations
      /*for (var i = self.items.length - 1; i >= 0; i--) {
        if (!ids[self.items[i].id]) {
          self.items.splice(i, 1);
          changed = true;
        }
      }*/

      if (self._sorted) {
        self._sort();
      } else {
        // raise changed event only if the collection was changed
        changed && self._triggerChanged();
      }
    }

    private _updateSort(cv: Conversation): void {
      var self = this;
      if (!self._sorted) return;
      var pos = self._findPosById(cv.id);
      var changed = Lingoal.utils.pushItemInSortedArray(self.items, pos, self._comparer);
      changed && self._triggerChanged();
    }

    private _comparer(a: Conversation, b: Conversation): number {
      if (a.last == b.last) return 0;
      return a.last > b.last ? -1 : 1;
    }

    private _sort(): void {
      var self = this;
      self.items.sort(self._comparer);
      self._triggerChanged();
    }

    private _triggerChanged(): void {
      $(this).trigger('changed', { conversations: this.items });
    }

    private _refresh(): void {
      var self = this;
      var date = new Date();
      date.setDate(date.getDate() - 7);
      var opts = {
        last: { $gte: date }
      };
      opts = null;// todo: remove this line to enable conversations restriction
      self._core.getConversations(opts, null, null, function (err, conversations: IServer.Conversation[]) {
        self._refreshItems(conversations, function () {
          self._initialized = !err ? true : false;
        });
      });
    }

    private _findPosById(id: string): number {
      if (!id) return -1;
      var self = this;
      for (var i = 0; i < self.items.length; i++) {
        if (self.items[i].id == id) {
          return i;
        }
      }
      return -1;
    }

    findById(id: string): Conversation {
      var self = this;
      var pos = self._findPosById(id);
      return pos != -1 ? self.items[pos] : null;
    }

    findByUser(userId: string): Conversation {
      if (!userId) return null;
      var self = this;
      for (var i = 0; i < self.items.length; i++) {
        var participants = self.items[i].getActiveParticipants();
        if (participants.length == 1 && participants[0].id == userId) {
          return self.items[i];
        }
      }
      return null;
    }

    create(userIds: string[], userData: any, callback: ConversationCallback) {
      var self = this;
      self._core.startConversation(null, userIds, userData, function (err, event: IServer.Event) {
        self._core.getConversations({ id: event.cvId }, null, null, function (err, conversations: IServer.Conversation[]) {
          var conversation = err || !conversations || !conversations.length ? null : conversations[0];
          self._refreshItems(conversation ? [conversation] : [], function() {
            callback && callback(err, self.findById(conversation.id));
          });
        });
      });
    }

    setHidden(userIds: string[], hidden: boolean, callback?: ErrorCallback) { // todo: error in callback has not implemeted, because of asyncEach restrictions
      var self = this;
      Lingoal.utils.asycnEach<string>(userIds, function (userIds, i, cb) {
        var opts = { participants: { '$size': 2 }, 'participants.id': userIds[i] }
        self._core.getConversations(opts, null, null, function (err, conversations) {
          if (err || !conversations) return cb();
          Lingoal.utils.asycnEach<IServer.Conversation>(conversations, function (conversations, i, cb) {
            self._core.updateParticipant(conversations[i].id, { hidden: hidden }, cb);
          }, cb);
        });
      }, function () {
        callback && callback(null);
      });
    }

    get initialized(): boolean {
      return this._initialized;
    }

    get selected(): Conversation {
      return this._selected;
    }

    set selected(conversation: Conversation) {
      var self = this;
      self._updateSelected(conversation);
    }
    protected _updateSelected(conversation: Conversation) {
      var self = this;
      var prevId: string = self._selected ? self._selected.id : null;
      var newId: string = conversation ? conversation.id : null;
      if (prevId != newId) {
        self._selected = self.findById(newId);
        $(self).trigger('select', self._selected);
      }
    }

    get sorted(): boolean {
      return this._sorted;
    }
    set sorted(value: boolean) {
      var self = this;
      if (self._sorted != value) {
        self._sorted = value;
        self._sorted && self._sort();
      }
    }

  }
}
