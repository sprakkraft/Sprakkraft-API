/// <reference path="api.ts" />
/// <reference path="textAnalyzer.ts" />

module Poly {
    var MIN_POPUP_WIDTH = 300;
    var eventListener;

    /** Popup showing translations and definitions */
    export class PopUp {
        popupElement: HTMLElement;
        popupTitle: HTMLElement;
        popupTitleWord: HTMLElement;
        popupTabs: HTMLElement;
        idiomArea: HTMLElement;
        popupTranslations: HTMLElement;
        popupGrade: HTMLElement;
        list: HTMLElement;
        resizeCorner: HTMLElement;

        isStatic: boolean;
        notResizable: boolean;
        readOnly: boolean;

        isDragging: boolean = false;
        isResizing: boolean = false;

        draggedX: number;
        draggedY: number;
        relativeX: number;
        relativeY: number;
        wasDragging: boolean;
        
        currentWord: IPopupWord;
        callback: any;

        lastClickTime: number = 0;

        /**
         * Set the properties and add eventListener for closing popup
         */
        constructor(isStatic = false, notResizable?: boolean, isReadOnly?: boolean) {
            this.generatePopup();
            this.isStatic = isStatic;
            this.notResizable = notResizable;
            this.readOnly = isReadOnly;
            //Hiding popup 
            document.addEventListener('mouseup', this.outerClick.bind(this));
            document.addEventListener('touchend', this.outerClick.bind(this));
        }
        /**
         * Handler for closing popup
         */
        outerClick(event) {
            if (this.isResizing) {
                event.preventDefault();
                this.isResizing = false;
                MIN_POPUP_WIDTH = this.popupElement.offsetWidth;
                return;
            }
            console.log('outerClick', event);
            let target = event.target;
            if (target.className.indexOf('poly-box') != -1 || target.className.indexOf('poly-tab') != -1 || target.tagName.toLowerCase() == 'html') {
                event.preventDefault();
                return false;
            }

            this.isDragging = false;
            this.currentWord = null;
            this.popupElement.classList.remove('show');
            this.popupElement.classList.add('hidden');
        }
        /**
         * Create popup
         */
        generatePopup(): HTMLElement {
            const {cnTranslateBox} = PolyWidget.Config.styles;
            let popupWrapper = document.createElement('div');
            popupWrapper.classList.add('hidden');
            popupWrapper.classList.add('poly-box-default');
            popupWrapper.classList.add(cnTranslateBox);
            popupWrapper.style.visibility = 'hidden';

            let popupTitle = document.createElement('div');
            popupTitle.classList.add('poly-box-header');

            let popupTitleWord = document.createElement('div');
            popupTitleWord.classList.add('poly-box-header-word');

            let popupClose = document.createElement('div');
            popupClose.classList.add('poly-box-close');
            popupClose.innerHTML = '<i class="fa fa-close"></i>';

            let idiomArea = document.createElement('div');
            idiomArea.classList.add('poly-box-idiom');

            let popupGrade = document.createElement('div');
            popupGrade.classList.add('poly-tab-grade');

            let resizeCorner = document.createElement('div');
            resizeCorner.classList.add('poly-box-resizeCorner');
            
            popupTitleWord.addEventListener('click', this.handleChangeDifficulty.bind(this));
            popupTitleWord.addEventListener('touchend', this.handleChangeDifficulty.bind(this));
            if (!this.isStatic) {
                popupTitle.addEventListener('mousedown', this.dragStart.bind(this));
                document.addEventListener('mouseup', this.dragEnd.bind(this));
                document.addEventListener('mousemove', this.dragging.bind(this));
                popupTitle.addEventListener('click', this.stopPropagation);

                popupTitleWord.addEventListener('touchstart', this.dragStart.bind(this));
                document.addEventListener('touchend', this.dragEnd.bind(this));
                document.addEventListener('touchmove', this.dragging.bind(this));
                popupTitle.addEventListener('touch', this.stopPropagation);
            }

            if (!this.notResizable) {
                resizeCorner.addEventListener('mousedown', this.resizeStart.bind(this));
                document.addEventListener('mousemove', this.resizeMove.bind(this));
            }

            let popupList = document.createElement('div');
            popupList.classList.add('poly-box-list');

            popupWrapper.appendChild(popupTitle);

            popupTitle.appendChild(popupTitleWord);
            popupTitle.appendChild(popupClose);

            popupWrapper.appendChild(idiomArea);

            popupTitleWord.appendChild(popupGrade);
            popupWrapper.appendChild(popupList);
            popupWrapper.appendChild(resizeCorner);

            this.popupElement = popupWrapper;
            this.popupTitle = popupTitle;
            this.popupTitleWord = popupTitleWord;
            this.idiomArea = idiomArea;
            this.popupGrade = popupGrade;
            this.list = popupList;
            this.resizeCorner = resizeCorner;

            popupClose.addEventListener('click', this.outerClick.bind(this));
            popupClose.addEventListener('touch', this.outerClick.bind(this));

            return popupWrapper;
        }
        
