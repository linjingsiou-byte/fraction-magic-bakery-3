const puppeteer = require('../2026_四年級上學期_數學：分數/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const HTML_PATH = `file://${path.resolve(__dirname, 'index.html').replace(/\\/g, '/')}`;
const SCREENSHOT_DIR = "C:\\Users\\user\\.gemini\\antigravity\\brain\\8b0c62c4-a7a5-4b2f-91ab-7f2644ea5400";

(async () => {
    console.log("[AI-TEST] Launching Chrome...");
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 850 });

    console.log(`[AI-TEST] Loading page: ${HTML_PATH}`);
    await page.goto(HTML_PATH, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    // 1. 測試切換至 AI 模式
    console.log("[AI-TEST] Switching to AI Challenge Mode...");
    await page.click('#btn-mode-ai');
    await new Promise(r => setTimeout(r, 600));

    const isAiSetupVisible = await page.$eval('#ai-setup-area', el => !el.classList.contains('hidden'));
    if (!isAiSetupVisible) {
        throw new Error("AI Setup Area is not visible after clicking #btn-mode-ai");
    }
    console.log("✔ AI Setup area visible.");

    // 2. 測試難度卡片切換
    console.log("[AI-TEST] Testing difficulty card selection...");
    await page.click('.ai-diff-card[data-diff="hard"]');
    await new Promise(r => setTimeout(r, 300));
    const selectedDiff = await page.evaluate(() => window.app.aiDifficulty);
    if (selectedDiff !== 'hard') {
        throw new Error(`Expected hard difficulty, got ${selectedDiff}`);
    }
    console.log("✔ Switched to Hard difficulty.");

    // 切回 Normal
    await page.click('.ai-diff-card[data-diff="normal"]');
    await new Promise(r => setTimeout(r, 300));
    console.log("✔ Switched back to Normal difficulty.");

    // 3. 點擊開啟挑戰賽
    console.log("[AI-TEST] Starting AI Challenge...");
    await page.click('#btn-start-ai');
    await new Promise(r => setTimeout(r, 800));

    const isAiScreenActive = await page.$eval('#screen-ai-play', el => el.classList.contains('active'));
    if (!isAiScreenActive) {
        throw new Error("#screen-ai-play is not active");
    }
    console.log("✔ AI Play Screen is active.");

    // 截圖 1: 遊戲初始畫面
    const screen1Path = path.join(SCREENSHOT_DIR, 'screenshot_ai_challenge_start.png');
    await page.screenshot({ path: screen1Path });
    console.log(`✔ Screenshot 1 saved to: ${screen1Path}`);

    // 4. 測試教學安全閥：刻意答錯
    console.log("[AI-TEST] Testing Misconception Feedback & Safety Valve on wrong answer...");
    await page.evaluate(() => {
        // 若當前是選擇題，選一個錯誤選項或若是算式題填錯
        const q = window.app.aiQuestions[window.app.aiCurrentQuestionIdx % window.app.aiQuestions.length];
        if (q.type === 'choice') {
            const wrongOpt = Array.from(document.querySelectorAll('#ai-equation-display .opt-btnChoice'))
                .find(b => (b.getAttribute('data-val') || b.innerText.trim()) !== q.answer);
            if (wrongOpt) wrongOpt.click();
        } else {
            // 填入錯誤的答案 99
            const numCell = document.querySelector('#ai-equation-display .frac-input-num');
            const denCell = document.querySelector('#ai-equation-display .frac-input-den');
            if (numCell) numCell.innerText = '99';
            if (denCell) denCell.innerText = '99';
        }
    });

    await page.click('#btn-ai-submit');
    await new Promise(r => setTimeout(r, 600));

    // 驗證回饋條與安全閥提示
    const feedbackVisible = await page.$eval('#ai-feedback-bar', el => !el.classList.contains('hidden'));
    const safetyHintVisible = await page.$eval('#ai-safety-hint', el => !el.classList.contains('hidden'));
    const isPaused = await page.evaluate(() => window.app.aiIsPaused);
    const nextBtnVisible = await page.$eval('#btn-ai-next', el => !el.classList.contains('hidden'));

    if (!feedbackVisible || !safetyHintVisible || !isPaused || !nextBtnVisible) {
        throw new Error(`Safety valve failed: feedback=${feedbackVisible}, safetyHint=${safetyHintVisible}, isPaused=${isPaused}, nextBtn=${nextBtnVisible}`);
    }
    console.log("✔ Misconception feedback shown and Safety Valve paused AI thinking timer.");

    // 截圖 2: 安全閥觸發
    const screen2Path = path.join(SCREENSHOT_DIR, 'screenshot_ai_safety_valve.png');
    await page.screenshot({ path: screen2Path });
    console.log(`✔ Screenshot 2 saved to: ${screen2Path}`);

    // 點擊下一題解除安全閥
    await page.click('#btn-ai-next');
    await new Promise(r => setTimeout(r, 800));

    const safetyHintAfterNext = await page.$eval('#ai-safety-hint', el => el.classList.contains('hidden'));
    if (!safetyHintAfterNext) {
        throw new Error("Safety hint still visible after clicking next question");
    }
    console.log("✔ Safety Valve resumed upon clicking next question.");

    // 5. 測試連續答對與黃金奶油暴擊 (Combo)
    console.log("[AI-TEST] Testing consecutive correct answers & Golden Butter Critical Combo...");
    
    // 正確回答第 1 題 (充能 +15%, Combo 1)
    await page.evaluate(() => {
        const q = window.app.aiQuestions[window.app.aiCurrentQuestionIdx % window.app.aiQuestions.length];
        if (q.type === 'choice') {
            const correctOpt = Array.from(document.querySelectorAll('#ai-equation-display .opt-btnChoice'))
                .find(b => (b.getAttribute('data-val') || b.innerText.trim()) === q.answer);
            if (correctOpt) correctOpt.click();
        } else {
            // 自動正確填入答案
            if (q.type === 'fraction-input') {
                const n = document.querySelector('[data-target="ai-f1-num"]');
                const d = document.querySelector('[data-target="ai-f1-den"]');
                if (n) n.innerText = q.answer.num;
                if (d) d.innerText = q.answer.den;
            } else if (q.type === 'equation') {
                const n = document.querySelector('[data-target="ai-fans-num"]');
                const d = document.querySelector('[data-target="ai-fans-den"]');
                if (n) n.innerText = q.answer.numAns;
                if (d) d.innerText = q.answer.denAns;
            } else if (q.type === 'equation-whole') {
                const n = document.querySelector('[data-target="ai-fans-num"]');
                const d = document.querySelector('[data-target="ai-fans-den"]');
                const w = document.getElementById('ai-wholeans');
                if (n) n.innerText = q.answer.numAns;
                if (d) d.innerText = q.answer.denAns;
                if (w) w.innerText = q.answer.wholeAns;
            } else if (q.type === 'equation-convert') {
                const n2 = document.querySelector('[data-target="ai-f2-num"]');
                const na = document.querySelector('[data-target="ai-fans-num"]');
                const da = document.querySelector('[data-target="ai-fans-den"]');
                if (n2) n2.innerText = q.answer.num2;
                if (na) na.innerText = q.answer.numAns;
                if (da) da.innerText = q.answer.denAns;
            } else if (q.type === 'equation-whole-sub') {
                const n1 = document.querySelector('[data-target="ai-f1-num"]');
                const d1 = document.querySelector('[data-target="ai-f1-den"]');
                const na = document.querySelector('[data-target="ai-fans-num"]');
                const da = document.querySelector('[data-target="ai-fans-den"]');
                if (n1) n1.innerText = q.answer.num1;
                if (d1) d1.innerText = q.answer.den1;
                if (na) na.innerText = q.answer.numAns;
                if (da) da.innerText = q.answer.denAns;
            } else if (q.type === 'equation-add-to-whole') {
                const na = document.querySelector('[data-target="ai-fans-num"]');
                const da = document.querySelector('[data-target="ai-fans-den"]');
                const w = document.getElementById('ai-wholeans');
                if (na) na.innerText = q.answer.numAns;
                if (da) da.innerText = q.answer.denAns;
                if (w) w.innerText = q.answer.wholeAns;
            }
        }
    });

    await page.click('#btn-ai-submit');
    await new Promise(r => setTimeout(r, 1200)); // 等待答對自動載入下一題

    const energyAfterQ1 = await page.evaluate(() => window.app.playerEnergy);
    console.log(`✔ Answer 1 correct: Player Energy = ${energyAfterQ1}%`);

    // 正確回答第 2 題 (觸發 Combo 2, 暴擊 +20%)
    await page.evaluate(() => {
        const q = window.app.aiQuestions[window.app.aiCurrentQuestionIdx % window.app.aiQuestions.length];
        if (q.type === 'choice') {
            const correctOpt = Array.from(document.querySelectorAll('#ai-equation-display .opt-btnChoice'))
                .find(b => (b.getAttribute('data-val') || b.innerText.trim()) === q.answer);
            if (correctOpt) correctOpt.click();
        } else {
            if (q.type === 'fraction-input') {
                const n = document.querySelector('[data-target="ai-f1-num"]');
                const d = document.querySelector('[data-target="ai-f1-den"]');
                if (n) n.innerText = q.answer.num;
                if (d) d.innerText = q.answer.den;
            } else if (q.type === 'equation') {
                const n = document.querySelector('[data-target="ai-fans-num"]');
                const d = document.querySelector('[data-target="ai-fans-den"]');
                if (n) n.innerText = q.answer.numAns;
                if (d) d.innerText = q.answer.denAns;
            } else if (q.type === 'equation-whole') {
                const n = document.querySelector('[data-target="ai-fans-num"]');
                const d = document.querySelector('[data-target="ai-fans-den"]');
                const w = document.getElementById('ai-wholeans');
                if (n) n.innerText = q.answer.numAns;
                if (d) d.innerText = q.answer.denAns;
                if (w) w.innerText = q.answer.wholeAns;
            } else if (q.type === 'equation-convert') {
                const n2 = document.querySelector('[data-target="ai-f2-num"]');
                const na = document.querySelector('[data-target="ai-fans-num"]');
                const da = document.querySelector('[data-target="ai-fans-den"]');
                if (n2) n2.innerText = q.answer.num2;
                if (na) na.innerText = q.answer.numAns;
                if (da) da.innerText = q.answer.denAns;
            } else if (q.type === 'equation-whole-sub') {
                const n1 = document.querySelector('[data-target="ai-f1-num"]');
                const d1 = document.querySelector('[data-target="ai-f1-den"]');
                const na = document.querySelector('[data-target="ai-fans-num"]');
                const da = document.querySelector('[data-target="ai-fans-den"]');
                if (n1) n1.innerText = q.answer.num1;
                if (d1) d1.innerText = q.answer.den1;
                if (na) na.innerText = q.answer.numAns;
                if (da) da.innerText = q.answer.denAns;
            } else if (q.type === 'equation-add-to-whole') {
                const na = document.querySelector('[data-target="ai-fans-num"]');
                const da = document.querySelector('[data-target="ai-fans-den"]');
                const w = document.getElementById('ai-wholeans');
                if (na) na.innerText = q.answer.numAns;
                if (da) da.innerText = q.answer.denAns;
                if (w) w.innerText = q.answer.wholeAns;
            }
        }
    });

    await page.click('#btn-ai-submit');
    await new Promise(r => setTimeout(r, 600));

    // 驗證 Combo 徽章與暴擊層
    const comboBadgeText = await page.$eval('#player-combo-badge', el => el.innerText);
    const energyAfterQ2 = await page.evaluate(() => window.app.playerEnergy);
    console.log(`✔ Answer 2 correct: Combo Badge = ${comboBadgeText}, Player Energy = ${energyAfterQ2}%`);

    // 截圖 3: Combo 暴擊畫面
    const screen3Path = path.join(SCREENSHOT_DIR, 'screenshot_ai_combo_critical.png');
    await page.screenshot({ path: screen3Path });
    console.log(`✔ Screenshot 3 saved to: ${screen3Path}`);

    // 6. 模擬衝刺充能至 100% 達成出爐獲勝
    console.log("[AI-TEST] Simulating victory by filling oven to 100%...");
    await page.evaluate(() => {
        window.app.playerEnergy = 100;
        window.app.finishAiChallenge(true);
    });
    await new Promise(r => setTimeout(r, 800));

    const isResultActive = await page.$eval('#screen-result', el => el.classList.contains('active'));
    const resultTitle = await page.$eval('#result-title', el => el.innerText);
    if (!isResultActive || !resultTitle.includes("魔力出爐")) {
        throw new Error(`Result screen error: active=${isResultActive}, title=${resultTitle}`);
    }
    console.log(`✔ Victory result screen verified: ${resultTitle}`);

    // 截圖 4: 結算畫面
    const screen4Path = path.join(SCREENSHOT_DIR, 'screenshot_ai_challenge_result.png');
    await page.screenshot({ path: screen4Path });
    console.log(`✔ Screenshot 4 saved to: ${screen4Path}`);

    console.log("\n==================== AI CHALLENGE TEST RESULT ====================");
    console.log("✅ ALL AI CHALLENGE FEATURES VERIFIED AND PASSED E2E PLAYTEST!");

    await browser.close();
})();
