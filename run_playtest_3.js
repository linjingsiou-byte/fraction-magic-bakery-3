const puppeteer = require('../2026_四年級上學期_數學：分數/node_modules/puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');

(async () => {
  console.log(`[PLAYTEST] Launching Chrome from: ${chromePath}`);
  console.log(`[PLAYTEST] Loading HTML from: ${htmlPath}`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();

    // Stream browser console logs to Node console
    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.text()}`);
    });

    // Navigate to page
    await page.goto(htmlPath, { waitUntil: 'load' });
    console.log("[PLAYTEST] Page loaded successfully.");

    // Helper: Wait for milliseconds
    const wait = ms => new Promise(r => setTimeout(r, ms));

    // 1. Verify Lobby DOM
    console.log("[PLAYTEST] Verifying welcome screen DOM...");
    const hasLobbyBtn = await page.evaluate(() => {
      return !!document.getElementById('btn-lobby-secret-guide');
    });
    if (!hasLobbyBtn) throw new Error("Missing Lobby Secret Guide button!");
    console.log("✔ Welcome screen verified successfully.");

    // 2. Test Secret Guide Modal opening and closing
    console.log("[PLAYTEST] Testing 'Magic Baking Guide' opening from Lobby...");
    await page.click('#btn-lobby-secret-guide');
    await wait(500);
    let modalActive = await page.evaluate(() => {
      return document.getElementById('modal-secret-guide').classList.contains('active');
    });
    if (!modalActive) throw new Error("Modal failed to open from Lobby button!");
    console.log("✔ Modal opened successfully.");

    console.log("[PLAYTEST] Testing Modal closing via Close (✕) button...");
    await page.click('#btn-close-guide');
    await wait(300);
    modalActive = await page.evaluate(() => {
      return document.getElementById('modal-secret-guide').classList.contains('active');
    });
    if (modalActive) throw new Error("Modal failed to close via Close button!");
    console.log("✔ Modal closed successfully.");

    console.log("[PLAYTEST] Testing Modal opening from Footer link...");
    await page.click('#btn-footer-secret-guide');
    await wait(500);
    modalActive = await page.evaluate(() => {
      return document.getElementById('modal-secret-guide').classList.contains('active');
    });
    if (!modalActive) throw new Error("Modal failed to open from Footer link!");
    console.log("✔ Modal opened successfully from Footer.");

    console.log("[PLAYTEST] Testing Modal closing via bottom 'I understand' button...");
    await page.click('#btn-close-guide-bottom');
    await wait(300);
    modalActive = await page.evaluate(() => {
      return document.getElementById('modal-secret-guide').classList.contains('active');
    });
    if (modalActive) throw new Error("Modal failed to close via bottom button!");
    console.log("✔ Modal closed successfully.");

    // 3. Play through all 4 levels
    for (let level = 1; level <= 4; level++) {
      console.log(`\n==================== SIMULATING LEVEL ${level} ====================`);
      
      // Select level node
      await page.evaluate((lvl) => {
        const node = document.querySelector(`.level-node[data-level="${lvl}"]`);
        node.click();
      }, level);
      await wait(500);

      // Start game
      await page.click('#btn-start-single');
      await wait(500);

      // Loop through 5 questions
      for (let qIdx = 0; qIdx < 5; qIdx++) {
        console.log(`[PLAYTEST] [Level ${level} - Question ${qIdx + 1}] Processing...`);
        
        // Solve question
        await page.evaluate(() => {
          const app = window.app;
          const q = app.singleQuestions[app.singleCurrentQuestionIdx];
          
          if (q.type === 'choice') {
            // Find choice button with text matching q.answer
            const buttons = Array.from(document.querySelectorAll('#single-equation-display .opt-btn'));
            const targetBtn = buttons.find(b => b.innerText.trim() === q.answer);
            if (targetBtn) {
              targetBtn.click();
            } else {
              console.error(`Target choice button not found for answer: ${q.answer}`);
            }
          } 
          else {
            // Fill inputs based on question type
            const setVal = (target, val) => {
              const el = document.querySelector(`[data-target="${target}"]`);
              if (el) el.innerText = val;
            };

            const setWhole = (id, val) => {
              const el = document.getElementById(id);
              if (el) el.innerText = val;
            };

            if (q.type === 'fraction-input') {
              setVal('single-f1-num', q.answer.num);
              setVal('single-f1-den', q.answer.den);
            } else if (q.type === 'equation') {
              setVal('single-fans-num', q.answer.numAns);
              setVal('single-fans-den', q.answer.denAns);
            } else if (q.type === 'equation-whole') {
              setVal('single-fans-num', q.answer.numAns);
              setVal('single-fans-den', q.answer.denAns);
              setWhole('single-wholeans', q.answer.wholeAns);
            } else if (q.type === 'equation-convert') {
              setVal('single-f2-num', q.answer.num2);
              setVal('single-fans-num', q.answer.numAns);
              setVal('single-fans-den', q.answer.denAns);
            } else if (q.type === 'equation-whole-sub') {
              setVal('single-f1-num', q.answer.num1);
              setVal('single-f1-den', q.answer.den1);
              setVal('single-fans-num', q.answer.numAns);
              setVal('single-fans-den', q.answer.denAns);
            } else if (q.type === 'equation-add-to-whole') {
              setVal('single-fans-num', q.answer.numAns);
              setVal('single-fans-den', q.answer.denAns);
              setWhole('single-wholeans', q.answer.wholeAns);
            }
          }
        });
        await wait(500);

        // Click Submit
        await page.click('#btn-single-submit');
        await wait(600);

        // Assert that submit button is hidden and next button is visible
        const nextVisible = await page.evaluate(() => {
          const submitHidden = document.getElementById('btn-single-submit').classList.contains('hidden');
          const nextBtnVisible = !document.getElementById('btn-single-next').classList.contains('hidden');
          return submitHidden && nextBtnVisible;
        });

        if (!nextVisible) {
          throw new Error(`Submit button did not work on Level ${level} Question ${qIdx + 1}! Check inputs or click bindings.`);
        }
        console.log(`✔ Question ${qIdx + 1} answered correctly.`);

        // Click Next
        await page.click('#btn-single-next');
        await wait(500);
      }

      // Assert Result Screen
      const onResultScreen = await page.evaluate(() => {
        return document.getElementById('screen-result').classList.contains('active');
      });
      if (!onResultScreen) throw new Error(`Failed to reach result screen at the end of Level ${level}!`);
      console.log(`✔ Level ${level} completed and result screen verified.`);

      // Click OK to go back to lobby
      await page.click('#btn-result-ok');
      await wait(500);
    }

    console.log("\n==================== TEST RESULT ====================");
    console.log("✅ E2E PLAYTEST PASSED! All 4 levels are fully functional and submit buttons are working.");
    process.exit(0);

  } catch (err) {
    console.error("\n❌ E2E PLAYTEST FAILED!", err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
