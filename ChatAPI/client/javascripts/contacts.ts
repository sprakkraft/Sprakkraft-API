namespace Lingoal {

  export interface ContactCallback {
    (error: any, result: Contact): void;
  }

  export interface ContactsCallback {
    (error: any, result: Contact[]): void;
  }

  /** Represent a contact object in a contact list */
  export class Contact implements IListItem {
    protected _id: string;
    protected _avatar: string;
    protected _name: string;
    protected _online: boolean;
    protected _blocked: boolean;
    protected _core: ChatCore;

    constructor(core: ChatCore, user: IServer.User) {
      var self = this;
      self._core = core;
      if (user) {
        self._id = user.id;
        self._name = user.name;
        self._avatar = user.avatar;
        self._online = false;
      }
    }
    protected _triggerChanged(): void {
      $(this).trigger('changed', this);
    }

    /** Gets a contact ID */
    get id(): string { return this._id; }
    /** Gets or sets a contact name */
    get name(): string { return this._name; }
    /** Gets or sets a URL to contact avatar */
    get avatar(): string { return this._avatar; }
    set name(value: string) {
      if (this._name != value) {
        this._name = value;
        this._triggerChanged();
      }
    }
    set avatar(value: string) {
      if (this._avatar != value) {
        this._avatar = value;
        this._triggerChanged();
      }
    }
    /** Gets or sets whether a contact is online */
    get online(): boolean { return this._online; }
    set online(value: boolean) {
      if (this._online != value) {
        this._online = value;
        this._triggerChanged();
      }
    }
    get blocked(): boolean { return this._blocked; }
    /**
     * Update contact properties with data from user provider
     * @param props  User data from user provider
     */
    update(props: IServer.User, raiseChanged: boolean): boolean {
      if (!props) return;
      if (this.name != props.name || this.avatar != props.avatar) {
        this._name = props.name;
        this._avatar = props.avatar;
        raiseChanged && this._triggerChanged();
        return true;
      }
      return false;
    }
    /**
     * Update contact properties with data from chat DB
     * @param props  User data from chat DB
     */
    updateState(props: IServer.Contact, raiseChanged: boolean): boolean {
      if (!props) return;
      if (this.online != props.online) {
        this._online = props.online;
        raiseChanged && this._triggerChanged();
        return true;
      }
      return false;
    }
    updateBlocked(blocked: boolean, raiseChanged: boolean): boolean {
      if (this._blocked != blocked) {
        this._blocked = blocked;
        raiseChanged && this._triggerChanged();
        return true;
      }
      return false;
    }
  }

  /** Represents contact list of a user */
  export class Contacts implements IList {
    protected _sorted: boolean;
    protected _selected: Contact;
    protected _me: Contact;
    protected _all: { [id: string]: Contact; } = { };
    protected _blocked: string[] = [];
    items: Contact[];
    protected _core: ChatCore;
    private _initialized: boolean;
    constructor(core: ChatCore) {
      var self = this;
      self._initialized = false;
      self._core = core;
      self.items = [];
      self._sorted = true;
      var getContactListCallback = function (err, contactList: IServer.ContactList) {
        self._core.getBlockedList(function (err, blockedList: IServer.ContactList) {
          self._blocked = blockedList ? blockedList.userIds : [];
          self._refreshItems(err || !contactList ? [] : contactList.userIds);
        });
      };
      var init = function () {
        self._refreshMe(function (err) {
          if (!self._initialized && !err) {
            self._initialized = true;
            $(self).trigger('ready');
          }
        });
        self._core.getContactList(getContactListCallback);
      };
      if (self._core.authenticated) {
        init();
      }
      $(self._core).on('signin', function (event, user: string) {
        init();
      }).on('connected', function () {
        if (self._core.authenticated) {
          init();
        }
      }).on('signout', function (event, user: string) {
        self.items = [];
        self._triggerChanged();
      }).on('contactUpdated', function (event: JQueryEventObject, user: IServer.Contact) {
        var contact = self._getContact(user.id);
        if (contact) {
          contact.online = user.online;
        }
      }).on('contactListUpdated', function (event: JQueryEventObject, contactList: IServer.ContactList) {
        getContactListCallback(null, contactList);
      }).on('blockedListUpdated', function (event: JQueryEventObject, contactList: IServer.ContactList) {
        self._blocked = contactList ? contactList.userIds : [];
        self._refreshBlocked(contactList ? contactList.userIds : []);
      }).on('contactInfoUpdated', function (event: JQueryEventObject, user: IServer.User) {
        var contact = self._getContact(user.id);
        contact && contact.update(user, true);
      });
    }

    _addToAll(contact: Contact): void {
      if (!contact || !contact.id) return;
      var self = this;
      self._all[contact.id] = contact;
    }

    protected _getContact(id: string) {
      if (!id) return;
      var self = this;
      return self._all[id];
    }

    protected _refreshMe(callback?: ErrorCallback): void {
      var self = this;
      self._core.getContactInfo(self._core.user, function (err, user: IServer.User) {
        self._me = err ? null : self._createContact(user);
        self._addToAll(self._me);
        callback && callback(err);
        self._me && self._core.getSpecificContacts(self._me.id, function (err, data) {
          data && data.length && self._me.updateState(data[0], true);
        });
      });
    }

    protected _refreshContacts(): void {
      var self = this;
      self._core.getContacts(function (err, contacts: IServer.Contact[]) {
        if (err || !contacts) return;
        for (var i = 0; i < contacts.length; i++) {
          var contact: Contact  = self.findById(contacts[i].id);
          if (contact) {
            contact.updateState(contacts[i], true);
            contact.updateBlocked(self._blocked.indexOf(contact.id) != -1, true);
          }
        }
      });
    }

    protected _createContact(info: IServer.User): Contact {
      var contact = info && info.id ? this._all[info.id] : null;
      if (!contact) contact = new Contact(this._core, info);
      contact.updateBlocked(this._blocked.indexOf(contact.id) != -1, false);
      return contact;
    }

    protected _refreshItems(contacts: string[]): void {
      var self = this;
      var ids = {};
      var changed: boolean = false;
      contacts = contacts || [];

      var processContact = function (contacts: string[], i: number, callback: () => void) {
        self._core.getContactInfo(contacts[i], function (err, info: IServer.User) {
          if (err || !info) info = { id: contacts[i], name: contacts[i], avatar: '' };
          var contact: Contact = self.findById(contacts[i]);
          if (!contact) {
            contact = self._createContact(info);
            self._addToAll(contact);
            self.items.push(contact);
            $(contact).on('changed', function (e: JQueryEventObject, contact: Contact) {
              self._updateSort(contact);
            });
            changed = true;
          } else {
            contact.update(info, true);
            contact.updateBlocked(self._blocked.indexOf(contact.id) != -1, true);
          }
          ids[contacts[i]] = true;
          callback();
        });
      };

      // add new conversations and/or update existing ones
      Lingoal.utils.asycnEach<string>(contacts, processContact, function () {
        // removed contacts
        for (var i = self.items.length - 1; i >= 0; i--) {
          if (!ids[self.items[i].id]) {
            self.items.splice(i, 1);
            changed = true;
          }
        }

        if (self._sorted) {
          self._sort();
        } else {
          // raise changed event only if the collection was changed
          changed && self._triggerChanged();
        }
        self._refreshContacts();
      });
    }

    protected _refreshBlocked(blocked: string[]): void {
      var self = this;
      for (var id in self._all) {
        var contact = self._all[id];
        contact && contact.updateBlocked(blocked.indexOf(id) != -1, true);
      }
    }

    protected _updateSort(contact: Contact): void {
      var self = this;
      if (!self._sorted) return;
      var pos = self._findPosById(contact.id);
      var changed = Lingoal.utils.pushItemInSortedArray(self.items, pos, self._comparer);
      changed && self._triggerChanged();
    }

    protected _comparer(a: Contact, b: Contact): number {
      if (a.name == b.name) return 0;
      return a.name > b.name ? 1 : -1;
    }

    protected _sort(): void {
      var self = this;
      self.items.sort(self._comparer);
      self._triggerChanged();
    }

    protected _triggerChanged(): void {
      $(this).trigger('changed', { contacts: this.items });
    }

    protected _findPosById(id: string): number {
      if (!id) return -1;
      var self = this;
      for (var i = 0; i < self.items.length; i++) {
        if (self.items[i].id == id) {
          return i;
        }
      }
      return -1;
    }

    /**
     * Gets contact info object by ID
     * @param id  ID of a contact to search for.
     * @returns   Contact object with the specified ID if found, otherwise null.
     */
    findById(id: string): Contact {
      var self = this;
      var pos = self._findPosById(id);
      return pos != -1 ? self.items[pos] : null;
    }

    /**
     * Adds specified contacts to the contact list of the current user.
     * @param ids  Array of contact IDs to be added
     */
    add(ids: string[], callback?: ErrorCallback): void {
      var self = this;
      self._core.addToContactList(ids, function (err, contactList: IServer.ContactList) {
        !err && contactList && self._refreshItems(contactList.userIds);
        callback && callback(err);
      });
    }

    /**
     * Removes specified contacts from the contact list of the current user.
     * @param ids  Array of contact IDs to be removed
     */
    remove(ids: string[], callback?: ErrorCallback): void {
      var self = this;
      self._core.removeFromContactList(ids, function (err, contactList: IServer.ContactList) {
        !err && contactList && self._refreshItems(contactList.userIds);
        callback && callback(err);
      });
    }

    block(ids: string[], callback?: ErrorCallback): void {
      var self = this;
      self._core.addToBlockedList(ids, function (err, contactList: IServer.ContactList) {
        !err && contactList && self._refreshBlocked(contactList.userIds);
        callback && callback(err);
      });
    }

    unblock(ids: string[], callback?: ErrorCallback): void {
      var self = this;
      self._core.removeFromBlockedList(ids, function (err, contactList: IServer.ContactList) {
        !err && contactList && self._refreshBlocked(contactList.userIds);
        callback && callback(err);
      });
    }

    getBlocked(callback?: ContactsCallback): void {
      var self = this;
      var index = 0;
      var blocked = [];
      self._blocked.forEach(function (id) {
        self.getContactInfo(id, function (err, contact) {
          if (err) return callback(err, null);
          contact && blocked.push(contact);
          if (++index == self._blocked.length) callback(null, blocked); 
        });
      });
    }

    reportAbuse(violator: string, message: string, callback?: ErrorCallback): void {
      var self = this;
      self._core.reportAbuse(violator, message, function (err, report: IServer.AbuseReport) {
        callback && callback(err);
      });
    }

    getContactInfo(id: string, callback?: ContactCallback): void {
      var self = this;
      var contact = self._getContact(id);
      if (contact) {
        callback(null, contact);
      } else {
        self._core.getContactInfo(id, function (err, user: IServer.User) {
          contact = err ? null : self._createContact(user);
          self._core.getSpecificContacts(id, function (err, data) {
            if (data && data.length) {
              contact.updateState(data[0], true);
            }
            callback(err, contact);
          });
        });
      }
    }

    find(query: Object, callback?: ContactsCallback): void {
      var self = this;
      self._core.findContactsInfo(query, function (err, users: IServer.User[]) {
        if (err) return callback && callback(err, null);
        if (!users) return callback && callback(null, []);
        var contacts: Contact[] = [];
        var dict: { [id: string]: Contact } = {};
        for (var i = 0; i < users.length; i++) {
          var user = users[i];
          if (!user || !user.id) continue; 
          var contact = self._getContact(user.id);
          var exists = contact != null;
          contact = contact || self._createContact(user);
          contacts.push(contact);
          if (!exists) {
            self._addToAll(contact);
            dict[contact.id] = contact;
          }
        }
        if (!Object.keys(dict).length) return callback && callback(null, contacts);
        self._core.getSpecificContacts(Object.keys(dict), function (err, data) {
          if (err) return callback && callback(err, null);
          if (!data) return callback && callback(null, []);
          for (var i = 0; i < data.length; i++) {
            dict[data[i].id].updateState(data[i], true);
          }
          callback && callback(null, contacts);
        });
      });
    }

    get me(): Contact {
      return this._me;
    }

    /** Gets or sets currently selected contact */
    get selected(): Contact {
      return this._selected;
    }

    set selected(contact: Contact) {
      var self = this;
      self._updateSelected(contact);
    }
    protected _updateSelected(contact: Contact) {
      var self = this;
      var prevId: string = self._selected ? self._selected.id : null;
      var newId: string = contact ? contact.id : null;
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
