/* ==========================================
   分數魔法烘焙屋 3.0 主程式邏輯 (app.js)
   管理模式切換、單人遊戲關卡、雙人對戰、輸入處理與動態渲染
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化應用程式
    const app = new MagicBakeryApp();
    window.app = app;
    app.start();
});

class MagicBakeryApp {
    constructor() {
        this.currentMode = 'single'; // 'single' 或 'double'
        this.activeScreen = 'screen-lobby';
        this.selectedSingleLevel = 1;
        this.completedLevels = [false, false, false, false]; // 是否通關 [L1, L2, L3, L4]
        
        // 模式切換按鈕
        this.btnSingle = document.getElementById('btn-mode-single');
        this.btnDouble = document.getElementById('btn-mode-double');
        this.btnAi = document.getElementById('btn-mode-ai');
        this.singleMap = document.getElementById('single-map-area');
        this.doubleSetup = document.getElementById('double-setup-area');
        this.aiSetup = document.getElementById('ai-setup-area');
        
        // 語音按鈕
        this.btnTts = document.getElementById('btn-tts-toggle');
        
        // 遊戲畫面切換
        this.screenLobby = document.getElementById('screen-lobby');
        this.screenSinglePlay = document.getElementById('screen-single-play');
        this.screenDoublePlay = document.getElementById('screen-double-play');
        this.screenAiPlay = document.getElementById('screen-ai-play');
        this.screenResult = document.getElementById('screen-result');
        
        // 單人遊玩狀態
        this.singleCurrentQuestionIdx = 0;
        this.singleQuestions = [];
        this.singleActiveInputCell = null; // 當前被點選的算式輸入格 (DOM element)
        this.singleScore = 0;

        // 雙人對戰狀態
        this.battleQuestions = [];
        this.battleCurrentQuestionIdx = 0;
        this.battleTimerInterval = null;
        this.battleTimeLimit = 30; // 每題 30 秒
        this.battleTimerVal = 30;
        this.p1Score = 0;
        this.p2Score = 0;
        this.p1ActiveInputCell = null;
        this.p2ActiveInputCell = null;
        this.p1Answered = false;
        this.p2Answered = false;
        this.p1SubmitBtn = document.getElementById('btn-p1-submit');
        this.p2SubmitBtn = document.getElementById('btn-p2-submit');
        this.battleThinkingTimer = null;
        this.isBattleThinkingPhase = false;

        // 單人 AI 挑戰賽（魔力烤箱充能賽）狀態
        this.aiDifficulty = 'normal'; // 'easy' | 'normal' | 'hard'
        this.aiTopic = 'mix'; // 'mix' | 'add' | 'sub' | 'sub1'
        this.playerEnergy = 0; // 0 - 100
        this.aiEnergy = 0; // 0 - 100
        this.playerCombo = 0;
        this.maxPlayerCombo = 0;
        this.aiQuestions = [];
        this.aiCurrentQuestionIdx = 0;
        this.aiActiveInputCell = null;
        this.aiThinkingTimeout = null;
        this.aiThinkingInterval = null;
        this.aiIsPaused = false;
        this.aiThinkingTotalMs = 9000;
        this.aiThinkingElapsedMs = 0;
        this.aiGameStartTime = 0;
        this.aiCorrectCount = 0;
        this.aiTotalAnswered = 0;
        this.isAiGameActive = false;

        // 學習迷思診斷統計（供結算畫面產出個人化診斷報告）
        this.sessionMisconceptions = {
            denError: 0,      // 分母跟著相加減
            convert1Error: 0, // 整數 1 換算錯誤或分子分母相等概念混淆
            numError: 0,      // 分子加減計算或計數錯誤
            choiceError: 0    // 觀念比較選擇錯誤
        };
    }

    resetSessionMisconceptions() {
        this.sessionMisconceptions = {
            denError: 0,
            convert1Error: 0,
            numError: 0,
            choiceError: 0
        };
    }

    getDiagnosticSummaryHtml() {
        const m = this.sessionMisconceptions;
        const totalErrors = m.denError + m.convert1Error + m.numError + m.choiceError;
        let advice = "";
        if (totalErrors === 0) {
            advice = "✅ <strong>完美表現：</strong>你的同分母分數加減與「整數 1 等於分子分母相同分數」概念非常穩固喔！";
        } else if (m.denError > 0) {
            advice = "💡 <strong>關鍵迷思提醒：</strong>同分母分數相加或相減時，<strong>「分母（平分的總份數）」維持不變</strong>，只需要把分子相加或相減喔！";
        } else if (m.convert1Error > 0) {
            advice = "💡 <strong>關鍵迷思提醒：</strong>遇到整數 1 的加減時，記得先把 1 換成<strong>「分子和分母一樣大」</strong>的分數（例如 1 = <span class=\"fraction\"><span class=\"num-row\"><span>8</span></span><span class=\"den-row\"><span>8</span></span></span>），再進行計算喔！";
        } else {
            advice = "💡 <strong>貼心小提醒：</strong>觀念很棒！在數配料份數與計算分子加減時，再細心核對一次數字就會全對囉！";
        }
        return `<div class="diagnostic-summary-box">${advice}</div>`;
    }

    start() {
        this.initParticles();
        this.bindGlobalEvents();
        this.updateLevelNodes();
        
        // 播放開場語音
        setTimeout(() => {
            ttsManager.speak("歡迎光臨分數魔法烘焙屋！請選擇你想挑戰的模式呢。");
        }, 800);
    }

    // ==================== 基礎背景粒子 ====================
    initParticles() {
        const container = document.getElementById('particles-container');
        if (!container) return;

        const createParticle = () => {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            const size = Math.random() * 8 + 4;
            const left = Math.random() * 100;
            const duration = Math.random() * 6 + 4;
            const delay = Math.random() * 3;

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${left}vw`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;

            container.appendChild(particle);

            // 動畫結束後移除
            setTimeout(() => {
                particle.remove();
            }, (duration + delay) * 1000);
        };

        // 每秒產生粒子
        setInterval(createParticle, 400);
    }

    // ==================== 全域事件綁定 ====================
    bindGlobalEvents() {
        // 模式切換
        this.btnSingle.addEventListener('click', () => this.switchMode('single'));
        this.btnDouble.addEventListener('click', () => this.switchMode('double'));
        if (this.btnAi) {
            this.btnAi.addEventListener('click', () => this.switchMode('ai'));
        }

        // 語音切換
        this.btnTts.addEventListener('click', () => {
            soundEffects.playClick();
            const nowEnabled = !ttsManager.enabled;
            ttsManager.setEnabled(nowEnabled);
            if (nowEnabled) {
                this.btnTts.classList.add('active');
                this.btnTts.querySelector('.tts-text').innerText = "語音報讀：開";
                this.btnTts.querySelector('.tts-icon').innerText = "🔊";
                ttsManager.speak("語音報讀已開啟呢！");
            } else {
                this.btnTts.classList.remove('active');
                this.btnTts.querySelector('.tts-text').innerText = "語音報讀：關";
                this.btnTts.querySelector('.tts-icon').innerText = "🔇";
            }
        });

        // 關卡地圖節點選擇 (單人)
        document.querySelectorAll('.level-node').forEach(node => {
            node.addEventListener('click', (e) => {
                const targetNode = e.currentTarget;
                if (targetNode.classList.contains('locked')) {
                    soundEffects.playWrong();
                    ttsManager.speak("這關鎖住了，請先完成前一關的修練呢。");
                    return;
                }
                
                soundEffects.playClick();
                const lvl = parseInt(targetNode.getAttribute('data-level'));
                this.selectedSingleLevel = lvl;
                
                // 更新高亮狀態
                document.querySelectorAll('.level-node').forEach(n => n.classList.remove('active'));
                targetNode.classList.add('active');
                
                const names = ["", "第一關魔法麵包拼拼樂", "第二關魔法吐司大烤爐", "第三關老鼠小偷的挑戰", "第四關神奇彩帶裝飾秀"];
                ttsManager.speak(`你選擇了 ${names[lvl]}，準備好就可以出發呢。`);
            });
        });

        // 大廳開始遊戲按鈕
        document.getElementById('btn-start-single').addEventListener('click', () => {
            soundEffects.playClick();
            this.startSingleGame(this.selectedSingleLevel);
        });

        // 單人遊玩送出答案按鈕
        document.getElementById('btn-single-submit').addEventListener('click', () => {
            this.submitSingleAnswer();
        });

        document.getElementById('btn-start-battle').addEventListener('click', () => {
            soundEffects.playClick();
            this.startBattleGame();
        });

        // 返回大廳
        document.getElementById('btn-single-back-lobby').addEventListener('click', () => {
            soundEffects.playClick();
            ttsManager.stop();
            this.showScreen('screen-lobby');
        });

        document.getElementById('btn-battle-back-lobby').addEventListener('click', () => {
            soundEffects.playClick();
            this.endBattle();
            this.showScreen('screen-lobby');
        });

        // 雙人對戰主題選擇
        document.querySelectorAll('#battle-topic-select .opt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                soundEffects.playClick();
                document.querySelectorAll('#battle-topic-select .opt-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 雙人對戰題數選擇
        document.querySelectorAll('#battle-count-select .opt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                soundEffects.playClick();
                document.querySelectorAll('#battle-count-select .opt-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // AI 挑戰賽難度選擇
        document.querySelectorAll('#ai-difficulty-select .ai-diff-card').forEach(card => {
            card.addEventListener('click', (e) => {
                soundEffects.playClick();
                document.querySelectorAll('#ai-difficulty-select .ai-diff-card').forEach(c => c.classList.remove('active'));
                const currentCard = e.currentTarget;
                currentCard.classList.add('active');
                this.aiDifficulty = currentCard.getAttribute('data-diff');
                const diffName = currentCard.querySelector('.diff-title').innerText;
                ttsManager.speak(`切換難度為：${diffName}`);
            });
        });

        // AI 挑戰賽主題選擇
        document.querySelectorAll('#ai-topic-select .opt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                soundEffects.playClick();
                document.querySelectorAll('#ai-topic-select .opt-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.aiTopic = e.target.getAttribute('data-topic');
            });
        });

        // AI 挑戰賽開始按鈕
        const btnStartAi = document.getElementById('btn-start-ai');
        if (btnStartAi) {
            btnStartAi.addEventListener('click', () => {
                soundEffects.playClick();
                this.startAiChallenge();
            });
        }

        // AI 挑戰賽作答送出按鈕
        const btnAiSubmit = document.getElementById('btn-ai-submit');
        if (btnAiSubmit) {
            btnAiSubmit.addEventListener('click', () => {
                this.submitAiAnswer();
            });
        }

        // AI 挑戰賽下一題按鈕
        const btnAiNext = document.getElementById('btn-ai-next');
        if (btnAiNext) {
            btnAiNext.addEventListener('click', () => {
                soundEffects.playClick();
                this.nextAiQuestion();
            });
        }

        // AI 挑戰賽重播語音
        const btnAiAudioRepeat = document.getElementById('btn-ai-audio-repeat');
        if (btnAiAudioRepeat) {
            btnAiAudioRepeat.addEventListener('click', () => {
                this.repeatAiAudio();
            });
        }

        // AI 挑戰賽返回大廳
        const btnAiBackLobby = document.getElementById('btn-ai-back-lobby');
        if (btnAiBackLobby) {
            btnAiBackLobby.addEventListener('click', () => {
                soundEffects.playClick();
                this.cleanupAiChallenge();
                this.showScreen('screen-lobby');
            });
        }

        // 結算畫面確認按鈕
        document.getElementById('btn-result-ok').addEventListener('click', () => {
            soundEffects.playClick();
            this.showScreen('screen-lobby');
        });

        // 魔法烘培秘笈彈窗事件繫結
        const openGuide = () => this.toggleSecretGuide(true);
        const closeGuide = () => this.toggleSecretGuide(false);
        
        document.getElementById('btn-lobby-secret-guide').addEventListener('click', openGuide);
        document.getElementById('btn-footer-secret-guide').addEventListener('click', openGuide);
        document.getElementById('btn-close-guide').addEventListener('click', closeGuide);
        document.getElementById('btn-close-guide-bottom').addEventListener('click', closeGuide);

        // 實體鍵盤監聽支援 (支援單人與 AI 挑戰賽)
        window.addEventListener('keydown', (e) => {
            if (this.activeScreen === 'screen-single-play') {
                if (e.key >= '0' && e.key <= '9') {
                    this.handleVirtualKeyboardInput(e.key);
                } else if (e.key === 'Backspace') {
                    this.handleVirtualKeyboardInput('清除');
                } else if (e.key === 'Enter') {
                    const nextBtn = document.getElementById('btn-single-next');
                    if (nextBtn && !nextBtn.classList.contains('hidden')) {
                        nextBtn.click();
                    } else {
                        this.submitSingleAnswer();
                    }
                }
            } else if (this.activeScreen === 'screen-ai-play') {
                if (e.key >= '0' && e.key <= '9') {
                    this.handleAiKeyboardInput(e.key);
                } else if (e.key === 'Backspace') {
                    this.handleAiKeyboardInput('清除');
                } else if (e.key === 'Enter') {
                    this.submitAiAnswer();
                }
            }
        });
    }

    // ==================== 畫面切換與模式 ====================
    switchMode(mode) {
        if (this.currentMode === mode) return;
        soundEffects.playClick();
        
        this.currentMode = mode;
        this.btnSingle.classList.toggle('active', mode === 'single');
        this.btnDouble.classList.toggle('active', mode === 'double');
        if (this.btnAi) this.btnAi.classList.toggle('active', mode === 'ai');

        this.singleMap.classList.toggle('hidden', mode !== 'single');
        this.doubleSetup.classList.toggle('hidden', mode !== 'double');
        if (this.aiSetup) this.aiSetup.classList.toggle('hidden', mode !== 'ai');

        if (mode === 'single') {
            ttsManager.speak("開啟單人自主學習模式，跟著關卡一起修練吧呢。");
        } else if (mode === 'double') {
            ttsManager.speak("開啟雙人烘焙對決，和你的夥伴一起同屏競技吧呢。");
        } else if (mode === 'ai') {
            ttsManager.speak("開啟單人 AI 挑戰賽！與煉金貓頭鷹大師比拼魔力烤箱充能吧！");
        }
    }

    showScreen(screenId) {
        this.screenLobby.classList.remove('active');
        this.screenSinglePlay.classList.remove('active');
        this.screenDoublePlay.classList.remove('active');
        if (this.screenAiPlay) this.screenAiPlay.classList.remove('active');
        this.screenResult.classList.remove('active');

        const screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');
        this.activeScreen = screenId;
    }

    // 控制魔法烘培秘笈彈窗顯示
    toggleSecretGuide(show) {
        soundEffects.playClick();
        const modal = document.getElementById('modal-secret-guide');
        if (show) {
            modal.classList.add('active');
            ttsManager.speak("開啟分數魔法烘焙秘笈。");
        } else {
            modal.classList.remove('active');
            ttsManager.stop();
        }
    }

    // 更新地圖節點解鎖狀態
    updateLevelNodes() {
        const nodes = document.querySelectorAll('.level-node');
        nodes.forEach((node, idx) => {
            const lvl = idx + 1;
            node.classList.remove('completed', 'locked', 'active');
            
            if (this.selectedSingleLevel === lvl) {
                node.classList.add('active');
            }

            if (lvl === 1) {
                // 第一關預設解鎖
            } else {
                const prevCompleted = this.completedLevels[lvl - 2];
                if (!prevCompleted) {
                    node.classList.add('locked');
                }
            }

            if (this.completedLevels[idx]) {
                node.classList.add('completed');
            }
        });
    }

    // ==========================================================
    // ==================== 單人遊玩模式 ========================
    // ==========================================================
    startSingleGame(level) {
        this.singleCurrentQuestionIdx = 0;
        this.resetSessionMisconceptions();
        
        // 隨機抽取 5 題不重複 (Fisher-Yates 洗牌)
        const pool = [...gameQuestions[level]];
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        this.singleQuestions = pool.slice(0, 5);
        this.singleScore = 0;
        
        document.getElementById('single-level-title').innerText = `第 ${level} 關：` + 
            (level === 1 ? "魔法麵包拼拼樂" : 
             level === 2 ? "魔法吐司大烤爐" : 
             level === 3 ? "老鼠小偷的挑戰" : "神奇彩帶裝飾秀");

        this.showScreen('screen-single-play');
        this.loadSingleQuestion();
    }

    loadSingleQuestion() {
        const q = this.singleQuestions[this.singleCurrentQuestionIdx];
        
        // 進度條
        const progressPercent = (this.singleCurrentQuestionIdx / this.singleQuestions.length) * 100;
        document.getElementById('single-progress-fill').style.width = `${progressPercent}%`;

        // 題目文字與報讀 (以直式分數 HTML 格式化)
        document.getElementById('single-question-text').innerHTML = this.formatMathText(q.text);
        ttsManager.speak(q.text);

        // 重播按鈕
        const audioBtn = document.getElementById('btn-single-audio-repeat');
        // 清理先前的事件
        const newAudioBtn = audioBtn.cloneNode(true);
        audioBtn.parentNode.replaceChild(newAudioBtn, audioBtn);
        newAudioBtn.addEventListener('click', () => {
            soundEffects.playClick();
            ttsManager.speak(q.text);
        });

        // 送出與下一題按鈕切換與隱藏回饋橫條
        document.getElementById('btn-single-submit').classList.remove('hidden');
        document.getElementById('btn-single-next').classList.add('hidden');
        const singleFeedbackBar = document.getElementById('single-feedback-bar');
        if (singleFeedbackBar) {
            singleFeedbackBar.classList.add('hidden');
            singleFeedbackBar.className = 'ai-feedback-bar hidden';
        }

        // 初始化作答區
        this.renderSingleWorkspace(q);
        
        // 初始化視覺互動區
        this.renderSingleInteraction(q);

        // 依「先分母、後分子」順序選取第一個未填寫的問號格
        const display = document.getElementById('single-equation-display');
        const orderedCells = this.getOrderedInputCells(display);
        const firstUnfilled = orderedCells.find(c => c.innerText === '?') || orderedCells[0];
        if (firstUnfilled) {
            this.activateInputCell(firstUnfilled);
        }
    }

    // 依國小數學「先分母（平分份數）、後分子（拿取份數）」之教學順序取得輸入格清單
    getOrderedInputCells(container) {
        if (!container) return [];
        const ordered = [];
        const boxes = container.querySelectorAll('.frac-input-box, .whole-input-box');
        boxes.forEach(box => {
            if (box.classList.contains('frac-input-box')) {
                const den = box.querySelector('.frac-input-den');
                const num = box.querySelector('.frac-input-num');
                if (den && !den.classList.contains('static-default')) ordered.push(den);
                if (num && !num.classList.contains('static-default')) ordered.push(num);
            } else if (box.classList.contains('whole-input-box')) {
                ordered.push(box);
            }
        });
        return ordered;
    }

    // 渲染單人作答區 (算式與鍵盤)
    renderSingleWorkspace(q) {
        const display = document.getElementById('single-equation-display');
        display.innerHTML = '';
        this.singleActiveInputCell = null;

        // 1. 選擇題模式
        if (q.type === 'choice') {
            document.getElementById('single-keyboard').innerHTML = ''; // 隱藏鍵盤
            display.style.flexDirection = 'column';
            display.style.gap = '12px';
            
            q.options.forEach(opt => {
                const optBtn = document.createElement('button');
                optBtn.className = 'opt-btnChoice opt-btn';
                optBtn.style.width = '100%';
                optBtn.style.maxWidth = '300px';
                optBtn.setAttribute('data-val', opt);
                optBtn.innerHTML = this.formatMathText(opt);
                
                optBtn.addEventListener('click', () => {
                    soundEffects.playClick();
                    display.querySelectorAll('.opt-btnChoice').forEach(b => b.classList.remove('active'));
                    optBtn.classList.add('active');
                });
                display.appendChild(optBtn);
            });
            return;
        }

        // 2. 分數/算式輸入模式
        display.style.flexDirection = 'row';
        display.style.gap = '8px';
        
        if (q.type === 'fraction-input') {
            // 單個分數輸入： [? / ?]
            const fracBox = this.createFracInputBox('single-f1');
            display.appendChild(fracBox);
        } else if (q.type === 'equation') {
            // A/C + B/C = ?/?  或  A/C - B/C = ?/?
            // 課本會寫： 3/8 + 2/8 = [? / ?]
            display.appendChild(this.createStaticFrac(q.answer.num1, q.answer.den1));
            
            const symbol = document.createElement('span');
            symbol.className = 'symbol';
            symbol.innerText = q.initialEq.includes('+') ? '+' : '-';
            display.appendChild(symbol);
            
            display.appendChild(this.createStaticFrac(q.answer.num2, q.answer.den2));
            
            const eqSymbol = document.createElement('span');
            eqSymbol.className = 'symbol';
            eqSymbol.innerText = '=';
            display.appendChild(eqSymbol);
            
            const fracBox = this.createFracInputBox('single-fans');
            display.appendChild(fracBox);
        } else if (q.type === 'equation-whole') {
            // A/C + B/C = ?/? = ?
            display.appendChild(this.createStaticFrac(q.answer.num1, q.answer.den1));
            
            const symbol = document.createElement('span');
            symbol.className = 'symbol';
            symbol.innerText = '+';
            display.appendChild(symbol);
            
            display.appendChild(this.createStaticFrac(q.answer.num2, q.answer.den2));
            
            const eqSymbol = document.createElement('span');
            eqSymbol.className = 'symbol';
            eqSymbol.innerText = '=';
            display.appendChild(eqSymbol);
            
            display.appendChild(this.createFracInputBox('single-fans'));
            
            const eqSymbol2 = document.createElement('span');
            eqSymbol2.className = 'symbol';
            eqSymbol2.innerText = '=';
            display.appendChild(eqSymbol2);
            
            display.appendChild(this.createWholeInputBox('single-wholeans'));
        } else if (q.type === 'equation-convert') {
            // 減法轉換： 7/12 - ?/12 = ?/?
            display.appendChild(this.createStaticFrac(q.answer.num1, q.answer.den1));
            
            const symbol = document.createElement('span');
            symbol.className = 'symbol';
            symbol.innerText = '-';
            display.appendChild(symbol);
            
            // 中間的減數分數輸入框
            display.appendChild(this.createFracInputBox('single-f2', q.answer.den2)); // 分母自動填寫(因同分母)
            
            const eqSymbol = document.createElement('span');
            eqSymbol.className = 'symbol';
            eqSymbol.innerText = '=';
            display.appendChild(eqSymbol);
            
            display.appendChild(this.createFracInputBox('single-fans'));
        } else if (q.type === 'equation-whole-sub') {
            // 1 - A/B = ?/? - A/B = ?/?
            const wholeSymbol = document.createElement('span');
            wholeSymbol.className = 'symbol';
            wholeSymbol.innerText = '1';
            display.appendChild(wholeSymbol);
            
            const symbol = document.createElement('span');
            symbol.className = 'symbol';
            symbol.innerText = '-';
            display.appendChild(symbol);
            
            display.appendChild(this.createStaticFrac(q.answer.num2, q.answer.den2));
            
            const eqSymbol = document.createElement('span');
            eqSymbol.className = 'symbol';
            eqSymbol.innerText = '=';
            display.appendChild(eqSymbol);
            
            display.appendChild(this.createFracInputBox('single-f1'));
            
            const symbol2 = document.createElement('span');
            symbol2.className = 'symbol';
            symbol2.innerText = '-';
            display.appendChild(symbol2);
            
            display.appendChild(this.createStaticFrac(q.answer.num2, q.answer.den2));
            
            const eqSymbol2 = document.createElement('span');
            eqSymbol2.className = 'symbol';
            eqSymbol2.innerText = '=';
            display.appendChild(eqSymbol2);
            
            display.appendChild(this.createFracInputBox('single-fans'));
        } else if (q.type === 'equation-add-to-whole') {
            // A/B + C/B = ?/? = ?
            display.appendChild(this.createStaticFrac(q.answer.num1, q.answer.den1));
            
            const symbol = document.createElement('span');
            symbol.className = 'symbol';
            symbol.innerText = '+';
            display.appendChild(symbol);
            
            display.appendChild(this.createStaticFrac(q.answer.num2, q.answer.den2));
            
            const eqSymbol = document.createElement('span');
            eqSymbol.className = 'symbol';
            eqSymbol.innerText = '=';
            display.appendChild(eqSymbol);
            
            display.appendChild(this.createFracInputBox('single-fans'));
            
            const eqSymbol2 = document.createElement('span');
            eqSymbol2.className = 'symbol';
            eqSymbol2.innerText = '=';
            display.appendChild(eqSymbol2);
            
            display.appendChild(this.createWholeInputBox('single-wholeans'));
        }

        // 綁定手寫虛擬鍵盤
        this.renderKeyboard('single-keyboard', (val) => this.handleVirtualKeyboardInput(val));
        
        // 依「先分母、後分子」預設高亮第一個輸入小格
        const orderedCells = this.getOrderedInputCells(display);
        const firstInput = orderedCells.find(c => c.innerText === '?') || orderedCells[0];
        if (firstInput) {
            this.activateInputCell(firstInput);
        }
    }

    // 輔助函式：建立靜態直式分數 DOM
    createStaticFrac(num, den) {
        const fracSpan = document.createElement('span');
        fracSpan.className = 'fraction';
        fracSpan.innerHTML = `
            <span class="num-row"><span>${num}</span></span>
            <span class="den-row"><span>${den}</span></span>
        `;
        return fracSpan;
    }

    // 輔助函式：建立分數輸入框組 DOM
    createFracInputBox(prefixId, defaultDen = null) {
        const box = document.createElement('div');
        box.className = 'frac-input-box';
        box.id = prefixId;

        const isPlayer1 = prefixId.startsWith('p1');
        const isPlayer2 = prefixId.startsWith('p2');
        const isAi = prefixId.startsWith('ai');

        const numCell = document.createElement('div');
        numCell.className = 'frac-input-num';
        numCell.setAttribute('data-target', `${prefixId}-num`);
        numCell.innerText = '?';
        numCell.addEventListener('click', (e) => {
            if ((isPlayer1 || isPlayer2) && this.isBattleThinkingPhase) {
                soundEffects.playSoftClick();
                this.triggerBattleSideShake(isPlayer1 ? 1 : 2);
                e.stopPropagation();
                return;
            }
            soundEffects.playClick();
            e.stopPropagation();
            if (isPlayer1) {
                this.activatePlayerInputCell(1, numCell);
            } else if (isPlayer2) {
                this.activatePlayerInputCell(2, numCell);
            } else if (isAi) {
                this.activateAiInputCell(numCell);
            } else {
                this.activateInputCell(numCell);
            }
        });

        const line = document.createElement('div');
        line.className = 'frac-input-line';

        const denCell = document.createElement('div');
        denCell.className = 'frac-input-den';
        denCell.setAttribute('data-target', `${prefixId}-den`);
        if (defaultDen) {
            denCell.innerText = defaultDen;
            denCell.classList.add('static-default'); // 已有預設值，唯讀
        } else {
            denCell.innerText = '?';
            denCell.addEventListener('click', (e) => {
                if ((isPlayer1 || isPlayer2) && this.isBattleThinkingPhase) {
                    soundEffects.playSoftClick();
                    this.triggerBattleSideShake(isPlayer1 ? 1 : 2);
                    e.stopPropagation();
                    return;
                }
                soundEffects.playClick();
                e.stopPropagation();
                if (isPlayer1) {
                    this.activatePlayerInputCell(1, denCell);
                } else if (isPlayer2) {
                    this.activatePlayerInputCell(2, denCell);
                } else if (isAi) {
                    this.activateAiInputCell(denCell);
                } else {
                    this.activateInputCell(denCell);
                }
            });
        }

        box.appendChild(numCell);
        box.appendChild(line);
        box.appendChild(denCell);
        
        return box;
    }

    // 輔助函式：建立整數輸入框 DOM
    createWholeInputBox(id) {
        const cell = document.createElement('div');
        cell.className = 'whole-input-box';
        cell.id = id;
        cell.innerText = '?';
        
        const isPlayer1 = id.startsWith('p1');
        const isPlayer2 = id.startsWith('p2');
        const isAi = id.startsWith('ai');

        cell.addEventListener('click', (e) => {
            soundEffects.playClick();
            e.stopPropagation();
            if (isPlayer1) {
                this.activatePlayerInputCell(1, cell);
            } else if (isPlayer2) {
                this.activatePlayerInputCell(2, cell);
            } else if (isAi) {
                this.activateAiInputCell(cell);
            } else {
                this.activateInputCell(cell);
            }
        });
        return cell;
    }

    // 啟動點選的輸入小格
    activateInputCell(cell) {
        if (cell.classList.contains('static-default')) return; // 略過預設值
        
        // 移除其他的高亮
        document.querySelectorAll('.frac-input-num, .frac-input-den, .whole-input-box, .frac-input-box').forEach(el => {
            el.classList.remove('selected', 'active');
        });

        this.singleActiveInputCell = cell;
        cell.classList.add('selected');
        
        // 同時高亮其父級輸入框組
        const parentBox = cell.closest('.frac-input-box');
        if (parentBox) {
            parentBox.classList.add('active');
        }
    }

    // 渲染虛擬鍵盤
    renderKeyboard(containerId, onKeyPress) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        // 0-9 數字鍵，加 C (清除) 和 OK (確認)
        const keys = ['1', '2', '3', '清除', '4', '5', '6', '確認', '7', '8', '9', '0'];
        
        keys.forEach(k => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.innerText = k;
            
            if (k === '清除' || k === '確認') {
                btn.classList.add('action-key');
            }

            btn.addEventListener('click', () => {
                soundEffects.playClick();
                onKeyPress(k);
            });
            container.appendChild(btn);
        });
    }

    // 處理虛擬鍵盤輸入
    handleVirtualKeyboardInput(val) {
        if (!this.singleActiveInputCell) return;

        if (val === '清除') {
            this.singleActiveInputCell.innerText = '?';
            this.syncVisualFromInputs(); // 清除時也更新視覺
        } else if (val === '確認') {
            // 跳到下一個未填寫的輸入格
            this.autoAdvanceInputFocus();
        } else {
            // 輸入數字，支持兩位數 (如分母10, 12)
            const currentVal = this.singleActiveInputCell.innerText;
            if (currentVal === '?') {
                this.singleActiveInputCell.innerText = val;
            } else {
                if (currentVal === '0') {
                    // 如果原先是0，輸入新數字則直接覆蓋0 (避免05等情況)
                    this.singleActiveInputCell.innerText = val;
                } else if (currentVal.length < 2) {
                    this.singleActiveInputCell.innerText = currentVal + val;
                }
            }
            
            // 數值輸入後，若符合常規，自動更新視覺互動區 (即時反應)
            this.syncVisualFromInputs();
        }
    }

    autoAdvanceInputFocus() {
        const display = document.getElementById('single-equation-display');
        const inputs = this.getOrderedInputCells(display);
        if (inputs.length === 0) return;
        const currentIdx = inputs.indexOf(this.singleActiveInputCell);
        
        // 依「先分母、後分子」順序尋找下一個未填寫的問號格
        for (let i = 1; i <= inputs.length; i++) {
            const nextCell = inputs[(currentIdx + i) % inputs.length];
            if (!nextCell.classList.contains('static-default') && nextCell.innerText === '?') {
                this.activateInputCell(nextCell);
                return;
            }
        }
        // 若都已填寫，循環切換至下一格方便修改
        const nextCell = inputs[(currentIdx + 1) % inputs.length];
        if (nextCell) this.activateInputCell(nextCell);
    }

    // 當輸入數值時，即時更新視覺表徵
    syncVisualFromInputs() {
        const q = this.singleQuestions[this.singleCurrentQuestionIdx];
        
        // 抓取目前畫面上已填入的分子與分母 (如果有填寫的話)
        let numVal = parseInt(this.getInputValue('single-fans-num') || this.getInputValue('single-f1-num'));
        let denVal = parseInt(this.getInputValue('single-fans-den') || this.getInputValue('single-f1-den') || q.visual.totalSlices || q.visual.totalItems);
        
        if (isNaN(numVal)) numVal = 0;
        if (isNaN(denVal) || denVal <= 0) denVal = q.visual.totalSlices || q.visual.totalItems;

        this.updateInteractiveVisual(q, numVal, denVal, 'single-interactive-content');
    }

    getInputValue(dataTargetId) {
        const el = document.querySelector(`[data-target="${dataTargetId}"]`);
        return el && el.innerText !== '?' ? el.innerText : null;
    }

    // ==================== 渲染與更新視覺互動區 ====================
    renderSingleInteraction(q, containerId = 'single-interactive-content') {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const type = q.visual.interactiveType;
        const prefix = containerId.startsWith('ai') ? 'ai' : 'single';

        // 1. 第一關：圓形魔法盤 (和 1 一樣大)
        if (type === 'pie') {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'center';

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('class', 'magic-circle-svg');
            svg.setAttribute('viewBox', '0 0 200 200');
            svg.id = `${prefix}-magic-pie-svg`;
            wrapper.appendChild(svg);

            // 右下角追加按鈕
            const inventory = document.createElement('div');
            inventory.className = 'drag-inventory';
            inventory.innerHTML = `
                <button class="tool-btn" id="btn-add-slice">
                    ${this.formatMathText(`🍰 放入 1/${q.visual.totalSlices} 塊麵包`)}
                </button>
                <button class="tool-btn" id="btn-clear-slices" style="border-color: var(--accent-strawberry); color: var(--accent-strawberry);">
                    🗑️ 清空
                </button>
            `;
            wrapper.appendChild(inventory);
            container.appendChild(wrapper);

            // 當前放入切片數
            this.currentPieSlicesCount = 0;

            const updatePie = () => {
                this.drawPieSvg(svg, q.visual.totalSlices, this.currentPieSlicesCount);
                
                // 動態同步輸入框
                const numEl = document.querySelector(`[data-target="${prefix}-f1-num"]`);
                const denEl = document.querySelector(`[data-target="${prefix}-f1-den"]`);
                if (numEl && !numEl.classList.contains('selected') && this.currentPieSlicesCount > 0) {
                    numEl.innerText = this.currentPieSlicesCount;
                }
                if (denEl && (this.currentPieSlicesCount > 0 || !q.text.includes('?/?'))) {
                    denEl.innerText = q.visual.totalSlices;
                }
            };

            updatePie();

            wrapper.querySelector('#btn-add-slice').addEventListener('click', () => {
                if (this.currentPieSlicesCount < q.visual.totalSlices) {
                    this.currentPieSlicesCount++;
                    soundEffects.playClick();
                    if (this.currentPieSlicesCount === q.visual.totalSlices) {
                        soundEffects.playMagic();
                    }
                    updatePie();
                } else {
                    ttsManager.speak("盤子已經裝滿蛋糕了呢。");
                }
            });

            wrapper.querySelector('#btn-clear-slices').addEventListener('click', () => {
                this.currentPieSlicesCount = 0;
                soundEffects.playClick();
                updatePie();
            });
        }
        
        // 1.5. 第一關離散量：盒裝點心 (和 1 一樣大)
        else if (type === 'discrete') {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'center';

            // 根據題目文字自動判斷對應的 Emoji 與單位名稱
            let emoji = '🍩';
            let name = '點心';
            let unitName = '個';
            if (q.text.includes('雞蛋')) {
                emoji = '🥚';
                name = '雞蛋';
                unitName = '個';
            } else if (q.text.includes('果凍')) {
                emoji = '🍮';
                name = '果凍';
                unitName = '個';
            } else if (q.text.includes('巧克力')) {
                emoji = '🍫';
                name = '巧克力';
                unitName = '顆';
            } else if (q.text.includes('餅乾')) {
                emoji = '🍪';
                name = '餅乾';
                unitName = '片';
            }

            const grid = document.createElement('div');
            grid.className = 'cookie-box-grid';
            grid.style.marginTop = '20px';

            wrapper.appendChild(grid);

            // 右下角追加操作按鈕
            const inventory = document.createElement('div');
            inventory.className = 'drag-inventory';
            inventory.innerHTML = `
                <button class="tool-btn" id="btn-add-item">
                    ${this.formatMathText(`${emoji} 放入 1/${q.visual.totalItems} 盒${name}`)}
                </button>
                <button class="tool-btn" id="btn-clear-items" style="border-color: var(--accent-strawberry); color: var(--accent-strawberry);">
                    🗑️ 清空
                </button>
            `;
            wrapper.appendChild(inventory);
            container.appendChild(wrapper);

            // 當前放入個數
            this.currentDiscreteCount = 0;

            const updateDiscrete = () => {
                grid.innerHTML = '';
                // 渲染容器外框
                const groupOutline = document.createElement('div');
                groupOutline.className = 'box-group-outline';
                grid.appendChild(groupOutline);

                for (let i = 0; i < q.visual.totalItems; i++) {
                    const item = document.createElement('div');
                    item.className = 'discrete-item';
                    if (i < this.currentDiscreteCount) {
                        item.classList.add('filled');
                        item.innerText = emoji;
                    } else {
                        item.innerText = '';
                    }
                    grid.appendChild(item);
                }

                // 同步更新分子/分母輸入框 (學童操作配料盤時自動連動)
                const numEl = document.querySelector(`[data-target="${prefix}-f1-num"]`);
                const denEl = document.querySelector(`[data-target="${prefix}-f1-den"]`);
                if (numEl && !numEl.classList.contains('selected') && this.currentDiscreteCount > 0) {
                    numEl.innerText = this.currentDiscreteCount;
                }
                if (denEl && (this.currentDiscreteCount > 0 || !q.text.includes('?/?'))) {
                    denEl.innerText = q.visual.totalItems;
                }
            };

            updateDiscrete();

            wrapper.querySelector('#btn-add-item').addEventListener('click', () => {
                if (this.currentDiscreteCount < q.visual.totalItems) {
                    this.currentDiscreteCount++;
                    soundEffects.playClick();
                    if (this.currentDiscreteCount === q.visual.totalItems) {
                        soundEffects.playMagic();
                    }
                    updateDiscrete();
                } else {
                    ttsManager.speak(`盒子已經裝滿${name}了呢。`);
                }
            });

            wrapper.querySelector('#btn-clear-items').addEventListener('click', () => {
                this.currentDiscreteCount = 0;
                soundEffects.playClick();
                updateDiscrete();
            });
        }
        
        // 2. 雙彩帶對比
        else if (type === 'ribbon-compare') {
            const wrapper = document.createElement('div');
            wrapper.className = 'ribbon-container';
            wrapper.style.width = '90%';
            
            // 紅彩帶 (12/12)
            const label1 = document.createElement('div');
            label1.style.fontWeight = '700';
            label1.style.alignSelf = 'flex-start';
            label1.innerHTML = `紅色彩帶 (長 <span class="fraction"><span class="num-row"><span>${q.visual.r1.num}</span></span><span class="den-row"><span>${q.visual.r1.den}</span></span></span> 公尺)：`;
            wrapper.appendChild(label1);

            const track1 = document.createElement('div');
            track1.className = 'ribbon-track';
            for (let i = 0; i < q.visual.r1.den; i++) {
                const seg = document.createElement('div');
                seg.className = 'ribbon-segment';
                seg.style.backgroundColor = 'var(--accent-strawberry)';
                track1.appendChild(seg);
            }
            wrapper.appendChild(track1);

            // 綠彩帶 (3/3)
            const label2 = document.createElement('div');
            label2.style.fontWeight = '700';
            label2.style.alignSelf = 'flex-start';
            label2.style.marginTop = '20px';
            label2.innerHTML = `綠色彩帶 (長 <span class="fraction"><span class="num-row"><span>${q.visual.r2.num}</span></span><span class="den-row"><span>${q.visual.r2.den}</span></span></span> 公尺)：`;
            wrapper.appendChild(label2);

            const track2 = document.createElement('div');
            track2.className = 'ribbon-track';
            for (let i = 0; i < q.visual.r2.den; i++) {
                const seg = document.createElement('div');
                seg.className = 'ribbon-segment';
                seg.style.backgroundColor = 'var(--accent-matcha)';
                track2.appendChild(seg);
            }
            wrapper.appendChild(track2);

            container.appendChild(wrapper);
        }

        // 3. 第二關：圓餅加法烤爐 (加法)
        else if (type === 'pie-add' || type === 'bread-add' || type === 'ribbon-add' || type === 'discrete-add') {
            this.renderAddInteractive(container, q, 0, prefix); // 初始填寫追加數為0
        }

        // 4. 第三關：減法老鼠與點心盒 (減法)
        else if (type === 'pie-sub' || type === 'discrete-sub' || type === 'bread-sub' || type === 'ribbon-sub') {
            this.renderSubInteractive(container, q, prefix);
        }

        // 5. 第四關：整數 1 減分數彩帶剪切
        else if (type === 'ribbon-cut' || type === 'bread-cut' || type === 'discrete-cut' || type === 'ribbon-add-whole') {
            this.renderCutInteractive(container, q, prefix);
        }
    }

    // 繪製 SVG 圓餅扇區 helper
    drawPieSvg(svg, totalSlices, filledCount, targetCount = 0) {
        svg.innerHTML = '';
        const cx = 100;
        const cy = 100;
        const r = 85;

        // 如果只有 1 份，那就是整個圓
        if (totalSlices === 1) {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('cx', cx);
            circle.setAttribute('cy', cy);
            circle.setAttribute('r', r);
            circle.setAttribute('class', filledCount >= 1 ? 'svg-pie-slice filled' : 'svg-pie-slice');
            svg.appendChild(circle);
            return;
        }

        const angleStep = 360 / totalSlices;

        for (let i = 0; i < totalSlices; i++) {
            const startAngle = i * angleStep - 90; // 從正上方 (12點鐘方向) 開始
            const endAngle = (i + 1) * angleStep - 90;

            const rad1 = (startAngle * Math.PI) / 180;
            const rad2 = (endAngle * Math.PI) / 180;

            const x1 = cx + r * Math.cos(rad1);
            const y1 = cy + r * Math.sin(rad1);
            const x2 = cx + r * Math.cos(rad2);
            const y2 = cy + r * Math.sin(rad2);

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            
            // SVG Arc path
            const largeArcFlag = angleStep > 180 ? 1 : 0;
            const dStr = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
            path.setAttribute('d', dStr);

            // 設定樣式類別
            let cls = 'svg-pie-slice';
            if (i < filledCount) {
                cls += ' filled';
            } else if (i < targetCount) {
                cls += ' target-add'; // 預期追加的閃爍提示
            }
            path.setAttribute('class', cls);
            svg.appendChild(path);
        }
    }

    // 第二關：加法動態渲染
    renderAddInteractive(container, q, userAddedCount, prefix = 'single') {
        container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'oven-container';
        
        // 烤爐主體
        const oven = document.createElement('div');
        oven.className = 'oven-graphic';
        
        const glass = document.createElement('div');
        glass.className = 'oven-glass';
        
        const glow = document.createElement('div');
        glow.className = 'oven-glow';
        glass.appendChild(glow);

        // 放置吐司或披薩
        const total = q.visual.totalSlices || q.visual.totalItems;
        const initial = q.visual.initialSlices || q.visual.initialItems;
        const add = q.visual.addSlices || q.visual.addItems;

        // 我們可以使用麵包切片展示
        const loaf = document.createElement('div');
        loaf.className = 'bread-loaf';

        for (let i = 0; i < total; i++) {
            const slice = document.createElement('div');
            slice.className = 'bread-slice';
            
            if (i < initial) {
                // 原本已有的 (黃色)
                slice.classList.add('filled');
            } else if (i < initial + userAddedCount) {
                // 學童追加進去的 (黃色)
                slice.classList.add('filled');
                slice.style.backgroundColor = '#ff6b6b'; // 用草莓紅色高亮
            } else if (i < initial + add) {
                // 目標要追加的虛線框提示
                slice.classList.add('target-add');
            }
            loaf.appendChild(slice);
        }

        glass.appendChild(loaf);
        oven.appendChild(glass);
        wrapper.appendChild(oven);

        // 加法操作按鈕
        const toolArea = document.createElement('div');
        toolArea.className = 'drag-inventory';
        
        const unitName = q.visual.interactiveType.includes('discrete') ? '個' : '塊';
        toolArea.innerHTML = `
            <button class="tool-btn" id="btn-add-val">
                ${this.formatMathText(`➕ 放入 1/${total} ${unitName}吐司`)}
            </button>
            <button class="tool-btn" id="btn-reset-val" style="border-color: var(--accent-strawberry); color: var(--accent-strawberry);">
                🗑️ 重設
            </button>
        `;
        wrapper.appendChild(toolArea);
        container.appendChild(wrapper);

        // 連接按鈕邏輯
        let currentAdded = userAddedCount;
        
        wrapper.querySelector('#btn-add-val').addEventListener('click', () => {
            if (initial + currentAdded < total) {
                currentAdded++;
                soundEffects.playClick();
                this.renderAddInteractive(container, q, currentAdded, prefix);
                
                // 同步更新分母與分子輸入格（相容單人與 AI 模式）
                const fansDen = document.querySelector(`[data-target="${prefix}-fans-den"]`);
                if (fansDen && fansDen.innerText === '?') {
                    fansDen.innerText = total;
                }
                const fansNum = document.querySelector(`[data-target="${prefix}-fans-num"]`);
                if (fansNum) {
                    fansNum.innerText = initial + currentAdded;
                }
            } else {
                ttsManager.speak("烤爐已經裝不下麵包了呢。");
            }
        });

        wrapper.querySelector('#btn-reset-val').addEventListener('click', () => {
            currentAdded = 0;
            soundEffects.playClick();
            this.renderAddInteractive(container, q, 0, prefix);
        });
    }

    // 第三關：減法互動渲染 (老鼠小偷)
    renderSubInteractive(container, q, prefix = 'single') {
        container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'box-container';

        const total = q.visual.totalSlices || q.visual.totalItems;
        const initial = q.visual.initialSlices || q.visual.initialItems;
        const sub = q.visual.subSlices || q.visual.subItems;

        // 老鼠圖案
        const mouse = document.createElement('div');
        mouse.className = 'mouse-thief';
        mouse.innerText = '🐭';
        wrapper.appendChild(mouse);

        // 離散量點心格
        const grid = document.createElement('div');
        grid.className = 'cookie-box-grid';

        const isPencilProblem = q.visual.interactiveType === 'discrete-sub' && total === 12; // 鉛筆 12 枝
        
        // 若是鉛筆，我們可以使用鉛筆圖案，若是其他可以用餅乾 🍪
        const icon = isPencilProblem ? '✏️' : '🍪';
        
        // 如果是離散量包覆框，則放一個邊框框
        const groupOutline = document.createElement('div');
        groupOutline.className = 'box-group-outline';
        grid.appendChild(groupOutline);

        // 目前被學生移走的個數
        this.currentRemovedCount = 0;

        const items = [];
        for (let i = 0; i < total; i++) {
            const item = document.createElement('div');
            item.className = 'discrete-item';
            item.innerText = icon;

            if (i < initial) {
                item.classList.add('filled');
            } else {
                item.style.opacity = '0'; // 未放滿
                item.style.pointerEvents = 'none';
            }

            // 被減數點選事件：將已有的點心「移走」或「咬掉」
            item.addEventListener('click', () => {
                if (!item.classList.contains('filled')) return;
                
                soundEffects.playClick();
                if (item.classList.contains('selected')) {
                    // 取消移走
                    item.classList.remove('selected');
                    item.innerText = icon;
                    this.currentRemovedCount--;
                } else {
                    // 移走
                    item.classList.add('selected');
                    item.innerText = '💥'; // 被老鼠咬壞了或移走
                    this.currentRemovedCount++;
                }

                // 同步算式輸入格（相容單人與 AI 模式）：
                const f2Num = document.querySelector(`[data-target="${prefix}-f2-num"]`);
                if (f2Num) {
                    f2Num.innerText = this.currentRemovedCount > 0 ? this.currentRemovedCount : '?';
                }
                
                const fansDen = document.querySelector(`[data-target="${prefix}-fans-den"]`);
                if (fansDen && fansDen.innerText === '?') {
                    fansDen.innerText = total;
                }

                // 自動更新結果分子
                const fansNum = document.querySelector(`[data-target="${prefix}-fans-num"]`);
                if (fansNum) {
                    const ans = initial - this.currentRemovedCount;
                    fansNum.innerText = ans >= 0 ? ans : '?';
                }

                // 如果是鉛筆題，且點選移走 2 枝，我們彈出「2 枝 = 2/12 盒」的提示
                if (isPencilProblem && this.currentRemovedCount === 2) {
                    ttsManager.speak("答對了！移走2枝鉛筆，也就是移走十二分之二盒呢。");
                    item.style.border = '3px dashed var(--accent-matcha)';
                }
            });

            groupOutline.appendChild(item);
            items.push(item);
        }

        wrapper.appendChild(grid);

        // 加上老鼠偷吃提示按鈕
        const tipBtn = document.createElement('button');
        tipBtn.className = 'tool-btn';
        tipBtn.innerHTML = `🐭 召喚小偷老鼠咬掉 ${sub} ${isPencilProblem ? '枝' : '塊'}`;
        tipBtn.addEventListener('click', () => {
            soundEffects.playClick();
            // 播放老鼠跑過去動畫
            mouse.style.opacity = '1';
            mouse.style.left = '40%';
            mouse.style.top = '35%';
            
            setTimeout(() => {
                // 自動幫學生點選要扣去的個數
                let selected = 0;
                for (let i = initial - 1; i >= 0; i--) {
                    if (selected < sub && !items[i].classList.contains('selected')) {
                        items[i].classList.add('selected');
                        items[i].innerText = '💥';
                        selected++;
                    }
                }
                this.currentRemovedCount = selected;
                
                // 同步算式（相容單人與 AI 模式）
                const f2Num = document.querySelector(`[data-target="${prefix}-f2-num"]`);
                if (f2Num) f2Num.innerText = sub;
                const fansDen = document.querySelector(`[data-target="${prefix}-fans-den"]`);
                if (fansDen) fansDen.innerText = total;
                const fansNum = document.querySelector(`[data-target="${prefix}-fans-num"]`);
                if (fansNum) fansNum.innerText = initial - sub;
                
                ttsManager.speak(`老鼠小偷把 ${sub} ${isPencilProblem ? '枝' : '塊'} 偷走囉！`);
                soundEffects.playWrong();
                
                // 老鼠跑回角落
                setTimeout(() => {
                    mouse.style.opacity = '0';
                    mouse.style.left = '10%';
                }, 1000);
            }, 600);
        });

        wrapper.appendChild(tipBtn);
        container.appendChild(wrapper);
    }

    // 第四關：整數 1 減分數彩帶剪切
    renderCutInteractive(container, q, prefix = 'single') {
        container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'ribbon-container';

        const total = q.visual.totalSlices || q.visual.totalItems;
        const sub = q.visual.subSlices || q.visual.subItems || 0;

        const isDiscrete = q.visual.interactiveType.includes('discrete');
        const icon = isDiscrete ? '🍒' : '🎀';

        // 畫面上彩帶
        const track = document.createElement('div');
        track.className = 'ribbon-track';
        track.style.height = isDiscrete ? '60px' : '45px';
        track.style.alignItems = 'center';
        track.style.justifyContent = 'space-around';

        // 彩帶狀態
        this.ribbonIsCut = false;
        this.cutSegmentsCount = 0; // 被剪掉的段數

        const renderSegments = () => {
            track.innerHTML = '';
            
            if (!this.ribbonIsCut) {
                // 一整條 1 公尺 (或 1 盒)
                if (isDiscrete) {
                    for (let i = 0; i < total; i++) {
                        const dot = document.createElement('span');
                        dot.style.fontSize = '1.8rem';
                        dot.innerText = icon;
                        track.appendChild(dot);
                    }
                    track.style.backgroundColor = 'var(--bg-tertiary)';
                } else {
                    const block = document.createElement('div');
                    block.style.width = '100%';
                    block.style.height = '100%';
                    block.style.backgroundColor = 'var(--accent-strawberry)';
                    block.style.display = 'flex';
                    block.style.alignItems = 'center';
                    block.style.justifyContent = 'center';
                    block.style.fontWeight = '800';
                    block.innerText = "1 公尺的彩帶";
                    track.appendChild(block);
                }
            } else {
                // 已切成等分
                for (let i = 0; i < total; i++) {
                    if (isDiscrete) {
                        const dot = document.createElement('div');
                        dot.className = 'discrete-item filled';
                        dot.innerText = icon;
                        
                        if (i < this.cutSegmentsCount) {
                            dot.classList.add('removed');
                            dot.innerText = '💨';
                        }
                        
                        // 點選剪去
                        dot.addEventListener('click', () => {
                            soundEffects.playClick();
                            if (dot.classList.contains('removed')) {
                                dot.classList.remove('removed');
                                dot.innerText = icon;
                                this.cutSegmentsCount--;
                            } else {
                                dot.classList.add('removed');
                                dot.innerText = '💨';
                                this.cutSegmentsCount++;
                            }
                            syncEquation();
                        });
                        track.appendChild(dot);
                    } else {
                        const seg = document.createElement('div');
                        seg.className = 'ribbon-segment';
                        
                        if (i < this.cutSegmentsCount) {
                            seg.classList.add('cut'); // 被剪掉
                        }

                        // 點選剪去
                        seg.addEventListener('click', () => {
                            soundEffects.playClick();
                            if (seg.classList.contains('cut')) {
                                seg.classList.remove('cut');
                                this.cutSegmentsCount--;
                            } else {
                                seg.classList.add('cut');
                                this.cutSegmentsCount++;
                            }
                            syncEquation();
                        });
                        track.appendChild(seg);
                    }
                }
            }
        };

        const syncEquation = () => {
            // 自動同步算式（相容單人與 AI 模式）
            const f1Num = document.querySelector(`[data-target="${prefix}-f1-num"]`);
            const f1Den = document.querySelector(`[data-target="${prefix}-f1-den"]`);
            if (f1Num && f1Den) {
                f1Num.innerText = total;
                f1Den.innerText = total;
            }

            const fansNum = document.querySelector(`[data-target="${prefix}-fans-num"]`);
            const fansDen = document.querySelector(`[data-target="${prefix}-fans-den"]`);
            if (fansNum && fansDen) {
                fansNum.innerText = total - this.cutSegmentsCount;
                fansDen.innerText = total;
            }
        };

        renderSegments();
        wrapper.appendChild(track);

        // 工具欄
        const tools = document.createElement('div');
        tools.className = 'ribbon-tools';
        
        tools.innerHTML = `
            <button class="tool-btn" id="btn-cut-action">
                🪓 平分切成 ${total} 等分
            </button>
            <button class="tool-btn" id="btn-remove-sub" style="display:none;">
                ✂️ 剪掉 ${sub} 份
            </button>
        `;
        wrapper.appendChild(tools);
        container.appendChild(wrapper);

        const cutBtn = tools.querySelector('#btn-cut-action');
        const removeBtn = tools.querySelector('#btn-remove-sub');

        cutBtn.addEventListener('click', () => {
            soundEffects.playMagic();
            this.ribbonIsCut = true;
            renderSegments();
            
            // 更新算式：把 1 換成 B/B（相容單人與 AI 模式）
            const f1Num = document.querySelector(`[data-target="${prefix}-f1-num"]`);
            const f1Den = document.querySelector(`[data-target="${prefix}-f1-den"]`);
            if (f1Num && f1Den) {
                f1Num.innerText = total;
                f1Den.innerText = total;
                if (prefix === 'ai') {
                    this.activateAiInputCell(f1Num);
                } else {
                    this.activateInputCell(f1Num);
                }
            }

            ttsManager.speak(`把1${isDiscrete ? '盒' : '公尺'}平分切成 ${total} 份，就是 ${total}/${total} 喔！`);

            cutBtn.style.display = 'none';
            removeBtn.style.display = 'inline-flex';
        });

        removeBtn.addEventListener('click', () => {
            soundEffects.playClick();
            this.cutSegmentsCount = sub;
            renderSegments();
            syncEquation();
            ttsManager.speak(`用剪刀剪掉了 ${sub} 份呢。`);
        });
    }

    // ==================== 單人作答送出與判定 ====================
    // 支援即時迷思文字回饋橫條、迷思記錄、半透明重疊比對與雙軌長條對照卡
    submitSingleAnswer() {
        const q = this.singleQuestions[this.singleCurrentQuestionIdx];
        let isCorrect = false;
        let misconceptionMsg = "";
        let misconceptionType = null;

        // 1. 選擇題判定
        if (q.type === 'choice') {
            const activeOpt = document.querySelector('#single-equation-display .opt-btn.active');
            if (!activeOpt) {
                ttsManager.speak("請先選一個答案呢。");
                return;
            }
            const selectedVal = activeOpt.getAttribute('data-val') || activeOpt.innerText.trim();
            if (selectedVal === q.answer) {
                isCorrect = true;
            } else {
                misconceptionType = "choice_error";
                misconceptionMsg = (q.feedback && q.feedback.wrongChoices && q.feedback.wrongChoices[selectedVal]) 
                    ? q.feedback.wrongChoices[selectedVal] 
                    : "選擇的答案不正確喔，再仔細想想！";
                ttsManager.speak(misconceptionMsg);
            }
        } 
        
        // 2. 分數輸入與算式判定
        else {
            // 檢查是否有任何未填寫的輸入格（值為 '?'）
            const unfilled = Array.from(document.querySelectorAll('#single-equation-display .frac-input-num, #single-equation-display .frac-input-den, #single-equation-display .whole-input-box')).some(el => el.innerText === '?');
            if (unfilled) {
                soundEffects.playWrong();
                ttsManager.speak("算式還沒填寫完整呢，請點選問號格用鍵盤填寫呢。");
                return;
            }

            const inputs = {};
            document.querySelectorAll('#single-equation-display [data-target], #single-equation-display .whole-input-box').forEach(el => {
                const target = el.getAttribute('data-target') || el.id;
                inputs[target] = el.innerText === '?' ? null : parseInt(el.innerText);
            });

            if (q.type === 'fraction-input') {
                if (inputs['single-f1-num'] === q.answer.num && inputs['single-f1-den'] === q.answer.den) {
                    isCorrect = true;
                } else {
                    if (inputs['single-f1-num'] !== q.answer.num) {
                        misconceptionType = "numerator_count";
                        misconceptionMsg = q.feedback.wrongNum;
                    } else {
                        misconceptionType = "denominator_partition";
                        misconceptionMsg = q.feedback.wrongDen;
                    }
                    ttsManager.speak(misconceptionMsg);
                }
            } else if (q.type === 'equation') {
                const numAns = inputs['single-fans-num'];
                const denAns = inputs['single-fans-den'];
                
                if (numAns === q.answer.numAns && denAns === q.answer.denAns) {
                    isCorrect = true;
                } else {
                    // 診斷迷思：如果分母相加了 (例如 3/8 + 2/8 = 5/16)
                    if (denAns === q.answer.den1 + q.answer.den2) {
                        misconceptionType = "denominator_addition";
                        misconceptionMsg = q.feedback.denAddError || "分母相加了！同分母加法中，分母代表每份的大小，是不變的喔！";
                        ttsManager.speak(misconceptionMsg);
                        this.showOverlapComparison(q, numAns, denAns, 'single-interactive-content'); // 顯示重疊與長條比對
                    } else if (denAns === q.answer.den1 - q.answer.den2 || denAns === 0) {
                        misconceptionType = "denominator_subtraction";
                        misconceptionMsg = q.feedback.denSubError || "減法計算時，分母是維持不變的喔！";
                        ttsManager.speak(misconceptionMsg);
                        this.showOverlapComparison(q, numAns, denAns, 'single-interactive-content');
                    } else if (numAns !== q.answer.numAns) {
                        misconceptionType = "numerator_calc";
                        misconceptionMsg = q.feedback.numError || "分子計算錯誤喔！只需要把分子相加減即可。";
                        ttsManager.speak(misconceptionMsg);
                    } else {
                        misconceptionType = "denominator_partition";
                        misconceptionMsg = "分母不對喔！同分母加減法中，分母是不變的呢。";
                        ttsManager.speak(misconceptionMsg);
                    }
                }
            } else if (q.type === 'equation-whole') {
                const numAns = inputs['single-fans-num'];
                const denAns = inputs['single-fans-den'];
                const wholeAns = inputs['single-wholeans'];

                if (numAns === q.answer.numAns && denAns === q.answer.denAns && wholeAns === q.answer.wholeAns) {
                    isCorrect = true;
                } else {
                    if (denAns === q.answer.den1 + q.answer.den2) {
                        misconceptionType = "denominator_addition";
                        misconceptionMsg = q.feedback.denAddError || "分母相加了喔！分母維持不變。";
                        ttsManager.speak(misconceptionMsg);
                        this.showOverlapComparison(q, numAns, denAns, 'single-interactive-content');
                    } else if (wholeAns !== q.answer.wholeAns && wholeAns !== null) {
                        misconceptionType = "whole_convert";
                        misconceptionMsg = "後面的整數算錯了喔。當分子和分母一樣大時，它會等於多少呢？";
                        ttsManager.speak(misconceptionMsg);
                    } else {
                        misconceptionType = "numerator_calc";
                        misconceptionMsg = q.feedback.numError || "分子計算錯誤喔！";
                        ttsManager.speak(misconceptionMsg);
                    }
                }
            } else if (q.type === 'equation-convert') {
                const num2 = inputs['single-f2-num'];
                const numAns = inputs['single-fans-num'];
                const denAns = inputs['single-fans-den'];

                if (num2 === q.answer.num2 && numAns === q.answer.numAns && denAns === q.answer.denAns) {
                    isCorrect = true;
                } else {
                    if (num2 !== q.answer.num2) {
                        misconceptionType = "whole_convert";
                        misconceptionMsg = q.feedback.convertError || "先把整數 1 換成假分數再計算喔！";
                        ttsManager.speak(misconceptionMsg);
                    } else if (denAns === q.answer.den1 - q.answer.den2 || denAns === 0) {
                        misconceptionType = "denominator_subtraction";
                        misconceptionMsg = q.feedback.denSubError || "減法計算時，分母代表平分的大小，是維持不變的喔！";
                        ttsManager.speak(misconceptionMsg);
                        this.showOverlapComparison(q, numAns, denAns, 'single-interactive-content');
                    } else {
                        misconceptionType = "numerator_calc";
                        misconceptionMsg = q.feedback.numError || "分子計算錯誤喔！";
                        ttsManager.speak(misconceptionMsg);
                    }
                }
            } else if (q.type === 'equation-whole-sub') {
                const num1 = inputs['single-f1-num'];
                const den1 = inputs['single-f1-den'];
                const numAns = inputs['single-fans-num'];
                const denAns = inputs['single-fans-den'];

                if (num1 === q.answer.num1 && den1 === q.answer.den1 && numAns === q.answer.numAns && denAns === q.answer.denAns) {
                    isCorrect = true;
                } else {
                    if (num1 !== q.answer.num1 || den1 !== q.answer.den1) {
                        misconceptionType = "whole_convert";
                        misconceptionMsg = q.feedback.convertError || "先把整數 1 換成假分數再計算喔！";
                        ttsManager.speak(misconceptionMsg);
                    } else if (denAns === q.answer.den1 - q.answer.den2 || denAns === 0) {
                        misconceptionType = "denominator_subtraction";
                        misconceptionMsg = q.feedback.denSubError || "減法計算時，分母代表平分的大小，是維持不變的喔！";
                        ttsManager.speak(misconceptionMsg);
                        this.showOverlapComparison(q, numAns, denAns, 'single-interactive-content');
                    } else {
                        misconceptionType = "numerator_calc";
                        misconceptionMsg = q.feedback.numError || "分子計算錯誤喔！";
                        ttsManager.speak(misconceptionMsg);
                    }
                }
            } else if (q.type === 'equation-add-to-whole') {
                const numAns = inputs['single-fans-num'];
                const denAns = inputs['single-fans-den'];
                const wholeAns = inputs['single-wholeans'];

                if (numAns === q.answer.numAns && denAns === q.answer.denAns && wholeAns === q.answer.wholeAns) {
                    isCorrect = true;
                } else {
                    if (denAns === q.answer.den1 + q.answer.den2) {
                        misconceptionType = "denominator_addition";
                        misconceptionMsg = q.feedback.denAddError || "分母相加了！分母是不變的喔！";
                        ttsManager.speak(misconceptionMsg);
                        this.showOverlapComparison(q, numAns, denAns, 'single-interactive-content');
                    } else if (wholeAns !== q.answer.wholeAns) {
                        misconceptionType = "whole_convert";
                        misconceptionMsg = "後面的整數算錯了。分子分母一樣大時會等於多少呢？";
                        ttsManager.speak(misconceptionMsg);
                    } else {
                        misconceptionType = "numerator_calc";
                        misconceptionMsg = q.feedback.numError || "分子計算錯誤喔！";
                        ttsManager.speak(misconceptionMsg);
                    }
                }
            }
        }

        const singleFbBar = document.getElementById('single-feedback-bar');

        if (isCorrect) {
            soundEffects.playCorrect();
            
            // 隨機鼓勵詞
            const praises = ["哇！你做得非常完美呢！", "太棒了！你的分數魔法真厲害呀！", "答對了！你是一個合格的小學徒呢！"];
            ttsManager.speak(praises[Math.floor(Math.random() * praises.length)]);
            
            this.singleScore += 10;

            // 顯示文字正向回饋
            if (singleFbBar) {
                singleFbBar.innerHTML = `✨ <strong>太棒了！</strong>回答正確！魔力原料調配完美！`;
                singleFbBar.className = 'ai-feedback-bar success';
                singleFbBar.classList.remove('hidden');
            }
            
            // 顯示下一題按鈕
            document.getElementById('btn-single-submit').classList.add('hidden');
            const nextBtn = document.getElementById('btn-single-next');
            nextBtn.classList.remove('hidden');
            
            // 清理先前的事件
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
            
            newNextBtn.addEventListener('click', () => {
                soundEffects.playClick();
                this.singleCurrentQuestionIdx++;
                if (this.singleCurrentQuestionIdx < this.singleQuestions.length) {
                    this.loadSingleQuestion();
                } else {
                    this.finishSingleLevel();
                }
            });
        } else {
            soundEffects.playWrong();

            // 記錄迷思概念
            if (this.sessionMisconceptions && misconceptionType) {
                if (misconceptionType.includes("denominator")) {
                    this.sessionMisconceptions.denError = (this.sessionMisconceptions.denError || 0) + 1;
                } else if (misconceptionType === "whole_convert") {
                    this.sessionMisconceptions.convert1Error = (this.sessionMisconceptions.convert1Error || 0) + 1;
                } else if (misconceptionType === "choice_error") {
                    this.sessionMisconceptions.choiceError = (this.sessionMisconceptions.choiceError || 0) + 1;
                } else {
                    this.sessionMisconceptions.numError = (this.sessionMisconceptions.numError || 0) + 1;
                }
            }

            // 顯示文字版迷思診斷回饋
            if (singleFbBar && misconceptionMsg) {
                singleFbBar.innerHTML = `💡 <strong>烘焙小精靈提示：</strong>${this.formatMathText(misconceptionMsg)}`;
                singleFbBar.className = 'ai-feedback-bar';
                singleFbBar.classList.remove('hidden');
            }

            // 震動輸入格效果
            document.getElementById('single-equation-display').animate([
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(0)' }
            ], { duration: 300 });
        }
    }

    // 實作：半透明重疊比對 ＋ 雙軌長條對照卡 (對比學童的錯誤分母答案與正確分母的大小)
    showOverlapComparison(q, userNum, userDen, containerId = 'single-interactive-content') {
        const board = document.getElementById(containerId);
        if (!board) return;

        const correctTotal = (q.answer && q.answer.denAns) ? q.answer.denAns : (q.answer.den || 8);
        const correctNum = (q.answer && q.answer.numAns) ? q.answer.numAns : (q.answer.num || 1);
        const errNum = (!isNaN(userNum) && userNum > 0) ? userNum : correctNum;
        const errDen = (!isNaN(userDen) && userDen > 0) ? userDen : (correctTotal * 2);

        // 1. 如果有 SVG 圓餅圖，進行半透明雙層疊合
        const svg = board.querySelector('svg');
        if (svg) {
            svg.innerHTML = '';
            const cx = 100, cy = 100, r = 85;
            const correctStep = 360 / correctTotal;

            // 綠色底：正確答案平分
            for (let i = 0; i < correctTotal; i++) {
                const startAngle = i * correctStep - 90;
                const endAngle = (i + 1) * correctStep - 90;
                const rad1 = (startAngle * Math.PI) / 180;
                const rad2 = (endAngle * Math.PI) / 180;
                const x1 = cx + r * Math.cos(rad1);
                const y1 = cy + r * Math.sin(rad1);
                const x2 = cx + r * Math.cos(rad2);
                const y2 = cy + r * Math.sin(rad2);

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const dStr = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
                path.setAttribute('d', dStr);
                path.setAttribute('stroke', '#333');
                path.setAttribute('stroke-width', '2px');
                path.setAttribute('fill', i < correctNum ? 'rgba(142, 182, 122, 0.65)' : 'rgba(255,255,255,0.05)');
                svg.appendChild(path);
            }

            // 藍色疊加：錯誤分母平分 (切太小塊)
            const userStep = 360 / errDen;
            for (let i = 0; i < errDen; i++) {
                if (i >= errNum) break;
                const startAngle = i * userStep - 90;
                const endAngle = (i + 1) * userStep - 90;
                const rad1 = (startAngle * Math.PI) / 180;
                const rad2 = (endAngle * Math.PI) / 180;
                const x1 = cx + (r * 0.95) * Math.cos(rad1);
                const y1 = cy + (r * 0.95) * Math.sin(rad1);
                const x2 = cx + (r * 0.95) * Math.cos(rad2);
                const y2 = cy + (r * 0.95) * Math.sin(rad2);

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const dStr = `M ${cx} ${cy} L ${x1} ${y1} A ${r*0.95} ${r*0.95} 0 0 1 ${x2} ${y2} Z`;
                path.setAttribute('d', dStr);
                path.setAttribute('stroke', '#5ec4cd');
                path.setAttribute('stroke-width', '2px');
                path.setAttribute('fill', 'rgba(94, 196, 205, 0.7)');
                svg.appendChild(path);
            }
        }

        // 2. 雙軌長條對照卡 (所有題型均可展現平分份數與每份大小的直接比較)
        let oldCard = board.querySelector('.overlap-comparison-card');
        if (oldCard) oldCard.remove();

        const card = document.createElement('div');
        card.className = 'overlap-comparison-card';

        let correctSegsHtml = '';
        for (let i = 0; i < correctTotal; i++) {
            correctSegsHtml += `<div class="overlap-bar-seg ${i < correctNum ? 'active' : ''}"></div>`;
        }

        let errorSegsHtml = '';
        for (let i = 0; i < errDen; i++) {
            errorSegsHtml += `<div class="overlap-bar-seg ${i < errNum ? 'active error' : ''}"></div>`;
        }

        card.innerHTML = `
            <div class="overlap-card-title">🔍 迷思概念視覺對照：平分塊數比一比</div>
            <div class="overlap-bar-row">
                <span class="overlap-bar-label">正確平分 (分母不變)：</span>
                <div class="overlap-bar-track">${correctSegsHtml}</div>
                <span class="overlap-bar-val">${this.formatMathText(`${correctNum}/${correctTotal}`)}</span>
            </div>
            <div class="overlap-bar-row error">
                <span class="overlap-bar-label">你的錯誤平分 (切太碎了！)：</span>
                <div class="overlap-bar-track">${errorSegsHtml}</div>
                <span class="overlap-bar-val">${this.formatMathText(`${errNum}/${errDen}`)}</span>
            </div>
            <div class="overlap-explainer">💡 注意看：分母變大，每一份就切得更小塊了！同分母加減每份大小不變，分母不能相加減喔！</div>
        `;
        board.appendChild(card);
    }

    // 更新互動區 (當在鍵盤打字時)
    updateInteractiveVisual(q, num, den, containerId = 'single-interactive-content') {
        const type = q.visual.interactiveType;
        const board = document.getElementById(containerId);
        if (!board) return;

        if (type === 'pie' || type === 'pie-add' || type === 'pie-sub') {
            const svg = board.querySelector('svg');
            if (svg) {
                this.drawPieSvg(svg, den, num);
            }
        } else if (type === 'discrete') {
            const grid = board.querySelector('.cookie-box-grid');
            if (grid) {
                let emoji = '🍩';
                if (q.text.includes('雞蛋')) emoji = '🥚';
                else if (q.text.includes('果凍')) emoji = '🍮';
                else if (q.text.includes('巧克力')) emoji = '🍫';
                else if (q.text.includes('餅乾')) emoji = '🍪';

                // 同步內部計數器
                this.currentDiscreteCount = num;

                // 重新渲染填充狀態
                const items = grid.querySelectorAll('.discrete-item');
                items.forEach((item, i) => {
                    if (i < num) {
                        item.classList.add('filled');
                        item.innerText = emoji;
                    } else {
                        item.classList.remove('filled');
                        item.innerText = '';
                    }
                });
            }
        }
    }

    finishSingleLevel() {
        soundEffects.playVictory();
        this.completedLevels[this.selectedSingleLevel - 1] = true;
        this.updateLevelNodes();

        // 結算畫面設定
        document.getElementById('result-title').innerText = "修練成功！";
        document.getElementById('result-emoji').innerText = "🏆";
        document.getElementById('result-stats').innerHTML = `
            <div class="stat-item"><span>挑戰關卡：</span><span class="stat-val">第 ${this.selectedSingleLevel} 關</span></div>
            <div class="stat-item"><span>榮譽積分：</span><span class="stat-val">${this.singleScore} 分</span></div>
            <div class="stat-item"><span>烘焙稱號：</span><span class="stat-val">魔法烘焙學徒 ✨</span></div>
            ${this.getDiagnosticSummaryHtml()}
        `;
        
        ttsManager.speak(`恭喜你完成了第 ${this.selectedSingleLevel} 關的修練！你獲得了 ${this.singleScore} 分呢。`);
        this.showScreen('screen-result');
    }

    // ==========================================================
    // ==================== 雙人對戰模式 ========================
    // ==========================================================
    startBattleGame() {
        // 取得設定
        const activeTopicBtn = document.querySelector('#battle-topic-select .opt-btn.active');
        const activeCountBtn = document.querySelector('#battle-count-select .opt-btn.active');
        
        const topic = activeTopicBtn ? activeTopicBtn.getAttribute('data-topic') : 'add';
        const count = activeCountBtn ? parseInt(activeCountBtn.getAttribute('data-count')) : 10; // 預設 10 題

        // 產生對戰題目
        this.battleQuestions = getRandomBattleQuestions(topic, count);
        this.battleCurrentQuestionIdx = 0;
        this.p1Score = 0;
        this.p2Score = 0;

        document.getElementById('p1-score').innerText = "0 分";
        document.getElementById('p2-score').innerText = "0 分";

        this.showScreen('screen-double-play');
        this.loadBattleQuestion();
        
        // 綁定送出按鈕
        this.p1SubmitBtn.onclick = () => this.submitPlayerAnswer(1);
        this.p2SubmitBtn.onclick = () => this.submitPlayerAnswer(2);
    }

    clearBattleThinkingTimer() {
        if (this.battleThinkingTimer) {
            clearInterval(this.battleThinkingTimer);
            this.battleThinkingTimer = null;
        }
    }

    startBattleThinkingCountdown(durationSec = 3.0) {
        this.clearBattleThinkingTimer();
        clearInterval(this.battleTimerInterval);

        this.isBattleThinkingPhase = true;

        const p1Side = document.getElementById('p1-side');
        const p2Side = document.getElementById('p2-side');
        if (p1Side) p1Side.classList.add('cooling');
        if (p2Side) p2Side.classList.add('cooling');

        const statusBar = document.getElementById('battle-status-bar');
        const statusIcon = document.getElementById('battle-status-icon');
        const statusText = document.getElementById('battle-status-text');
        const progressFill = document.getElementById('battle-status-progress-fill');
        const timerCircle = document.getElementById('battle-timer-display');

        if (timerCircle) {
            timerCircle.innerText = "⏳";
            timerCircle.classList.remove('warning');
        }

        if (statusBar) {
            statusBar.classList.remove('hidden', 'ready');
            if (statusIcon) statusIcon.textContent = '⏳';
            if (statusText) {
                statusText.innerHTML = `仔細看題思考中... <strong id="battle-status-timer">${durationSec.toFixed(1)}</strong> 秒後開放作答！`;
            }
            if (progressFill) {
                progressFill.style.transition = 'none';
                progressFill.style.width = '0%';
            }
        }

        const totalMs = durationSec * 1000;
        const intervalMs = 100;
        let elapsedMs = 0;

        this.battleThinkingTimer = setInterval(() => {
            elapsedMs += intervalMs;
            const remainingSec = Math.max(0, (totalMs - elapsedMs) / 1000);
            const percent = Math.min(100, (elapsedMs / totalMs) * 100);

            const timerEl = document.getElementById('battle-status-timer');
            if (timerEl) {
                timerEl.textContent = remainingSec.toFixed(1);
            }
            if (progressFill) {
                progressFill.style.transition = 'width 0.1s linear';
                progressFill.style.width = `${percent}%`;
            }

            if (elapsedMs >= totalMs) {
                this.clearBattleThinkingTimer();
                this.onBattleThinkingComplete();
            }
        }, intervalMs);
    }

    onBattleThinkingComplete() {
        this.isBattleThinkingPhase = false;

        soundEffects.playBuzzerOpen();

        const p1Side = document.getElementById('p1-side');
        const p2Side = document.getElementById('p2-side');
        if (p1Side) p1Side.classList.remove('cooling');
        if (p2Side) p2Side.classList.remove('cooling');

        const statusBar = document.getElementById('battle-status-bar');
        const statusIcon = document.getElementById('battle-status-icon');
        const statusText = document.getElementById('battle-status-text');

        if (statusBar) {
            statusBar.className = 'battle-status-bar ready';
            if (statusIcon) statusIcon.textContent = '⚡';
            if (statusText) {
                statusText.innerHTML = '⚡ <strong>競速開始！</strong>快動手計算並填寫答案送出！';
            }
        }

        // 正式啟動作答倒數
        this.startBattleTimer();
    }

    loadBattleQuestion() {
        this.clearBattleThinkingTimer();
        const q = this.battleQuestions[this.battleCurrentQuestionIdx];
        this.battleTimerVal = this.battleTimeLimit;
        this.p1Answered = false;
        this.p2Answered = false;

        document.getElementById('p1-feedback').innerText = '';
        document.getElementById('p2-feedback').innerText = '';
        
        // 顯示雙方題目 (對稱，以直式分數 HTML 格式化)
        document.getElementById('p1-question').innerHTML = this.formatMathText(q.text);
        document.getElementById('p2-question').innerHTML = this.formatMathText(q.text);

        // 語音播報題目 (對戰時只播報一次)
        ttsManager.speak("雙人烘焙對決！請聽題目：" + q.text);

        // 渲染各自的算式
        this.renderPlayerWorkspace(1, q);
        this.renderPlayerWorkspace(2, q);

        // 渲染各自的視覺操作區
        this.renderPlayerInteraction(1, q);
        this.renderPlayerInteraction(2, q);

        // 啟動 3 秒讀題思考倒數
        this.startBattleThinkingCountdown(3.0);
    }

    renderPlayerWorkspace(playerNum, q) {
        const display = document.getElementById(`p${playerNum}-equation`);
        const keyboardContainer = `p${playerNum}-keyboard`;
        display.innerHTML = '';
        
        const prefix = `p${playerNum}`;
        const inputId = `${prefix}-fans`;

        // 雙人對戰全題型相容防呆：
        if (q.type === 'fraction-input') {
            display.appendChild(this.createFracInputBox(inputId));
        } else if (q.type === 'equation-whole-sub') {
            const wholeSymbol = document.createElement('span');
            wholeSymbol.className = 'symbol';
            wholeSymbol.innerText = '1';
            display.appendChild(wholeSymbol);
            
            const symbol = document.createElement('span');
            symbol.className = 'symbol';
            symbol.innerText = '-';
            display.appendChild(symbol);
            
            const num2 = q.answer.num2 !== undefined ? q.answer.num2 : 1;
            const den2 = q.answer.den2 !== undefined ? q.answer.den2 : (q.answer.denAns || 8);
            display.appendChild(this.createStaticFrac(num2, den2));
            
            const eqSymbol = document.createElement('span');
            eqSymbol.className = 'symbol';
            eqSymbol.innerText = '=';
            display.appendChild(eqSymbol);
            
            display.appendChild(this.createFracInputBox(inputId));
        } else {
            const num1 = q.answer.num1 !== undefined ? q.answer.num1 : (q.answer.numAns || 1);
            const den1 = q.answer.den1 !== undefined ? q.answer.den1 : (q.answer.denAns || 8);
            const num2 = q.answer.num2 !== undefined ? q.answer.num2 : 1;
            const den2 = q.answer.den2 !== undefined ? q.answer.den2 : den1;
            const isSub = (q.initialEq && q.initialEq.includes('-')) || (q.type && q.type.includes('sub'));

            display.appendChild(this.createStaticFrac(num1, den1));
            
            const symbol = document.createElement('span');
            symbol.className = 'symbol';
            symbol.style.fontSize = '1.3rem';
            symbol.innerText = isSub ? '-' : '+';
            display.appendChild(symbol);
            
            display.appendChild(this.createStaticFrac(num2, den2));
            
            const eqSymbol = document.createElement('span');
            eqSymbol.className = 'symbol';
            eqSymbol.style.fontSize = '1.3rem';
            eqSymbol.innerText = '=';
            display.appendChild(eqSymbol);
            
            display.appendChild(this.createFracInputBox(inputId));
        }

        // 渲染各自鍵盤
        this.renderKeyboard(keyboardContainer, (val) => {
            if (this.isBattleThinkingPhase) {
                soundEffects.playSoftClick();
                this.triggerBattleSideShake(playerNum);
                return;
            }
            let activeCell = playerNum === 1 ? this.p1ActiveInputCell : this.p2ActiveInputCell;
            if (!activeCell) return;

            if (val === '清除') {
                activeCell.innerText = '?';
                
                // 即時更新視覺
                let numVal = parseInt(display.querySelector('.frac-input-num').innerText) || 0;
                let denVal = parseInt(display.querySelector('.frac-input-den').innerText) || (q.visual && q.visual.totalSlices) || 8;
                const svg = document.getElementById(`${prefix}-svg-pie`);
                if (svg) {
                    this.drawPieSvg(svg, denVal, numVal);
                }
            } else if (val === '確認') {
                // 自動換格 (先分母、後分子順序)
                const cells = this.getOrderedInputCells(display);
                const curIdx = cells.indexOf(activeCell);
                const nextCell = cells[(curIdx + 1) % cells.length];
                this.activatePlayerInputCell(playerNum, nextCell);
            } else {
                if (activeCell.innerText === '?') {
                    activeCell.innerText = val;
                } else {
                    if (activeCell.innerText === '0') {
                        activeCell.innerText = val;
                    } else if (activeCell.innerText.length < 2) {
                        activeCell.innerText += val;
                    }
                }
                
                // 即時更新視覺
                let numVal = parseInt(display.querySelector('.frac-input-num').innerText) || 0;
                let denVal = parseInt(display.querySelector('.frac-input-den').innerText) || (q.visual && q.visual.totalSlices) || 8;
                const svg = document.getElementById(`${prefix}-svg-pie`);
                if (svg) {
                    this.drawPieSvg(svg, denVal, numVal);
                }
            }
        });

        // 預設高亮第一個輸入格 (先分母、後分子)
        const orderedCells = this.getOrderedInputCells(display);
        if (orderedCells.length > 0) {
            this.activatePlayerInputCell(playerNum, orderedCells[0]);
        }
    }

    activatePlayerInputCell(playerNum, cell) {
        const prefix = `p${playerNum}`;
        document.querySelectorAll(`#${prefix}-side .frac-input-num, #${prefix}-side .frac-input-den, #${prefix}-side .frac-input-box`).forEach(el => {
            el.classList.remove('selected', 'active');
        });

        if (playerNum === 1) {
            this.p1ActiveInputCell = cell;
        } else {
            this.p2ActiveInputCell = cell;
        }

        cell.classList.add('selected');
        cell.closest('.frac-input-box').classList.add('active');
    }

    renderPlayerInteraction(playerNum, q) {
        const container = document.getElementById(`p${playerNum}-interaction`);
        container.innerHTML = '';

        const prefix = `p${playerNum}`;

        // 對戰時為了畫面簡潔與一致性，操作區統一採用 SVG 圓餅圖進行視覺回饋
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('width', '130');
        svg.setAttribute('height', '130');
        svg.setAttribute('viewBox', '0 0 200 200');
        svg.id = `${prefix}-svg-pie`;
        container.appendChild(svg);

        // 畫出原本已有的片數 (相容無 visual 屬性的題型)
        const total = (q.visual && (q.visual.totalSlices || q.visual.totalItems)) || (q.answer && (q.answer.denAns || q.answer.den || 8));
        const initial = (q.visual && (q.visual.initialSlices || q.visual.initialItems)) || (q.answer && (q.answer.numAns || q.answer.num || 1));
        this.drawPieSvg(svg, total, initial);
    }

    startBattleTimer() {
        clearInterval(this.battleTimerInterval);
        const timerDisplay = document.getElementById('battle-timer-display');
        timerDisplay.classList.remove('warning');
        timerDisplay.innerText = this.battleTimerVal;

        this.battleTimerInterval = setInterval(() => {
            this.battleTimerVal--;
            timerDisplay.innerText = this.battleTimerVal;

            if (this.battleTimerVal <= 5) {
                timerDisplay.classList.add('warning');
                soundEffects.playTick(); // 播放滴答聲
            }

            if (this.battleTimerVal <= 0) {
                clearInterval(this.battleTimerInterval);
                this.handleBattleTimeout();
            }
        }, 1000);
    }

    triggerBattleSideShake(playerNum) {
        const sideEl = document.getElementById(`p${playerNum}-side`);
        if (sideEl) {
            sideEl.classList.remove('shake-warn');
            void sideEl.offsetWidth; // 強制重繪觸發動畫
            sideEl.classList.add('shake-warn');
        }
        const feedbackEl = document.getElementById(`p${playerNum}-feedback`);
        if (feedbackEl) {
            feedbackEl.innerText = "👀 請先看題思考喔！倒數結束後才能開始作答！";
            feedbackEl.className = "battle-feedback wrong";
            setTimeout(() => {
                if (this.isBattleThinkingPhase && feedbackEl.innerText.includes("請先看題思考")) {
                    feedbackEl.innerText = "";
                }
            }, 1800);
        }
    }

    submitPlayerAnswer(playerNum) {
        if (this.isBattleThinkingPhase) {
            soundEffects.playSoftClick();
            this.triggerBattleSideShake(playerNum);
            return;
        }

        if (playerNum === 1 && this.p1Answered) return;
        if (playerNum === 2 && this.p2Answered) return;

        const q = this.battleQuestions[this.battleCurrentQuestionIdx];
        const prefix = `p${playerNum}`;
        const feedbackEl = document.getElementById(`${prefix}-feedback`);

        const numCell = document.querySelector(`#p${playerNum}-equation .frac-input-num`);
        const denCell = document.querySelector(`#p${playerNum}-equation .frac-input-den`);
        if ((numCell && numCell.innerText === '?') || (denCell && denCell.innerText === '?')) {
            soundEffects.playWrong();
            feedbackEl.innerText = "請先完成填寫！";
            feedbackEl.className = "battle-feedback wrong";
            
            // 震動該玩家的作答區
            document.getElementById(`p${playerNum}-side`).animate([
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(0px)' }
            ], { duration: 200 });
            return;
        }

        const numAns = parseInt(numCell.innerText);
        const denAns = parseInt(denCell.innerText);

        let targetNumAns = q.answer.numAns !== undefined ? q.answer.numAns : q.answer.num;
        let targetDenAns = q.answer.denAns !== undefined ? q.answer.denAns : q.answer.den;

        // 如果是 1 減分數
        if (q.type === 'equation-whole-sub') {
            targetNumAns = q.answer.numAns;
            targetDenAns = q.answer.denAns;
        }

        if (numAns === targetNumAns && denAns === targetDenAns) {
            soundEffects.playCorrect();
            feedbackEl.innerText = "答對了！🧁 +10分";
            feedbackEl.className = "battle-feedback correct";
            
            if (playerNum === 1) {
                this.p1Score += 10;
                document.getElementById('p1-score').innerText = `${this.p1Score} 分`;
                this.p1Answered = true;
            } else {
                this.p2Score += 10;
                document.getElementById('p2-score').innerText = `${this.p2Score} 分`;
                this.p2Answered = true;
            }
        } else {
            soundEffects.playWrong();
            feedbackEl.innerText = "答錯了！再試試";
            feedbackEl.className = "battle-feedback wrong";
            
            // 對戰時答錯只扣 2 分以鼓勵學童
            if (playerNum === 1) {
                this.p1Score = Math.max(0, this.p1Score - 2);
                document.getElementById('p1-score').innerText = `${this.p1Score} 分`;
            } else {
                this.p2Score = Math.max(0, this.p2Score - 2);
                document.getElementById('p2-score').innerText = `${this.p2Score} 分`;
            }
        }

        // 檢查雙方是否都已作答完畢
        if (this.p1Answered && this.p2Answered) {
            clearInterval(this.battleTimerInterval);
            setTimeout(() => this.nextBattleQuestion(), 1500);
        }
    }

    handleBattleTimeout() {
        // 時間到，沒答對的玩家顯示逾時
        if (!this.p1Answered) {
            document.getElementById('p1-feedback').innerText = "時間到！⏰";
            document.getElementById('p1-feedback').className = "battle-feedback wrong";
        }
        if (!this.p2Answered) {
            document.getElementById('p2-feedback').innerText = "時間到！⏰";
            document.getElementById('p2-feedback').className = "battle-feedback wrong";
        }

        setTimeout(() => this.nextBattleQuestion(), 1800);
    }

    nextBattleQuestion() {
        this.clearBattleThinkingTimer();
        this.battleCurrentQuestionIdx++;
        if (this.battleCurrentQuestionIdx < this.battleQuestions.length) {
            this.loadBattleQuestion();
        } else {
            this.finishBattle();
        }
    }

    endBattle() {
        this.clearBattleThinkingTimer();
        clearInterval(this.battleTimerInterval);
        const p1Side = document.getElementById('p1-side');
        const p2Side = document.getElementById('p2-side');
        if (p1Side) p1Side.classList.remove('cooling', 'shake-warn');
        if (p2Side) p2Side.classList.remove('cooling', 'shake-warn');
        const statusBar = document.getElementById('battle-status-bar');
        if (statusBar) statusBar.classList.add('hidden');
    }

    finishBattle() {
        this.endBattle();
        soundEffects.playVictory();

        let winnerText = "";
        let winnerEmoji = "🏆";
        
        if (this.p1Score > this.p2Score) {
            winnerText = "玩家 1 獲勝！";
            winnerEmoji = "🧁";
        } else if (this.p2Score > this.p1Score) {
            winnerText = "玩家 2 獲勝！";
            winnerEmoji = "🍩";
        } else {
            winnerText = "雙方平手！";
            winnerEmoji = "🤝";
        }

        document.getElementById('result-title').innerText = winnerText;
        document.getElementById('result-emoji').innerText = winnerEmoji;
        document.getElementById('result-stats').innerHTML = `
            <div class="stat-item"><span>玩家 1 分數：</span><span class="stat-val">${this.p1Score} 分</span></div>
            <div class="stat-item"><span>玩家 2 分數：</span><span class="stat-val">${this.p2Score} 分</span></div>
            <div class="stat-item"><span>對戰題數：</span><span class="stat-val">${this.battleQuestions.length} 題</span></div>
        `;
        
        ttsManager.speak(`對戰結束！結果是：${winnerText}！玩家一得到 ${this.p1Score} 分，玩家二得到 ${this.p2Score} 分呢。`);
        this.showScreen('screen-result');
    }

    // 将題目中的斜角分數 (如 3/8) 動態轉為 inline-table 直式分數 HTML 元件
    formatMathText(text) {
        if (!text) return '';
        const fracRegex = /([\d\?]+)\/([\d\?]+)/g;
        return text.replace(fracRegex, (match, num, den) => {
            return `<span class="fraction"><span class="num-row"><span>${num}</span></span><span class="den-row"><span>${den}</span></span></span>`;
        });
    }

    // ==========================================================
    // ==================== 單人 AI 挑戰賽模式 ==================
    // ==========================================================

    startAiChallenge() {
        this.cleanupAiChallenge();
        this.resetSessionMisconceptions();

        // 依難度設定參數
        const diffConfigs = {
            easy: {
                diffLabel: '⭐ 見習學徒',
                roleTitle: '🦉 見習烘焙學徒',
                minMs: 12000,
                maxMs: 15000,
                accuracy: 0.75
            },
            normal: {
                diffLabel: '⭐⭐ 熟練師傅',
                roleTitle: '🦉 熟練甜點師傅',
                minMs: 8000,
                maxMs: 10000,
                accuracy: 0.90
            },
            hard: {
                diffLabel: '⭐⭐⭐ 挑戰',
                roleTitle: '🦉 傳奇皇家主廚',
                minMs: 4500,
                maxMs: 6500,
                accuracy: 1.00
            }
        };

        const config = diffConfigs[this.aiDifficulty] || diffConfigs.normal;

        // 更新對手頭銜與難度標籤
        const aiDisplayDiff = document.getElementById('ai-display-diff');
        const aiDisplayName = document.getElementById('ai-display-name');
        if (aiDisplayDiff) aiDisplayDiff.innerText = config.diffLabel;
        if (aiDisplayName) aiDisplayName.innerText = config.roleTitle;

        // 重設能量與狀態
        this.playerEnergy = 0;
        this.aiEnergy = 0;
        this.playerCombo = 0;
        this.maxPlayerCombo = 0;
        this.aiCurrentQuestionIdx = 0;
        this.aiCorrectCount = 0;
        this.aiTotalAnswered = 0;
        this.aiIsPaused = false;
        this.isAiGameActive = true;
        this.aiGameStartTime = Date.now();

        // 抽取題目 (30 題隨機題庫)
        this.aiQuestions = getRandomBattleQuestions(this.aiTopic, 30);

        // 重設 UI
        this.updateAiDashboardUI();
        const comboBadge = document.getElementById('player-combo-badge');
        if (comboBadge) comboBadge.classList.add('hidden');

        const safetyHint = document.getElementById('ai-safety-hint');
        if (safetyHint) safetyHint.classList.add('hidden');

        const critLayer = document.getElementById('ai-critical-layer');
        if (critLayer) critLayer.classList.add('hidden');

        const feedbackBar = document.getElementById('ai-feedback-bar');
        if (feedbackBar) feedbackBar.classList.add('hidden');

        const aiStatusBubble = document.getElementById('ai-status-bubble');
        if (aiStatusBubble) aiStatusBubble.innerText = '🦉 調配配方中...';

        this.showScreen('screen-ai-play');

        // 開場語音
        ttsManager.speak(`魔力烤箱充能對決開始！對手是${config.roleTitle}，先集滿百分之百出爐就能獲勝呢！`);

        this.loadAiQuestion();
        this.startAiThinkingCycle();
    }

    updateAiDashboardUI() {
        // 玩家星光烤爐
        const pPct = document.getElementById('player-charge-pct');
        const pFill = document.getElementById('player-charge-fill');
        const pStatus = document.getElementById('player-oven-status');
        if (pPct) pPct.innerText = `${this.playerEnergy}%`;
        if (pFill) pFill.style.width = `${this.playerEnergy}%`;
        if (pStatus) {
            pStatus.innerText = this.playerEnergy >= 100 
                ? '🎉 充能完成！美味出爐！' 
                : `持續充能中... (${this.playerEnergy}% / 100%)`;
        }

        // 貓頭鷹月光烤爐
        const aiPct = document.getElementById('ai-charge-pct');
        const aiFill = document.getElementById('ai-charge-fill');
        if (aiPct) aiPct.innerText = `${this.aiEnergy}%`;
        if (aiFill) aiFill.style.width = `${this.aiEnergy}%`;
    }

    loadAiQuestion() {
        if (!this.aiQuestions || this.aiQuestions.length === 0) return;
        const q = this.aiQuestions[this.aiCurrentQuestionIdx % this.aiQuestions.length];

        // 更新指示與進度條
        const indicator = document.getElementById('ai-question-indicator');
        if (indicator) {
            indicator.innerText = `第 ${this.aiCurrentQuestionIdx + 1} 題：充能原料調配`;
        }
        const roundFill = document.getElementById('ai-round-progress');
        if (roundFill) {
            const pct = Math.min(100, ((this.aiCurrentQuestionIdx + 1) / 10) * 100);
            roundFill.style.width = `${pct}%`;
        }

        // 題目文字 (直式分數格式化)
        const qTextEl = document.getElementById('ai-question-text');
        if (qTextEl) {
            qTextEl.innerHTML = this.formatMathText(q.text);
        }

        // 語音報讀
        ttsManager.speak(q.text);

        // 重設按鈕與回饋提示
        const btnSubmit = document.getElementById('btn-ai-submit');
        const btnNext = document.getElementById('btn-ai-next');
        const feedbackBar = document.getElementById('ai-feedback-bar');
        if (btnSubmit) {
            btnSubmit.innerText = '投入原料充能 🔮';
            btnSubmit.classList.remove('hidden');
        }
        if (btnNext) {
            btnNext.innerText = '跳過下一題 ➔';
            btnNext.classList.add('hidden');
        }
        if (feedbackBar) {
            feedbackBar.className = 'ai-feedback-bar hidden';
        }

        // 渲染作答區與互動操作區
        this.renderAiWorkspace(q);
        this.renderSingleInteraction(q, 'ai-interactive-content');
    }

    repeatAiAudio() {
        if (!this.isAiGameActive) return;
        soundEffects.playClick();
        const q = this.aiQuestions[this.aiCurrentQuestionIdx % this.aiQuestions.length];
        if (q) ttsManager.speak(q.text);
    }

    renderAiWorkspace(q) {
        const display = document.getElementById('ai-equation-display');
        const keyboardArea = document.getElementById('ai-keyboard');
        if (!display) return;
        display.innerHTML = '';
        this.aiActiveInputCell = null;

        // 1. 選擇題模式
        if (q.type === 'choice') {
            if (keyboardArea) keyboardArea.innerHTML = '';
            display.style.flexDirection = 'column';
            display.style.gap = '12px';

            q.options.forEach(opt => {
                const optBtn = document.createElement('button');
                optBtn.className = 'opt-btnChoice opt-btn';
                optBtn.innerHTML = this.formatMathText(opt);
                optBtn.setAttribute('data-val', opt);
                
                optBtn.addEventListener('click', () => {
                    soundEffects.playClick();
                    display.querySelectorAll('.opt-btnChoice').forEach(b => b.classList.remove('active'));
                    optBtn.classList.add('active');
                });
                display.appendChild(optBtn);
            });
            return;
        }

        // 2. 直式算式輸入模式
        display.style.flexDirection = 'row';
        display.style.gap = '8px';

        if (q.type === 'fraction-input') {
            display.appendChild(this.createFracInputBox('ai-f1'));
        } else if (q.type === 'equation') {
            display.appendChild(this.createStaticFrac(q.answer.num1, q.answer.den1));
            const symbol = document.createElement('span');
            symbol.className = 'symbol';
            symbol.innerText = q.initialEq.includes('+') ? '+' : '-';
            display.appendChild(symbol);
            display.appendChild(this.createStaticFrac(q.answer.num2, q.answer.den2));
            const eqSymbol = document.createElement('span');
            eqSymbol.className = 'symbol';
            eqSymbol.innerText = '=';
            display.appendChild(eqSymbol);
            display.appendChild(this.createFracInputBox('ai-fans'));
        } else if (q.type === 'equation-whole') {
            display.appendChild(this.createStaticFrac(q.answer.num1, q.answer.den1));
            const symbol = document.createElement('span');
            symbol.className = 'symbol';
            symbol.innerText = '+';
            display.appendChild(symbol);
            display.appendChild(this.createStaticFrac(q.answer.num2, q.answer.den2));
            const eqSymbol = document.createElement('span');
            eqSymbol.className = 'symbol';
            eqSymbol.innerText = '=';
            display.appendChild(eqSymbol);
            display.appendChild(this.createFracInputBox('ai-fans'));
            const eqSymbol2 = document.createElement('span');
            eqSymbol2.className = 'symbol';
            eqSymbol2.innerText = '=';
            display.appendChild(eqSymbol2);
            display.appendChild(this.createWholeInputBox('ai-wholeans'));
        } else if (q.type === 'equation-convert') {
            display.appendChild(this.createStaticFrac(q.answer.num1, q.answer.den1));
            const symbol = document.createElement('span');
            symbol.className = 'symbol';
            symbol.innerText = '-';
            display.appendChild(symbol);
            display.appendChild(this.createFracInputBox('ai-f2', q.answer.den2));
            const eqSymbol = document.createElement('span');
            eqSymbol.className = 'symbol';
            eqSymbol.innerText = '=';
            display.appendChild(eqSymbol);
            display.appendChild(this.createFracInputBox('ai-fans'));
        } else if (q.type === 'equation-whole-sub') {
            const wholeSymbol = document.createElement('span');
            wholeSymbol.className = 'symbol';
            wholeSymbol.innerText = '1';
            display.appendChild(wholeSymbol);
            const symbol = document.createElement('span');
            symbol.className = 'symbol';
            symbol.innerText = '-';
            display.appendChild(symbol);
            display.appendChild(this.createStaticFrac(q.answer.num2, q.answer.den2));
            const eqSymbol = document.createElement('span');
            eqSymbol.className = 'symbol';
            eqSymbol.innerText = '=';
            display.appendChild(eqSymbol);
            display.appendChild(this.createFracInputBox('ai-f1'));
            const symbol2 = document.createElement('span');
            symbol2.className = 'symbol';
            symbol2.innerText = '-';
            display.appendChild(symbol2);
            display.appendChild(this.createStaticFrac(q.answer.num2, q.answer.den2));
            const eqSymbol2 = document.createElement('span');
            eqSymbol2.className = 'symbol';
            eqSymbol2.innerText = '=';
            display.appendChild(eqSymbol2);
            display.appendChild(this.createFracInputBox('ai-fans'));
        } else if (q.type === 'equation-add-to-whole') {
            display.appendChild(this.createStaticFrac(q.answer.num1, q.answer.den1));
            const symbol = document.createElement('span');
            symbol.className = 'symbol';
            symbol.innerText = '+';
            display.appendChild(symbol);
            display.appendChild(this.createStaticFrac(q.answer.num2, q.answer.den2));
            const eqSymbol = document.createElement('span');
            eqSymbol.className = 'symbol';
            eqSymbol.innerText = '=';
            display.appendChild(eqSymbol);
            display.appendChild(this.createFracInputBox('ai-fans'));
            const eqSymbol2 = document.createElement('span');
            eqSymbol2.className = 'symbol';
            eqSymbol2.innerText = '=';
            display.appendChild(eqSymbol2);
            display.appendChild(this.createWholeInputBox('ai-wholeans'));
        }

        // 渲染虛擬鍵盤
        if (keyboardArea) {
            this.renderKeyboard('ai-keyboard', (val) => this.handleAiKeyboardInput(val));
        }

        // 預設高亮第一個未填寫輸入格 (先分母、後分子順序)
        const orderedCells = this.getOrderedInputCells(display);
        if (orderedCells.length > 0) {
            this.activateAiInputCell(orderedCells[0]);
        }
    }

    activateAiInputCell(cell) {
        if (!cell || cell.classList.contains('static-default')) return;

        document.querySelectorAll('#ai-equation-display .frac-input-num, #ai-equation-display .frac-input-den, #ai-equation-display .whole-input-box, #ai-equation-display .frac-input-box').forEach(el => {
            el.classList.remove('selected', 'active');
        });

        this.aiActiveInputCell = cell;
        cell.classList.add('selected');

        const parentBox = cell.closest('.frac-input-box');
        if (parentBox) parentBox.classList.add('active');
    }

    handleAiKeyboardInput(val) {
        if (!this.aiActiveInputCell) return;

        if (val === '清除') {
            this.aiActiveInputCell.innerText = '?';
            this.syncAiVisualFromInputs();
        } else if (val === '確認') {
            this.autoAdvanceAiInputFocus();
        } else {
            const currentVal = this.aiActiveInputCell.innerText;
            if (currentVal === '?' || currentVal === '0') {
                this.aiActiveInputCell.innerText = val;
            } else if (currentVal.length < 2) {
                this.aiActiveInputCell.innerText = currentVal + val;
            }
            this.syncAiVisualFromInputs();
        }
    }

    autoAdvanceAiInputFocus() {
        const display = document.getElementById('ai-equation-display');
        if (!display) return;
        const inputs = this.getOrderedInputCells(display);
        const currentIdx = inputs.indexOf(this.aiActiveInputCell);

        for (let i = 1; i <= inputs.length; i++) {
            const nextCell = inputs[(currentIdx + i) % inputs.length];
            if (!nextCell.classList.contains('static-default') && nextCell.innerText === '?') {
                this.activateAiInputCell(nextCell);
                return;
            }
        }
    }

    syncAiVisualFromInputs() {
        const q = this.aiQuestions[this.aiCurrentQuestionIdx % this.aiQuestions.length];
        if (!q || !q.visual) return;

        const numEl = document.querySelector('[data-target="ai-fans-num"]') || document.querySelector('[data-target="ai-f1-num"]');
        const denEl = document.querySelector('[data-target="ai-fans-den"]') || document.querySelector('[data-target="ai-f1-den"]');
        
        let numVal = parseInt(numEl && numEl.innerText !== '?' ? numEl.innerText : 0);
        let denVal = parseInt(denEl && denEl.innerText !== '?' ? denEl.innerText : (q.visual.totalSlices || q.visual.totalItems || 8));

        if (isNaN(numVal)) numVal = 0;
        if (isNaN(denVal) || denVal <= 0) denVal = q.visual.totalSlices || q.visual.totalItems || 8;

        const svg = document.getElementById('ai-magic-pie-svg');
        if (svg && q.visual.interactiveType === 'pie') {
            this.drawPieSvg(svg, denVal, numVal);
        }
    }

    submitAiAnswer() {
        if (!this.isAiGameActive) return;
        const q = this.aiQuestions[this.aiCurrentQuestionIdx % this.aiQuestions.length];
        let isCorrect = false;
        let misconceptionMsg = "";
        let misconceptionType = null;

        // 1. 選擇題檢驗
        if (q.type === 'choice') {
            const activeOpt = document.querySelector('#ai-equation-display .opt-btnChoice.active');
            if (!activeOpt) {
                soundEffects.playWrong();
                ttsManager.speak("請先點選一個答案選項呢。");
                return;
            }
            const selectedVal = activeOpt.getAttribute('data-val') || activeOpt.innerText.trim();
            if (selectedVal === q.answer) {
                isCorrect = true;
            } else {
                misconceptionType = "choice_error";
                misconceptionMsg = (q.feedback && q.feedback.wrongChoices && q.feedback.wrongChoices[selectedVal]) 
                    ? q.feedback.wrongChoices[selectedVal] 
                    : "選擇的答案不正確喔，請再觀察題目想想看！";
            }
        }

        // 2. 算式輸入檢驗
        else {
            const unfilled = Array.from(document.querySelectorAll('#ai-equation-display .frac-input-num, #ai-equation-display .frac-input-den, #ai-equation-display .whole-input-box')).some(el => el.innerText === '?');
            if (unfilled) {
                soundEffects.playWrong();
                ttsManager.speak("算式還沒填寫完整呢，請點選問號格用鍵盤填寫呢。");
                return;
            }

            const inputs = {};
            document.querySelectorAll('#ai-equation-display [data-target], #ai-equation-display .whole-input-box').forEach(el => {
                const target = el.getAttribute('data-target') || el.id;
                inputs[target] = el.innerText === '?' ? null : parseInt(el.innerText);
            });

            if (q.type === 'fraction-input') {
                if (inputs['ai-f1-num'] === q.answer.num && inputs['ai-f1-den'] === q.answer.den) {
                    isCorrect = true;
                } else {
                    if (inputs['ai-f1-num'] !== q.answer.num) {
                        misconceptionType = "numerator_count";
                        misconceptionMsg = q.feedback.wrongNum;
                    } else {
                        misconceptionType = "denominator_partition";
                        misconceptionMsg = q.feedback.wrongDen;
                    }
                }
            } else if (q.type === 'equation') {
                const numAns = inputs['ai-fans-num'];
                const denAns = inputs['ai-fans-den'];
                if (numAns === q.answer.numAns && denAns === q.answer.denAns) {
                    isCorrect = true;
                } else {
                    if (denAns === q.answer.den1 + q.answer.den2) {
                        misconceptionType = "denominator_addition";
                        misconceptionMsg = q.feedback.denAddError || "分母相加了！同分母加法中，分母代表平分的份數，是不變的喔！";
                        this.showOverlapComparison(q, numAns, denAns, 'ai-interactive-content');
                    } else if (denAns === q.answer.den1 - q.answer.den2 || denAns === 0) {
                        misconceptionType = "denominator_subtraction";
                        misconceptionMsg = q.feedback.denSubError || "減法計算時，分母是維持不變的喔！";
                        this.showOverlapComparison(q, numAns, denAns, 'ai-interactive-content');
                    } else if (numAns !== q.answer.numAns) {
                        misconceptionType = "numerator_calc";
                        misconceptionMsg = q.feedback.numError || "分子計算錯誤囉！只需將分子相加即可。";
                    } else {
                        misconceptionType = "denominator_partition";
                        misconceptionMsg = "分母不對喔！同分母加法中，分母是不變的呢。";
                    }
                }
            } else if (q.type === 'equation-whole') {
                const numAns = inputs['ai-fans-num'];
                const denAns = inputs['ai-fans-den'];
                const wholeAns = inputs['ai-wholeans'];
                if (numAns === q.answer.numAns && denAns === q.answer.denAns && wholeAns === q.answer.wholeAns) {
                    isCorrect = true;
                } else {
                    if (denAns === q.answer.den1 + q.answer.den2) {
                        misconceptionType = "denominator_addition";
                        misconceptionMsg = q.feedback.denAddError || "分母相加了喔！分母維持不變。";
                        this.showOverlapComparison(q, numAns, denAns, 'ai-interactive-content');
                    } else if (wholeAns !== q.answer.wholeAns && wholeAns !== null) {
                        misconceptionType = "whole_convert";
                        misconceptionMsg = "後面的整數算錯了喔。當分子和分母一樣大時，它會等於整數 1 呢。";
                    } else {
                        misconceptionType = "numerator_calc";
                        misconceptionMsg = q.feedback.numError || "分子計算錯誤喔！";
                    }
                }
            } else if (q.type === 'equation-convert') {
                const num2 = inputs['ai-f2-num'];
                const numAns = inputs['ai-fans-num'];
                const denAns = inputs['ai-fans-den'];
                if (num2 === q.answer.num2 && numAns === q.answer.numAns && denAns === q.answer.denAns) {
                    isCorrect = true;
                } else {
                    if (num2 !== q.answer.num2) {
                        misconceptionType = "whole_convert";
                        misconceptionMsg = q.feedback.convertError;
                    } else if (denAns === q.answer.den1 - q.answer.den2 || denAns === 0) {
                        misconceptionType = "denominator_subtraction";
                        misconceptionMsg = q.feedback.denSubError || "減法計算時，分母是維持不變的喔！";
                        this.showOverlapComparison(q, numAns, denAns, 'ai-interactive-content');
                    } else {
                        misconceptionType = "numerator_calc";
                        misconceptionMsg = q.feedback.numError;
                    }
                }
            } else if (q.type === 'equation-whole-sub') {
                const num1 = inputs['ai-f1-num'];
                const den1 = inputs['ai-f1-den'];
                const numAns = inputs['ai-fans-num'];
                const denAns = inputs['ai-fans-den'];
                if (num1 === q.answer.num1 && den1 === q.answer.den1 && numAns === q.answer.numAns && denAns === q.answer.denAns) {
                    isCorrect = true;
                } else {
                    if (num1 !== q.answer.num1 || den1 !== q.answer.den1) {
                        misconceptionType = "whole_convert";
                        misconceptionMsg = q.feedback.convertError;
                    } else if (denAns === q.answer.den1 - q.answer.den2 || denAns === 0) {
                        misconceptionType = "denominator_subtraction";
                        misconceptionMsg = q.feedback.denSubError || "減法計算時，分母維持不變喔！";
                        this.showOverlapComparison(q, numAns, denAns, 'ai-interactive-content');
                    } else {
                        misconceptionType = "numerator_calc";
                        misconceptionMsg = q.feedback.numError;
                    }
                }
            } else if (q.type === 'equation-add-to-whole') {
                const numAns = inputs['ai-fans-num'];
                const denAns = inputs['ai-fans-den'];
                const wholeAns = inputs['ai-wholeans'];
                if (numAns === q.answer.numAns && denAns === q.answer.denAns && wholeAns === q.answer.wholeAns) {
                    isCorrect = true;
                } else {
                    if (denAns === q.answer.den1 + q.answer.den2) {
                        misconceptionType = "denominator_addition";
                        misconceptionMsg = q.feedback.denAddError;
                        this.showOverlapComparison(q, numAns, denAns, 'ai-interactive-content');
                    } else if (wholeAns !== q.answer.wholeAns) {
                        misconceptionType = "whole_convert";
                        misconceptionMsg = "後面的整數算錯了喔！分子分母相等時等於 1 呢。";
                    } else {
                        misconceptionType = "numerator_calc";
                        misconceptionMsg = q.feedback.numError;
                    }
                }
            }
        }

        // ================= 答對處理 =================
        if (isCorrect) {
            soundEffects.playCorrect();
            soundEffects.playCharge();

            // 若之前觸發了安全閥，此處答對即時解除！
            this.pauseAiSafetyValve(false);

            this.aiCorrectCount++;
            this.aiTotalAnswered++;
            this.playerCombo++;
            if (this.playerCombo > this.maxPlayerCombo) {
                this.maxPlayerCombo = this.playerCombo;
            }

            let energyGain = 15;
            let isCritical = false;

            // 連擊判定 (Combo >= 2 觸發黃金奶油暴擊)
            if (this.playerCombo >= 2) {
                isCritical = true;
                energyGain = 20; // 基礎 +15% + 暴擊 +5%
                this.triggerGoldenButterCritical();
            }

            // 更新 Combo 徽章
            const comboBadge = document.getElementById('player-combo-badge');
            if (comboBadge) {
                comboBadge.innerText = `🔥 連擊 x${this.playerCombo}`;
                comboBadge.classList.remove('hidden');
            }

            this.playerEnergy = Math.min(100, this.playerEnergy + energyGain);
            this.updateAiDashboardUI();

            // 顯示成功文字回饋
            const feedbackBar = document.getElementById('ai-feedback-bar');
            if (feedbackBar) {
                feedbackBar.innerHTML = `✨ <strong>太棒了！</strong>回答正確！魔力充能成功！`;
                feedbackBar.className = 'ai-feedback-bar success';
                feedbackBar.classList.remove('hidden');
            }

            // 檢查玩家勝利
            if (this.playerEnergy >= 100) {
                this.finishAiChallenge(true);
                return;
            }

            // 語音激勵
            if (isCritical) {
                ttsManager.speak(`太棒了！黃金奶油暴擊，魔力充能百分之二十！`);
            } else {
                ttsManager.speak(`答對了！原料投入成功，魔力充能百分之十五呢！`);
            }

            // 自動進入下一題
            setTimeout(() => {
                if (this.isAiGameActive) {
                    this.nextAiQuestion();
                }
            }, 800);
        }

        // ================= 答錯處理 (觸發教學安全閥 ＋ 支援原地修正重送) =================
        else {
            soundEffects.playWrong();
            this.aiTotalAnswered++;
            this.playerCombo = 0;

            if (this.sessionMisconceptions && misconceptionType) {
                if (misconceptionType.includes("denominator")) {
                    this.sessionMisconceptions.denError = (this.sessionMisconceptions.denError || 0) + 1;
                } else if (misconceptionType === "whole_convert") {
                    this.sessionMisconceptions.convert1Error = (this.sessionMisconceptions.convert1Error || 0) + 1;
                } else if (misconceptionType === "choice_error") {
                    this.sessionMisconceptions.choiceError = (this.sessionMisconceptions.choiceError || 0) + 1;
                } else {
                    this.sessionMisconceptions.numError = (this.sessionMisconceptions.numError || 0) + 1;
                }
            }

            const comboBadge = document.getElementById('player-combo-badge');
            if (comboBadge) comboBadge.classList.add('hidden');

            // 顯示迷思診斷回饋橫條 (所有分數轉直式)
            const feedbackBar = document.getElementById('ai-feedback-bar');
            if (feedbackBar) {
                feedbackBar.innerHTML = `💡 <strong>烘焙小精靈提示：</strong>${this.formatMathText(misconceptionMsg)}`;
                feedbackBar.className = 'ai-feedback-bar';
                feedbackBar.classList.remove('hidden');
            }

            // 啟動教學安全閥 (AI 思考計時暫停，確保學生讀懂提示)
            this.pauseAiSafetyValve(true);
            ttsManager.speak(misconceptionMsg);

            // 支援原地修正重送閉環：保留修正重送按鈕，並同時提供跳過下一題按鈕
            const btnSubmit = document.getElementById('btn-ai-submit');
            const btnNext = document.getElementById('btn-ai-next');
            if (btnSubmit) {
                btnSubmit.innerText = '修正重送 🔮';
                btnSubmit.classList.remove('hidden');
            }
            if (btnNext) {
                btnNext.innerText = '跳過下一題 ➔';
                btnNext.classList.remove('hidden');
            }
        }
    }

    nextAiQuestion() {
        if (!this.isAiGameActive) return;
        this.pauseAiSafetyValve(false); // 解除教學安全閥，AI 恢復思考
        this.aiCurrentQuestionIdx++;
        this.loadAiQuestion();
    }

    triggerGoldenButterCritical() {
        // 播放暴擊與打噴嚏音效
        soundEffects.playCombo();
        setTimeout(() => soundEffects.playSneeze(), 250);

        // 顯示暴擊煙霧覆蓋層
        const critLayer = document.getElementById('ai-critical-layer');
        if (critLayer) {
            critLayer.classList.remove('hidden');
            setTimeout(() => {
                if (critLayer) critLayer.classList.add('hidden');
            }, 2800);
        }

        // 貓頭鷹大師打噴嚏暫停 3 秒
        const aiBubble = document.getElementById('ai-status-bubble');
        if (aiBubble) {
            aiBubble.innerText = '🤧 哈啾！好濃的奶油煙霧...（打噴嚏暫停 3 秒）';
        }

        this.aiIsPaused = true;
        setTimeout(() => {
            if (this.isAiGameActive) {
                const safetyHint = document.getElementById('ai-safety-hint');
                const isUnderSafety = safetyHint && !safetyHint.classList.contains('hidden');
                if (!isUnderSafety) {
                    this.aiIsPaused = false;
                    if (aiBubble) aiBubble.innerText = '🦉 調配配方中...';
                }
            }
        }, 3000);
    }

    pauseAiSafetyValve(isPaused) {
        this.aiIsPaused = isPaused;
        const safetyHint = document.getElementById('ai-safety-hint');
        if (safetyHint) {
            if (isPaused) safetyHint.classList.remove('hidden');
            else safetyHint.classList.add('hidden');
        }

        const aiBubble = document.getElementById('ai-status-bubble');
        if (aiBubble && isPaused) {
            aiBubble.innerText = '🦉 考官注視中（思考暫停）...';
        } else if (aiBubble && !this.aiIsPaused) {
            aiBubble.innerText = '🦉 調配配方中...';
        }
    }

    startAiThinkingCycle() {
        if (!this.isAiGameActive) return;
        this.clearAiThinkingTimer();

        const diffConfigs = {
            easy: { minMs: 12000, maxMs: 15000, accuracy: 0.75 },
            normal: { minMs: 8000, maxMs: 10000, accuracy: 0.90 },
            hard: { minMs: 4500, maxMs: 6500, accuracy: 1.00 }
        };

        const config = diffConfigs[this.aiDifficulty] || diffConfigs.normal;
        let thinkDuration = Math.floor(Math.random() * (config.maxMs - config.minMs)) + config.minMs;

        // Rubber-banding 防挫折機制：若學生落後達 30% 能量，AI 打瞌睡延長 +4 秒
        let isNoddingOff = false;
        if (this.aiDifficulty === 'easy' && this.playerEnergy <= this.aiEnergy - 30) {
            thinkDuration += 4000;
            isNoddingOff = true;
            const aiBubble = document.getElementById('ai-status-bubble');
            if (aiBubble) aiBubble.innerText = '💤 貓頭鷹大師偷打瞌睡中...';
        }

        this.aiThinkingTotalMs = thinkDuration;
        this.aiThinkingElapsedMs = 0;

        const thinkFill = document.getElementById('ai-think-fill');
        if (thinkFill) thinkFill.style.width = '0%';

        const intervalMs = 100;

        this.aiThinkingInterval = setInterval(() => {
            if (!this.isAiGameActive) {
                this.clearAiThinkingTimer();
                return;
            }

            // 若處於暫停狀態 (打噴嚏或教學安全閥)，不累加經過時間
            if (this.aiIsPaused) {
                return;
            }

            this.aiThinkingElapsedMs += intervalMs;
            const pct = Math.min(100, (this.aiThinkingElapsedMs / this.aiThinkingTotalMs) * 100);

            if (thinkFill) {
                thinkFill.style.width = `${pct}%`;
            }

            // 思考時間到，貓頭鷹出手！
            if (this.aiThinkingElapsedMs >= this.aiThinkingTotalMs) {
                this.clearAiThinkingTimer();
                this.resolveAiTurn(config.accuracy);
            }
        }, intervalMs);
    }

    resolveAiTurn(accuracy) {
        if (!this.isAiGameActive) return;

        const aiBubble = document.getElementById('ai-status-bubble');
        const roll = Math.random();

        // 依正確率判定
        if (roll <= accuracy) {
            soundEffects.playClick();
            this.aiEnergy = Math.min(100, this.aiEnergy + 15);
            this.updateAiDashboardUI();

            if (aiBubble) {
                aiBubble.innerText = '🦉 貓頭鷹大師調配成功！(+15%)';
            }

            // 檢查 AI 是否獲勝
            if (this.aiEnergy >= 100) {
                this.finishAiChallenge(false);
                return;
            }
        } else {
            // AI 失誤
            soundEffects.playWrong();
            if (aiBubble) {
                aiBubble.innerText = '💨 貓頭鷹大師原料配方失誤，冒出黑煙！';
            }
        }

        // 短暫間隔後開啟下一個 AI 思考循環
        this.aiThinkingTimeout = setTimeout(() => {
            if (this.isAiGameActive) {
                if (aiBubble) aiBubble.innerText = '🦉 調配配方中...';
                this.startAiThinkingCycle();
            }
        }, 1200);
    }

    clearAiThinkingTimer() {
        if (this.aiThinkingInterval) {
            clearInterval(this.aiThinkingInterval);
            this.aiThinkingInterval = null;
        }
        if (this.aiThinkingTimeout) {
            clearTimeout(this.aiThinkingTimeout);
            this.aiThinkingTimeout = null;
        }
    }

    cleanupAiChallenge() {
        this.isAiGameActive = false;
        this.aiIsPaused = false;
        this.clearAiThinkingTimer();

        const critLayer = document.getElementById('ai-critical-layer');
        if (critLayer) critLayer.classList.add('hidden');

        const safetyHint = document.getElementById('ai-safety-hint');
        if (safetyHint) safetyHint.classList.add('hidden');

        const feedbackBar = document.getElementById('ai-feedback-bar');
        if (feedbackBar) feedbackBar.classList.add('hidden');
    }

    finishAiChallenge(playerWon) {
        this.cleanupAiChallenge();

        let title = "";
        let emoji = "";
        let titleBadge = "";

        if (playerWon) {
            soundEffects.playVictory();
            emoji = "🏆";
            title = "魔力出爐，大獲全勝！";
            if (this.aiDifficulty === 'hard') {
                titleBadge = "傳奇魔力烘焙王 👑";
            } else if (this.maxPlayerCombo >= 3) {
                titleBadge = "黃金奶油大師 ✨";
            } else {
                titleBadge = "星光烘焙高手 🥐";
            }
            ttsManager.speak(`太棒了！你的星光烤爐率先充能完成，獲得了${titleBadge}的榮譽呢！`);
        } else {
            soundEffects.playWrong();
            emoji = "🦉";
            title = "貓頭鷹大師率先出爐！";
            titleBadge = "見習魔法烘焙師 🧁";
            ttsManager.speak(`哎呀，貓頭鷹大師的月光烤爐先完成充能出爐囉。不要氣餒，再挑戰一次吧呢！`);
        }

        const elapsedSec = Math.round((Date.now() - this.aiGameStartTime) / 1000);

        document.getElementById('result-title').innerText = title;
        document.getElementById('result-emoji').innerText = emoji;
        document.getElementById('result-stats').innerHTML = `
            <div class="stat-item"><span>星光烤爐魔力：</span><span class="stat-val" style="color: var(--accent-gold);">${this.playerEnergy}%</span></div>
            <div class="stat-item"><span>貓頭鷹大師魔力：</span><span class="stat-val">${this.aiEnergy}%</span></div>
            <div class="stat-item"><span>最高連擊 (Combo)：</span><span class="stat-val">🔥 x${this.maxPlayerCombo}</span></div>
            <div class="stat-item"><span>挑戰難度：</span><span class="stat-val">${this.aiDifficulty === 'easy' ? '⭐ 見習學徒' : this.aiDifficulty === 'normal' ? '⭐⭐ 熟練師傅' : '⭐⭐⭐ 傳奇主廚'}</span></div>
            <div class="stat-item"><span>烘焙稱號：</span><span class="stat-val" style="color: var(--accent-strawberry); font-weight: bold;">${titleBadge}</span></div>
            <div class="stat-item"><span>挑戰用時：</span><span class="stat-val">${elapsedSec} 秒</span></div>
            ${this.getDiagnosticSummaryHtml()}
        `;

        this.showScreen('screen-result');
    }
}
