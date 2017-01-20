/// <reference path="api.ts" />
/// <reference path="textAnalyzer.ts" />
/// <reference path="translator.ts" />

module Poly {
    export class PolyWidget {
        /** Element being parsed */
        element: HTMLElement;

        /** Popup showing translations and definitions */
        popup: PopUp;
        public static Config: IConfig;
        public static CurentElement;
        public static EditableElement;
        public static PreviousElements = [];

        private editableParser:EditableParser;
        private parseBookHandler:EventListener;

        public plugin: any;

        constructor(config:IConfig = {}) {
            config.styles = Object.assign({}, this.getDefaultStyles(), config.styles);
            config = Object.assign({}, config);
            PolyWidget.Config = config;
            let { element } = config;
            this.element = element;

            if (config.usePlugin && PolyPlugin) {
                this.plugin = new PolyPlugin(this, config);
            } else {
                this.element && this.parse(this.element, config);
            }

            this.popup = this.createPopup();
        }

        /**
         * Start parsing in a 'book mode' (binds to the click event).
         * 'Book mode' is our term for the mode in which current block for parsing
         * (analysing text and highlighting) is determined by where the user clicked.
        */
        public parseBook() {
            const parseBookEventHandler:EventListener = this.parseBookClick.bind(this)
            document.addEventListener('click', parseBookEventHandler, true)
            this.parseBookHandler = parseBookEventHandler;
        }

        /**
         * Stop parsing in book mode.
         * Removes the eventListener.
        */
        public stopParseBook() {
            document.removeEventListener('click', this.parseBookHandler);
        }

        /** For all parsed blocks, hide highlighting spans,
         * then parse the clicked block.
        */
        private parseBookClick(e:MouseEvent) {
            let target = <HTMLElement>e.target;
            for (let elem = target; elem != null; elem = elem.parentElement) {
                if (elem.className.indexOf('poly-box') != -1 || elem.className.indexOf('poly-tab') != -1) {
                    return;
                }
            }
            target = utils.findBlockParent(target);
            if (target.className.indexOf('poly-current') != -1) return;
            const selector = "["+PolyWidget.Config.styles.attrBlockParsed+"]";
            let nodeList = document.querySelectorAll(selector);
            let elements = Array.prototype.slice.call(nodeList);
            this.toggleBlocks(target, elements, e);
        }
         /**
         * Main parsing function.
         * Parse part of the element if in blockSeparator mode or in tagSeparator mode (in Config).
         * Otherwise, parse the entire element.
         */
        private parse(element:HTMLElement = PolyWidget.Config.element, config:IConfig = PolyWidget.Config) {
            if (!element) throw new Error('No element specified');
            if (config.blockSeparator) {
                this.processBySeparator(element, config.blockSeparator)
            }
            else if (config.tagSeparator) {
                this.processByTags(element, config.tagSeparator);
            }
            else {
                this.processByAll(element);
            }
        }

        /**
         * Start parsing an editable element
         */
        public startParseEditable(element:HTMLElement, config: IConfig = PolyWidget.Config) {
            if (!element) throw new Error('No element specified');
            this.editableParser = new EditableParser(element, config, this);
            this.editableParser.start();
        }

        /**
        * Start parting a list of elements with Analyzed data
        */
        public parseElementsWithData(elements: HTMLElement[], parent: HTMLElement, data) {
            PolyWidget.CurentElement = parent;
            const { attrBlockParsed, cnCurrentBlock } = PolyWidget.Config.styles;
            elements.forEach(element => {
              textAnalyze.setTextData(data);
              textAnalyze.parseElement(element, data.analyzed.concat());

              this.bindToPopup(element);
              element.setAttribute(attrBlockParsed, "true");
              element.classList.add(cnCurrentBlock);
            });
        }

        /**
         * Stop parsing an editable element. Removes the listener.
         */
        public stopParseEditable() {
            this.editableParser.stop();
        }

        /**
         * Translate a word or phrase and show it in the translation popup.
         */
        public showDictPopup(lemma:string, level:number, pos:string, phrase:string, difficulty:number, x?: number, y?: number, token?:string, callback?:any) {
            let word: IPopupWord = {
                token: token,
                lemma: lemma,
                grade: ['1','2','3','4','5','6'][level - 1],
                pos: pos,
                idiom: phrase,
                userGrade: difficulty,
                color: textAnalyze.gradeToColor(difficulty)
            };
            this.popup.show(word, null, x, y, callback);
        }

        /**
         * Split the element with separator
         */
        private processBySeparator(element:HTMLElement, separator:string = PolyWidget.Config.blockSeparator) {
            if (!separator) throw new Error('No separator specified');
            let blocks: Array<HTMLElement> = this.parseBlocksBySeparator(element, separator);
            this.bindBlocks(blocks);
        }

        /**
        * Split the element using tags
        */
        private processByTags(element: HTMLElement, tagName: string = PolyWidget.Config.tagSeparator) {
            if (!tagName) throw new Error('No tagName specified');
            let blocks: Array<HTMLElement> = this.parseBlocksByTag(element, tagName);
            this.bindBlocks(blocks);
        }
        /**
         * Bind blocks to the click event, to be able to switch between them
         */
        private bindBlocks(blocks: Array<HTMLElement>) {
            for (let block of blocks) {
                block.className += ' poly-ready';
                //@TODO: Add ability to remove event listener
                block.addEventListener('click', this.toggleBlocks.bind(this, block, blocks))
            }
        }

