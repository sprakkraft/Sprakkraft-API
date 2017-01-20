namespace Lingoal.ui {

  export class ChatWidget {
    options: any;
    _container: JQuery;
    _contactsTabs: JQuery;
    _userProvider: IUserProvider;
    _core: ChatCore;
    _transport: SocketTransport;
    _conversations: Conversations;
    _contacts: Contacts;
    _contactsList: ContactsList;
    _recentList: RecentList;

    constructor(container: JQuery, userProvider: IUserProvider, options?) {
      var self = this;
      self._container = container;
      self._userProvider = userProvider;
      self._core = null;
      self._transport = null;
      self.options = $.extend(true, {}, options);
      self.init();
    }

    protected _createContacts() {
      this._contacts = new Contacts(this._core);
      return this._contacts;
    }

    _addTab(id: string, text: string): JQuery {
      var self = this;
      var tab = $('<div class="tab">');
      var header = $('<a class="tab-header">').attr('href', '#' + id).text(text);
      var headerBorder = $('<span class="arrow-up">');
      var content = $('<div class="tab-content">').attr('id', id);
      tab.append(header).append(content);
      header.append(headerBorder);
      $(header).click(function () {
        $(this).closest('.contacts-tabs').find('.tab').removeClass('active').find('.tab-content').hide();
        $(this).closest('.tab').addClass('active').find('.tab-content').show();
        return false;
      });
      self._contactsTabs.append(tab);
      return tab;
    }

    init() {
      var self = this;

      var core = self._core = new ChatCore(self.options.url, self._userProvider);
      var contacts = self._createContacts();
      var conversations = self._conversations = new Conversations(core, contacts);

      var userPanel = $('<div class="current-user-panel"><img class="current-user-avatar"/><span class="current-user-name"></span></div>');
      var contactsPanel = $('<div class="contacts-panel">');
      self._contactsTabs = $('<div class="contacts-tabs">');
      var contactsTab = self._addTab('tabContacts', 'Contacts');
      var recentTab = self._addTab('tabRecent', 'Recent');
      contactsPanel.append(self._contactsTabs);
      contactsTab.find('.tab-header').click();

      var conversationContainer = $('<div class="conversation-container">');

      self._container.append(userPanel).append(contactsPanel).append(conversationContainer);
      userPanel.hide();
      contactsPanel.hide();
      conversationContainer.hide();

      var contactsList = self._contactsList = new ContactsList({ data: contacts, conversations: conversations, container: contactsTab.find('.tab-content') });
      var recentList = self._recentList = new RecentList({ data: conversations, container: recentTab.find('.tab-content') });
      var conversationUIFactory = new ConversationUIFactory(conversations, contacts, conversationContainer);

      $(core).on('signin', function () {
        contactsPanel.show();
        conversationContainer.show();
        userPanel.show();
        core.getContactInfo(core.user, function (err, me) {
          var avatar = userPanel.find('.current-user-avatar');
          if (me.avatar) {
            avatar.removeClass('no-avatar').attr('src', me.avatar);
          } else {
            avatar.addClass('no-avatar').removeAttr('src');
          }
          userPanel.find('.current-user-name').text(me.name);
        });
      });

      $(self._userProvider).on('changed', function () {
        contactsList.refresh();
      });
    }
  }

}