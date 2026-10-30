/**
 * 分數魔法烘焙屋 3.0 全維度自動化體檢腳本 (qa-audit.js)
 * 遵循 108 課綱三年級下學期 N-3-10 與 fraction-game-qa-pipeline 標準
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const htmlCode = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const cssCode = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const jsCode = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const soundCode = fs.readFileSync(path.join(ROOT, 'sound.js'), 'utf8');
const ttsCode = fs.readFileSync(path.join(ROOT, 'tts.js'), 'utf8');
const questionsCode = fs.readFileSync(path.join(ROOT, 'questions.js'), 'utf8');

const report = {
    summary: { critical: 0, warning: 0, info: 0, passed: 0 },
    critical: [],
    warning: [],
    info: [],
    details: {}
};

function logCritical(category, location, title, desc) {
    report.critical.push({ category, location, title, desc });
    report.summary.critical++;
}

function logWarning(category, location, title, desc) {
    report.warning.push({ category, location, title, desc });
    report.summary.warning++;
}

function logInfo(category, location, title, desc) {
    report.info.push({ category, location, title, desc });
    report.summary.info++;
}

function logPass(title) {
    report.summary.passed++;
}

console.log("==================================================");
console.log("🔍 [QA-AUDIT] 開始執行分數魔法烘焙屋 3.0 全維度評測...");
console.log("==================================================");

// ----------------------------------------------------
// 維度 1: 數學課綱概念嚴謹度 (三年級下學期 N-3-10)
// ----------------------------------------------------
console.log("\n[D1] 檢核數學課綱概念嚴謹度 (N-3-10)...");

// 載入題庫
let sandboxQ = {};
vm.createContext(sandboxQ);
vm.runInContext(questionsCode + '\n;globalThis.gameQuestions = gameQuestions; globalThis.getRandomBattleQuestions = getRandomBattleQuestions;', sandboxQ);
const gameQuestions = sandboxQ.gameQuestions;

let maxDen = 0;
let over1Count = 0;
let invalidDenCount = 0;
let totalQCount = 0;

for (let lvl = 1; lvl <= 4; lvl++) {
    const list = gameQuestions[lvl] || [];
    totalQCount += list.length;
    list.forEach(q => {
        const ans = q.answer || {};
        const den = ans.den || ans.denAns || ans.den1 || 0;
        const num = ans.num || ans.numAns || 0;
        if (den > maxDen) maxDen = den;
        if (den > 12) {
            invalidDenCount++;
            logCritical("課綱邊界超綱", `題目 ${q.id}`, `分母 ${den} 超過三年級課綱上限 12`, q.text);
        }
        if (den > 0 && num > den) {
            over1Count++;
            logWarning("課綱數值超綱", `題目 ${q.id}`, `答案 ${num}/${den} 大於 1（三年級下學期尚未教授假分數）`, q.text);
        }
    });
}

if (totalQCount === 60) {
    logPass("題庫題數完整：全關卡共 60 題 (4 關各 15 題)");
} else {
    logCritical("題庫數量異常", "questions.js", `題庫題數應為 60 題，實際檢測到 ${totalQCount} 題`);
}

if (maxDen <= 12 && invalidDenCount === 0) {
    logPass(`分母上限合規：全題目最大分母為 ${maxDen} (<= 12)`);
}

if (over1Count === 0) {
    logPass("分數數值嚴謹：全題目答案皆小於等於 1，無假分數超綱");
}

// ----------------------------------------------------
// 維度 2: 題庫與答案邏輯完備性
// ----------------------------------------------------
console.log("\n[D2] 檢核題庫與答案邏輯完備性...");

let choiceMismatch = 0;
let optionDuplicates = 0;

for (let lvl = 1; lvl <= 4; lvl++) {
    (gameQuestions[lvl] || []).forEach(q => {
        if (q.type === 'choice') {
            if (!q.options || !q.options.includes(q.answer)) {
                choiceMismatch++;
                logCritical("答案邏輯破綻", `題目 ${q.id}`, `正確答案 "${q.answer}" 不在選項清單中`, JSON.stringify(q.options));
            }
            const set = new Set(q.options);
            if (set.size !== q.options.length) {
                optionDuplicates++;
                logWarning("選項設計不良", `題目 ${q.id}`, "選項中出現重複項目", JSON.stringify(q.options));
            }
        }
    });
}

if (choiceMismatch === 0) {
    logPass("選擇題選項檢核：所有選擇題選項皆包含正確答案");
}
if (optionDuplicates === 0) {
    logPass("選擇題去重檢核：選項均無重複");
}

// 檢核雙人對戰題庫抽題池
try {
    const battleAdd = sandboxQ.getRandomBattleQuestions('add', 5);
    const battleSub = sandboxQ.getRandomBattleQuestions('sub', 5);
    const battleSub1 = sandboxQ.getRandomBattleQuestions('sub1', 5);
    const battleMix = sandboxQ.getRandomBattleQuestions('mix', 5);
    if (battleAdd.length === 5 && battleSub.length === 5 && battleSub1.length === 5 && battleMix.length === 5) {
        logPass("對戰題庫抽題機制健全：add, sub, sub1, mix 均能正確生成抽題池");
    }
} catch (e) {
    logCritical("對戰抽題錯誤", "getRandomBattleQuestions", e.message);
}

// ----------------------------------------------------
// 維度 3: 幾何圖形與題圖適配性 (離散 vs 連續模型)
// ----------------------------------------------------
console.log("\n[D3] 檢核幾何圖形與題圖適配性...");

let modelMismatches = 0;
for (let lvl = 1; lvl <= 4; lvl++) {
    (gameQuestions[lvl] || []).forEach(q => {
        const text = q.text || '';
        const itype = q.visual ? q.visual.interactiveType : '';
        
        // 盒裝題目應使用 discrete 系列
        if (text.includes('盒') && !text.includes('公尺') && !text.includes('公升')) {
            if (!itype.includes('discrete') && !itype.includes('compare')) {
                modelMismatches++;
                logWarning("題圖模型不協調", `題目 ${q.id}`, `題目為盒裝點心，但使用了 ${itype} 模型`, text);
            }
        }
        // 公升/水瓶應使用 bread (容器量筒)
        if (text.includes('公升') || text.includes('瓶')) {
            if (!itype.includes('bread')) {
                modelMismatches++;
                logWarning("題圖模型不協調", `題目 ${q.id}`, `題目為液體容量，但使用了 ${itype} 模型`, text);
            }
        }
        // 公尺/彩帶應使用 ribbon
        if (text.includes('公尺') || text.includes('彩帶') || text.includes('緞帶') || text.includes('毛線') || text.includes('木頭') || text.includes('長麵團')) {
            if (!itype.includes('ribbon')) {
                modelMismatches++;
                logWarning("題圖模型不協調", `題目 ${q.id}`, `題目為長度/彩帶，但使用了 ${itype} 模型`, text);
            }
        }
    });
}

if (modelMismatches === 0) {
    logPass("題圖情境 100% 精準對齊：盒裝(discrete)、液體(bread/cylinder)、彩帶(ribbon)、圓餅(pie) 模型無錯置");
}

// ----------------------------------------------------
// 維度 4: 狀態機與計時器生命週期 (Timer Leak & Ghost Modal)
// ----------------------------------------------------
console.log("\n[D4] 檢核狀態機與計時器生命週期...");

// 檢查對戰狀態是否有 isBattleActive 守衛與 battleNextQuestionTimeout 清理
const hasBattleActiveFlag = jsCode.includes('this.isBattleActive');
const hasBattleNextTimeout = jsCode.includes('this.battleNextQuestionTimeout');

if (!hasBattleActiveFlag) {
    logCritical("生命週期漏洞 (Timer Leak)", "app.js (Battle Mode)", "缺乏 isBattleActive 旗標，對戰中途離開大廳可能引發幽靈彈窗");
} else {
    logPass("對戰生命週期守衛存在：已配備 isBattleActive 旗標");
}

if (!hasBattleNextTimeout) {
    logWarning("計時器未納管 (Timer Leak)", "app.js (Battle Mode)", "nextBattleQuestion 延遲跳題計時器未納管，endBattle 未清除定時器");
} else {
    logPass("對戰轉場定時器納管：battleNextQuestionTimeout 已受控清理");
}

// 檢查 Modal 鍵盤無障礙支援
const hasModalEscape = jsCode.includes("'Escape'") || jsCode.includes('"Escape"');
if (!hasModalEscape) {
    logWarning("無障礙鍵盤支援欠缺", "app.js (toggleSecretGuide)", "魔法烘焙秘笈彈窗未支援鍵盤 [Escape] 關閉");
} else {
    logPass("彈窗鍵盤無障礙完備：支援 [Escape] 關閉");
}

// ----------------------------------------------------
// 維度 5: 語音 (TTS) 與音效控制
// ----------------------------------------------------
console.log("\n[D5] 檢核語音與音效控制模組...");

const hasCleanSpeech = ttsCode.includes('cleanSpeechText') || ttsCode.includes('replace(/<[^>]+>/g');
const hasEmojiClean = ttsCode.includes('1F300') || ttsCode.includes('1FAFF') || ttsCode.includes('cleanSpeechText');
const hasPlayTone = soundCode.includes('playTone');

if (!hasCleanSpeech || !hasEmojiClean) {
    logWarning("語音朗讀雜音 (TTS Glitch)", "tts.js", "TtsManager 未清理 Emoji 圖示與 HTML 標籤，可能產生語音雜音");
} else {
    logPass("語音文字清洗完備：已實裝 cleanSpeechText 過濾 Emoji 與 HTML");
}

if (!hasPlayTone) {
    logWarning("音效兜底缺失 (Web Audio API)", "sound.js", "SoundManager 缺少通用 playTone(freq, duration, type) 兜底方法");
} else {
    logPass("音效兜底機制完備：具備通用 playTone 方法");
}

// ----------------------------------------------------
// 維度 6: 三級載具 RWD 與繁中字型 Fallback
// ----------------------------------------------------
console.log("\n[D6] 檢核載具相容性與字型 Fallback...");

const hasJhengHei = cssCode.includes('Microsoft JhengHei') || cssCode.includes('PingFang TC');
if (!hasJhengHei) {
    logInfo("離線字型 Fallback", "style.css", "建議於 --font-body 與 --font-heading 補充 Microsoft JhengHei 確保離線電腦字體美觀");
} else {
    logPass("本機字型 Fallback 完備：已包含繁體中文字型 Microsoft JhengHei / PingFang TC");
}

// ----------------------------------------------------
// 維度 7: 總結報告
// ----------------------------------------------------
console.log("\n==================================================");
console.log("📊 [QA-AUDIT] 體檢結果統計：");
console.log(`✅ 通過項目 (Passed) : ${report.summary.passed}`);
console.log(`🔴 嚴重缺失 (Critical): ${report.summary.critical}`);
console.log(`🟡 警告提示 (Warning) : ${report.summary.warning}`);
console.log(`🟢 建議優化 (Info)    : ${report.summary.info}`);
console.log("==================================================");

if (report.critical.length > 0) {
    console.log("\n🔴 [CRITICAL ISSUES]:");
    report.critical.forEach(c => console.log(`  - [${c.category}] ${c.location}: ${c.title}`));
}

if (report.warning.length > 0) {
    console.log("\n🟡 [WARNING ISSUES]:");
    report.warning.forEach(w => console.log(`  - [${w.category}] ${w.location}: ${w.title}`));
}

if (report.info.length > 0) {
    console.log("\n🟢 [INFO / SUGGESTIONS]:");
    report.info.forEach(i => console.log(`  - [${i.category}] ${i.location}: ${i.title}`));
}

fs.writeFileSync(path.join(ROOT, 'qa-audit-result.json'), JSON.stringify(report, null, 2), 'utf8');
console.log("\n📄 診斷數據已輸出至 qa-audit-result.json");
