var Poly;
(function (Poly) {
    var ax = axios.create({
        baseURL: '/',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }
    });
    Poly.API = {
        analyzeText: function (text) {
            return ax.get('api/analyze', { params: { text: text } })
                .then(function (response) {
                return response.data.textData;
            });
        },
        translateWord: function (word) {
            var toLang = Poly.PolyWidget.Config.toLang || 'en';
            return ax.get('api/translate', { params: {
                    toLanguage: toLang,
                    lemma: word.lemma,
                    word: word.token,
                    partOfSpeech: word.pos,
                    getDefinitions: 'true'
                } })
                .then(function (res) {
                return res.data.translation;
            });
        },
        translatePhrase: function (phrase) {
            var toLang = Poly.PolyWidget.Config.toLang || 'en';
            return ax.get('api/translate', { params: {
                    toLanguage: toLang,
                    phrase: phrase
                } })
                .then(function (res) {
                return res.data.translation;
            });
        },
        setDifficulty: function (word, difficulty) {
            return new window['Promise']();
        }
    };
})(Poly || (Poly = {}));
var Promise = window['Promise'];
var Poly;
(function (Poly) {
    var PolyPlugin = (function () {
        function PolyPlugin(widget, config) {
            Poly.API = Poly.ChatAPI;
            Poly.ChatAPI._core = config._core;
            Poly.ChatAPI.getConversationId = this.getConversationId.bind(this);
            Poly.ChatAPI.getLangId = this.getLangId.bind(this);
        }
        PolyPlugin.prototype.getConversationId = function () {
            return this.conversationId;
        };
        PolyPlugin.prototype.setConversationId = function (cvId) {
            console.log('Setting cvId', cvId);
            this.conversationId = cvId;
        };
        PolyPlugin.prototype.getLangId = function () {
            return this.langId;
        };
        PolyPlugin.prototype.setLangId = function (langId) {
            console.log('Setting langId', langId);
            this.langId = langId;
        };
        return PolyPlugin;
    }());
    Poly.PolyPlugin = PolyPlugin;
    Poly.ChatAPI = {
        _core: null,
        getConversationId: null,
        getLangId: null,
        analyzeText: function (text) {
            var _this = this;
            var langid = this.getLangId();
            return new Promise(function (resolve, err) {
                _this._core.analyzeText({ text: text, langid: langid }, function (err, res) {
                    if (err)
                        console.error(err);
                    else
                        resolve(res.textData);
                });
            });
        },
        translateWord: function (word) {
            var _this = this;
            var toLang = Poly.PolyWidget.Config.toLang || 'en';
            return new Promise(function (resolve, err) {
                _this._core.translateText({
                    lemma: word.lemma,
                    word: word.token,
                    partOfSpeech: word.pos,
                    toLanguage: toLang
                }, function (err, res) {
                    if (err)
                        console.error(err);
                    else
                        resolve(res.translation);
                });
            });
        },
        translatePhrase: function (phrase) {
            var _this = this;
            var toLang = Poly.PolyWidget.Config.toLang || 'en';
            return new Promise(function (resolve, err) {
                _this._core.translateText({ phrase: phrase, toLanguage: toLang }, function (err, res) {
                    if (err)
                        console.error(err);
                    else
                        resolve(res.translation);
                });
            });
        },
        setDifficulty: function (word, difficulty) {
            var _this = this;
            var langid = this.getLangId();
            var data = {
                word: word,
                difficulty: difficulty,
                langid: langid
            };
            return new Promise(function (resolve, err) {
                _this._core.setWordDifficutly(data, function (err, res) {
                    if (err)
                        console.error(err);
                    else
                        resolve(res.success);
                });
            });
        }
    };
})(Poly || (Poly = {}));
var Poly;
(function (Poly) {
    var MIN_POPUP_WIDTH = 300;
    var eventListener;
    var PopUp = (function () {
        function PopUp(isStatic, isResizable) {
            if (isStatic === void 0) { isStatic = false; }
            this.isDragging = false;
            this.isResizing = false;
            this.generatePopup();
            this.isStatic = isStatic;
            this.isResizable = isResizable;
            document.addEventListener('mouseup', this.outerClick.bind(this));
            document.addEventListener('touchend', this.outerClick.bind(this));
        }
        PopUp.prototype.outerClick = function (event) {
            if (this.isResizing) {
                event.preventDefault();
                this.isResizing = false;
                MIN_POPUP_WIDTH = this.popupElement.offsetWidth;
                return;
            }
            console.log('outerClick', event);
            var target = event.target;
            if (target.className.indexOf('poly-box') != -1 || target.className.indexOf('poly-tab') != -1 || target.tagName.toLowerCase() == 'html') {
                event.preventDefault();
                return false;
            }
            this.isDragging = false;
            this.currentWord = null;
            this.popupElement.classList.remove('show');
            this.popupElement.classList.add('hidden');
        };
        PopUp.prototype.generatePopup = function () {
            var cnTranslateBox = Poly.PolyWidget.Config.styles.cnTranslateBox;
            var popupWrapper = document.createElement('div');
            popupWrapper.classList.add('hidden');
            popupWrapper.classList.add('poly-box-default');
            popupWrapper.classList.add(cnTranslateBox);
            popupWrapper.style.visibility = 'hidden';
            var popupTitle = document.createElement('div');
            popupTitle.classList.add('poly-box-header');
            var popupTitleWord = document.createElement('div');
            popupTitleWord.classList.add('poly-box-header-word');
            var popupClose = document.createElement('div');
            popupClose.classList.add('poly-box-close');
            popupClose.innerHTML = '<i class="fa fa-close"></i>';
            var idiomArea = document.createElement('div');
            idiomArea.classList.add('poly-box-idiom');
            var popupGrade = document.createElement('div');
            popupGrade.classList.add('poly-tab-grade');
            var resizeCorner = document.createElement('div');
            resizeCorner.classList.add('poly-box-resizeCorner');
            popupTitleWord.addEventListener('click', this.handleChangeDifficulty.bind(this));
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
            if (!this.isResizable) {
                resizeCorner.addEventListener('mousedown', this.resizeStart.bind(this));
                document.addEventListener('mousemove', this.resizeMove.bind(this));
            }
            var popupList = document.createElement('div');
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
        };
        PopUp.prototype.handleChangeDifficulty = function () {
            var _this = this;
            if (this.wasDragging)
                return;
            if (!this.currentWord)
                return;
            var _a = this.currentWord, lemma = _a.lemma, pos = _a.pos, userGrade = _a.userGrade;
            var word = lemma + '|' + pos;
            var newUserGradeServer;
            var newUserGrade;
            switch (+userGrade) {
                case Poly.UserGrades.dontKnow:
                    newUserGradeServer = '3';
                    newUserGrade = Poly.UserGrades.wantKnow3;
                    break;
                case Poly.UserGrades.wantKnow1:
                case Poly.UserGrades.wantKnow2:
                case Poly.UserGrades.wantKnow3:
                case Poly.UserGrades.wantKnow4:
                    newUserGradeServer = '0';
                    newUserGrade = Poly.UserGrades.know;
                    break;
                case Poly.UserGrades.know:
                    newUserGradeServer = '5';
                    newUserGrade = Poly.UserGrades.dontKnow;
                    break;
            }
            var self = this;
            var currentWord = this.currentWord;
            Poly.API.setDifficulty(word, newUserGradeServer)
                .then(function (success) {
                if (success) {
                    currentWord.userGrade = newUserGrade;
                    var gradeColor = Poly.textAnalyze.gradeToColor(currentWord.userGrade);
                    self.popupTitleWord.className = 'poly-box-header-word ' + gradeColor;
                    if (_this.callback) {
                        _this.callback(newUserGrade);
                    }
                    _this.updateNodes(self.currentWord, newUserGrade, gradeColor);
                }
            });
        };
        PopUp.prototype.updateNodes = function (word, newUserGrade, gradeColor) {
            var currentElement = Poly.PolyWidget.CurentElement;
            Poly.textAnalyze.updateNodes(currentElement, word, newUserGrade, gradeColor);
            var editableElement = Poly.PolyWidget.EditableElement;
            Poly.textAnalyze.updateNodes(editableElement, word, newUserGrade, gradeColor);
            var previousElements = Poly.PolyWidget.PreviousElements;
            previousElements.forEach(function (element) {
                Poly.textAnalyze.updateNodes(element, word, newUserGrade, gradeColor);
            });
        };
        PopUp.prototype.resizeStart = function (e) {
            e.preventDefault();
            e.cancelBubble = true;
            e.stopPropagation();
            this.isResizing = true;
        };
        PopUp.prototype.resizeMove = function (e) {
            if (this.isResizing) {
                e.preventDefault();
                e.cancelBubble = true;
                e.stopPropagation();
                var parentOffsetX = this.popupElement.offsetLeft;
                var parentOffsetY = this.popupElement.offsetTop;
                var relativeX = e.clientX - parentOffsetX;
                var relativeY = Math.abs(e.clientY - parentOffsetY);
                relativeY = Math.max(150, relativeY);
                this.popupElement.style.width = relativeX + 'px';
                this.popupElement.style.height = relativeY + 'px';
                this.list.style.maxHeight = (relativeY - 79) + 'px';
            }
        };
        PopUp.prototype.dragStart = function (event) {
            var touchEvent = event instanceof TouchEvent ? event : null;
            var mouseEvent = event instanceof MouseEvent ? event : null;
            if (!touchEvent && !mouseEvent)
                return;
            this.isDragging && event.preventDefault();
            this.stopPropagation(event);
            event.cancelBubble = true;
            this.isDragging = true;
            var parentOffsetX = this.popupElement.offsetLeft;
            var parentOffsetY = this.popupElement.offsetTop;
            this.relativeX = mouseEvent ? mouseEvent.clientX : touchEvent.touches[0].clientX;
            this.relativeX -= parentOffsetX;
            this.relativeY = mouseEvent ? mouseEvent.clientY : touchEvent.touches[0].clientY;
            this.relativeY -= parentOffsetY;
        };
        PopUp.prototype.dragging = function (event) {
            var touchEvent = event instanceof TouchEvent ? event : null;
            var mouseEvent = event instanceof MouseEvent ? event : null;
            if (!touchEvent && !mouseEvent)
                return;
            if (this.isDragging) {
                this.wasDragging = true;
                event.preventDefault();
                event.cancelBubble = true;
                var posX = mouseEvent ? mouseEvent.clientX : touchEvent.touches[0].clientX;
                posX -= this.relativeX;
                var posY = mouseEvent ? mouseEvent.clientY : touchEvent.touches[0].clientY;
                posY -= this.relativeY;
                this.adjustPosition(posX, posY);
                this.draggedX = posX;
                this.draggedY = posY;
            }
        };
        PopUp.prototype.adjustPosition = function (x, y) {
            var r = this.popupElement.getBoundingClientRect();
            var wViewport = document.documentElement.clientWidth;
            var hViewport = document.documentElement.clientHeight;
            var w = this.popupElement.offsetWidth;
            var h = this.popupElement.offsetHeight;
            var dX = 0;
            var dY = 0;
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
            this.popupElement.style.left = x + dX + 'px';
            this.popupElement.style.top = y + dY + 'px';
        };
        PopUp.prototype.dragEnd = function (event) {
            var _this = this;
            this.isDragging && event.preventDefault();
            event.stopPropagation();
            event.cancelBubble = true;
            this.isDragging = false;
            setTimeout(function (e) { return _this.wasDragging = false; }, 10);
        };
        PopUp.prototype.stopPropagation = function (event) {
            event.stopPropagation();
            return false;
        };
        PopUp.prototype.bindWords = function (element, eventType, handler) {
            if (eventType === void 0) { eventType = "click"; }
            if (handler === void 0) { handler = this.click; }
            var attrBlockParsed = Poly.PolyWidget.Config.styles.attrBlockParsed;
            var words = element.querySelectorAll("[" + attrBlockParsed + "]");
            eventListener = handler.bind(this);
            for (var i = 0; i < words.length; i++) {
                var wordElement = words[i];
                wordElement.addEventListener(eventType, eventListener);
            }
        };
        PopUp.prototype.unbindWords = function (element, eventType) {
            if (eventType === void 0) { eventType = 'click'; }
            var words = element.querySelectorAll('span[poly-processed="true"]');
            for (var i = 0; i < words.length; i++) {
                var wordElement = words[i];
                wordElement.removeEventListener(eventType, eventListener);
            }
        };
        PopUp.prototype.calculateRightOffset = function (element) {
            var clientWidth = document.body.clientWidth, elementWidth = element.offsetWidth, leftOffset = element.offsetLeft, rightOffset = clientWidth - (leftOffset + elementWidth);
            return rightOffset;
        };
        PopUp.prototype.calculatePopupX = function (element) {
            var MIN_SPACE = 10;
            var posX = 0, clientWidth = document.body.clientWidth, elementWidth = element.offsetWidth, leftOffset = element.offsetLeft, rightOffset = this.calculateRightOffset(element);
            if (rightOffset < MIN_POPUP_WIDTH / 2) {
                posX = clientWidth - MIN_POPUP_WIDTH - MIN_SPACE;
            }
            else if (leftOffset > MIN_POPUP_WIDTH / 2) {
                posX = leftOffset + (elementWidth / 2) - MIN_POPUP_WIDTH / 2;
            }
            else {
                posX = MIN_SPACE;
            }
            return posX;
        };
        PopUp.prototype.calculatePopupY = function (element) {
            var SPACE_TO_BOTTOM = 35;
            var boundingRect = {};
            if (element.offsetTop > window.innerHeight) {
                boundingRect = element.getBoundingClientRect();
            }
            var posY = boundingRect.top || element.offsetTop + SPACE_TO_BOTTOM;
            return posY;
        };
        PopUp.prototype.click = function (event) {
            var _a = Poly.PolyWidget.Config.styles, attrBlockParsed = _a.attrBlockParsed, cnIdiom = _a.cnIdiom;
            var wordElement = event.target;
            Poly.utils.selectText(wordElement);
            if (!wordElement.getAttribute(attrBlockParsed))
                return;
            if (wordElement.classList.contains(cnIdiom))
                return;
            var word = {
                token: wordElement.textContent,
                lemma: wordElement.getAttribute('poly-lemma'),
                grade: wordElement.getAttribute('poly-grade'),
                pos: wordElement.getAttribute('poly-pos'),
                idiom: wordElement.getAttribute('poly-idiom'),
                userGrade: wordElement.getAttribute('poly-userGrade'),
                color: wordElement.getAttribute('class')
            };
            event.stopPropagation();
            var element = event.target;
            this.show(word, element);
        };
        PopUp.prototype.show = function (word, element, x, y, callback) {
            this.currentWord = word;
            this.callback = callback;
            var posX, posY;
            if (!this.isStatic && (this.draggedX || this.draggedY)) {
                posX = this.draggedX;
                posY = this.draggedY;
            }
            else {
                if (element) {
                    posX = this.calculatePopupX(element);
                    posY = this.calculatePopupY(element);
                }
                else {
                    posX = x == null ? 100 : x;
                    posY = y == null ? 100 : y;
                }
            }
            this.adjustPosition(posX, posY);
            this.generateHeader(word);
            this.list.textContent = '';
            this.popupElement.classList.remove('hidden');
            this.popupElement.classList.add('show');
            Poly.API.translateWord(word).then(this.showTranslations.bind(this));
        };
        PopUp.prototype.generateHeader = function (word) {
            var _this = this;
            var gradeColor = word.color || Poly.textAnalyze.computeColor(word);
            var gradeText = this.computeGradeLabel(word.grade);
            var idiom = word.idiom;
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
                Poly.API.translatePhrase(idiom).then(function (res) {
                    var trans = res.phrase.trans;
                    var translation = trans[0];
                    console.log('translate', res);
                    if (!translation) {
                        _this.idiomArea.classList.remove('show');
                        _this.idiomArea.innerHTML = "";
                    }
                    else {
                        if (translation.indexOf("|")) {
                            translation = translation.split("|")[0];
                        }
                        _this.idiomArea.innerHTML = translation;
                        _this.idiomArea.classList.add('show');
                    }
                });
            }
            else {
                this.idiomArea.classList.remove('show');
                this.idiomArea.innerHTML = "";
            }
        };
        PopUp.prototype.computePartOfSpeech = function (position) {
            if (!position)
                return;
            var partOfSpeech = '';
            switch (position) {
                case 'VB':
                    partOfSpeech = "(v)";
                    break;
                case 'NN':
                    partOfSpeech = "(n)";
                    break;
                case 'JJ':
                    partOfSpeech = "(adj)";
                    break;
                case 'RB':
                    partOfSpeech = "(adv)";
                    break;
            }
            return partOfSpeech;
        };
        PopUp.prototype.computeGradeLabel = function (grade) {
            var textGrade = '';
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
        };
        PopUp.prototype.showTranslations = function (translated) {
            var _this = this;
            var translations = translated.word.trans;
            translations.forEach(function (translation) {
                var translationOfWord = document.createElement('div');
                translationOfWord.className = 'poly-box-translate';
                translationOfWord.textContent = translation;
                _this.list.appendChild(translationOfWord);
            });
        };
        return PopUp;
    }());
    Poly.PopUp = PopUp;
})(Poly || (Poly = {}));
var Poly;
(function (Poly) {
    var PolyWidget = (function () {
        function PolyWidget(config) {
            if (config === void 0) { config = {}; }
            config.styles = Object.assign({}, this.getDefaultStyles(), config.styles);
            config = Object.assign({}, config);
            PolyWidget.Config = config;
            var element = config.element;
            this.element = element;
            if (config.usePlugin && Poly.PolyPlugin) {
                this.plugin = new Poly.PolyPlugin(this, config);
            }
            else {
                this.element && this.parse(this.element, config);
            }
            this.popup = this.createPopup();
        }
        PolyWidget.prototype.parseBook = function () {
            var parseBookEventHandler = this.parseBookClick.bind(this);
            document.addEventListener('click', parseBookEventHandler);
            this.parseBookHandler = parseBookEventHandler;
        };
        PolyWidget.prototype.stopParseBook = function () {
            document.removeEventListener('click', this.parseBookHandler);
        };
        PolyWidget.prototype.parseBookClick = function (e) {
            var target = e.target;
            target = Poly.utils.findBlockParent(target);
            var selector = "[" + PolyWidget.Config.styles.attrBlockParsed + "]";
            var nodeList = document.querySelectorAll(selector);
            var elements = Array.prototype.slice.call(nodeList);
            this.toggleBlocks(target, elements, e);
        };
        PolyWidget.prototype.parse = function (element, config) {
            if (element === void 0) { element = PolyWidget.Config.element; }
            if (config === void 0) { config = PolyWidget.Config; }
            if (!element)
                throw new Error('No element specified');
            if (config.blockSeparator) {
                this.processBySeparator(element, config.blockSeparator);
            }
            else if (config.tagSeparator) {
                this.processByTags(element, config.tagSeparator);
            }
            else {
                this.processByAll(element);
            }
        };
        PolyWidget.prototype.startParseEditable = function (element, config) {
            if (config === void 0) { config = PolyWidget.Config; }
            if (!element)
                throw new Error('No element specified');
            this.editableParser = new Poly.EditableParser(element, config, this);
            this.editableParser.start();
        };
        PolyWidget.prototype.parseElementsWithData = function (elements, parent, data) {
            var _this = this;
            PolyWidget.CurentElement = parent;
            var _a = PolyWidget.Config.styles, attrBlockParsed = _a.attrBlockParsed, cnCurrentBlock = _a.cnCurrentBlock;
            elements.forEach(function (element) {
                Poly.textAnalyze.setTextData(data);
                Poly.textAnalyze.parseElement(element, data.analyzed.concat());
                _this.bindToPopup(element);
                element.setAttribute(attrBlockParsed, "true");
                element.classList.add(cnCurrentBlock);
            });
        };
        PolyWidget.prototype.stopParseEditable = function () {
            this.editableParser.stop();
        };
        PolyWidget.prototype.showDictPopup = function (lemma, level, pos, phrase, difficulty, x, y, token, callback) {
            var word = {
                token: token,
                lemma: lemma,
                grade: ['1', '2', '3', '4', '5', '6'][level - 1],
                pos: pos,
                idiom: phrase,
                userGrade: difficulty,
                color: Poly.textAnalyze.gradeToColor(difficulty)
            };
            this.popup.show(word, null, x, y, callback);
        };
        PolyWidget.prototype.processBySeparator = function (element, separator) {
            if (separator === void 0) { separator = PolyWidget.Config.blockSeparator; }
            if (!separator)
                throw new Error('No separator specified');
            var blocks = this.parseBlocksBySeparator(element, separator);
            this.bindBlocks(blocks);
        };
        PolyWidget.prototype.processByTags = function (element, tagName) {
            if (tagName === void 0) { tagName = PolyWidget.Config.tagSeparator; }
            if (!tagName)
                throw new Error('No tagName specified');
            var blocks = this.parseBlocksByTag(element, tagName);
            this.bindBlocks(blocks);
        };
        PolyWidget.prototype.bindBlocks = function (blocks) {
            for (var _i = 0, blocks_1 = blocks; _i < blocks_1.length; _i++) {
                var block = blocks_1[_i];
                block.className += ' poly-ready';
                block.addEventListener('click', this.toggleBlocks.bind(this, block, blocks));
            }
        };
        PolyWidget.prototype.processByAll = function (element) {
            if (!element)
                throw new Error('No element specified');
            this.parseElement(element);
        };
        PolyWidget.prototype.toggleBlocks = function (target, blocks, event) {
            var cnCurrentBlock = PolyWidget.Config.styles.cnCurrentBlock;
            for (var _i = 0, blocks_2 = blocks; _i < blocks_2.length; _i++) {
                var block = blocks_2[_i];
                if (!Poly.utils.isBlockElement(block))
                    continue;
                block.classList.remove(cnCurrentBlock);
                this.unbindToPopup(block);
            }
            this.parseElement(target);
        };
        PolyWidget.prototype.parseBlocksByTag = function (element, tagName) {
            var childNodes = element.childNodes;
            var blocks = [];
            for (var i = 0; i < childNodes.length; i++) {
                var child = childNodes[i];
                if (child.nodeName == tagName.toUpperCase()) {
                    blocks.push(child);
                }
            }
            return blocks;
        };
        PolyWidget.prototype.parseBlocksBySeparator = function (element, separator) {
            var childNodes = element.childNodes;
            var blocks = [];
            for (var i = 0; i < childNodes.length; i++) {
                var child = childNodes[i];
                if (child.nodeType == Node.TEXT_NODE)
                    continue;
                var attributes = child.attributes;
                var found = false;
                for (var y = 0; y < attributes.length; y++) {
                    var attr = attributes[y];
                    if (attr.name === separator) {
                        blocks.push(child);
                        found = true;
                    }
                }
                if (!found && child.childNodes.length > 0) {
                    var innerBlocks = this.parseBlocksBySeparator(child, separator);
                    if (innerBlocks.length > 0)
                        blocks = blocks.concat(innerBlocks);
                }
            }
            return blocks;
        };
        PolyWidget.prototype.parseElement = function (element) {
            var _this = this;
            PolyWidget.CurentElement = element;
            this.registerElement(element);
            var shouldUpdate = false;
            var _a = PolyWidget.Config.styles, attrBlockParsed = _a.attrBlockParsed, cnCurrentBlock = _a.cnCurrentBlock;
            console.log('Parse Element');
            if (element.getAttribute(attrBlockParsed)) {
                element.classList.add(cnCurrentBlock);
                this.bindToPopup(element);
                shouldUpdate = true;
            }
            var elementText = element.textContent;
            PolyWidget.AnalyzeText(elementText, function (textData) {
                var analyzed = textData.analyzed;
                Poly.textAnalyze.parseElement(element, analyzed);
                _this.bindToPopup(element);
                element.setAttribute(attrBlockParsed, "true");
                element.classList.add(cnCurrentBlock);
            });
        };
        PolyWidget.prototype.registerElement = function (element) {
            var isDuplicated = false;
            PolyWidget.PreviousElements.forEach(function (previousEl) {
                if (previousEl.isEqualNode(element)) {
                    isDuplicated = true;
                    return element;
                }
            });
            if (!isDuplicated) {
                PolyWidget.PreviousElements.push(element);
            }
        };
        PolyWidget.prototype.createPopup = function () {
            var popup = new Poly.PopUp();
            var body = document.getElementsByTagName('body')[0];
            if (!body)
                console.error('No body element');
            else
                body.appendChild(popup.popupElement);
            return popup;
        };
        PolyWidget.prototype.getDefaultStyles = function () {
            return {
                cnCurrentBlock: 'poly-current',
                cnWordKnow: 'green',
                cnWordWantKnow: 'yellow',
                cnWordDontKnow: 'red',
                cnIdiom: 'idiom',
                cnOutOfVocab: 'out-of-vocab',
                attrBlockParsed: 'poly-processed',
                cnTranslateBox: 'translateBox',
            };
        };
        PolyWidget.prototype.bindToPopup = function (element) {
            this.popup.bindWords(element, 'click');
        };
        PolyWidget.prototype.unbindToPopup = function (element) {
            return this.popup.unbindWords(element, 'click');
        };
        PolyWidget.AnalyzeText = function (text, cb) {
            return Poly.API.analyzeText(text)
                .then(function (textData) {
                Poly.textAnalyze.setTextData(textData);
                cb(textData);
            });
        };
        PolyWidget.PreviousElements = [];
        return PolyWidget;
    }());
    Poly.PolyWidget = PolyWidget;
})(Poly || (Poly = {}));
var PolyWidget = Poly.PolyWidget;
window.PolyWidget = PolyWidget;
(function () {
    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css';
    link.media = 'all';
    head.appendChild(link);
})();
var Poly;
(function (Poly) {
    var blockElements = ["address", "article", "aside", "audio", "blockquote", "body", "canvas", "dd", "div", "dl", "fieldset",
        "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "noscript",
        "ol", "output", "p", "pre", "section", "table", "tr", "td", "tbody", "tfoot", "ul", "video", "li"];
    Poly.utils = {
        isBlockElement: function (node) {
            return node.nodeType == 1 && blockElements.indexOf(node.tagName.toLowerCase()) >= 0;
        },
        selectText: function (text) {
            var doc = document, range, selection;
            if (doc.body.createTextRange) {
                range = doc.body.createTextRange();
                range.moveToElementText(text);
                range.select();
            }
            else if (window.getSelection) {
                selection = window.getSelection();
                range = document.createRange();
                range.selectNodeContents(text);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        },
        setCaret: function (elem, offset) {
            var range = document.createRange();
            var sel = window.getSelection();
            range.setStart(elem, offset);
            range.setEnd(elem, offset);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        },
        findBlockParent: function (element) {
            if (Poly.utils.isBlockElement(element))
                return element;
            return this.findBlockParent(element.parentNode);
        }
    };
})(Poly || (Poly = {}));
var Poly;
(function (Poly) {
    (function (UserGrades) {
        UserGrades[UserGrades["know"] = 0] = "know";
        UserGrades[UserGrades["wantKnow1"] = 1] = "wantKnow1";
        UserGrades[UserGrades["wantKnow2"] = 2] = "wantKnow2";
        UserGrades[UserGrades["wantKnow3"] = 3] = "wantKnow3";
        UserGrades[UserGrades["wantKnow4"] = 4] = "wantKnow4";
        UserGrades[UserGrades["dontKnow"] = 5] = "dontKnow";
    })(Poly.UserGrades || (Poly.UserGrades = {}));
    var UserGrades = Poly.UserGrades;
    var TextAnalyze = (function () {
        function TextAnalyze() {
        }
        TextAnalyze.prototype.setTextData = function (textData) {
            this.textData = textData;
        };
        TextAnalyze.prototype.parseElement = function (element, analyzed) {
            var foundAtAll = this.parse(element, analyzed);
            if (!foundAtAll) {
                analyzed.shift();
                this.parseElement(element, analyzed);
            }
        };
        TextAnalyze.prototype.update = function (element, analyzed) {
            var _this = this;
            analyzed.forEach(function (word) {
                var nodes = element.childNodes;
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    if (node.nodeType == Node.TEXT_NODE || node.nodeType == Node.COMMENT_NODE)
                        continue;
                    if (node.childNodes.length > 1)
                        _this.update(node, analyzed);
                    if (node.getAttribute('poly-processed')) {
                        var lemma = node.getAttribute('poly-lemma');
                        var wordLemma = word.lemma || word.token;
                        if (wordLemma == lemma) {
                            _this.updateNodeFull(node, word);
                            analyzed.shift();
                            word = analyzed[0];
                            if (!word)
                                return;
                        }
                    }
                }
            });
        };
        TextAnalyze.prototype.updateNodes = function (element, word, newUserGrade, cnColor) {
            if (!element)
                return;
            var nodes = element.childNodes;
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (node.nodeType != Node.ELEMENT_NODE)
                    continue;
                if (node.childNodes.length >= 1)
                    this.updateNodes(node, word, newUserGrade, cnColor);
                var lemma = node.getAttribute('poly-lemma');
                if (word.lemma == lemma) {
                    node.setAttribute('poly-userGrade', newUserGrade);
                    this.changeNodeColor(node, word, cnColor);
                }
            }
        };
        TextAnalyze.prototype.updateNodeFull = function (span, analyzed) {
            this.setAttributes(span, analyzed);
        };
        TextAnalyze.prototype.changeNodeColor = function (node, word, cnColor) {
            var color;
            if (cnColor)
                color = cnColor;
            else
                color = this.computeColor(word);
            node.className = color;
        };
        TextAnalyze.prototype.parse = function (element, analyzed) {
            var nodes = element.childNodes;
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (node.nodeType == Node.TEXT_NODE) {
                    if (analyzed[0] == undefined)
                        return true;
                    try {
                        var found = this.parseTextToFindWord(node, analyzed);
                        if (found) {
                            analyzed.shift();
                            i++;
                        }
                        if (!found && i === nodes.length - 1)
                            return false;
                    }
                    catch (e) {
                        console.log('Error while parsing:', e);
                    }
                }
                else {
                    var attrBlockParsed = Poly.PolyWidget.Config.styles.attrBlockParsed;
                    var polyProccessedAttr = node.getAttribute && node.getAttribute(attrBlockParsed);
                    if (polyProccessedAttr)
                        continue;
                    var foundInRecursion = this.parse(node, analyzed);
                    if (!foundInRecursion && i === nodes.length - 1)
                        return false;
                }
            }
            return true;
        };
        TextAnalyze.prototype.parseTextToFindWord = function (textNode, analyzed) {
            var text = textNode.nodeValue.trim();
            if (text && text === "" || text.length < 1)
                return false;
            var word = analyzed[0];
            var idiom = word.idiom || word.colloc;
            var idiomText = '';
            if (idiom) {
                var tokens_1 = [];
                idiom.forEach(function (word) {
                    var token = word.token || word.lemma;
                    idiomText += token + " ";
                    tokens_1.push(token);
                });
                if (this.matchWords([tokens_1[0]], textNode) != null && this.matchWords(tokens_1, textNode) == null) {
                    analyzed.shift();
                    idiom.reverse().forEach(function (word) {
                        analyzed.unshift(word);
                    });
                    idiom = null;
                    word = analyzed[0];
                }
            }
            var found;
            if (idiom) {
                found = this.parseIdiom(word, textNode, textNode.parentNode, idiomText);
            }
            else {
                found = this.parseWord(word, textNode, textNode.parentNode);
            }
            if (found === true || found === false)
                return found;
            else
                return !!found.span;
        };
        TextAnalyze.prototype.parseIdiom = function (word, textNode, parent, idiomText) {
            var idiomWrapper = this.composeIdiomWraper();
            var idiom = word.idiom || word.colloc;
            for (var i = 0; i < idiom.length; i++) {
                var oneWord = idiom[i];
                var rest = this.parseWord(oneWord, textNode, parent, idiomText);
                if (!rest)
                    return false;
                var restText = rest.restText, span = rest.span;
                if (i == 0)
                    parent.insertBefore(idiomWrapper, span);
                else
                    idiomWrapper.appendChild(textNode);
                idiomWrapper.appendChild(span);
                textNode = restText;
            }
            return true;
        };
        TextAnalyze.regExpEscape = function (word) {
            return word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        };
        TextAnalyze.prototype.matchWords = function (tokens, textNode) {
            var regExpStr = '';
            tokens.forEach(function (token) { return regExpStr += TextAnalyze.regExpEscape(token) + '\\s*'; });
            try {
                var regexp = new RegExp(regExpStr);
                return textNode.textContent.match(regexp);
            }
            catch (error) {
                return null;
            }
        };
        TextAnalyze.prototype.parseWord = function (word, textNode, parent, idiom) {
            var token = word.token;
            var match = this.matchWords([token], textNode);
            if (match == null)
                return false;
            var span = this.composeTag(word, idiom);
            var restText = this.wrap(span, textNode, match.index, token.length, parent);
            return { restText: restText, span: span };
        };
        TextAnalyze.prototype.wrap = function (wrapper, textNode, start, end, parent) {
            var text = textNode.splitText(start);
            var restText = text.splitText(end);
            parent.insertBefore(wrapper, text);
            wrapper.insertBefore(text, null);
            return restText;
        };
        TextAnalyze.prototype.computeColor = function (word) {
            var grade = word.grade, tag = word.tag, pos = word.pos, lemma = word.lemma || word.token;
            var _a = Poly.PolyWidget.Config.styles, cnWordKnow = _a.cnWordKnow, cnWordWantKnow = _a.cnWordWantKnow, cnOutOfVocab = _a.cnOutOfVocab, cnWordDontKnow = _a.cnWordDontKnow;
            if (grade === -1)
                return cnOutOfVocab;
            if (Poly.PolyWidget.Config.usePlugin && this.textData.userData)
                return this.computeColorUser(lemma, pos || tag);
            else
                return this.computeColorGrade(grade);
        };
        TextAnalyze.prototype.computeUserGrade = function (word, pos) {
            var grade = this.findUserGrade(word + '|' + pos);
            if (grade != UserGrades.dontKnow)
                return grade;
            return this.findUserGrade(word + '|');
        };
        TextAnalyze.prototype.findUserGrade = function (word) {
            var _a = this.textData.userData, known = _a.known, learn = _a.learn;
            if (known && known[word] != null)
                return UserGrades.know;
            for (var i = 0; learn && i < learn.length && learn[i]; i++) {
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
        };
        TextAnalyze.prototype.computeColorUser = function (word, pos) {
            var grade = this.computeUserGrade(word, pos);
            return this.gradeToColor(grade);
        };
        TextAnalyze.prototype.gradeToColor = function (grade) {
            var _a = Poly.PolyWidget.Config.styles, cnWordKnow = _a.cnWordKnow, cnWordWantKnow = _a.cnWordWantKnow, cnOutOfVocab = _a.cnOutOfVocab, cnWordDontKnow = _a.cnWordDontKnow;
            switch (grade) {
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
        };
        TextAnalyze.prototype.computeColorGrade = function (grade) {
            var level = Poly.PolyWidget.Config.level || 1;
            var _a = Poly.PolyWidget.Config.styles, cnWordKnow = _a.cnWordKnow, cnWordWantKnow = _a.cnWordWantKnow, cnOutOfVocab = _a.cnOutOfVocab, cnWordDontKnow = _a.cnWordDontKnow;
            if (grade === -1)
                return cnOutOfVocab;
            if (grade < level)
                return cnWordKnow;
            else if (grade == level)
                return cnWordWantKnow;
            else if (grade > level)
                return cnWordDontKnow;
        };
        TextAnalyze.prototype.composeTag = function (word, idiom) {
            var spanElement = document.createElement('span');
            spanElement = this.setAttributes(spanElement, word);
            idiom && spanElement.setAttribute('poly-idiom', idiom);
            return spanElement;
        };
        TextAnalyze.prototype.setAttributes = function (element, word) {
            var attrBlockParsed = Poly.PolyWidget.Config.styles.attrBlockParsed;
            if (!word)
                return null;
            var lemma = word.lemma || word.token, userGrade;
            var cnWordKnowledge = this.computeColor(word);
            if (Poly.PolyWidget.Config.usePlugin && this.textData.userData)
                userGrade = this.computeUserGrade(lemma, word.pos || word.tag);
            element.setAttribute(attrBlockParsed, 'true');
            element.setAttribute('poly-lemma', lemma);
            element.setAttribute('poly-grade', word.grade || -1);
            element.setAttribute('poly-userGrade', userGrade);
            element.className = cnWordKnowledge;
            if (userGrade == 2) {
                element.classList.add('poly-1dot');
            }
            else if (userGrade == 1) {
                element.classList.add('poly-2dots');
            }
            element.setAttribute('poly-pos', word.pos || word.tag);
            return element;
        };
        TextAnalyze.prototype.composeIdiomWraper = function () {
            var _a = Poly.PolyWidget.Config.styles, attrBlockParsed = _a.attrBlockParsed, cnIdiom = _a.cnIdiom;
            var spanElement = document.createElement('span');
            spanElement.className = cnIdiom;
            spanElement.setAttribute(attrBlockParsed, 'true');
            return spanElement;
        };
        return TextAnalyze;
    }());
    Poly.TextAnalyze = TextAnalyze;
    Poly.textAnalyze = new TextAnalyze;
})(Poly || (Poly = {}));
var Poly;
(function (Poly) {
    var EditableParser = (function () {
        function EditableParser(element, config, polyWidget) {
            if (config === void 0) { config = Poly.PolyWidget.Config; }
            this.lastCaret = 0;
            var cnCurrentBlock = Poly.PolyWidget.Config.styles.cnCurrentBlock;
            this.element = element;
            this.element.classList.add(cnCurrentBlock);
            this.lastText = "";
            this.polyWidget = polyWidget;
        }
        EditableParser.prototype.start = function () {
            this.eventRef = this.parse.bind(this);
            this.pasteHandler = this.onPaste.bind(this);
            this.element.addEventListener('input', this.eventRef);
            this.element.addEventListener('paste', this.pasteHandler);
            Poly.PolyWidget.EditableElement = this.element;
        };
        EditableParser.prototype.stop = function () {
            this.element.removeEventListener('input', this.eventRef);
            this.element.removeEventListener('paste', this.pasteHandler);
        };
        EditableParser.prototype.parse = function (e) {
            var _this = this;
            console.log('Change Event:', e);
            this.lastCaret = this.getCaretCharacterOffsetWithin(this.element);
            console.log('Caret', this.lastCaret);
            this.resetMarkUp();
            setTimeout(function () {
                _this.setCursor();
            });
            Poly.PolyWidget.AnalyzeText(this.element.innerText, function (translations) {
                Poly.textAnalyze.parseElement(_this.element, translations.analyzed);
                _this.updatePopupBinds();
                setTimeout(function () {
                    _this.setCursor();
                });
            });
        };
        EditableParser.prototype.resetMarkUp = function () {
            this.element.innerHTML = this.element.innerText;
        };
        EditableParser.prototype.setCursor = function () {
            this.setCursorToEnd(this.element);
        };
        EditableParser.prototype.setCaret = function (el, start, end) {
            if (document.createRange && window.getSelection) {
                var range = document.createRange();
                range.selectNodeContents(el);
                var textNodes = this.getTextNodesIn(el);
                var foundStart = false;
                var charCount = 0, endCharCount;
                for (var i = 0, textNode; textNode = textNodes[i++];) {
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
            }
            else if (document['selection'] && document.body['createTextRange']) {
                var textRange = document.body['createTextRange()'];
                textRange.moveToElementText(el);
                textRange.collapse(true);
                textRange.moveEnd("character", end);
                textRange.moveStart("character", start);
                textRange.select();
            }
        };
        EditableParser.prototype.getTextNodesIn = function (node) {
            var textNodes = [];
            if (node.nodeType == 3) {
                textNodes.push(node);
            }
            else {
                var children = node.childNodes;
                for (var i = 0, len = children.length; i < len; ++i) {
                    textNodes.push.apply(textNodes, this.getTextNodesIn(children[i]));
                }
            }
            return textNodes;
        };
        EditableParser.prototype.getCaretCharacterOffsetWithin = function (element) {
            var caretOffset = 0;
            if (typeof window.getSelection != "undefined") {
                var range = window.getSelection().getRangeAt(0);
                var preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(element);
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                caretOffset = preCaretRange.toString().length;
            }
            else if (typeof document['selection'] != "undefined" && document['selection'].type != "Control") {
                var textRange = document['selection'].createRange();
                var preCaretTextRange = document.body['createTextRange']();
                preCaretTextRange.moveToElementText(element);
                preCaretTextRange.setEndPoint("EndToEnd", textRange);
                caretOffset = preCaretTextRange.text.length;
            }
            return caretOffset;
        };
        EditableParser.prototype.onPaste = function (e) {
            var _this = this;
            e.preventDefault();
            var textPlain = e.clipboardData.getData('text/plain');
            document.execCommand("insertHTML", false, textPlain);
            Poly.PolyWidget.AnalyzeText(textPlain, function (translations) {
                Poly.textAnalyze.parseElement(_this.element, translations.analyzed);
                _this.updatePopupBinds();
            });
        };
        EditableParser.prototype.setCursorToEnd = function (el) {
            el.focus();
            if (typeof window.getSelection != "undefined"
                && typeof document.createRange != "undefined") {
                var range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
            else if (typeof document.body['createTextRange'] != "undefined") {
                var textRange = document.body['createTextRange']();
                textRange.moveToElementText(el);
                textRange.collapse(false);
                textRange.select();
            }
        };
        EditableParser.prototype.updatePopupBinds = function () {
            var element = this.element;
            this.polyWidget.unbindToPopup(element);
            this.polyWidget.bindToPopup(element);
        };
        return EditableParser;
    }());
    Poly.EditableParser = EditableParser;
})(Poly || (Poly = {}));
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
