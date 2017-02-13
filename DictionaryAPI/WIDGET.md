[<img src="../iis.png">](https://www.iis.se/)

[Internetfonden, Internetstiftelsen i Sverige](https://www.iis.se/)

## Overview

This is a non-visual widget that can connect to any block/paragraph of HTML on a web page, send its
text to a server that uses Dictionary API for analysis and, upon receiving response from the server,
highlight words in the text according to their properties in the analyzed result:
* Idioms and collocations (phrases) can be highlighted. Default highlight for phrases: italic
underlined.
* Compound words can be highlighted (default: underline), and parts of the compound can be
highlighted to make part split visual.
* CEFR grade (importance for the learner) can be used to highlight words according to their
importance. Default: three levels of importance according to the user’s level (level specified as a
widget’s setting, from 1 to 6) – green for words below the user’s level (meaning the user
probably already knows them), yellow for words on the user’s level (recommended to learn),
red for words above the user’s level (maybe look up to understand the meaning of the sentence
but don’t try to memorize them).

It also includes a visual widget, a popup showing translations of words and phrases when the user clicks/taps
them. If the word is inside a phrase, both word and phrase translation is shown.
It also shows the CEFR grade of the word (optionally) highlighted with corresponding color customizable
with styles.

The code is open source and free for any use. It is fully customizable with styles for appearance,
and with code if needed.

## Usage

Instantiate *PolyWidget* with a config object, for example
```javascript
var config = {
        element: *HTML element*
    }
}
var parser = new PolyWidget(config);
```
If *element* property is included in config at this time, parsing (ananlyzing text and highlighting) starts immidiately.
Otherwise, call the *parser.parse(element)* method:
```javascript
var parser = new PolyWidget();
parser.parse(*HTML element*)
```

See below for the full list of config options.

If you need different config options for different *parse* calls, you can pass a config object to each *parse* call:

```javascript
parser.parse(*HTML element*, config);
```

## Book mode

It is called 'book mode' because it is intended for large tests, like books, that can't be
parsed at once and don't have a simple natural division into small blocks.
In this mode, parsing is performed where the user clicked (nearest block element containing the click point). 

To use this mode, set *book* property to *true* in the config object:
```javascript
var config = {
    element: *html element*,
    book: true
}
var parser = new PolyWidget(config);
```

## Parsing blocks

There are also two options, specified in the config object, for dividing text into smaller blocks for parsing.
You can specify a tag name for such elements, or use an attribute to mark such elements.
There are two samples demonstrating that.

## Parsing contentEditable elements

There is special support for input, textarea and any other contentEditable elements, so you can
highlight and translate words while the user is typing them.

Use *parser.startParseEditable(element, config)* to start parsing while the user types,
and *parser.stopParseEditable()* to stop it:

```javascript
var parser = new PolyWidget({...});
parser.startParseEditable(*html element*, {});
...
...
parser.stopParseEditable();
```

## Config Options (see IConfig in interfaces.ts)
```javascript
    /** Element to work with */
        element?: HTMLElement,
    /** 'Book' mode: block for parsing is determined by where the user clicked */
        book?: boolean,
    /** Attribute mode: blocks for parsing are determined by splitting at the elements having this attribute */
        blockSeparator?: string,
    /** Tag mode: blocks for parsing are elements having this tag name */
        tagSeparator?: string,
    /** Sets the language to translate to (ISO-693-1 format). Default 'en'. */
        toLang?: string,
    /** The user's CEFR level of language knowledge. Number from 1 to 6. Default: 1.
     *  Words on this level are highlighted yellow, below it - green, above it - red */
        level?: string,
    /** Names for classes and attributes, if defaults need to be changed */
        styles?: IStyles,
```

## Samples

To try samples in the *samples* directory, start the server:

npm start 

or, if .js files are already compiled

node server.js

and open the browser at

http://localhost:3200/samples/








