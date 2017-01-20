/// <reference path="main.ts" />
/// <reference path="utils.ts" />

module Poly {

    export enum UserGrades {
        know = 0,
        wantKnow1 = 1,
        wantKnow2 = 2,
        wantKnow3 = 3,
        wantKnow4 = 4,
        dontKnow = 5
    }
    /**
     * Class doing the parsing and highlighting (wrapping words with spans) based on
     * text analysis results obtained from the API
     */
    export class TextAnalyze {
        private textData: ITextData;

        public setTextData(textData: ITextData) {
            this.textData = textData;
        }

        /**
         * Method starting parse
         */
        public parseElement(element:HTMLElement, analyzed:Array<IAnalyzedWord>) {
            let foundAtAll = this.parse(element, analyzed);
            if (!foundAtAll) { analyzed.shift(); this.parseElement(element, analyzed)}
        }

        /** Recursive updates  */
        public update(element:HTMLElement, analyzed:Array<IAnalyzedWord>) {
            analyzed.forEach((word) => {
                const nodes = element.childNodes;
                for(let i = 0; i < nodes.length; i++){
                    let node:any = nodes[i];

                    if (node.nodeType == Node.TEXT_NODE || node.nodeType == Node.COMMENT_NODE) continue;
                    if (node.childNodes.length > 1) this.update(<HTMLElement>node, analyzed);

                    if (node.getAttribute('poly-processed')) {
                        let lemma = node.getAttribute('poly-lemma');
                        let wordLemma = word.lemma || word.token;
                        if (wordLemma == lemma) {
                            this.updateNodeFull(node, word);
                            analyzed.shift();
                            word = analyzed[0];
                            if (!word) return;
                        }
                    }
                }
            })
        }

        /**
         * Look for a word inside an element (comparison by lemma), and change node color
         */
        public updateNodes(element:HTMLElement, word, newUserGrade, cnColor?:string) {
            if (!element) return;
            const nodes = element.childNodes;
            for (let i = 0; i < nodes.length; i++){
                let node:any = nodes[i];
                if (node.nodeType != Node.ELEMENT_NODE) continue;
                if (node.childNodes.length >= 1) this.updateNodes(<HTMLElement>node, word, newUserGrade, cnColor);
                let lemma = node.getAttribute('poly-lemma');
                if (word.lemma == lemma) {
                    node.setAttribute('poly-userGrade', newUserGrade);
                    this.changeNodeColor(node, word, cnColor);
                }
            }
        }

        /**
         * Reset all attributes in an element
         */
        public updateNodeFull(span:HTMLElement, analyzed:IAnalyzedWord) {
            this.setAttributes(span, analyzed);
        }

        /**
         * Set className based on word data
         */
        private changeNodeColor(node, word, cnColor?:string) {
            let color;
            if (cnColor) color = cnColor
            else color = this.computeColor(word)
            node.className = color;
        }

        /**
         * Main method. Find text node and parse it.
         */
        private parse(element:HTMLElement, analyzed:Array<IAnalyzedWord>) {
            let nodes = element.childNodes;
            for (let i=0; i<nodes.length; i++) {
                const node:any = nodes[i];
                if (node.nodeType == Node.TEXT_NODE) {
                    if (analyzed[0] == undefined) return true;
                    try {
                        const found = this.parseTextToFindWord(node, analyzed);
                        if (found) {
                            analyzed.shift();
                            i++;
                        }
                        if (!found && i === nodes.length-1) return false;
                    } catch(e) {
                        console.log('Error while parsing:', e);
                    }
                }
                else {
                    const { attrBlockParsed } = PolyWidget.Config.styles;
                    const polyProccessedAttr = node.getAttribute && node.getAttribute(attrBlockParsed);
                    if (polyProccessedAttr) continue;
                    let foundInRecursion = this.parse(<HTMLElement>node, analyzed);
                    if (!foundInRecursion && i === nodes.length-1) return false;
                }
            }
            return true;
        }

