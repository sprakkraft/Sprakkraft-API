/// <reference path="../../bower_components/axios/axios.d.ts" />
module Poly {
    var ax = axios.create({
            baseURL: '/',
            headers: { 'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8' }
    });

    // Functions for sending analysis and translation requests to the server.
    // On the server, they are handled by sending requests to Dictionary API.    
    export var API = {
        analyzeText(text) {
            return ax.get('api/analyze', { params: {text: text}})
            .then((response: axios.Response) => {
                return response.data.textData;
            })
        },
        
        translateWord(word) {
            let toLang = PolyWidget.Config.toLang || 'en';
            return ax.get('api/translate', { params: {
                toLanguage: toLang,
                lemma: word.lemma,
                word: word.token,
                partOfSpeech: word.pos,
                getDefinitions: 'true'
            }})
            .then((res) => {
                return res.data.translation;
            })
        },
        
        translatePhrase(phrase) {
            let toLang = PolyWidget.Config.toLang || 'en';
            return ax.get('api/translate', { params: {
                toLanguage: toLang,
                phrase: phrase
            }})
            .then((res) => {
                return res.data.translation;
            })
        },

        setDifficulty(word:string, difficulty) {
            return new window['Promise'](); // stub, not implemented
        }
        
    }
}
