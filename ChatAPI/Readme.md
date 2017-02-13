[<img src="iis.png">](https://www.iis.se/)

[Internetfonden, Internetstiftelsen i Sverige](https://www.iis.se/)

## Overview

This repository contains source code and samples for the client-side JS library for communication with the Chat API.
Client-side JS library makes it simple to build a chat with Swedish linguistic and language learning features.
The library supports all necessary collections such as Contacts, Conversations, and others, and takes care of all communications with the chat server and with Dictionary API for linguistic features. It even provides a ready-made UI widget for the chat. Using that widget, creating such chat is a simple task with very little code, as demonstrated by a sample here. If more customization is needed, that is also possible. For more details, see documents in the docs folder.

## Folders

* *client*: Client-side JS library. Contains library source and, in the *client/test* folder, an HTML page with code for testing Chat API and exploring its functions ('chat server explorer', see description in docs/chat-socket-io.txt).

* *docs*: Documents describing how to use Chat API and client-side JS library. 

* *server-sample*: A simple working example of a chat. Contains sample server code (folder *server-sample*) and client code (folder *server-sample/public*)    

## Installation

We tested this on Linux, Windows and Mac OS X.

* Make sure node.js is installed on the machine.

* Make sure TypeScript is installed on the machine. These sources were tested with TypeScript 2.0. You'll also need *typings* (to install: npm install -g typings)

* Get dependencies (npm install, typings install), compile (tsc), and run (npm start):

  cd server-sample
  npm install  
  typings install
  tsc  
  npm start

The last command starts a sample server listening on port 3102.

To use the chat in your browser, open http://localhost:3102.

## Working with the sample app without installation

If you don't want to install anything on your computer (or if you only have a browser and nothing else), you can open the same app hosted on our server, just enter the following in your browser address line:

http://lrcmain.brainglass.com:3102/