        private unwrapIdiom(idiom, array?) {            
            array = array || [];
            let that = this;
            idiom.forEach(word => {
                if (word.idiom) {
                    that.unwrapIdiom(word.idiom, array);
                } else {
                    array.push(word);
                }
            });
            return array;
        }

        /**
         * Takes textNode and AnalyzedWord.
         * If AnalyzedWord word is an idiom (phrase) then parse it as idiom.
         * Otherwise, pass it to this.parseWord.
         */
        private parseTextToFindWord(textNode:Node, analyzed:Array<IAnalyzedWord>) {
            let text = textNode.nodeValue.trim();
            //Remove spaces
            if (text && text === "" || text.length < 1) return false;
            let word = analyzed[0]; 
            var idiom:any = word.idiom || word.colloc;
            let idiomText = '';
            if (idiom) {
                idiom = this.unwrapIdiom(idiom);
                let tokens = [];
                idiom.forEach(word => {
                    let token = word.token || word.lemma;
                    idiomText += token + " ";
                    tokens.push(token);
                });
                if (this.matchWords([tokens[0]], textNode) != null && this.matchWords(tokens, textNode) == null) {
                     // limitation: idiom must not span text nodes
                    analyzed.shift();
                    idiom.reverse().forEach(word => {
                        analyzed.unshift(word);
                    });
                    idiom = null;
                    word = analyzed[0]; 
                }
            }

            let found;
            if (idiom) {
                found = this.parseIdiom(word, textNode, textNode.parentNode, idiomText); 
            } else {
                found = this.parseWord(word, textNode, textNode.parentNode);
            }
            if (found === true || found === false) return found;
            else return !!found.span;
        }
        /**
         * For an idiom (phrase), wrap it first into an idiom wrapper,
         * then proccess words inside the idiom as usual
         */
        private parseIdiom(word, textNode, parent, idiomText) {
            var idiomWrapper = this.composeIdiomWraper();
            var idiom = word.idiom || word.colloc;
            idiom = this.unwrapIdiom(idiom);

            for(var i = 0; i < idiom.length; i++) {
                var oneWord = idiom[i];
                var rest = this.parseWord(oneWord, textNode, parent, idiomText);
                if(!rest) return false;
                var {restText, span} = rest;

                //If it is the beigining, insert idiomWrapper
                if (i == 0) parent.insertBefore(idiomWrapper, span)
                else idiomWrapper.appendChild(textNode);

                idiomWrapper.appendChild(span);

                textNode = restText;
            }

            return true;
        }

        /**
         * Escape special characters in a word, for use in a regular expression
         */
        private static regExpEscape(word:string) {
            // from https://github.com/jonathantneal/regexp-escape/blob/master/RegExp.escape.js
            return word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        }
        
        /**
         * Utility method for regexp match
         */
        private matchWords(tokens:string[], textNode: Node) {
            let regExpStr = '';
            tokens.forEach(token => regExpStr += TextAnalyze.regExpEscape(token) + '\\s*');
            try {
                let regexp = new RegExp(regExpStr);
                return textNode.textContent.match(regexp);
            }
            catch (error) {
                return null;
            }
        }

        /**
         * Find a word inside textNode and wrap it
         */
        private parseWord(word:IAnalyzedWord, textNode:Node, parent:Node, idiom?:string):{restText?, span?} {
            let token = word.token;
            var match = this.matchWords([<string>token], textNode);
            if (match == null) return false;
            var span = this.composeTag(word, idiom);
            var restText = this.wrap(span, textNode, match.index, token.length, parent);
            return {restText,span};
        }

        /**
         * Splitting and wrapping the text
         */
        private wrap(wrapper, textNode, start, end, parent) {
            var text = textNode.splitText(start);
            var restText = text.splitText(end); // text is the word that we were looking for, restText contains the rest
            parent.insertBefore(wrapper, text); //Insert the wrapper before our word
            wrapper.insertBefore(text, null); //Move the word inside span
            return restText;
        }
         /**
         * Compute color for a word
         */
        public computeColor(word):string {
           const {grade, tag, pos} = word,
                 lemma = word.lemma || word.token;
           const {cnWordKnow,
                  cnWordWantKnow,
                  cnOutOfVocab,
                  cnWordDontKnow} = PolyWidget.Config.styles;
           if (grade === -1) return cnOutOfVocab;
           if (PolyWidget.Config.usePlugin && this.textData.userData)
               return this.computeColorUser(lemma, pos || tag);
           else
               return this.computeColorGrade(grade);
        }
        /**
         * Compute user grade based on user info
         */
        private computeUserGrade(word:string, pos:string) {
            let grade = this.findUserGrade(word + '|' + pos);
            if (grade != UserGrades.dontKnow) return grade;
            return this.findUserGrade(word + '|');
        }

