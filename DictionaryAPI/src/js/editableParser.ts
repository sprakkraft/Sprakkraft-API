/// <reference path="api.ts" />
/// <reference path="textAnalyzer.ts" />
/// <reference path="translator.ts" />
    
module Poly {
    /**
     * Parsing contentEditable elements
     */
    export class EditableParser {
        /** For finding the difference betwen the current change and the last one */
        private lastText:string;
        private lastCaret:number = 0;
        /** Element being parsed */
        private element:HTMLElement;
        /** Reference to the method in eventListener */
        private eventRef;
        private pasteHandler;

        private polyWidget:PolyWidget;
        
        constructor(element:HTMLElement, config: IConfig = PolyWidget.Config, polyWidget:PolyWidget) {
            const {cnCurrentBlock} = PolyWidget.Config.styles;
            this.element = element;
            this.element.classList.add(cnCurrentBlock);
            this.lastText = "";
            this.polyWidget = polyWidget;
        }
        /**
         * Creates a listener for element and 
         * stores it inside this.eventRef for correct removing
         */
        start() {
            this.eventRef = this.parse.bind(this);
            this.pasteHandler = this.onPaste.bind(this);
            this.element.addEventListener('input', this.eventRef)
            this.element.addEventListener('paste', this.pasteHandler);

            PolyWidget.EditableElement = this.element;
        }
        /**
         * Removes the parse listener from the element
         */
        stop() {
            this.element.removeEventListener('input',this.eventRef)
            this.element.removeEventListener('paste',this.pasteHandler)
        }
        /**
         * Main method of EditableParser.
         * Firstl get the caret position, then 
         * decide whether to send the word for translation to the server,
         * and find out whether the change was inside the parsed span or not.
         * Based on  that information, update the span or wrap the text.
         */
        parse(e) {
            console.log('Change Event:', e);
            this.lastCaret = this.getCaretCharacterOffsetWithin(this.element);
            console.log('Caret', this.lastCaret);

            this.resetMarkUp();
            // this.setCaret(this.element, this.lastCaret,this.lastCaret);
            // console.log('after Set Caret:',this.getCaretCharacterOffsetWithin(this.element));
            setTimeout(() => {
                this.setCursor();
            })
            PolyWidget.AnalyzeText(this.element.innerText, (translations:any) => {
                textAnalyze.parseElement(this.element, translations.analyzed);
                this.updatePopupBinds();
                setTimeout(() => {
                    this.setCursor();
                })
            })
        }

        resetMarkUp() {
            this.element.innerHTML = this.element.innerText;
        }

        setCursor() {
            this.setCursorToEnd(this.element);
        }

        setCaret(el, start, end) {
            if (document.createRange && window.getSelection) {
                var range = document.createRange();
                range.selectNodeContents(el);
                var textNodes = this.getTextNodesIn(el);
                var foundStart = false;
                var charCount = 0, endCharCount;

                for (var i = 0, textNode; textNode = textNodes[i++]; ) {
                    endCharCount = charCount + textNode.length;
                    if (!foundStart && start >= charCount
                        && (start < endCharCount ||
                        (start == endCharCount && i <= textNodes.length))) {
                        range.setStart(textNode, start - charCount);
                        foundStart = true;
                    }
                    if (foundStart && end <= endCharCount) {
                        range.setEnd(textNode, end - charCount);
                        break;
                    }
                    charCount = endCharCount;
                }

                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document['selection'] && document.body['createTextRange']) {
                var textRange = document.body['createTextRange()'];
                textRange.moveToElementText(el);
                textRange.collapse(true);
                textRange.moveEnd("character", end);
                textRange.moveStart("character", start);
                textRange.select();
            }
        }

        getTextNodesIn(node) {
            var textNodes = [];
            if (node.nodeType == 3) {
                textNodes.push(node);
            } else {
                var children = node.childNodes;
                for (var i = 0, len = children.length; i < len; ++i) {
                    textNodes.push.apply(textNodes, this.getTextNodesIn(children[i]));
                }
            }
            return textNodes;
        }

        getCaretCharacterOffsetWithin(element) {
            var caretOffset = 0;
            if (typeof window.getSelection != "undefined") {
                var range = window.getSelection().getRangeAt(0);
                var preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(element);
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                caretOffset = preCaretRange.toString().length;
            } else if (typeof document['selection'] != "undefined" && document['selection'].type != "Control") {
                var textRange = document['selection'].createRange();
                var preCaretTextRange = document.body['createTextRange']();
                preCaretTextRange.moveToElementText(element);
                preCaretTextRange.setEndPoint("EndToEnd", textRange);
                caretOffset = preCaretTextRange.text.length;
            }
            return caretOffset;
        }

        onPaste(e) {
            e.preventDefault();
            let textPlain= e.clipboardData.getData('text/plain');
            document.execCommand("insertHTML", false, textPlain);
            PolyWidget.AnalyzeText(textPlain,(translations:any) => {
                textAnalyze.parseElement(this.element, translations.analyzed);
                this.updatePopupBinds();
            })
        }

        setCursorToEnd(el) {

            el.focus();
            if (typeof window.getSelection != "undefined"
                && typeof document.createRange != "undefined") {
                var range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (typeof document.body['createTextRange'] != "undefined") {
                var textRange = document.body['createTextRange']();
                textRange.moveToElementText(el);
                textRange.collapse(false);
                textRange.select();
            }

        }

        updatePopupBinds() {
            const element = this.element;
            this.polyWidget.unbindToPopup(element);
            this.polyWidget.bindToPopup(element);
        }
    }
}