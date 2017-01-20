/// <reference path="../../../client/reference.ts" />
var app: Lingoal.ui.ChatWidget;
$(function () {

  // This class implements the only interface required by the client-side JS chat library, IUserProvider.
  // That interface provides chat library with information about your users that it needs. It only provides
  // information necessary for the chat, not your users' private properties, of course. 
  // This is, obviously, only a small sample. A real application would probably call its server to get user information.
  class UserProvider implements Lingoal.IUserProvider {
    initialized: boolean;
    _users: any[];

    constructor() {
      var self = this;
      self.initialized = false;
    }

    init(): void {
      var self = this;
      if (self.initialized) return;
      var forbes = [{
          id: '1',
          name: 'Bill Gates',
          avatar: 'http://specials-images.forbesimg.com/imageserve/55b833c9e4b05c2c34323e5f/200x200.jpg?background=000000&cropX1=82&cropX2=694&cropY1=135&cropY2=747'
        },
        {
          id: '2',
          name: 'Amancio Ortega',
          avatar: 'http://i.forbesimg.com/media/lists/people/amancio-ortega_100x100.jpg'
        },
        {
          id: '3',
          name: 'Warren Buffett',
          avatar: 'http://i.forbesimg.com/media/lists/people/warren-buffett_100x100.jpg'
        },
        {
          id: '4',
          name: 'Carlos Slim Helu',
          avatar: 'http://i.forbesimg.com/media/lists/people/carlos-slim-helu_100x100.jpg'
        },
        {
          id: '5',
          name: 'Jeff Bezos',
          avatar: 'http://specials-images.forbesimg.com/imageserve/57056e96e4b0fd7369a3e1f9/200x200.jpg?background=000000&cropX1=13&cropX2=731&cropY1=71&cropY2=789'
        },
        {
          id: '6',
          name: 'Mark Zuckerberg',
          avatar: 'http://specials-images.forbesimg.com/imageserve/56d3135ee4b0c144a7f66b99/200x200.jpg?background=000000&cropX1=130&cropX2=640&cropY1=66&cropY2=576'
        },
        {
          id: '7',
          name: 'Larry Ellison',
          avatar: 'http://i.forbesimg.com/media/lists/people/larry-ellison_100x100.jpg'
        },
        {
          id: '8',
          name: 'Michael Bloomberg',
          avatar: 'http://i.forbesimg.com/media/lists/people/michael-bloomberg_100x100.jpg'
        },
        {
          id: '9',
          name: 'Charles Koch',
          avatar: 'http://i.forbesimg.com/media/lists/people/charles-koch_100x100.jpg'
        },
        {
          id: '10',
          name: 'David Koch',
          avatar: 'http://i.forbesimg.com/media/lists/people/david-koch_100x100.jpg'
        }];
      self._users = forbes;
      self.initialized = true;
    }

    getContactInfo(id: string, callback): IServer.User {
      var self = this;
      if (!self.initialized) {
        self.init();
      }
      for (var i = 0; i < self._users.length; i++) {
        if (self._users[i].id.toLowerCase() == id.toLowerCase()) {
          return callback(null, self._users[i]);
        }
      }
      callback(null, null);
    }

  }

  var userProvider = new UserProvider();
  userProvider.init();

  // ChatWidget is the ready-made char UI implemented in the client-side JS chat library.
  // Its constructor has three arguments: parent element, IUserProvider implementation, and
  // an options object containing the chat server URL  
  app = new Lingoal.ui.ChatWidget($('#container'), userProvider, {
    url: 'http://lrcmain.brainglass.com:3100'
  });
  var lingoal: any = Lingoal;
  // show login, which is a simple user selection in this sample (see login.js)
  var login = new lingoal.Login({ core: app._core, container: $('#container') }, userProvider);
  login.show();

  // Build a contact list for our sample users. 
  // This is, of course, only a small sample. Real implementation would contain its
  // own functionality for selecting users that you want to add to contacts. 
  $(app._core).on('signin', function () {
    if (app._core.user == '1') app._contacts.add(['2', '3']);
    if (app._core.user == '2') app._contacts.add(['1', '3', '4', '10']);
    if (app._core.user == '3') app._contacts.add(['1', '2', '4']);
    if (app._core.user == '4') app._contacts.add(['1']);
    if (app._core.user == '5') app._contacts.add(['1', '2', '3', '4', '8']);
    if (app._core.user == '6') app._contacts.add(['1', '4', '7', '9', '10']);
    if (app._core.user == '7') app._contacts.add(['8', '10']);
    if (app._core.user == '8') app._contacts.add(['1', '10']);
    if (app._core.user == '9') app._contacts.add(['3', '6']);
    if (app._core.user == '10') app._contacts.add(['1']);
  });

  // Setting up a text analysis widget for analyzing Swedish text, highlighting words according to their linguistic
  // difficulty level and the user's level in Swedish, and looking up word translations and definitions. 
  // See textAnalysis repository for details.
  var config = {
    usePlugin: true,
    _core: app._core
  }
  var poly = new window.PolyWidget(config);
  window.poly = poly;
});

