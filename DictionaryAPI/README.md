[<img style="width:48px;height:48px;position:relative" src="https://www.iis.se/docs/iis_logo.png"><span style="top:25px;position:absolute;font-size:22px;padding-left:10px"> Internetfonden, Internetstiftelsen i Sverige</span>](https://www.iis.se/)

## Overview

This is a non-visual widget that can connect to any block/paragraph of HTML on a web page,
send its text to a server that uses Dictionary API for analysis and, upon receiving response
from the server, highlight words in the text according to their properties in the analyzed result.
It also includes a visual widget, a popup showing translations of words and phrases when the user clicks/taps them.

For more details, see API.md and WIDGET.md

## Installation

We tested this on Linux, Windows and Mac OS X.

* This repository contains both TypeScript sources (.ts) and compiled JavaScript sources (.js),
so you don't need TypeScript compiler if you just want to use them. But if you need to change and recompile them,
make sure TypeScript is installed on the machine. These sources were tested with TypeScript 2.0.

* Make sure node.js is installed on the machine.

* Install Bower if it's not already installed:

  npm install -g bower

* Get dependencies, compile, and run:

  npm install
  bower install
  npm start

*npm start* compiles the source and starts sample server. If the sources werten't changed so they don't need to be compiled,
you can start the server simply with

  npm server

The server is listening on port 3200.

## Opening samples
Start the server and open the following URL in your browser:

http://localhost:3200/samples/

## More information

See API.md and WIDGET.md
