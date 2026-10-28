const puppeteer = require('../2026_四年級上學期_數學：分數/node_modules/puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');

const VIEWPORTS = [
  { name: 'Desktop (1440x900)', width: 1440, height: 900 },
  { name: 'Tablet Landscape (1024x768)', width: 1024, height: 768 },
  { name: 'Tablet Portrait (768x1024)', width: 768, height: 1024 },
  { name: 'Mobile (414x896)', width: 414, height: 896 },
  { name: 'Small Mobile (375x667)', width: 375, height: 667 }
];

async function checkOverflow(page, contextName) {
  return await page.evaluate((ctx) => {
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    const bodyWidth = document.body.scrollWidth;
    const isOverflow = docWidth > winWidth + 2 || bodyWidth > winWidth + 2;
    
    let overflowingElements = [];
    if (isOverflow) {
      const all = document.querySelectorAll('*');
      for (const el of all) {
        if (el.offsetParent === null && el.tagName !== 'BODY' && el.tagName !== 'HTML') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.right > winWidth + 1) {
          overflowingElements.push({
            tag: el.tagName,
            id: el.id,
            className: typeof el.className === 'string' ? el.className : '',
            rect: { right: Math.round(rect.right), width: Math.round(rect.width) },
            text: el.innerText ? el.innerText.substring(0, 30).trim() : ''
          });
        }
      }
    }
    return {
      isOverflow,
      docWidth,
      winWidth,
      bodyWidth,
      overflowingElements: overflowingElements.slice(0, 10)
    };
  }, contextName);
}

(async () => {
  console.log('[RESPONSIVE TEST] Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  await page.goto(htmlPath, { waitUntil: 'load' });
  const wait = ms => new Promise(r => setTimeout(r, ms));

  let allResults = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n==================== Testing Viewport: ${vp.name} ====================`);
    await page.setViewport({ width: vp.width, height: vp.height });
    await wait(300);

    // 1. Lobby - Single Mode
    await page.evaluate(() => {
      window.app.showScreen('screen-lobby');
      window.app.switchMode('single');
    });
    await wait(200);
    let res = await checkOverflow(page, `${vp.name} - Lobby (Single)`);
    console.log(`Lobby (Single): ${res.isOverflow ? '❌ OVERFLOW (' + res.docWidth + 'px > ' + res.winWidth + 'px)' : '✅ OK'}`);
    if (res.isOverflow) {
      console.log('  Overflow elements:', JSON.stringify(res.overflowingElements));
      allResults.push({ vp: vp.name, screen: 'Lobby (Single)', details: res });
    }

    // 2. Lobby - Double Mode Setup
    await page.evaluate(() => {
      window.app.switchMode('double');
    });
    await wait(200);
    res = await checkOverflow(page, `${vp.name} - Lobby (Double Setup)`);
    console.log(`Lobby (Double Setup): ${res.isOverflow ? '❌ OVERFLOW (' + res.docWidth + 'px > ' + res.winWidth + 'px)' : '✅ OK'}`);
    if (res.isOverflow) {
      console.log('  Overflow elements:', JSON.stringify(res.overflowingElements));
      allResults.push({ vp: vp.name, screen: 'Lobby (Double Setup)', details: res });
    }

    // 3. Lobby - AI Mode Setup
    await page.evaluate(() => {
      window.app.switchMode('ai');
    });
    await wait(200);
    res = await checkOverflow(page, `${vp.name} - Lobby (AI Setup)`);
    console.log(`Lobby (AI Setup): ${res.isOverflow ? '❌ OVERFLOW (' + res.docWidth + 'px > ' + res.winWidth + 'px)' : '✅ OK'}`);
    if (res.isOverflow) {
      console.log('  Overflow elements:', JSON.stringify(res.overflowingElements));
      allResults.push({ vp: vp.name, screen: 'Lobby (AI Setup)', details: res });
    }

    // 4. Secret Guide Modal
    await page.evaluate(() => {
      window.app.toggleSecretGuide(true);
    });
    await wait(200);
    res = await checkOverflow(page, `${vp.name} - Secret Guide Modal`);
    console.log(`Secret Guide Modal: ${res.isOverflow ? '❌ OVERFLOW (' + res.docWidth + 'px > ' + res.winWidth + 'px)' : '✅ OK'}`);
    if (res.isOverflow) {
      console.log('  Overflow elements:', JSON.stringify(res.overflowingElements));
      allResults.push({ vp: vp.name, screen: 'Secret Guide Modal', details: res });
    }
    await page.evaluate(() => {
      window.app.toggleSecretGuide(false);
    });

    // 5. Single Play - Level 1 to 4
    for (let lvl = 1; lvl <= 4; lvl++) {
      await page.evaluate((l) => {
        window.app.startSingleGame(l);
      }, lvl);
      await wait(200);
      res = await checkOverflow(page, `${vp.name} - Single Play (Level ${lvl})`);
      console.log(`Single Play (Level ${lvl}): ${res.isOverflow ? '❌ OVERFLOW (' + res.docWidth + 'px > ' + res.winWidth + 'px)' : '✅ OK'}`);
      if (res.isOverflow) {
        console.log('  Overflow elements:', JSON.stringify(res.overflowingElements));
        allResults.push({ vp: vp.name, screen: `Single Play (Level ${lvl})`, details: res });
      }
    }

    // 6. Double Battle Play
    await page.evaluate(() => {
      window.app.startBattleGame();
    });
    await wait(200);
    res = await checkOverflow(page, `${vp.name} - Battle Play`);
    console.log(`Double Battle Play: ${res.isOverflow ? '❌ OVERFLOW (' + res.docWidth + 'px > ' + res.winWidth + 'px)' : '✅ OK'}`);
    if (res.isOverflow) {
      console.log('  Overflow elements:', JSON.stringify(res.overflowingElements));
      allResults.push({ vp: vp.name, screen: 'Battle Play', details: res });
    }
    await page.evaluate(() => {
      window.app.endBattle();
    });

    // 7. AI Challenge Play
    await page.evaluate(() => {
      window.app.startAiChallenge();
    });
    await wait(200);
    res = await checkOverflow(page, `${vp.name} - AI Play`);
    console.log(`AI Challenge Play: ${res.isOverflow ? '❌ OVERFLOW (' + res.docWidth + 'px > ' + res.winWidth + 'px)' : '✅ OK'}`);
    if (res.isOverflow) {
      console.log('  Overflow elements:', JSON.stringify(res.overflowingElements));
      allResults.push({ vp: vp.name, screen: 'AI Play', details: res });
    }
    await page.evaluate(() => {
      window.app.cleanupAiChallenge();
    });

    // 8. Result Screen
    await page.evaluate(() => {
      window.app.finishSingleLevel();
    });
    await wait(200);
    res = await checkOverflow(page, `${vp.name} - Result Screen`);
    console.log(`Result Screen: ${res.isOverflow ? '❌ OVERFLOW (' + res.docWidth + 'px > ' + res.winWidth + 'px)' : '✅ OK'}`);
    if (res.isOverflow) {
      console.log('  Overflow elements:', JSON.stringify(res.overflowingElements));
      allResults.push({ vp: vp.name, screen: 'Result Screen', details: res });
    }
  }

  console.log('\n==================== Console Errors ====================');
  console.log(`Total errors: ${consoleErrors.length}`);
  consoleErrors.forEach(err => console.log('ERROR:', err));

  console.log('\n==================== OVERFLOW SUMMARY ====================');
  console.log(`Total overflow occurrences: ${allResults.length}`);

  await browser.close();
})();