        handleChangeDifficulty() {
            if (this.readOnly) return;
            let msec = Date.now(); 
            if (msec - this.lastClickTime < 500) return;
            this.lastClickTime = msec; 
            if (this.wasDragging) return;
            if (!this.currentWord) return;
            let { lemma, pos, userGrade } = this.currentWord;
            let word = lemma + '|' + pos;
            let newUserGradeServer;
            let newUserGrade;

            switch (+userGrade) {
                case UserGrades.dontKnow:
                    newUserGradeServer = '3';
                    newUserGrade = UserGrades.wantKnow3;
                    break;
                case UserGrades.wantKnow1:
                case UserGrades.wantKnow2:
                case UserGrades.wantKnow3:
                case UserGrades.wantKnow4:
                    newUserGradeServer = '0';
                    newUserGrade = UserGrades.know;
                    break;
                case UserGrades.know:
                    newUserGradeServer = '5';
                    newUserGrade = UserGrades.dontKnow;
                    break;
            }

            let self = this;
            let currentWord = this.currentWord;
            API.setDifficulty(word, newUserGradeServer)
                .then((success) => {
                    if (success) {
                        currentWord.userGrade = newUserGrade;
                        let gradeColor = textAnalyze.gradeToColor(currentWord.userGrade);
                        self.popupTitleWord.className = 'poly-box-header-word ' + gradeColor;
                        if (this.callback) {
                            this.callback(newUserGrade)
                        }
                        this.updateNodes(self.currentWord, newUserGrade, gradeColor);
                    }
                });
        }

        updateNodes(word, newUserGrade, gradeColor) {
            let currentElement = PolyWidget.CurentElement;
            textAnalyze.updateNodes(currentElement, word, newUserGrade, gradeColor);

            let editableElement = PolyWidget.EditableElement;
            textAnalyze.updateNodes(editableElement, word, newUserGrade, gradeColor);

            let previousElements = PolyWidget.PreviousElements;
            previousElements.forEach((element) => {
                textAnalyze.updateNodes(element, word, newUserGrade, gradeColor);
            });
        }

        resizeStart(e: MouseEvent) {
            e.preventDefault();
            e.cancelBubble = true;
            e.stopPropagation();
            this.isResizing = true;
        }

        resizeMove(e: MouseEvent) {
            if (this.isResizing) {
                e.preventDefault();
                e.cancelBubble = true;
                e.stopPropagation();
                let parentOffsetX = this.popupElement.offsetLeft;
                let parentOffsetY = this.popupElement.offsetTop;

                let relativeX = e.clientX - parentOffsetX;
                let relativeY = Math.abs(e.clientY - parentOffsetY);
                relativeY = Math.max(150, relativeY);

                this.popupElement.style.width = relativeX + 'px';
                this.popupElement.style.height = relativeY + 'px';

                this.adjustHeight();
            }
        }

        adjustHeight() {
            let inIdiom = this.idiomArea.classList.contains('show');
            let popupHeight = this.popupElement.offsetHeight;
            let idiomHeight = inIdiom ? this.idiomArea.offsetHeight : 0;
            let titleHeight = this.popupTitle.offsetHeight;
            this.list.style.height = (popupHeight - titleHeight - idiomHeight) + 'px';
        }

        dragStart(event: UIEvent) {
            let touchEvent = event instanceof TouchEvent ? <TouchEvent>event : null;  
            let mouseEvent = event instanceof MouseEvent ? <MouseEvent>event : null;
            if (!touchEvent && !mouseEvent) return;  
            // console.log('Drag Start');
            this.isDragging && event.preventDefault();
            this.stopPropagation(event);
            event.cancelBubble = true;
            this.isDragging = true;

            let parentOffsetX = this.popupElement.offsetLeft;
            let parentOffsetY = this.popupElement.offsetTop;

            this.relativeX = mouseEvent ? mouseEvent.clientX : touchEvent.touches[0].clientX;
            this.relativeX -= parentOffsetX;
            this.relativeY = mouseEvent ? mouseEvent.clientY : touchEvent.touches[0].clientY;
            this.relativeY -= parentOffsetY;
        }