        /**
         * Analyze the entire element
         */
        private processByAll(element:HTMLElement) {
            if (!element) throw new Error('No element specified');
            this.parseElement(element);
        }

        /**
         * Remove cnCurrentBlock class from all blocks and
         * unbind popup from these blocks,
         *  then parse the target
         * (which makes the block "current" and binds words to popup)
         */
        private toggleBlocks(target:HTMLElement, blocks:Array<HTMLElement>, event: MouseEvent) {
            const { cnCurrentBlock } = PolyWidget.Config.styles;
            for (let block of blocks) {
                if(!utils.isBlockElement(block)) continue;
                block.classList.remove(cnCurrentBlock);
                this.unbindToPopup(block);
            }
            this.parseElement(target);
        }

        /**
         * Parsing an element by tag.
         * Add elements with that tag to the array.
         * @returns Array of blocks with given tagName
         */
        private parseBlocksByTag(element: HTMLElement, tagName: string) {
            let childNodes = element.childNodes;
            let blocks:Array<HTMLElement> = [];
            for (let i = 0; i < childNodes.length; i++) {
                let child = childNodes[i];
                if (child.nodeName == tagName.toUpperCase()) {
                    blocks.push(<HTMLElement>child);
                }
            }
            return blocks;
        }

        /**
         * Parsing an element by separator.
         * Elements with the separator attribute are added to the array.
         * @returns Array of blocks having this attribute.
         */
        private parseBlocksBySeparator(element: HTMLElement, separator: string) {
            let childNodes = element.childNodes;
            let blocks:Array<HTMLElement> = [];

            for (let i = 0; i < childNodes.length; i++) {
                let child = childNodes[i];
                if (child.nodeType == Node.TEXT_NODE) continue;
                let attributes = child.attributes;

                let found = false;
                for (let y = 0; y < attributes.length; y++) {
                    let attr = attributes[y];
                    if (attr.name === separator) {
                        blocks.push(<HTMLElement>child);
                        found = true;
                    }
                }
                if (!found && child.childNodes.length > 0) {
                    let innerBlocks = this.parseBlocksBySeparator(<HTMLElement>child, separator);
                    if (innerBlocks.length > 0) blocks = blocks.concat(innerBlocks);
                }
            }
            return blocks;
        }

        /**
         * Parse the entire  element.
         * If the element is already parsed, just add class cnCurrentBlock.
         * Otherwise, make API call and parse with TextAnalyzer.
         */
        private parseElement(element:HTMLElement) {
            PolyWidget.CurentElement = element;
            this.registerElement(element);
            let shouldUpdate = false;
            const { attrBlockParsed, cnCurrentBlock } = PolyWidget.Config.styles;
            console.log('Parse Element')
            if (element.getAttribute(attrBlockParsed)) {
                element.classList.add(cnCurrentBlock);
                //@TODO: Prevent showing popup if it is not in the current block
                this.bindToPopup(element);
                shouldUpdate = true;
            }

            let elementText = element.textContent;

            PolyWidget.AnalyzeText(elementText, (textData: ITextData) => {
                let analyzed = textData.analyzed;
                textAnalyze.parseElement(element, analyzed);

                this.bindToPopup(element);
                element.setAttribute(attrBlockParsed, "true");
                element.classList.add(cnCurrentBlock);
            });
        }

        registerElement(element) {
            let isDuplicated = false;
            PolyWidget.PreviousElements.forEach((previousEl) => {
                if(previousEl.isEqualNode(element)) {
                    isDuplicated = true;
                    return element;
                }
            });
            if (!isDuplicated) {
                PolyWidget.PreviousElements.push(element);
            }
        }

        /**
         * Create the popup and append it to the end of the body element
         */
        private createPopup() {
            let popup:PopUp = new PopUp();
            let body = document.getElementsByTagName('body')[0];
            if (!body) console.error('No body element');
            else body.appendChild(popup.popupElement);
            return popup;
        }

        public setReadOnly(readOnly: boolean) {
            this.popup.readOnly = readOnly;
        }

        /**
         * Return default styles, to use for classes  not specified in Config.
         */
        private getDefaultStyles() {
            return {
                cnCurrentBlock: 'poly-current',
                cnWordKnow:     'green',
                cnWordWantKnow: 'yellow',
                cnWordDontKnow: 'red',
                cnIdiom:        'idiom',
                cnOutOfVocab:   'out-of-vocab',
                attrBlockParsed:'poly-processed',
                cnTranslateBox: 'translateBox',
            }
        }

        public bindToPopup(element) {
            this.popup.bindWords(element, 'click');
        }

        public unbindToPopup(element) {
            return this.popup.unbindWords(element, 'click')
        }

        /**
         * Call API fr analysis
         */
        static AnalyzeText(text, cb) {
            return API.analyzeText(text)
                .then((textData: ITextData) => {
                    textAnalyze.setTextData(textData);
                    cb(textData);
                })
        }
    }
}

// Make PolyWidget global
var PolyWidget = Poly.PolyWidget;
window.PolyWidget = PolyWidget;

// FontAwesome icons
(function () {
    var head  = document.getElementsByTagName('head')[0];
    var link  = document.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = 'https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css';
    link.media = 'all';
    head.appendChild(link);
})();
