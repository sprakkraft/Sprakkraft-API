/// <reference path="javascripts/contacts.ts" /> 
/// <reference path="javascripts/conversations.ts" /> 
/// <reference path="javascripts/conversationUI.ts" /> 
/// <reference path="javascripts/core.ts" /> 
/// <reference path="javascripts/list.ts" /> 
/// <reference path="javascripts/messages.ts" />
/// <reference path="javascripts/model.ts" /> 
/// <reference path="javascripts/widget.ts" />


interface PolyWidget {
    startParseEditable: Function,
    parse: Function,
    plugin: any
}

interface Window {
    poly: PolyWidget,
    PolyWidget: any
}