        dragging(event: UIEvent) {
            let touchEvent = event instanceof TouchEvent ? <TouchEvent>event : null;  
            let mouseEvent = event instanceof MouseEvent ? <MouseEvent>event : null;
            if (!touchEvent && !mouseEvent) return;  
            if (this.isDragging) {
                this.wasDragging = true;
                event.preventDefault();
                event.cancelBubble = true;
                let posX = mouseEvent ? mouseEvent.clientX : touchEvent.touches[0].clientX;
                    posX -= this.relativeX;
                let posY = mouseEvent ? mouseEvent.clientY : touchEvent.touches[0].clientY;
                    posY -= this.relativeY;
                this.adjustPosition(posX, posY, false);
                this.draggedX = posX;
                this.draggedY = posY;
            }
        }

        adjustPosition(x, y, inViewPort) {
            if (!inViewPort) {
                x -= document.body.scrollLeft;
                y -= document.body.scrollTop;
            }
            let r = this.popupElement.getBoundingClientRect();
            let wViewport = document.documentElement.clientWidth;
            let hViewport = document.documentElement.clientHeight;
            let w = this.popupElement.offsetWidth;
            let h = this.popupElement.offsetHeight;
            let dX = 0;
            let dY = 0;
            if (x + w > wViewport) {
                dX -= x + w - wViewport;
            }
            if (y + h > hViewport) {
                dY -= y + h - hViewport;
            }
            if (x < 0) {
                dX -= x;
            }
            if (y < 0) {
                dY -= y;
            }
            x += document.body.scrollLeft;
            y += document.body.scrollTop;
            this.popupElement.style.left = x + dX + 'px';
            this.popupElement.style.top = y + dY + 'px';
        }

        dragEnd(event: Event) {
            this.isDragging && event.preventDefault();
            event.stopPropagation();
            event.cancelBubble = true;
            this.isDragging = false;
            setTimeout(e => this.wasDragging = false, 10);
        }

        stopPropagation(event) {
            event.stopPropagation();
            return false;
        }
        
        /**
         * Bind event to all words inside an element
         */
        public bindWords(element: HTMLElement, eventType: string = "click", handler = this.click) {
            const {attrBlockParsed} = PolyWidget.Config.styles;
            let words = element.querySelectorAll("[" + attrBlockParsed + "]");
            eventListener = handler.bind(this);

            for (let i = 0; i < words.length; i++) {
                let wordElement = words[i];
                wordElement.addEventListener(eventType, eventListener);
            }
        }
        /**
         * Unbind event from words
         */
        public unbindWords(element: HTMLElement, eventType: string = 'click') {
            let words = element.querySelectorAll('span[poly-processed="true"]');
            for (let i = 0; i < words.length; i++) {
                let wordElement = words[i];
                wordElement.removeEventListener(eventType, eventListener);
            }
        }
        /**
         * Helper method for calculating right offset relative to the word
         */
        calculateRightOffset(element: HTMLElement) {
            let clientWidth = document.body.clientWidth,
                elementWidth = element.offsetWidth,
                leftOffset = element.offsetLeft,
                rightOffset = clientWidth - (leftOffset + elementWidth);

            return rightOffset;
        }
        /**
         * Calculate the X coordinate for popup
         */
        calculatePopupX(element: HTMLElement) {
            const MIN_SPACE = 10;
            let posX = 0,
                clientWidth = document.body.clientWidth,
                elementWidth = element.offsetWidth,
                leftOffset = element.offsetLeft,
                rightOffset = this.calculateRightOffset(element);

            if (rightOffset < MIN_POPUP_WIDTH / 2) {
                //Close to right border
                posX = clientWidth - MIN_POPUP_WIDTH - MIN_SPACE;
            }
            else if (leftOffset > MIN_POPUP_WIDTH / 2) {
                //Not close to left border
                posX = leftOffset + (elementWidth / 2) - MIN_POPUP_WIDTH / 2
            }
            else {
                //Close to left border
                posX = MIN_SPACE;
            }

            return posX;
        }
        /**
         * Calculate the Y coordinate for popup
         */
        calculatePopupY(element: HTMLElement) {
            const SPACE_TO_BOTTOM = 35;
            return element.getBoundingClientRect().top + SPACE_TO_BOTTOM;
        }
        /**
         * Handler called when the word is clicked.
         * Take info from attributes, show popup (which initiates translation)
         */
        click(event) {
            let msec = Date.now(); 
            if (msec - this.lastClickTime < 500) return;
            this.lastClickTime = msec; 
            const {attrBlockParsed, cnIdiom} = PolyWidget.Config.styles;
            let wordElement = event.target;
            utils.selectText(wordElement);
            if (!wordElement.getAttribute(attrBlockParsed)) return;
            if (wordElement.classList.contains(cnIdiom)) return;
            let word: IPopupWord = {
                token: wordElement.textContent,
                lemma: wordElement.getAttribute('poly-lemma'),
                grade: wordElement.getAttribute('poly-grade'),
                pos: wordElement.getAttribute('poly-pos'),
                idiom: wordElement.getAttribute('poly-idiom'),
                userGrade: wordElement.getAttribute('poly-userGrade'),
                color: wordElement.getAttribute('class')
            }

            event.stopPropagation()
            
            //Element clicked by the user 
            let element = event.target;

            this.show(word, element);        
        }

