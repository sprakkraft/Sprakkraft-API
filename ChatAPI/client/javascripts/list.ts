/// <reference path="conversations.ts" />
namespace Lingoal.ui {

  export class List {
    tmplList = '<ul class="list">';
    tmplItem = '<li class="item"></li>';
    _activeClass = 'active';
    _activeSel = '.' + this._activeClass;
    _itemSel = '.item';
    _dataProp = 'listItemData';
    _list: JQuery;
    options: any;
    _data: IList;
    _selectedId: string = null;

    constructor(options) {
      var self = this;
      var opts = self.options = $.extend(true, {}, options);
      self.tmplList = opts.tmpList || self.tmplList;
      self.tmplItem = opts.tmplItem || self.tmplItem;
      self._data = opts.data;
      !options.skipRefresh && self.refresh();
      $(self._data).on('changed', function (event, data) {
        self._dataChanged(event, data);
      });
      $(self._data).on('select', function (error, data) {
        self.select(data.id || data);
        $(self).trigger('itemSelected', data);
      });
    }

    find(id: string): JQuery {
      var self = this;
      if (!id || !self._list) return $();
      var li = $();
      self._list.find(self._itemSel).each(function () {
        var item = $(this);
        var data = item.data(self._dataProp);
        if (data.id == id) {
          li = item;
          return false;
        }
      });
      return li;
    }

    select(id: string): void {
      var self = this;
      self._selectedId = id;
      var item = self.find(id);
      self._selectItem(item);
    }

    _selectItem(item): void {
      var self = this;
      if (!self._list) return;
      var selected = self._list.find(self._activeSel);
      if (selected.is(item)) {
        return;
      }
      self._list.find(self._itemSel).removeClass(self._activeClass);
      item.addClass(self._activeClass);
      var data: IListItem = item.data(self._dataProp);
      self._selectedId = data ? data.id : null;
      $(self).trigger('itemSelected', data);
    }

    _refreshItem(li: JQuery, data: any): void {

    }

    _dataChanged(event, data): void {
      var self = this;
      self.refresh();
    }

    _itemClicked(item: HTMLElement): void {
      $(this).trigger('itemClicked', item);
    }

    _generateItem(data) {
      var self = this;
      var item = $(self.tmplItem);
      item.data(self._dataProp, data);
      self._refreshItem(item, data);
      $(data).on('changed', function (error, data) {
        var li = self.find(data.id);
        self._refreshItem(li, data);
      });
      item.click(function () {
        self._itemClicked(this);
      });
      return item;
    }

    getSelectedData() {
      return null;
    }

    refresh() {
      var self = this;
      var opts = self.options;
      var items = self._data.items;
      if (!items || !items.length) return;
      if (!self._list) {
        self._list = opts.list || $(self.tmplList).appendTo(opts.container);
      }
      var selectedData = self._selectedId || (self.getSelectedData() || {}).id;
      self._list.empty();
      for (var i = 0; i < items.length; i++) {
        self._list.append(self._generateItem(items[i]));
      }
      self.select(selectedData);
      self.scrollToActive();
      $(self).trigger('updated', items);
    }

    scrollToActive(): void {
      var self = this;
      var activeItem = self._list.find(self._activeSel);
      if (activeItem && activeItem.length) {
        self._list.scrollTop(activeItem.position().top + activeItem.height() - self._list.height() - self._list.scrollTop());
      }
    }

    show(): void {
      var self = this;
      self._list && self._list.show();
    }
    hide(): void {
      var self = this;
      self._list && self._list.hide();
    }
  }

  export class RecentList extends List {
    tmplList = '<ul class="list conversations">';
    tmplItem = '<li class="item conversation"><div class="avatar-container"><span class="user-status-icon" /><img class="avatar" alt="avatar" src="{avatar_src}" /></div><div class="username-container"><p class="username">{username}</p><span class="unread-messages-count" /></div></li>';
    _unreadItemClass = 'unread-messages-count';
    _unreadItemSel = '.' + this._unreadItemClass;
    _dataConversationProp = 'conversation';

