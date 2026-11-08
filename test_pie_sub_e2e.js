const puppeteer = require('../2026_四年級上學期_數學：分數/node_modules/puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');

(async () => {
    console.log('=== 開始第 3 關大餅連續量圓餅圖與老鼠防重複點擊 E2E 測試 ===');
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

        // 1. 載入第 3 關第 14 題 (3_14)
        console.log('\n[TEST 1] 正在載入第 3 關第 14 題 (3_14: 大餅連續量減法)...');
        await page.evaluate(() => {
            window.app.startSingleGame(3);
            const qList = gameQuestions[3];
            const q = qList.find(item => item.id === '3_14');
            window.app.singleQuestions[window.app.singleCurrentQuestionIdx] = q;
            window.app.loadSingleQuestion();
        });

        await wait(600);

        // 驗證題目文字
        const qText = await page.$eval('#single-question-text', el => el.innerText.trim());
        console.log('題目文字:', qText);
        if (!qText.includes('桌上有 1 張大餅平分成 8 塊') || !qText.includes('張大餅')) {
            throw new Error(`題目文字未正確更新：${qText}`);
        }
        console.log('✅ 題目文字精準符合「張／塊」標準單位！');

        // 驗證右側配料盤是否為圓形大餅 SVG
        const svgCheck = await page.evaluate(() => {
            const svg = document.querySelector('.magic-circle-svg');
            const paths = svg ? svg.querySelectorAll('path') : [];
            const header = document.querySelector('.cut-status-tag');
            return {
                hasSvg: Boolean(svg),
                sliceCount: paths.length,
                headerText: header ? header.innerText : ''
            };
        });

        console.log('SVG 圓餅圖資訊:', svgCheck);
        if (!svgCheck.hasSvg || svgCheck.sliceCount !== 8) {
            throw new Error(`預期有 8 份切片的圓餅圖，實際為: ${JSON.stringify(svgCheck)}`);
        }
        console.log('✅ 成功呈現真實連續量圓形大餅圖（8 等份扇形切片）！');

        // 2. 測試召喚小老鼠與防重複點擊
        console.log('\n[TEST 2] 測試召喚小老鼠吃掉 3 塊...');
        const btnTextBefore = await page.$eval('.tool-btn', el => el.innerText);
        console.log('按鈕初始文字:', btnTextBefore);

        // 點擊召喚老鼠按鈕
        await page.click('.tool-btn');
        await wait(100);

        // 立即檢查按鈕是否 disabled (防抖)
        const isDisabledDuringAnim = await page.$eval('.tool-btn', el => el.disabled);
        console.log('動畫期間按鈕 disabled 狀態:', isDisabledDuringAnim);
        if (!isDisabledDuringAnim) {
            throw new Error('按鈕點擊後未立即 disabled，無法防抖！');
        }

        // 嘗試在動畫期間連續點擊多次，驗證不會重複觸發
        console.log('模擬連續狂按按鈕 3 次...');
        await page.click('.tool-btn').catch(() => {});
        await page.click('.tool-btn').catch(() => {});
        await page.click('.tool-btn').catch(() => {});

        // 等待動畫播放完畢 (老鼠吃完回角落)
        await wait(1600);

        // 檢查吃完後的按鈕狀態與文字
        const btnStateAfter = await page.evaluate(() => {
            const tipBtn = document.querySelector('.tool-btn');
            const resetBtn = document.querySelectorAll('.tool-btn')[1];
            const eatenSlices = document.querySelectorAll('.magic-circle-svg text');
            const eatenCount = Array.from(eatenSlices).filter(t => t.textContent === '💥').length;
            const f2Num = document.querySelector('[data-target="single-f2-num"]');
            const fansNum = document.querySelector('[data-target="single-fans-num"]');
            const fansDen = document.querySelector('[data-target="single-fans-den"]');
            return {
                tipBtnText: tipBtn ? tipBtn.innerText : '',
                tipBtnDisabled: tipBtn ? tipBtn.disabled : false,
                resetBtnVisible: resetBtn && resetBtn.style.display !== 'none',
                eatenCount: eatenCount,
                f2Num: f2Num ? f2Num.innerText : '',
                fansNum: fansNum ? fansNum.innerText : '',
                fansDen: fansDen ? fansDen.innerText : ''
            };
        });

        console.log('老鼠吃完後狀態:', btnStateAfter);
        if (!btnStateAfter.tipBtnText.includes('吃飽') || !btnStateAfter.tipBtnDisabled) {
            throw new Error(`吃完後按鈕未鎖定：${JSON.stringify(btnStateAfter)}`);
        }
        if (btnStateAfter.eatenCount !== 3) {
            throw new Error(`預期吃掉 3 塊，實際吃掉 ${btnStateAfter.eatenCount} 塊`);
        }
        if (btnStateAfter.fansNum !== '4' || btnStateAfter.fansDen !== '8') {
            throw new Error(`算式未正確連動：${JSON.stringify(btnStateAfter)}`);
        }
        if (!btnStateAfter.resetBtnVisible) {
            throw new Error('吃完後未顯示「還原大餅」按鈕');
        }
        console.log('✅ 召喚老鼠吃掉 3 塊驗證通過！算式同步為 7/8 - 3/8 = 4/8，按鈕成功鎖定！');

        // 截圖存證
        await page.screenshot({ path: 'screenshot_pie_sub_eaten.png' });
        console.log('📸 已擷取大餅被老鼠吃掉截圖: screenshot_pie_sub_eaten.png');

        // 3. 測試「還原大餅」按鈕
        console.log('\n[TEST 3] 測試還原大餅功能...');
        await page.evaluate(() => {
            const resetBtn = document.querySelectorAll('.tool-btn')[1];
            resetBtn.click();
        });
        await wait(300);

        const resetCheck = await page.evaluate(() => {
            const tipBtn = document.querySelector('.tool-btn');
            const eatenSlices = document.querySelectorAll('.magic-circle-svg text');
            const eatenCount = Array.from(eatenSlices).filter(t => t.textContent === '💥').length;
            const f2Num = document.querySelector('[data-target="single-f2-num"]');
            return {
                tipBtnText: tipBtn ? tipBtn.innerText : '',
                tipBtnDisabled: tipBtn ? tipBtn.disabled : false,
                eatenCount: eatenCount,
                f2Num: f2Num ? f2Num.innerText : ''
            };
        });

        console.log('還原後狀態:', resetCheck);
        if (resetCheck.eatenCount !== 0 || resetCheck.tipBtnDisabled) {
            throw new Error(`還原失敗：${JSON.stringify(resetCheck)}`);
        }
        console.log('✅ 大餅切片與召喚按鈕成功復原！');

        console.log('\n🎉 第 3 關大餅連續量圓餅圖與老鼠防重複點擊 E2E 測試 100% 通過！');
    } catch (err) {
        console.error('❌ 測試失敗:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