        public show(word: IPopupWord, element?: HTMLElement, x?: number, y?: number, callback?: any) {
            this.currentWord = word;
            this.callback = callback;

            let posX, posY;
            let inViewport = true; 
            //If it was not dragged yet, position popup under word, even if isStatic
            if (!this.isStatic && (this.draggedX || this.draggedY)) {
                posX = this.draggedX;
                posY = this.draggedY;
                inViewport = false;
            } else {
                if (element) {
                    posX = this.calculatePopupX(element);
                    posY = this.calculatePopupY(element);
                } else {
                    posX = x == null ? 100 : x;
                    posY = y == null ? 100 : y;
                }
            }

            this.adjustPosition(posX, posY, inViewport);
            this.generateHeader(word);
            this.list.innerHTML = '';

            this.popupElement.classList.remove('hidden');
            this.popupElement.classList.add('show');

            API.translateWord(word).then(this.showTranslations.bind(this))
        }

        /**
         * Fill the header with word information
         */
        generateHeader(word) {
            let gradeColor = word.color || textAnalyze.computeColor(word);
            let gradeText = this.computeGradeLabel(word.grade);
            const {idiom} = word;
            this.popupTitleWord.className = 'poly-box-header-word ' + gradeColor;
            this.popupTitleWord.textContent = word.lemma + " " + this.computePartOfSpeech(word.pos);
            if (gradeText) {
                this.popupGrade.textContent = gradeText;
                this.popupTitleWord.appendChild(this.popupGrade);
            }
            else {
                this.popupGrade.innerHTML = '';
            }
            if (idiom) {
                API.translatePhrase(idiom).then((res: any) => {
                    const {trans} = res.phrase;
                    let translation = trans[0];
                    console.log('translate', res);
                    if (!translation) {
                        this.idiomArea.classList.remove('show');
                        this.idiomArea.innerHTML = "";
                    } else {
                        if (translation.indexOf("|")) {
                            translation = translation.split("|")[0];
                        }
                        this.idiomArea.innerHTML = translation;
                        this.idiomArea.classList.add('show');
                    }
                });
            }
            else {
                this.idiomArea.classList.remove('show');
                this.idiomArea.innerHTML = "";
            }
        }
        /**
         * Get part of speech
         */
        computePartOfSpeech(position) {
            if (!position) return;

            let partOfSpeech = '';
            switch (position) {
                case 'VB':
                    partOfSpeech = "(v)"
                    break;
                case 'NN':
                    partOfSpeech = "(n)"
                    break;
                case 'JJ':
                    partOfSpeech = "(adj)"
                    break;
                case 'RB':
                    partOfSpeech = "(adv)"
                    break;
            }

            return partOfSpeech;
        }
        /**
         * Get grade label
         */
        computeGradeLabel(grade: string) {
            let textGrade = '';
            switch (grade) {
                case '1':
                    textGrade = "A1";
                    break;
                case '2':
                    textGrade = "A2";
                    break;
                case '3':
                    textGrade = "B1";
                    break;
                case '4':
                    textGrade = "B2";
                    break;
                case '5':
                    textGrade = "C1";
                    break;
                case '6':
                    textGrade = "C2";
                    break;
            }
            return textGrade;
        }
        /**
         * Render array of translations in the popup
         */
        showTranslations(translated: { word }) {
            let translations = translated.word.trans;
            this.list.innerHTML = '';
            translations.forEach((translation) => {
                let translationOfWord = document.createElement('div');
                translationOfWord.className = 'poly-box-translate';
                translationOfWord.textContent = translation;
                this.list.appendChild(translationOfWord);
            });
            this.adjustHeight();
        }
    }
}