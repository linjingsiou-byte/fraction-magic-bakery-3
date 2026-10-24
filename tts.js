/* ==========================================
   分數魔法烘焙屋 3.0 語音報讀管理器 (Web Speech API)
   支援開關控制、防吞字緩衝助詞、以及分數算式中文轉譯
   ========================================== */

class TtsManager {
    constructor() {
        this.enabled = true; // 預設開啟
        this.synth = window.speechSynthesis;
        this.currentUtterance = null;
        this.voice = null;
        this.initVoice();
    }

    // 初始化語音引擎，儘量尋找適合的中文(台灣)女聲
    initVoice() {
        if (!this.synth) return;
        
        const loadVoices = () => {
            const voices = this.synth.getVoices();
            // 優先選擇台灣中文 (zh-TW)，其次為其他中文
            this.voice = voices.find(v => v.lang === 'zh-TW' || v.lang.startsWith('zh-Hant')) || 
                         voices.find(v => v.lang.startsWith('zh')) || 
                         null;
        };

        loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    }

    // 設定啟用狀態
    setEnabled(state) {
        this.enabled = state;
        if (!state) {
            this.stop(); // 關閉時立即停止目前播放的語音
        }
    }

    // 停止當前播放
    stop() {
        if (this.synth) {
            this.synth.cancel();
        }
    }

    // 將字串中的分數 (如 3/8) 與算式轉譯為自然的中文報讀文字
    // 例如： "3/8" -> "八分之三" ; "1 - 3/5" -> "一減五分之三"
    translateText(text) {
        let result = text;

        // 1. 先匹配分數 "分子/分母" (支援問號分數，如 ?/8 或 ?/?)
        const fractionRegex = /([\d\?]+)\/([\d\?]+)/g;
        result = result.replace(fractionRegex, (match, num, den) => {
            const dText = den === '?' ? '幾' : den;
            const nText = num === '?' ? '幾' : num;
            return `${dText}分之${nText}`;
        });

        // 2. 將其他算式符號與單獨問號中文化
        result = result.replace(/\+/g, ' 加上 ');
        result = result.replace(/-/g, ' 減去 ');
        result = result.replace(/=/g, ' 等於 ');
        result = result.replace(/\?/g, '多少呢？'); // 單獨的問號轉換為防吞字助詞

        // 3. 檢查句尾是否有防吞字緩衝助詞，若沒有且是問句或感嘆句，則加上
        // 主要是防範 Windows / iOS 句尾吃字
        if (/[呢嗎呀喔吧囉][？\?！!。\.]?$/.test(result)) {
            // 已有語氣助詞，不用重複添加
        } else if (result.endsWith('？') || result.endsWith('?')) {
            result = result.slice(0, -1) + '呢？';
        } else if (result.endsWith('！') || result.endsWith('!')) {
            result = result.slice(0, -1) + '呀！';
        } else if (result.endsWith('。') || result.endsWith('.')) {
            result = result.slice(0, -1) + '呢。';
        } else {
            result = result + '呢。';
        }

        return result;
    }

    // 報讀文字
    speak(text) {
        if (!this.synth || !this.enabled) return;

        // 停止之前的語音，避免重疊
        this.stop();

        const translatedText = this.translateText(text);
        const utterance = new SpeechSynthesisUtterance(translatedText);
        
        if (this.voice) {
            utterance.voice = this.voice;
        }
        
        // 調整語速與音調，使聽起來親切、適合小學生
        utterance.rate = 0.95;  // 稍微慢一點
        utterance.pitch = 1.15; // 稍微高一點，聽起來比較活潑

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
    }
}

// 實例化全域語音管理器
const ttsManager = new TtsManager();
