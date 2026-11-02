const puppeteer = require('../2026_四年級上學期_數學：分數/node_modules/puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');

(async () => {
    console.log('[TEST-BATTLE] 啟動雙人對戰【方案 A：搶先奪分制】E2E 驗證...');

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    try {
        const page = await browser.newPage();
        await page.goto(htmlPath, { waitUntil: 'load' });
        const wait = ms => new Promise(r => setTimeout(r, ms));

        // 1. 從大廳進入雙人對戰模式選擇
        console.log('[TEST-BATTLE] 點擊進入雙人模式...');
        await page.click('#btn-mode-double');
        await wait(500);

        // 2. 選擇 5 題、同分母加法
        await page.evaluate(() => {
            const countBtn = document.querySelector('#battle-count-select .opt-btn[data-count="5"]');
            if (countBtn) countBtn.click();
        });
        await wait(200);

        // 3. 開始對戰
        await page.click('#btn-start-battle');
        await wait(400);

        // 檢查是否進入 screen-double-play
        const isDoubleScreen = await page.evaluate(() => {
            return document.getElementById('screen-double-play').classList.contains('active');
        });
        if (!isDoubleScreen) throw new Error('未成功進入雙人對戰畫面！');
        console.log('✔ 成功進入雙人對戰畫面。');

        // 等待 3 秒思考倒數結束
        console.log('[TEST-BATTLE] 等待 3 秒讀題思考緩衝期...');
        await wait(3300);

        // 檢查思考期已結束
        const isThinkingDone = await page.evaluate(() => {
            return !window.app.isBattleThinkingPhase;
        });
        if (!isThinkingDone) throw new Error('思考期結束狀態異常！');
        console.log('✔ 讀題思考期順利結束，進入競速階段。');

        // 4. 模擬玩家 1 搶先填寫正確答案並送出
        const qInfo = await page.evaluate(() => {
            const app = window.app;
            const q = app.battleQuestions[app.battleCurrentQuestionIdx];
            const targetNum = q.answer.numAns !== undefined ? q.answer.numAns : q.answer.num;
            const targetDen = q.answer.denAns !== undefined ? q.answer.denAns : q.answer.den;

            // 填寫玩家 1
            const p1Num = document.querySelector('#p1-equation .frac-input-num');
            const p1Den = document.querySelector('#p1-equation .frac-input-den');
            if (p1Num) p1Num.innerText = targetNum;
            if (p1Den) p1Den.innerText = targetDen;

            return { targetNum, targetDen };
        });
        console.log(`[TEST-BATTLE] 第 1 題正確答案: ${qInfo.targetNum}/${qInfo.targetDen}`);

        // 玩家 1 送出
        await page.click('#btn-p1-submit');
        await wait(300);

        // 5. 驗證玩家 1 與玩家 2 的即時反饋狀態
        const battleState = await page.evaluate(() => {
            const p1Feedback = document.getElementById('p1-feedback').innerText;
            const p2Feedback = document.getElementById('p2-feedback').innerText;
            const p1Score = document.getElementById('p1-score').innerText;
            const p2Score = document.getElementById('p2-score').innerText;
            const p1Cooling = document.getElementById('p1-side').classList.contains('cooling');
            const p2Cooling = document.getElementById('p2-side').classList.contains('cooling');
            const statusText = document.getElementById('battle-status-text').innerText;

            return {
                p1Feedback,
                p2Feedback,
                p1Score,
                p2Score,
                p1Cooling,
                p2Cooling,
                statusText,
                p1Answered: window.app.p1Answered,
                p2Answered: window.app.p2Answered
            };
        });

        console.log('[TEST-BATTLE] 搶先奪分狀態核驗：', battleState);

        if (!battleState.p1Feedback.includes('搶先奪得 10 分')) {
            throw new Error(`玩家 1 反饋未符合搶先奪分預期: ${battleState.p1Feedback}`);
        }
        if (!battleState.p2Feedback.includes('慢了一步')) {
            throw new Error(`玩家 2 反饋未符合慢了一步預期: ${battleState.p2Feedback}`);
        }
        if (battleState.p1Score !== '10 分' || battleState.p2Score !== '0 分') {
            throw new Error(`分數不符預期！P1: ${battleState.p1Score}, P2: ${battleState.p2Score}`);
        }
        if (!battleState.p1Cooling || !battleState.p2Cooling) {
            throw new Error('作答結算後未立即鎖定雙方面板！');
        }
        console.log('✔ 玩家 1 搶先獨得 10 分，玩家 2 立即被鎖定並提示「慢了一步」，杜絕抄答案破綻！');

        // 6. 模擬玩家 2 試圖在被搶先後送出答案（應被完全忽略，不得分）
        await page.evaluate((target) => {
            const p2Num = document.querySelector('#p2-equation .frac-input-num');
            const p2Den = document.querySelector('#p2-equation .frac-input-den');
            if (p2Num) p2Num.innerText = target.targetNum;
            if (p2Den) p2Den.innerText = target.targetDen;
        }, qInfo);
        await page.click('#btn-p2-submit');
        await wait(200);

        const p2ScoreAfterAttempt = await page.evaluate(() => document.getElementById('p2-score').innerText);
        if (p2ScoreAfterAttempt !== '0 分') {
            throw new Error(`玩家 2 抄答案後竟然仍獲得了分數！: ${p2ScoreAfterAttempt}`);
        }
        console.log('✔ 防作弊防禦生效：玩家 2 被鎖定後點擊送出無效，依然維持 0 分！');

        // 7. 等待 1.5 秒自動換題
        console.log('[TEST-BATTLE] 等待切換到第 2 題...');
        await wait(1600);

        const currentQIdx = await page.evaluate(() => window.app.battleCurrentQuestionIdx);
        if (currentQIdx !== 1) {
            throw new Error(`未順利切換至第 2 題！當前題號索引: ${currentQIdx}`);
        }
        console.log('✔ 1.5 秒後流暢進入第 2 題！');

        console.log('\n🎉 [PASS] 雙人對戰【方案 A：搶先奪分制】E2E 自動化測試全部通過！');
    } catch (err) {
        console.error('❌ [FAIL] 測試失敗：', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