    constructor(options: any) {
      super($.extend({}, options, { skipRefresh: true }));
      !options.skipRefresh && this.refresh();
    }
    _refreshOnlineStatus(item: JQuery) {
      var self = this;
      var conversation: Conversation = item.data(self._dataProp);
      var participants = conversation ? conversation.getActiveParticipants() : null;
      if (!participants || participants.length != 1) return;
      // todo: get contact status
    }
    _refreshName(li: JQuery, data: Conversation): void {
      var self = this;
      li.toggleClass('group', data.participants.length > 2);
      var avatar = li.find('.avatar');
      var logo = data.logo;
      if (logo) {
        avatar.removeClass('no-avatar').attr('src', logo).attr('alt', 'avatar');
      } else {
        avatar.addClass('no-avatar').removeAttr('src').removeAttr('alt');
      }
      li.find('.username').text(data.name);
    }
    _refreshUnread(li: JQuery, data: Conversation): void {
      var self = this;
      var unreadItem = li.find(self._unreadItemSel);
      unreadItem.text(data.unread);
      if (data.unread) {
        unreadItem.fadeIn();
      } else {
        unreadItem.fadeOut();
      }
    }
    _refreshItem(li: JQuery, data: Conversation): void {
      super._refreshItem(li, data);
      var self = this;
      self._refreshName(li, data);
      self._refreshUnread(li, data);
      self._refreshOnlineStatus(li);
    }
    _itemClicked(item: HTMLElement) {
      var self = this;
      super._itemClicked(item);
      self._data.selected = $(item).data(self._dataProp);
    }
    getSelectedData(): IListItem {
      var self = this;
      return self._data.selected;
    }
  }

  export class ContactsList extends RecentList {
    tmplList = '<ul class="list contacts">';
    tmplItem = '<li class="item contact"><div class="avatar-container"><span class="user-status-icon" /><img class="avatar" alt="avatar" src="{avatar_src}" /></div><div class="username-container"><p class="username">{username}</p><span class="unread-messages-count" /></div></li>';
    _conversations: Conversations;
    _filter: string;

    constructor(options: any) {
      super($.extend({}, options, { skipRefresh: true }));
      var self = this;
      self._conversations = options.conversations;
      $(self._conversations).on('changed', function (event, data) {
        self._refreshConversations(data);
      });
      if (!options.createGroupChat) {
        $(self._conversations).on('select', function (error, conversation: Conversation) {
          var users = conversation.getActiveParticipants();
          self.select(users.length == 1 ? users[0].id : null);
        });
      }
      !options.skipRefresh && this.refresh();
    }

    _dataChanged(event, data) {
      super._dataChanged(event, data);
      var self = this;
      self._refreshConversations();
    }

    _refreshOnlineStatus(item: JQuery) {
      var self = this;
      var contact: Contact = item.data(self._dataProp);
      var icon = item.find('.user-status-icon');
      if (contact.online) {
        icon.removeClass('offline').addClass('online');
      } else {
        icon.removeClass('online').addClass('offline');
      }
    }
    _refreshName(li: JQuery, data): void {
    }
    _generateItem(data) {
      var self = this;
      var replaces = {
        '{avatar_src}': data.avatar,
        '{username}': data.name
      };
      var tmpl = self.tmplItem;
      for (var key in replaces) {
        tmpl = tmpl.replace(key, replaces[key]);
      }
      var item = $(tmpl);
      var avatar = item.find('.avatar');
      if (data.avatar) {
        avatar.removeClass('no-avatar').attr('src', data.avatar).attr('alt', 'avatar');
      } else {
        avatar.addClass('no-avatar').removeAttr('src').removeAttr('alt');
      }
      item.data(self._dataProp, data);
      self._list.append(item);
      $(data).on('changed', function (error, data) {
        var li = self.find(data.id);
        self._refreshItem(li, data);
      });
      self._refreshItem(item, data);
      item.click(function () {
        if (self.options.createGroupChat) {
          self._selectItem(item);
          return;
        }
        var cv: Conversation = $(this).data(self._dataConversationProp);
        if (!cv) {
          var contact = $(this).data(self._dataProp);
          self._conversations.create([contact.id], null, function (err, conversation: Conversation) {
            self._conversations.selected = conversation;
          })
        } else {
          self._conversations.selected = cv;
        }
      });
      return item;
    }
    _itemClicked(item: HTMLElement) {
      var self = this;
      super._itemClicked(item);
      self._data.selected = $(item).data(self._dataProp);
    }
    getSelectedData() {
      var self = this;
      if (!self._selectedId) return null;
      var li = self.find(self._selectedId);
      var contact: Contact = li.data(self._dataProp);
      return contact;
    }

