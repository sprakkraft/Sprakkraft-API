module Poly {
    /**
     * config options for the widget
    */
    export interface IConfig {
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
    /** For external use */
        usePlugin?: boolean,
        _core?: any 
    }

    /** Names for classes and attributes, if defaults need to be changed */
    export interface IStyles {
    /** Class name for blocks that are already parsed */
        cnCurrentBlock?:string,
    /** Class name for words that the user supposedly knows */
        cnWordKnow?:string,
    /** Class name for words that the user is recommended to learn */
        cnWordWantKnow?:string,
    /** Class name for words that the user supposedly does not know and does not need to learn at this level */
        cnWordDontKnow?:string,
    /** Class name for idiom (phrase) wrapper */
        cnIdiom?:string,
    /** Class name for words that are not in the dictionary */
        cnOutOfVocab?:string,
    /** Attribute indicating that an element is proccessed */
        attrBlockParsed?:string,
    /** id for the PopUp element */
        cnTranslateBox?:string,
    }
    
    /** Interface representing a single word in analysis result returned by the API */
    export interface IAnalyzedWord {
        lemma?:string,
        token?:string,
        grade?:number,
        pos?:string,
        tag?:string,
        idiom?:Object,
        colloc?:Object
    }
    
    /** Interface  representing analysis API result */
    export interface ITextData {
        analyzed: Array<IAnalyzedWord>,
        userData: {
            known: any,
            learn: Array<any>
        }
    }
    
    /** Interface representing data passed for translating and showing in translation popup */
    export interface IPopupWord {
        token:string,
        lemma:string,
        grade:string,
        pos:string,
        userGrade: UserGrades,
        color:string,
        idiom?:string,
    }
}


interface ObjectConstructor {
    assign(target: any, ...sources: any[]): any;
}

if (typeof Object.assign != 'function') {
  (function () {
    Object.assign = function (target) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var output = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== undefined && source !== null) {
          for (var nextKey in source) {
            if (source.hasOwnProperty(nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
      }
      return output;
    };
  })();
}

interface Window {
    PolyWidget: Object
}
