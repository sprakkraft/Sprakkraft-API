module Poly {
    /**
     * Block tags
     */
    const blockElements = ["address", "article", "aside", "audio", "blockquote", "body", "canvas", "dd", "div", "dl", "fieldset",
      "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "noscript",
      "ol", "output", "p", "pre", "section", "table", "tr", "td", "tbody", "tfoot", "ul", "video", "li"]
    
    export var utils = {
        isBlockElement(node) {
             return node.nodeType == 1 && blockElements.indexOf(node.tagName.toLowerCase()) >= 0; 
        },
        selectText(text) {
            var doc:any = document,
                range,selection;
            if (doc.body.createTextRange) {
                range = doc.body.createTextRange();
                range.moveToElementText(text);
                range.select();
            } else if (window.getSelection) {
                selection = window.getSelection();        
                range = document.createRange();
                range.selectNodeContents(text);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        },
        
        /**
         * Sets the caret to an offset inside an element (not currently used) 
         */
        setCaret(elem, offset:number) {
            var range = document.createRange();
            var sel = window.getSelection();
            range.setStart(elem, offset);
            range.setEnd(elem, offset);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        },
        /**
         * Look up a tree to find a block node
         */
        findBlockParent(element:Node) {
            if (utils.isBlockElement(element)) return element;
            return this.findBlockParent(element.parentNode);
        }
        
    }
}