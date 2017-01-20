namespace IServer {
  /**
   * Interface that represents a client authentication data.
   * @interface
  */
  export interface Handshake {
    /**
     * Gets or sets a token provided by the chat server.
    */
    userToken?: string;
    /**
     * Gets or sets a token provided by the public API server.
    */
    publicApiToken?: string;
  }

  /**
   * Interface that represents the user credentials.
   * @interface
  */
  export interface Credentials extends Handshake {
    /**
     * Gets or sets the credentials data.
    */
    [propName: string]: any;
  }

  /**
   * Interface that represents a user.
   * @interface
  */
  export interface User {
    /**
     * Gets or sets the user id.
    */
    id: string;
    /**
     * Gets or sets the user name.
    */
    name: string;
    /**
     * Gets or sets the user avatar.
    */
    avatar?: string;
  }

  /**
   * Interface that represents a conversation participant properties.
   * @interface
  */
  export interface ParticipantProperties {
    /**
     * Indicates whether the conversation should be hidden for the particular participant.
    */
    hidden?: boolean;
  }

  /**
   * Interface that represents a conversation participant.
   * @interface
  */
  export interface Participant extends ParticipantProperties {
    /**
     * Get or set the user id of the participant.
    */
    id: string;
    /**
     * Indicates whether the participant is active in the conversation or it was removed from it.
    */
    active: boolean;
  }

  /**
   * Interface that represents conversation properties.
   * @interface
  */
  export interface ConversationProperties {
    /**
     * Get or sets the conversation name (optional).
    */
    name?: string;
    /**
     * Gets or sets the conversation image (optional).
    */
    image?: string;
  }

  /**
   * Interface that represents a conversation.
   * @interface
  */
  export interface Conversation {
    /**
     * Gets or sets the conversation id.
    */
    id?: string;
    /**
     * Gets or sets the conversation start date.
    */
    start: Date;
    /**
     * Gets or sets the last conversation event date.
    */
    last: Date;
    /**
     * Gets or sets the conversation participants.
    */
    participants: Participant[];
    /**
     * Gets or sets the coneversation properties (optional).
    */
    props?: ConversationProperties;
    /**
     * Gets or sets the count of unread events for a client (optional).
    */
    unread?: number;
    /**
     * Gets or sets user data for the conversation (optional).
    */
    userData?: Object;
  }

  /**
   * Enumeration of conversation events.
   * @readonly
   * @enum
  */
  export const enum EventType {
    /**
     * A message is added to the conversation.
    */
    Message = 0,
    /**
     * The conversation has started. This event is sent only once, when the conversation is created.
    */
    Start = 1,
    /**
     * Conversation properties have changed.
    */
    Change = 2,
    /**
     * Participants have been added to the conversation. 
    */
    Join = 3,
    /**
     * Participants have been removed from the conversation.
    */
    Leave = 4,
    /**
     * A comment is added to the event.
    */
    Comment = 5
  }

  /**
   * Interface that represents a conversation event content.
   * @interface
  */
  export interface EventContent {
    /**
     * Gets or sets the changed conversation properties (optional).
    */
    props?: ConversationProperties;
    /**
     * Gets or sets user IDs that have been added to or removed from the conversation (optional).
    */
    userIds?: string[];
    /**
     * Gets or sets the event text (optional).
    */
    text?: string;
    /**
     * Gets or sets a parent event ID for which the event has been occured (optional).
    */
    evId?: string;
  }

  /**
   * Interface that represents an event that occured in a conversation.
   * @interface
  */
  export interface Event {
    /**
     * Gets or sets the event id.
    */
    id?: string;
    /**
     * Gets or sets the event type.
    */
    type: EventType;
    /**
     * Gets or sets a conversation id where the event has occured.
    */
    cvId: string;
    /**
     * Gets or sets the user id of the user who initiated the event.
    */
    from: string;
    /**
     * Gets or sets the event date.
    */
    date: Date;
    /**
     * Gets or sets the event content.
    */
    content: EventContent;
    /**
     * Gets or sets the event update date (optional).
    */
    updated?: Date;
    /**
     * Gets or sets user data for the event (optional).
    */
    userData?: Object;
    /**
     * Indicates whether the event has been read by the client (optional).
    */
    read?: boolean;
    /**
     * Gets or sets the conversation where the event has occured (optional).
     * @private
    */
    cv?: Conversation;
    /**
     * Gets or sets participants ids that a deaf to the event (optional).
     * @private
    */
    deaf?: string[];
  }

  /**
   * Interface that represents an event that has not been read by a user.
   * @interface
  */
  export interface Deferred {
    /**
     * Gets or sets the deferred event id.
    */
    id?: string;
    /**
     * Gets or sets the user id of the user in question.
    */
    to: string;
    /**
     * Gets or sets a conversation id where the event has occured.
    */
    cvId: string;
    /**
     * Gets or sets the event id.
    */
    evId: string;
    /**
     * Gets or sets the event date.
    */
    date: Date;
  }

  /**
   * Interface that represents a contact in a user's contact list.
   * @interface
  */
  export interface Contact {
    /**
     * Gets or sets the user id of the contact.
    */
    id?: string;
    /**
     * Indicates whether the contact is logged in on the server. 
    */
    online: boolean;
    /**
     * Gets or sets a namespace associated with the contact.
    */
    ns?: string;
    /**
     * Gets or sets a token provided by the server to authenticate the client on connection.
     * The token returns only in callbacks for signup and login client methods.
    */
    token?: string;
  }

  /**
   * Interface that represents a user's contact list.
   * @interface
  */
  export interface ContactList {
    /**
     * Gets or sets the user id of the owner of the contact list.
    */
    id?: string;
    /**
     * Gets or sets user IDs that are in the contact list.
    */
    userIds: string[];
  }

  /**
   * Interface that represents an abuse report.
   * @interface
  */
  export interface AbuseReport {
    /**
     * Gets or sets the report id.
    */
    id?: string;
    /**
     * Gets or sets the user id who reports.
    */
    from: string;
    /**
     * Gets or sets user id who abuses.
    */
    violator: string;
    /**
     * Gets or sets the report date.
    */
    date: Date;
    /**
     * Gets or sets the report message.
    */
    message?: string;
  }

  /**
   * Interface that represents request parameters for analyzing a text.
   * @interface
  */
  export interface AnalysisInfo {
    /**
     * Gets or sets text to analyze.
     * Text length cannot exceed 2000 characters.
    */
    text: string;
    /**
     * NOTE: This member is private, not available in the open source version.
     * Gets or sets a user language id to personalyze the analysis result (optional).
     * @private
    */
    langid?: string;
  }

  /**
   * Interface that represents request parameters for translating a text (word or phrase).
   * @interface
  */
  export interface TranslationInfo {
    /**
     * Gets or sets a language (ISO-693-1 format) to translate the text to.
    */
    toLanguage: string;
    /**
     * Gets or sets a base (dictionary) form of the word to translate (ignored if phrase is defined).
     * The lemma length cannot exceed 50 characters.
    */
    lemma?: string;
    /**
     * Gets or sets a phrase to translate (ignored if lemma is defined).
     * The phrase length cannot exceed 100 characters.
    */
    phrase?: string;
    /**
     * Gets or sets a word to translate (optional).
     * The word length cannot exceed 50 characters.
     * This parameter is the original (as it occurs in the original text) form of the word.
     * Setting it is recommended because in some cases it allows get a translation even if the lemma is not present in the dictionary.
    */
    word?: string;
    /**
     * Gets or sets part of speech of the lemma (optional).
     * Allows to get a more accurate translation result.
    */
    partOfSpeech?: string;
    /**
     * NOTE: This member is private, not available in the open source version.
     * Gets or sets a user language id to personalyze a translation result (optional).
     * @private
    */
    langid?: string;
  }

  /**
   * Interface that represents request parameters to set a word's difficulty.
   * NOTE: This interface is private, not available in the open source version.
   * @interface
   * @private
  */
  export interface DifficultyInfo {
    /**
     * Gets or sets a user language id.
    */
    langid: string;
    /**
     * Get or sets the word to set difficulty for the given user.
     * The word length cannot exceed 50 characters.
    */
    word: string;
    /**
     * Get or sets word difficulty.
     * The value must be between 0 and 5.
    */
    difficulty: number;
  }

  /**
   * Interface that represents request parameters to send a request directly to the NodeSever.
   * NOTE: This interface is private, not available in the open source version.
   * @interface
   * @private
  */
  export interface RequestInfo {
    /**
     * Gets or sets a <Http.RequestOptions> to create the request.
    */
    opts: any; //Http.RequestOptions
    /**
     * Gets or sets data to send with the request.
    */
    data: any;
  }

  /**
   * Interface that represents response from the public API server.
   * @interface
  */
  export interface PublicApiResponse {
    /**
     * Gets or sets the request limits.
    */
    limits: {
      /**
       * Gets or sets the maximum number of the requst limit data.
      */
      limit: number,
      /**
       * Gets or sets the current number of the requst limit data.
      */
      remaining: number,
      /**
       * Gets or sets the The time in seconds before the access token expires.
      */
      reset: number
    };
    /**
     * Gets or sets the response data.
    */
    [propName: string]: any;
  }

  /**
   * Interface that represents a standard callback function.
   * @interface
  */
  export interface Callback<T> {
    /**
     * @param {any} err - An error that occured executing the method, if execution failed.
     * @param {T} result - Result of the method execution, if execution succeeded.
    */
    (err: any, result: T): void;
  }

  /**
   * Interface that represents a standard error callback function.
   * @interface
  */
  export interface ErrorCallback {
    /**
     * @param {any} err - An error that occured executing the method, if execution failed.
    */
    (err: any): void;
  }

}