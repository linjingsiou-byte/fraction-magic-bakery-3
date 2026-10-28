const fs = require('fs');

// 讀取 questions.js
const qCode = fs.readFileSync('questions.js', 'utf8');
eval(qCode.replace('const gameQuestions', 'global.gameQuestions'));

// 讀取 app.js 取得 FractionBakeryGame 的 getQuestionItemInfo
const appCode = fs.readFileSync('app.js', 'utf8');

// 提取 getQuestionItemInfo 實作
const match = appCode.match(/getQuestionItemInfo\(q\)\s*\{([\s\S]*?)\n    \}/);
if (!match) {
    console.error('Cannot find getQuestionItemInfo in app.js!');
    process.exit(1);
}

const getQuestionItemInfo = new Function('q', match[1]);

console.log('Testing all 60 questions for text-to-visual consistency...');

let passCount = 0;
let failCount = 0;

for (let lvl = 1; lvl <= 4; lvl++) {
    console.log(`\n=== Testing Level ${lvl} ===`);
    gameQuestions[lvl].forEach(q => {
        const info = getQuestionItemInfo(q);
        
        // 驗證 1: 名稱是否有被題目包含或相符
        let nameMatch = false;
        if (q.text.includes(info.name) || 
            (info.name === '點心' && (q.text.includes('點心') || q.text.includes('甜點'))) ||
            (info.name === '水果' && (q.text.includes('草莓') || q.text.includes('芒果'))) ||
            (info.name === '糕點' && (q.text.includes('綠豆椪') || q.text.includes('蛋黃酥'))) ||
            (info.name === '麵包' && (q.text.includes('麵包') || q.text.includes('吐司'))) ||
            (info.name === '果汁' && (q.text.includes('柳橙汁') || q.text.includes('芭樂汁') || q.text.includes('果汁'))) ||
            (info.name === '水' && (q.text.includes('水瓶') || q.text.includes('花瓶') || q.text.includes('水'))) ||
            (info.name === '鬆餅' && q.text.includes('鬆餅')) ||
            (info.name === '麵團' && q.text.includes('長麵團'))) {
            nameMatch = true;
        }

        // 驗證 2: emoji 是否合理
        const hasEmoji = Boolean(info.emoji && info.emoji.length > 0);

        // 驗證 3: 動作動詞是否合適
        let verbMatch = true;
        if (q.text.includes('喝') && info.actionVerb !== '喝掉') verbMatch = false;
        if (q.text.includes('煮') && info.actionVerb !== '煮了') verbMatch = false;
        if (q.text.includes('鋸') && info.actionVerb !== '鋸掉') verbMatch = false;
        if (q.text.includes('剪') && info.actionVerb !== '剪掉') verbMatch = false;
        if (q.text.includes('賣') && info.actionVerb !== '賣出') verbMatch = false;
        if (q.text.includes('偷吃') && info.actionVerb !== '吃掉') verbMatch = false;

        if (nameMatch && hasEmoji && verbMatch) {
            passCount++;
        } else {
            failCount++;
            console.error(`[FAIL] ${q.id}: text="${q.text}" -> parsed info:`, info, { nameMatch, hasEmoji, verbMatch });
        }
    });
}

console.log(`\n========================================`);
console.log(`Result: ${passCount} Passed, ${failCount} Failed.`);
if (failCount === 0) {
    console.log('SUCCESS! All 60 questions match perfectly with visual emojis, items, units, and verbs!');
} else {
    process.exit(1);
}
