[<img src="../iis.png">](https://www.iis.se/)

[Internetfonden, Internetstiftelsen i Sverige](https://www.iis.se/)

# Dictionary API

The API analyzes Swedish sentences and translates individual words and phrases to the following languages:

English, Albanian, Arabic, Bosnian, Croatian, Farsi, Finnish, Greek, Kurdish, Russian, Serbian, Somali, Spanish, Turkish, Azerbaijani.

### URL:

http://lrcmain.brainglass.com/

### Authorization:

see explanation and examples in server.js

## Analyze GET request

### Path

analyze/text-data

### Options

*text*: Swedish text. Usually, a sentence or a paragraph.

### Response JSON

```javascript
{
    textData: {
        analyzed: [
            word1, word2,...
        ]
    }
}
```
where a word is either an object describing a single word (token):
```javascript
{
    lemma: string,
    token: string,
    tag: string,
    pos: string,
    grade: number
}
```
or an object describing a phrase (sequence of words), which can be an idiom or a collocation: 
```javascript
{
    idiom: [word1, word2, ...]
}
```
```javascript
{
    colloc: [word1, word2, ...]
}
```
A word inside an idiom or a collocation is a word object as described above (it cannot be an idiom or a collocation; nesting of phrases is not allowed).

#### Properties of a word object:

#### token:
The original word exactly as it occurs in the text.

#### lemma
Base (dictionary) form of the word.

#### pos
Part of speech. If *pos* property is absent, use *tag* property instead. Part of speech codes:

     NN: noun  
     VB: verb  
     JJ: adjective  
     RB: adverb  
     PR: pronoun  
     UH: interjection  
     IN: preposition  
     CC: conjunction  
     RP: particle  
     CD: numeral  

#### grade
Level (measure of difficulty) of the word according to CEFR (Common European Framework of Reference for Languages).
     Levels ARE NUMBERS from 1 to 6. Absence of the grade property means that the word is in our dictionary but not
     in CEFR vocabularty (which contains about 10,000 common Swedish words).  
     grade=-1 means that the word is not in our dictionary.

#### Response example for the text 'Han hade varit här varenda sommar i hella sitt liv':
 
[{"lemma":"han","token":"Han","tag":"PN","grade":1,"pos":"PR"},{"colloc":[{"lemma":"ha","token":"hade","tag":"VB","grade":1},{"lemma":"vara","token":"varit","tag":"VB","grade":1}]},{"token":"här","tag":"AB","grade":1,"pos":"RB"},{"token":"varenda","tag":"DT","pos":"PR"},{"token":"sommar","tag":"NN","grade":1},{"token":"i","tag":"PP","grade":1,"pos":"IN"},{"lemma":"hel","token":"hela","tag":"JJ","grade":1},{"lemma":"sin","token":"sitt","tag":"PN","grade":1,"pos":"PR"},{"token":"liv","tag":"NN","grade":1},{"token":".","tag":" MAD ","grade":-1,"sentenceEnd":""}]

## Translate GET request

### Path

dictionary/translation

### Options

*word*: The original word exactly as it occurs in the text (empty if a phrase is translated).

*lemma*: Base (dictionary) form of the word (empty if a phrase is translated).

*partOfSpeech*: Part of speech. See list of part of speech codes above. Empty if a phrase is translated.

*phrase*: Phrase to translate (empty is a single word is translated).

*toLanguage*: Target language.  Default 'en'. Format: ISO-693-1.

### Response JSON
For translating a single word:
```javascript
{
    translation: {
        word: {
                trans: ["translation1", "translation2", ...],
                gotPos: "POS code",
                orig: "original-word"
        }
    }
}
```
Returned *gotPos* can be different from the passed *partOfSpeech* if there is no exact match with partOfSpeech in the dictionary but there is a match for the same word with a different part of speech.     

For translating a phrase:
```javascript
{
    translation: {
        phrase: {
            trans: ["translation of the phrase"],
            orig: "original phrase"
        }
    }
}
```

#### Response example for a single word:

{"translation":{"word":{"trans":["video, video recording","picture, video"],"gotPos":"NN","orig":"video"}}}

#### Response example for a phrase:

{"translation":"phrase":{"trans":["this"],"orig":"det här"}}
 
