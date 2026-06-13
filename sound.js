/* ==========================================
   分數魔法烘焙屋 3.0 音效管理器 (Web Audio API)
   零外部依賴，純代碼合成音效
   ========================================== */

class SoundManager {
    constructor() {
        this.ctx = null;
    }

    // 初始化或恢復 AudioContext (必須由使用者互動觸發)
    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 播放清脆的點擊音效
    playClick() {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    // 播放答對音效 (C 大調琶音 C4 -> E4 -> G4 -> C5)
    playCorrect() {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        const duration = 0.15;
        const delay = 0.08;

        notes.forEach((freq, idx) => {
            const playTime = now + idx * delay;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle'; // 軟三角形波，聽起來像木琴
            osc.frequency.setValueAtTime(freq, playTime);

            gain.gain.setValueAtTime(0, playTime);
            gain.gain.linearRampToValueAtTime(0.15, playTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, playTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(playTime);
            osc.stop(playTime + duration);
        });
    }

    // 播放答錯音效 (低沉的不和諧音)
    playWrong() {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        
        // 使用兩個稍微偏調的低音振盪器，製造悲傷/警示的感覺
        const freqs = [180, 185]; 
        
        freqs.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth'; // 鋸齒波，有一點粗糙感
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.linearRampToValueAtTime(120, now + 0.4);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

            // 低通濾波器，讓聲音溫和一點，不要太刺耳
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, now);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.45);
        });
    }

    // 魔法合成 / 拖曳成功 (漸變上升頻率)
    playMagic() {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.6);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
    }

    // 倒數計時 Tick 聲
    playTick() {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // 戰鬥勝利大琶音
    playVictory() {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // 擴展的 C 大調和弦
        const duration = 0.3;
        const delay = 0.1;

        notes.forEach((freq, idx) => {
            const playTime = now + idx * delay;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, playTime);

            gain.gain.setValueAtTime(0, playTime);
            gain.gain.linearRampToValueAtTime(0.12, playTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, playTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(playTime);
            osc.stop(playTime + duration + 0.1);
        });
    }
}

// 實例化全域音效管理器
const soundEffects = new SoundManager();

// 當使用者點擊頁面時，自動初始化 AudioContext，避免瀏覽器安全機制阻擋
document.addEventListener('pointerdown', () => {
    soundEffects.init();
}, { once: false });