    _refreshConversations(data?) {
      var self = this;
      if (!self._list) return;
      var conversations: Conversation[] = data ? data.conversations : self._conversations.items;
      self._list.find(self._itemSel).each(function () {
        var item = $(this);
        var data: Contact = item.data(self._dataProp);
        for (var i = 0; i < conversations.length; i++) {
          var cv = conversations[i];
          if (cv.participants.length == 2 && (cv.participants[0].id == data.id || cv.participants[1].id == data.id)) {
            item.data(self._dataConversationProp, cv);
            self._refreshItem(item, cv);
            $(cv).on('changed', function (error, conversation: Conversation) {
              var users: Participant[] = conversation.getActiveParticipants();
              if (users.length != 1) return;
              self._refreshItem(self.find(users[0].id), conversation);
            });
            break;
          }
        }
      });
    }

    applyFilter(filter: string): void {
      var self = this;
      filter = filter ? filter.toLowerCase() : '';
      if (!self._list || self._filter == filter) return;
      self._filter = filter;
      var selectedData = self.getSelectedData();
      self._list.find('.contact').each(function () {
        var contact: Contact = $(this).data(self._dataProp);
        var visible = contact.name.toLowerCase().indexOf(filter) != -1;
        $(this).toggle(visible);
        if (selectedData == contact && !visible) {
          self.select(null);
        }
      });
    }
    resetFilter(): void {
      this.applyFilter(null);
    }
  }

  export class AddUsers {
    tmpl = '<div class="add-user-container"><div class="add-user-search"><input type="text" placeholder="Type contact name" /></div><div class="add-user-main"></div><div class="add-user-buttons"><div><span class="create-group-button">Create group</span></div><div><span class="cancel-button">Cancel</span></div></div></div>';
    _element: JQuery;
    _list: ContactsList;
    _conversation: Conversation;
    _conversations: Conversations;
    _contacts: Contacts;
    options: any;

    constructor(conversation: Conversation, conversations: Conversations, contacts: Contacts, options: any) {
      var self = this;
      var opts = self.options = $.extend(true, {}, options);
      self._conversation = conversation;
      self._conversations = conversations;
      self._contacts = contacts;
      self._element = $(opts.tmpl || self.tmpl);
      self._element.hide();
      options.container.append(self._element);
      self._list = new ContactsList({ data: self._contacts, conversations: self._conversations, container: self._element.find('.add-user-main'), createGroupChat: true });

      $(self._element).on('click', '.create-group-button', function () {
        self.hide();
        var user: Contact = self._list.getSelectedData();
        var users: string[] = [user.id];
        var len = self._conversation.participants.length;
        if (len == 2) {
          users.push(self._conversation.getActiveParticipants()[0].id);
          self._conversations.create(users, null, function (err, conversation) {
            self._list.select(null);
            self._conversations.selected = conversation;
          });
        } else {
          self._conversation.addParticipants(users);
        }
      }).on('click', '.cancel-button', function () {
        self.hide();
      });

      self._element.find('input').on('input', function () {
        var filter: string = $(this).val();
        self._list.applyFilter(filter.trim());
      });

      $(self._list).on('itemSelected', function (e: JQueryEventObject, user: Contact) {
        self._element.find('.create-group-button').toggleClass('disabled', !user);
      });
    }

    toggle(): void {
      var self = this;
      if (self._element.is(':visible')) {
        self.hide();
      } else {
        self.show();
      }
    }

    show(): void {
      var self = this;
      self._list.resetFilter();
      self._list.select(null);
      var btn = self._element.find('.create-group-button').addClass('disabled');
      var isGroup = self._conversation.participants.length == 2;
      btn.text(isGroup ? 'Create group' : 'Add to group');
      self._element.show();
      self._element.find('input').val('').focus();
      $(self).trigger('activate', true);
    }

    hide() : void {
      var self = this;
      self._element.hide();
      $(self).trigger('activate', false);
    }

  }

}

