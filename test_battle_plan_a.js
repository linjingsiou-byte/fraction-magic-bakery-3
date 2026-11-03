const puppeteer = require('../2026_四年級上學期_數學：分數/node_modules/puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');

(async () => {
    console.log('[TEST-BATTLE] 啟動雙人對決標準規格（思考緩衝＋防偷跑震動＋搶先奪分）E2E 驗證...');

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(htmlPath, { waitUntil: 'load' });
        const wait = ms => new Promise(r => setTimeout(r, ms));

        // 1. 驗證大廳設定畫面與秘笈彈窗文案
        console.log('[TEST-BATTLE] 1. 驗證對決設定畫面賽制說明標籤...');
        await page.click('#btn-mode-double');
        await wait(300);

        const rulesText = await page.$eval('.duel-special-rules', el => el.textContent.trim());
        console.log('對決說明標籤內容:\n', rulesText);
        if (!rulesText.includes('3 秒讀題思考') || !rulesText.includes('極速搶答爭奪') || !rulesText.includes('率先達標獲勝')) {
            throw new Error('對決設定畫面缺少官方三步驟規範文案！');
        }
        console.log('✔ 對決設定畫面規則小標籤驗證通過！');

        console.log('[TEST-BATTLE] 驗證遊戲秘笈彈窗雙人對決賽制說明...');
        await page.click('#btn-lobby-secret-guide');
        await wait(300);
        const guideText = await page.$eval('#modal-secret-guide', el => el.textContent.trim());
        if (!guideText.includes('雙人對決賽制說明') || !guideText.includes('3 秒讀題思考') || !guideText.includes('極速搶答爭奪')) {
            throw new Error('秘笈彈窗缺少雙人對決賽制說明！');
        }
        await page.click('#btn-close-guide');
        await wait(300);
        console.log('✔ 遊戲秘笈彈窗雙人對決賽制說明驗證通過！');

        // 2. 點擊開始雙人烘焙對決
        console.log('[TEST-BATTLE] 2. 點擊開始雙人對決...');
        await page.click('#btn-start-battle');
        await wait(400);

        // 3. 驗證 3.0 秒讀題思考期與防偷跑攔截
        console.log('[TEST-BATTLE] 3. 驗證 3.0 秒讀題思考期狀態與防偷跑攔截...');
        let isThinking = await page.evaluate(() => window.app.isBattleThinkingPhase);
        if (!isThinking) {
            throw new Error('開題後未進入 isBattleThinkingPhase！');
        }

        // 模擬在思考期內點擊玩家 1 面板（偷按）
        console.log('[TEST-BATTLE] 模擬思考期偷按玩家 1 鍵盤/面板...');
        await page.click('#btn-p1-submit');
        await wait(100);

        const p1FeedbackDuringThinking = await page.evaluate(() => document.getElementById('p1-feedback').innerText);
        const p1HasShake = await page.evaluate(() => document.getElementById('p1-side').classList.contains('shake-warn'));
        console.log('思考期偷按反饋:', p1FeedbackDuringThinking, '震動動畫:', p1HasShake);
        if (!p1FeedbackDuringThinking.includes('請先讀題思考')) {
            throw new Error(`思考期偷按未跳出正確警示文字: ${p1FeedbackDuringThinking}`);
        }
        if (!p1HasShake) {
            throw new Error('思考期偷按未觸發 shake-warn 震動樣式！');
        }
        console.log('✔ 防偷跑攔截與震動警示完美生效！');

        // 4. 等待讀題思考期結束（3 秒）
        console.log('[TEST-BATTLE] 4. 等待思考緩衝倒數歸零...');
        await wait(2800);

        isThinking = await page.evaluate(() => window.app.isBattleThinkingPhase);
        if (isThinking) {
            await wait(500);
        }

        const statusBarText = await page.evaluate(() => document.getElementById('battle-status-text').innerText);
        console.log('開放作答狀態列:', statusBarText);
        if (!statusBarText.includes('競速開始') || !statusBarText.includes('提交配方')) {
            throw new Error(`開放作答狀態文字不符預期: ${statusBarText}`);
        }
        console.log('✔ 讀題思考期結束，開搶提示生效，進入競速階段！');

        // 5. 模擬玩家 1 搶先算對並送出
        console.log('[TEST-BATTLE] 5. 模擬玩家 1 搶先填入正確答案並送出...');
        const qInfo = await page.evaluate(() => {
            const q = window.app.battleQuestions[window.app.battleCurrentQuestionIdx];
            let targetNum = q.answer.numAns !== undefined ? q.answer.numAns : q.answer.num;
            let targetDen = q.answer.denAns !== undefined ? q.answer.denAns : q.answer.den;
            if (q.type === 'equation-whole-sub') {
                targetNum = q.answer.numAns;
                targetDen = q.answer.denAns;
            }
            return { targetNum, targetDen };
        });

        console.log('[TEST-BATTLE] 當前題正確答案:', `${qInfo.targetNum}/${qInfo.targetDen}`);

        await page.evaluate((target) => {
            const p1Num = document.querySelector('#p1-equation .frac-input-num');
            const p1Den = document.querySelector('#p1-equation .frac-input-den');
            if (p1Num) p1Num.innerText = target.targetNum;
            if (p1Den) p1Den.innerText = target.targetDen;
        }, qInfo);

        await page.click('#btn-p1-submit');
        await wait(300);

        // 驗證搶先奪分狀態
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

        if (!battleState.p1Feedback.includes('烘焙成功') || !battleState.p1Feedback.includes('+10 分')) {
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
        console.log('[TEST-BATTLE] 7. 等待切換到下一題...');
        await wait(1600);

        const currentQIdx = await page.evaluate(() => window.app.battleCurrentQuestionIdx);
        if (currentQIdx !== 1) {
            throw new Error(`未順利切換至第 2 題！當前題號索引: ${currentQIdx}`);
        }
        console.log('✔ 1.5 秒後流暢進入第 2 題！');

        console.log('🎉🎉🎉 [SUCCESS] 雙人對決標準規格全套驗證 100% 通過！');

    } catch (err) {
        console.error('❌ [FAIL] 測試失敗：', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