        private findUserGrade(word:string) {
            const { known, learn } = this.textData.userData;
            if (known && known[word] != null) return UserGrades.know;
            for (let i = 0; learn && i < learn.length && learn[i]; i++) {
                if (learn[i][word] != null) {
                    switch (i) {
                      case 0: return UserGrades.wantKnow1;
                      case 1: return UserGrades.wantKnow2;
                      case 2: return UserGrades.wantKnow3;
                      case 3: return UserGrades.wantKnow4;
                    }
                }
            }
            return UserGrades.dontKnow;
        }

        private computeColorUser(word:string, pos:string):string {
            let grade:UserGrades = this.computeUserGrade(word, pos);
            return this.gradeToColor(grade);
        }

        public gradeToColor(grade:UserGrades) {
            const {cnWordKnow,
                   cnWordWantKnow,
                   cnOutOfVocab,
                   cnWordDontKnow} = PolyWidget.Config.styles;

            switch(grade) {
                case UserGrades.know:
                    return cnWordKnow;
                case UserGrades.wantKnow1:
                case UserGrades.wantKnow2:
                case UserGrades.wantKnow3:
                case UserGrades.wantKnow4:
                    return cnWordWantKnow;
                case UserGrades.dontKnow:
                    return cnWordDontKnow;
            }
        }

        /**
         * Returns color based on word level
         */
        private computeColorGrade(grade:number) {
            let level = PolyWidget.Config.level || 1;

            const {cnWordKnow,
                   cnWordWantKnow,
                   cnOutOfVocab,
                   cnWordDontKnow} = PolyWidget.Config.styles;
            if(grade === -1) return cnOutOfVocab;

            if(grade < level)
                return cnWordKnow
            else if(grade == level)
                return cnWordWantKnow
            return cnWordDontKnow
        }
        /**
         * Make a span and set attributes
         */
        private composeTag(word, idiom?:string) {
            var spanElement = <HTMLElement>document.createElement('span');
            spanElement = this.setAttributes(spanElement, word);
            idiom && spanElement.setAttribute('poly-idiom', idiom);
            return spanElement;
        }
        
        /**
         * Set atributes based on analyzed word
         */
        private setAttributes(element:HTMLElement, word) {
            const {attrBlockParsed} = PolyWidget.Config.styles;
            if (!word) return null;
            let lemma = word.lemma || word.token,
                userGrade;
            const cnWordKnowledge = this.computeColor(word);
            if (PolyWidget.Config.usePlugin && this.textData.userData)
                userGrade = this.computeUserGrade(lemma, word.pos || word.tag);
            element.setAttribute(attrBlockParsed, 'true');
            element.setAttribute('poly-lemma', lemma);
            element.setAttribute('poly-grade', word.grade || -1);
            element.setAttribute('poly-userGrade', userGrade);
            element.className = cnWordKnowledge;
            if (userGrade == 2) {
                element.classList.add('poly-1dot');
            } else if (userGrade == 1) {
                element.classList.add('poly-2dots');
            }
            element.setAttribute('poly-pos', word.pos || word.tag);
            return element;
        }

        /**
         * Creats idiom wrapper
         */
        private composeIdiomWraper() {
            const {attrBlockParsed, cnIdiom} = PolyWidget.Config.styles;
            var spanElement = <HTMLElement>document.createElement('span');
            spanElement.className = cnIdiom;
            spanElement.setAttribute(attrBlockParsed, 'true');
            return spanElement;
        }
    }

    export var textAnalyze = new TextAnalyze;
}
