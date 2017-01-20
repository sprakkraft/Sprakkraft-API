let Promise = window['Promise'];

module Poly {
    export class PolyPlugin {
        private conversationId;
        private langId;

        constructor(widget:PolyWidget, config:IConfig) {
            API = ChatAPI;
            ChatAPI._core = config._core;
            ChatAPI.getConversationId = this.getConversationId.bind(this);
            ChatAPI.getLangId = this.getLangId.bind(this);
        }

        public getConversationId() {
            return this.conversationId;
        }

        public setConversationId(cvId) {
            console.log('Setting cvId', cvId);
            this.conversationId = cvId;
        }

        public getLangId() {
            return this.langId;
        }

        public setLangId(langId) {
            console.log('Setting langId', langId);
            this.langId = langId;
        }
    }



    export var ChatAPI = {
        _core: null,
        getConversationId: null,
        getLangId: null,

        analyzeText(text) {
            // console.log('analyzeText:ChatAPI');

            let langid = this.getLangId();

            return new Promise((resolve, err) => {
                this._core.analyzeText({text: text, langid}, (err, res) => {
                    // console.log('Analyze:', res, langid);
                    if(err) console.error(err)
                    else resolve(res.textData);
                })
            });
        },

        translateWord(word) {
            // console.log('translateWord:ChatAPI')
            let toLang = PolyWidget.Config.toLang || 'en';
            return new Promise((resolve, err) => {
                this._core.translateText({
                    lemma: word.lemma,
                    word: word.token,
                    partOfSpeech: word.pos,
                    toLanguage: toLang
                }, (err, res) => {
                    if(err) console.error(err)
                    else resolve(res.translation);
                })
            });
        },

        translatePhrase(phrase) {
            // console.log('translatePhrase:ChatAPI')
            let toLang = PolyWidget.Config.toLang || 'en';
            return new Promise((resolve, err) => {
                this._core.translateText({phrase: phrase, toLanguage: toLang}, (err, res) => {
                    if(err) console.error(err)
                    else resolve(res.translation);
                })
            });
        },

        setDifficulty(word:string, difficulty) {
            // console.log('setDifficulty:ChatAPI')
            let langid = this.getLangId();

            let data = {
                word,
                difficulty,
                langid
            }

            return new Promise((resolve, err) => {
                this._core.setWordDifficutly(data, (err, res) => {
                    if(err) console.error(err)
                    else resolve(res.success);
                })
            });
        }
    }
}
