namespace Lingoal {

  export const enum MessageType {
    Message = 0,
    Start = 1,
    Change = 2,
    Join = 3,
    Leave = 4,
    Comment = 5
  }

  interface IMessageNode {
    event: IServer.Event;
    nodes: IMessageNode[];
    msg: Message;
  }

  export class Message {
    private _id: string;
    private _text: string;
    private _type: MessageType;
    private _from: string;
    private _date: Date;
    private _read: boolean;
    private _fromMe: boolean;
    private _conversation: Conversation;
    private _comments: Message[];
    private _userData: any;

    constructor(conversation: Conversation, msg: IServer.Event) {
      this._id = msg.id;
      this._comments = [];
      var t: number = msg.type;
      this._type = t;
      this._from = msg.from;
      this._date = msg.date;
      this._read = msg.read || false;
      this._fromMe = msg.from == conversation.core.user;
      this._conversation = conversation;
      this._text = msg.content && msg.content.text ? msg.content.text : '';
      this._userData = msg.userData;
    }

    private _triggerChanged(): void {
      $(this).trigger('changed', this);
    }

    get id(): string { return this._id; }
    get text(): string { return this._text; }
    get type(): MessageType { return this._type; }
    get from(): string { return this._from; }
    get date(): Date { return this._date; }
    get read(): boolean { return this._read; }
    set read(value: boolean) {
      var self = this;
      if (self.read != value) {
        self._read = value;
        if (value && !self._fromMe) {
          self._conversation.unread--;
        }
      }
    }
    get fromMe(): boolean { return this._fromMe; }
    get comments(): Message[] { return this._comments; }
    get userData(): any { return this._userData || {}; }

    markAsRead(callback?: ErrorCallback): void {
      var self = this;
      self._conversation.core.markEventAsRead(self.id, function (err, event: IServer.Event) {
        callback && callback(err);
      });
    }
    change(newMessage: string, callback?: ErrorCallback): void {
      var self = this;
      self._conversation.core.updateEvent(self.id, newMessage, function (err, event: IServer.Event) {
        callback && callback(err);
      });
    }
    comment(comment: string, userData: any, callback?: EventCallback): void {
      var self = this;
      self._conversation.core.addComment(self.id, comment, userData, function (err, event: IServer.Event) {
        callback && callback(err, event);
      });
    }
    updateUserData(userData: any, notifyParticipants: boolean, callback?: EventCallback): void {
      var self = this;
      self._conversation.core.updateEventUserData(self.id, userData, notifyParticipants, function (err, event: IServer.Event) {
        self.update(event);
        callback && callback(err, event);
      });
    }
    update(props: IServer.Event) {
      if (!props) return;
      if ((this.type == MessageType.Message || this.type == MessageType.Comment) && (this._text != props.content.text || JSON.stringify(this._userData) !== JSON.stringify(props.userData))) {
        this._text = props.content.text;
        this._userData = props.userData;
        this._triggerChanged();
      }
    }
  }

  export class Messages {
    items: Message[];
    private _conversation: Conversation;
    private _sorted: boolean;
    private _initialized: boolean;

    constructor(conversation: Conversation) {
      var self = this;
      self._conversation = conversation;
      self.items = [];
      self._sorted = true;
      self._initialized = false;
      $(self._conversation.core).on('eventAdded', function (error, data: IServer.Event) {
        var cvId = data.cvId || data.cv.id;
        if (cvId != self._conversation.id) return;
        self._add([data], false);
      }).on('eventUpdated', function (error, data: IServer.Event) {
        var cvId = data.cvId || data.cv.id;
        if (cvId != self._conversation.id) return;
        var message = self.findById(data.id, true);
        if(message) {
          message.update(data);
          self._triggerChanged([message]);
        }
      });
    }

    private _updateSort(msg: Message): void {
      var self = this;
      if (!self._sorted) return;
      var pos = self._findPosById(self.items, msg.id);
      var changed = Lingoal.utils.pushItemInSortedArray(self.items, pos, self._comparer);
    }

    private _comparer(a: Message, b: Message): number {
      if (a.date == b.date) return 0;
      return a.date > b.date ? 1 : -1;
    }

    private _sort(items: Message[], recursive: boolean): void {
      if (!items || !items.length) return;
      var self = this;
      items.sort(self._comparer);
      if (recursive) {
        for (var i = 0; i < items.length; i++) {
          self._sort(items[i].comments, recursive);
        }
      }
    }

    private _triggerAdded(newMessages: Message[]): void {
      $(this).trigger('added', { data: newMessages });
    }
    private _triggerCleared(): void {
      $(this).trigger('cleared');
    }
    private _triggerChanged(updatedMessages: Message[]): void {
      $(this).trigger('changed', { data: updatedMessages});
    }

    fetch(messagesCount: number, callback?: ErrorCallback): void {
      var self = this;
      self._conversation.core.getEvents(self._conversation.id, null, self.items.length, messagesCount, function (err, data: IServer.Event[]) {
        if (!err) {
          self._initialized = true;
        }
        self._add(data, self._sorted, function () {
          callback && callback(err);
        });
      });
    }

    _findPosById(items: Message[], id: string): number {
      if (!id) return -1;
      var self = this;
      for (var i = 0; i < items.length; i++) {
        if (items[i].id == id) {
          return i;
        }
      }
      return -1;
    }

    private _findById(items: Message[], id: string, includeComments: boolean): Message {
      var self = this;
      var pos = self._findPosById(items, id);
      if (pos == -1 && includeComments) {
        for (var i = 0; i < items.length; i++) {
          var item = self._findById(items[i].comments, id, includeComments);
          if (item) return item;
        }
      }
      return pos != -1 ? items[pos] : null;
    }

