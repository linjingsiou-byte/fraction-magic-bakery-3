const fs = require('fs');
const path = require('path');

// Read questions.js
const filePath = path.resolve(__dirname, 'questions.js');
let code = fs.readFileSync(filePath, 'utf8');

// Mock browser global window/gameQuestions object so we can evaluate questions.js
eval(code + '\nmodule.exports = gameQuestions;');
const gameQuestions = module.exports;

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, message) {
    if (condition) {
        passed++;
    } else {
        failed++;
        errors.push(message);
    }
}

// Regex helpers to extract fractions (e.g. 6/6, 3/8, 12/12)
function extractFractions(text) {
    const regex = /(\d+|\?)\/(\d+)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        matches.push({
            str: match[0],
            num: match[1] === '?' ? '?' : parseInt(match[1]),
            den: parseInt(match[2])
        });
    }
    return matches;
}

console.log("[VERIFICATION] Scanning 60 questions across 4 levels...");

for (let lvl = 1; lvl <= 4; lvl++) {
    const list = gameQuestions[lvl];
    assert(list && list.length === 15, `Level ${lvl} should have exactly 15 questions, found ${list ? list.length : 0}`);
    
    list.forEach((q, idx) => {
        const qId = q.id;
        const textFracs = extractFractions(q.text);
        
        // ------------------ LEVEL 1 ------------------
        if (lvl === 1) {
            if (q.type === 'choice') {
                if (q.visual.interactiveType === 'pie') {
                    // e.g. "6/6個蛋糕... 1個蛋糕..." -> totalSlices: 6, targetSlices: 6
                    assert(textFracs.length >= 1, `[${qId}] Missing fraction in text: "${q.text}"`);
                    if (textFracs.length >= 1) {
                        assert(textFracs.some(tf => tf.num === q.visual.targetSlices && tf.den === q.visual.totalSlices), `[${qId}] Numerator/Denominator mismatch: visual is ${q.visual.targetSlices}/${q.visual.totalSlices}`);
                    }
                } else if (q.visual.interactiveType === 'ribbon-compare') {
                    // e.g. "12/12公尺... 3/3公尺" -> r1: 12/12, r2: 3/3
                    assert(textFracs.length >= 2, `[${qId}] Expected 2 fractions in compare ribbon: "${q.text}"`);
                    if (textFracs.length >= 2) {
                        assert(textFracs.some(tf => tf.num === q.visual.r1.num && tf.den === q.visual.r1.den), `[${qId}] r1 mismatch`);
                        assert(textFracs.some(tf => tf.num === q.visual.r2.num && tf.den === q.visual.r2.den), `[${qId}] r2 mismatch`);
                    }
                }
                assert(q.answer === '一樣多' || q.answer === '一樣長', `[${qId}] Answer should be '一樣多' or '一樣長', got: ${q.answer}`);
            } else if (q.type === 'fraction-input') {
                // e.g. "?/10盒" or "1/4塊" -> totalItems: 10, targetItems: 10, answer: 10/10
                assert(textFracs.length >= 1, `[${qId}] Expected at least 1 fraction in text: "${q.text}"`);
                if (q.visual.interactiveType === 'discrete') {
                    assert(q.answer.num === q.visual.targetItems, `[${qId}] Answer num mismatch`);
                    assert(q.answer.den === q.visual.totalItems, `[${qId}] Answer den mismatch`);
                } else {
                    assert(q.answer.num === q.visual.targetSlices, `[${qId}] Answer num mismatch`);
                    assert(q.answer.den === q.visual.totalSlices, `[${qId}] Answer den mismatch`);
                }
            }
        }
        
        // ------------------ LEVEL 2 ------------------
        else if (lvl === 2) {
            // Addition: A/C + B/C = ?/? -> num1+num2 = numAns, den1=den2=denAns
            assert(q.type === 'equation' || q.type === 'equation-whole', `[${qId}] Invalid type for L2: ${q.type}`);
            
            const ans = q.answer;
            const vis = q.visual;
            
            // Check mathematical correct answers
            assert(ans.den1 === ans.den2 && ans.den2 === ans.denAns, `[${qId}] Denominators are not equal: ${ans.den1}, ${ans.den2}, ${ans.denAns}`);
            assert(ans.num1 + ans.num2 === ans.numAns, `[${qId}] Addition math error: ${ans.num1} + ${ans.num2} !== ${ans.numAns}`);
            
            // Check visual alignment
            if (vis.interactiveType === 'pie-add' || vis.interactiveType === 'bread-add' || vis.interactiveType === 'ribbon-add') {
                assert(vis.totalSlices === ans.den1, `[${qId}] visual totalSlices ${vis.totalSlices} !== answer den1 ${ans.den1}`);
                assert(vis.initialSlices === ans.num1, `[${qId}] visual initialSlices ${vis.initialSlices} !== answer num1 ${ans.num1}`);
                assert(vis.addSlices === ans.num2, `[${qId}] visual addSlices ${vis.addSlices} !== answer num2 ${ans.num2}`);
            } else if (vis.interactiveType === 'discrete-add') {
                assert(vis.totalItems === ans.den1, `[${qId}] visual totalItems ${vis.totalItems} !== answer den1 ${ans.den1}`);
                assert(vis.initialItems === ans.num1, `[${qId}] visual initialItems ${vis.initialItems} !== answer num1 ${ans.num1}`);
                assert(vis.addItems === ans.num2, `[${qId}] visual addItems ${vis.addItems} !== answer num2 ${ans.num2}`);
            }
            
            // Check whole number answers
            if (q.type === 'equation-whole') {
                assert(ans.numAns === ans.denAns, `[${qId}] Whole equation result must be 1 (numerator === denominator)`);
                assert(ans.wholeAns === 1, `[${qId}] wholeAns must be 1, got ${ans.wholeAns}`);
            }
            
            // Check that the numbers parsed in text match (commutative set check)
            assert(textFracs.length >= 2, `[${qId}] Expected at least 2 fractions in text, found ${textFracs.length}`);
            if (textFracs.length >= 2) {
                const hasFirst = textFracs.some(tf => tf.num === ans.num1 && tf.den === ans.den1);
                const hasSecond = textFracs.some(tf => tf.num === ans.num2 && tf.den === ans.den2);
                assert(hasFirst && hasSecond, `[${qId}] Text fractions mismatch with answer fractions`);
            }
        }
        
        // ------------------ LEVEL 3 ------------------
        else if (lvl === 3) {
            // Subtraction: A/C - B/C = ?/? -> num1-num2 = numAns, den1=den2=denAns
            assert(q.type === 'equation' || q.type === 'equation-convert', `[${qId}] Invalid type for L3: ${q.type}`);
            
            const ans = q.answer;
            const vis = q.visual;
            
            // Check mathematical correctness
            assert(ans.den1 === ans.den2 && ans.den2 === ans.denAns, `[${qId}] Denominators are not equal: ${ans.den1}, ${ans.den2}, ${ans.denAns}`);
            assert(ans.num1 - ans.num2 === ans.numAns, `[${qId}] Subtraction math error: ${ans.num1} - ${ans.num2} !== ${ans.numAns}`);
            
            // Check visual alignment
            if (vis.interactiveType === 'pie-sub' || vis.interactiveType === 'bread-sub' || vis.interactiveType === 'ribbon-sub') {
                assert(vis.totalSlices === ans.den1, `[${qId}] visual totalSlices ${vis.totalSlices} !== answer den1 ${ans.den1}`);
                assert(vis.initialSlices === ans.num1, `[${qId}] visual initialSlices ${vis.initialSlices} !== answer num1 ${ans.num1}`);
                assert(vis.subSlices === ans.num2, `[${qId}] visual subSlices ${vis.subSlices} !== answer num2 ${ans.num2}`);
            } else if (vis.interactiveType === 'discrete-sub') {
                assert(vis.totalItems === ans.den1, `[${qId}] visual totalItems ${vis.totalItems} !== answer den1 ${ans.den1}`);
                assert(vis.initialItems === ans.num1, `[${qId}] visual initialItems ${vis.initialItems} !== answer num1 ${ans.num1}`);
                assert(vis.subItems === ans.num2, `[${qId}] visual subItems ${vis.subItems} !== answer num2 ${ans.num2}`);
            }
            
            // Check text fractions
            if (q.type === 'equation') {
                assert(textFracs.length >= 2, `[${qId}] Expected at least 2 fractions in text, found ${textFracs.length}`);
                if (textFracs.length >= 2) {
                    const hasFirst = textFracs.some(tf => tf.num === ans.num1 && tf.den === ans.den1);
                    const hasSecond = textFracs.some(tf => tf.num === ans.num2 && tf.den === ans.den2);
                    assert(hasFirst && hasSecond, `[${qId}] Text fractions mismatch with answer fractions`);
                }
            } else if (q.type === 'equation-convert') {
                // e.g. text: "7/12盒... 妹妹比弟弟少 2 枝 (1盒12枝)" -> initialEq: "7/12 - ?/12 = ?/?"
                // check text fraction A/C matches num1/den1
                assert(textFracs.length >= 1, `[${qId}] Expected at least 1 fraction in text, found ${textFracs.length}`);
                if (textFracs.length >= 1) {
                    assert(textFracs.some(tf => tf.num === ans.num1 && tf.den === ans.den1), `[${qId}] Text fraction 1 mismatch`);
                }
                // Check that the quantity of items to subtract matches visual subItems
                const numTextMatches = q.text.match(/少 (\d+) 枝|吃掉 (\d+) 個|用掉了 (\d+) 個/);
                if (numTextMatches) {
                    const count = parseInt(numTextMatches[1] || numTextMatches[2] || numTextMatches[3]);
                    assert(count === ans.num2, `[${qId}] Subtracted items in text (${count}) !== answer num2 (${ans.num2})`);
                }
            }
        }
        
        // ------------------ LEVEL 4 ------------------
        else if (lvl === 4) {
            // Subtraction from 1 or addition to 1
            assert(q.type === 'equation-whole-sub' || q.type === 'equation-add-to-whole', `[${qId}] Invalid type for L4: ${q.type}`);
            
            const ans = q.answer;
            const vis = q.visual;
            
            if (q.type === 'equation-whole-sub') {
                // 1 - B/C = C/C - B/C = Ans/C
                assert(ans.whole1 === 1, `[${qId}] whole1 must be 1`);
                assert(ans.num1 === ans.den1 && ans.den1 === ans.den2 && ans.den2 === ans.denAns, `[${qId}] Denominator mismatch or num1 !== den1`);
                assert(ans.num1 - ans.num2 === ans.numAns, `[${qId}] Subtraction math error: ${ans.num1} - ${ans.num2} !== ${ans.numAns}`);
                
                // Visual alignment
                if (vis.interactiveType === 'ribbon-cut' || vis.interactiveType === 'bread-cut') {
                    assert(vis.totalSlices === ans.den1, `[${qId}] visual totalSlices ${vis.totalSlices} !== answer den1 ${ans.den1}`);
                    assert(vis.initialSlices === ans.num1, `[${qId}] visual initialSlices ${vis.initialSlices} !== answer num1 ${ans.num1}`);
                    assert(vis.subSlices === ans.num2, `[${qId}] visual subSlices ${vis.subSlices} !== answer num2 ${ans.num2}`);
                } else if (vis.interactiveType === 'discrete-cut') {
                    assert(vis.totalItems === ans.den1, `[${qId}] visual totalItems ${vis.totalItems} !== answer den1 ${ans.den1}`);
                    assert(vis.initialItems === ans.num1, `[${qId}] visual initialItems ${vis.initialItems} !== answer num1 ${ans.num1}`);
                    assert(vis.subItems === ans.num2, `[${qId}] visual subItems ${vis.subItems} !== answer num2 ${ans.num2}`);
                }
                
                // Text fractions
                // Check if text says B/C or X items
                const hasFraction = textFracs.length >= 1 && textFracs[0].num !== '?';
                if (hasFraction) {
                    assert(textFracs[0].num === ans.num2 && textFracs[0].den === ans.den2, `[${qId}] Text fraction mismatch: ${textFracs[0].num}/${textFracs[0].den} !== ${ans.num2}/${ans.den2}`);
                } else {
                    // check items
                    const itemsMatch = q.text.match(/吃掉 (\d+) 顆/);
                    if (itemsMatch) {
                        const count = parseInt(itemsMatch[1]);
                        assert(count === ans.num2, `[${qId}] Subtracted items in text (${count}) !== answer num2 (${ans.num2})`);
                    }
                }
            } else if (q.type === 'equation-add-to-whole') {
                // A/C + B/C = C/C = 1
                assert(ans.den1 === ans.den2 && ans.den2 === ans.denAns, `[${qId}] Denominators mismatch`);
                assert(ans.num1 + ans.num2 === ans.numAns, `[${qId}] Addition math error`);
                assert(ans.numAns === ans.denAns, `[${qId}] Sum must be equal to denominator`);
                assert(ans.wholeAns === 1, `[${qId}] wholeAns must be 1`);
                
                // Visual alignment
                assert(vis.totalSlices === ans.den1, `[${qId}] visual totalSlices mismatch`);
                assert(vis.initialSlices === ans.num1, `[${qId}] visual initialSlices mismatch`);
                assert(vis.addSlices === ans.num2, `[${qId}] visual addSlices mismatch`);
                
                // Text fractions
                assert(textFracs.length >= 2, `[${qId}] Expected at least 2 fractions in text, found ${textFracs.length}`);
                if (textFracs.length >= 2) {
                    assert(textFracs[0].num === ans.num1 && textFracs[0].den === ans.den1, `[${qId}] Text fraction 1 mismatch`);
                    assert(textFracs[1].num === ans.num2 && textFracs[1].den === ans.den2, `[${qId}] Text fraction 2 mismatch`);
                }
            }
        }
    });
}

console.log("\n==================== DATABASE CHECK RESULT ====================");
console.log(`Passed checks: ${passed}`);
console.log(`Failed checks: ${failed}`);

if (failed > 0) {
    console.error("❌ QUESTION DATABASE INTEGRITY FAILED!");
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
} else {
    console.log("✅ QUESTION DATABASE INTEGRITY PASSED! All questions' fractions and visual diagrams are perfectly aligned and correct.");
    process.exit(0);
}
