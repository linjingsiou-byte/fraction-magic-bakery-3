const puppeteer = require('../2026_四年級上學期_數學：分數/node_modules/puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');

(async () => {
    console.log('=== 開始離散量圖形每列 6 個排版驗證測試 ===');
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

        // 1. 驗證第二關第 10 題 (2_10: 3/12 盒綠豆椪 + 8/12 盒蛋黃酥)
        console.log('\n[TEST 1] 正在載入第二關第 10 題 (2_10)...');
        await page.evaluate(() => {
            window.app.startSingleGame(2);
            const qList = gameQuestions[2];
            const q = qList.find(item => item.id === '2_10');
            window.app.singleQuestions[window.app.singleCurrentQuestionIdx] = q;
            window.app.loadSingleQuestion();
        });

        await wait(600);

        // 檢查 2_10 的 gridColumns 與 offsetTop
        const gridInfo2_10 = await page.evaluate(() => {
            const groupOutline = document.querySelector('.box-group-outline');
            if (!groupOutline) return { error: '找不到 .box-group-outline' };

            const style = window.getComputedStyle(groupOutline);
            const items = Array.from(groupOutline.querySelectorAll('.discrete-item'));
            const offsets = items.map(el => ({ top: el.offsetTop, left: el.offsetLeft }));

            return {
                itemCount: items.length,
                gridTemplateColumns: style.gridTemplateColumns,
                offsets: offsets
            };
        });

        console.log('2_10 排版資訊:', {
            itemCount: gridInfo2_10.itemCount,
            gridTemplateColumns: gridInfo2_10.gridTemplateColumns
        });

        if (gridInfo2_10.error) {
            throw new Error(gridInfo2_10.error);
        }

        if (gridInfo2_10.itemCount !== 12) {
            throw new Error(`預期有 12 個項目，實際為 ${gridInfo2_10.itemCount}`);
        }

        const cols = gridInfo2_10.gridTemplateColumns.split(/\s+/).filter(Boolean);
        if (cols.length !== 6) {
            throw new Error(`預期為 6 欄 (一列6個)，實際有 ${cols.length} 欄: ${gridInfo2_10.gridTemplateColumns}`);
        }

        // 驗證第一列 6 個的 offsetTop 是否相同
        const row1Top = gridInfo2_10.offsets[0].top;
        for (let i = 0; i < 6; i++) {
            if (Math.abs(gridInfo2_10.offsets[i].top - row1Top) > 1) {
                throw new Error(`第 1 列項目 ${i} 的 offsetTop (${gridInfo2_10.offsets[i].top}) 與第 0 個 (${row1Top}) 不同！`);
            }
        }

        // 驗證第二列 6 個的 offsetTop 是否相同，且大於第一列
        const row2Top = gridInfo2_10.offsets[6].top;
        if (row2Top <= row1Top) {
            throw new Error(`第 2 列 offsetTop (${row2Top}) 未大於第 1 列 (${row1Top})！`);
        }
        for (let i = 6; i < 12; i++) {
            if (Math.abs(gridInfo2_10.offsets[i].top - row2Top) > 1) {
                throw new Error(`第 2 列項目 ${i} 的 offsetTop (${gridInfo2_10.offsets[i].top}) 與第 6 個 (${row2Top}) 不同！`);
            }
        }

        console.log('✅ 第二關 2_10 驗證通過：12 個項目完美排成 2 列，每列 6 個！');

        // 截圖存證
        await page.screenshot({ path: 'test_grid_2_10.png' });
        console.log('📸 已擷取 2_10 排列截圖: test_grid_2_10.png');

        // 2. 驗證第三關第 2 題 (3_2: 12 入老鼠偷吃)
        console.log('\n[TEST 2] 正在載入第三關第 2 題 (3_2)...');
        await page.evaluate(() => {
            window.app.startSingleGame(3);
            const qList = gameQuestions[3];
            const q = qList.find(item => item.id === '3_2');
            window.app.singleQuestions[window.app.singleCurrentQuestionIdx] = q;
            window.app.loadSingleQuestion();
        });

        await wait(600);

        const gridInfo3_2 = await page.evaluate(() => {
            const groupOutline = document.querySelector('.box-group-outline');
            if (!groupOutline) return { error: '找不到 .box-group-outline' };

            const style = window.getComputedStyle(groupOutline);
            const items = Array.from(groupOutline.querySelectorAll('.discrete-item'));
            const offsets = items.map(el => ({ top: el.offsetTop, left: el.offsetLeft }));

            return {
                itemCount: items.length,
                gridTemplateColumns: style.gridTemplateColumns,
                offsets: offsets
            };
        });

        console.log('3_2 排版資訊:', {
            itemCount: gridInfo3_2.itemCount,
            gridTemplateColumns: gridInfo3_2.gridTemplateColumns
        });

        if (gridInfo3_2.itemCount === 12) {
            const cols3 = gridInfo3_2.gridTemplateColumns.split(/\s+/).filter(Boolean);
            if (cols3.length !== 6) {
                throw new Error(`3_2 預期為 6 欄，實際為 ${cols3.length} 欄`);
            }
            console.log('✅ 第三關 3_2 驗證通過：12 個槽位 (含老鼠咬與空槽位) 完美排成 2 列，每列 6 個！');
        }

        // 3. 驗證手機螢幕響應式 (375px) 零溢出
        console.log('\n[TEST 3] 正在切換至手機視窗寬度 375px 進行 RWD 溢出檢測...');
        await page.setViewport({ width: 375, height: 667 });
        await wait(400);

        const overflowCheck = await page.evaluate(() => {
            const body = document.body;
            const interactiveBoard = document.querySelector('.interactive-board');
            const cookieBox = document.querySelector('.cookie-box-grid');
            return {
                bodyScrollWidth: body.scrollWidth,
                bodyClientWidth: body.clientWidth,
                hasBodyOverflow: body.scrollWidth > body.clientWidth,
                cookieBoxWidth: cookieBox ? cookieBox.offsetWidth : 0,
                boardWidth: interactiveBoard ? interactiveBoard.offsetWidth : 0
            };
        });

        console.log('手機版 RWD 檢測結果:', overflowCheck);
        if (overflowCheck.hasBodyOverflow) {
            throw new Error(`手機寬度 375px 下產生水平溢出：scrollWidth=${overflowCheck.bodyScrollWidth}, clientWidth=${overflowCheck.bodyClientWidth}`);
        }
        console.log('✅ 手機寬度 375px 零水平溢出，自適應完美！');

        console.log('\n🎉 所有離散量圖形每列 6 個排版測試全數通過！');
    } catch (err) {
        console.error('❌ 測試失敗:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