    findById(id: string, includeComments: boolean): Message {
      var self = this;
      return self._findById(self.items, id, includeComments);
    }

    private _empty(): void {
      this.items = [];
      this._triggerCleared();
    }

    private _append(messages: Message[]): void {
      var self = this;
      for (var i = 0; i < messages.length; i++) {
        self.items.push(messages[i]);
      }
    }

    private _prepend(messages: Message[]): void {
      var self = this;
      for (var i = messages.length - 1; i >= 0; i--) {
        self.items.unshift(messages[i]);
      }
    }

    private _getUserNames(userIds: string[], callback: (names: string[]) => void): void {
      var core = this._conversation.core;
      var names = [];
      Lingoal.utils.asycnEach<string>(userIds, function (userIds: string[], i: number, callback: () => void) {
        core.getContactInfo(userIds[i], function (err, contact) {
          names[i] = contact ? contact.name : null;
          callback();
        });
      }, function () {
        callback(names);
      });
    }

    private _convertToTree(events: IServer.Event[]): IMessageNode[] {
      var root = {};
      for (var i = 0; i < events.length; i++) {
        root[events[i].id] = {
          event: events[i],
          nodes: [],
          msg: null
        };
      }
      for (var i = 0; i < events.length; i++) {
        var node: IMessageNode = root[events[i].id];
        if (events[i].type == IServer.EventType.Comment) {
          var parent: IMessageNode = root[events[i].content.evId];
          if (parent) {
            parent.nodes.push(node);
            delete root[events[i].id];
          }
        }
      }
      return Object.keys(root).map(key => { return root[key] });
    };

    private _add(events: IServer.Event[], prepend: boolean, callback?: () => void): void {
      if (!events || !events.length) return;
      var self = this;
      var messages: Message[] = [];
      var maxDate = self._conversation.last;
      // convert flat events list to tree
      var nodes: IMessageNode[] = this._convertToTree(events);
      var nodesWithoutParent = [];
      var nodesWithParent: IMessageNode[] = [];
      // find (comment) nodes for which we don't have parent (message)
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].event.type === IServer.EventType.Comment && !self.findById(nodes[i].event.content.evId, true)) {
          nodesWithoutParent.push(nodes[i].event.content.evId);
          nodes[i] = null;
        } else {
          nodesWithParent.push(nodes[i]);
        }
      }
      // nodes contains 'good' tree - only messages are at the root level, all comments are placed under message nodes as children
      nodes = nodesWithParent;
      nodesWithParent = null;

      var processMessageProps = function (events: IMessageNode[], i: number, callback: () => void) {
        // fill msg property for the event and for all its children
        var add = function (event: IMessageNode) {
          var msg: Message = new Message(self._conversation, event.event);
          event.msg = msg;
          // find max date to refresh it on the conversation level
          if (msg.date > maxDate) {
            maxDate = msg.date;
          }
          Lingoal.utils.asycnEach<IMessageNode>(event.nodes, processMessageProps, function () {
            for (var i = 0; i < event.nodes.length; i++) {
              event.msg.comments.push(event.nodes[i].msg);
            }
            callback();
          });
        };
        var node = events[i];
        // depending on event type we need to fill some properties before converting to Message
        if (node.event.type == IServer.EventType.Start || node.event.type == IServer.EventType.Join || node.event.type == IServer.EventType.Leave) {
          self._getUserNames(node.event.content.userIds, function (names) {
            node.event.content.text = JSON.stringify(names);
            add(node);
          });
        } else if (node.event.type == IServer.EventType.Change) {
          node.event.content = node.event.content || { };
          node.event.content.text = JSON.stringify(node.event.userData);
          add(node);
        } else {
          add(node);
        }
      };

      // if we have some comments without parent message we need to request necessary messages and use them for tree
      self._conversation.core.getRelatedEvents(self._conversation.id, nodesWithoutParent, function (err, events: IServer.Event[]) {
        var newNodes = self._convertToTree(events);
        // merge two message trees sorting by date
        var allNodes: IMessageNode[] = [];
        var i = 0;
        var j = 0;
        while (i < nodes.length || j < newNodes.length) {
          allNodes.push(j < newNodes.length && (i == nodes.length || nodes[i].event.date > newNodes[j].event.date) ? newNodes[j++] : nodes[i++]);
        }
        nodes = allNodes;
        newNodes = null;

        Lingoal.utils.asycnEach<IMessageNode>(nodes, processMessageProps, function () {
          // now all nodes have msg property which has filled in comments array
          for (var i = 0; i < nodes.length; i++) {
            // sort comments
            self._sorted && self._sort(nodes[i].msg.comments, true);
            if (nodes[i].msg.type !== MessageType.Comment) {
              messages.push(nodes[i].msg);
            } else {
              // try to add new comments to existing messages
              var parent = self.findById(nodes[i].event.content.evId, true);
              var existingEvent = self.findById(nodes[i].event.id, true);
              if (parent && !existingEvent) {
                parent.comments.push(nodes[i].msg);
              }
            }
          }

          // add new messages and sort
          prepend ? self._prepend(messages) : self._append(messages);
          if (self._sorted) {
            if (messages.length == 1) {
              self._updateSort(messages[0]);
            } else {
              self._sort(self.items, false);
            }
          }
          self._conversation.last = maxDate;
          self._triggerAdded(messages);
          callback && callback();
        });

      });
    }

    get initialized(): boolean {
      return this._initialized;
    }
    get sorted(): boolean {
      return this._sorted;
    }
    set sorted(value: boolean) {
      var self = this;
      if (self._sorted != value) {
        self._sorted = value;
        self._sorted && self._sort(self.items, true);
      }
    }

  }
}
