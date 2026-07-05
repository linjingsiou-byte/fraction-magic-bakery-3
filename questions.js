/* ==========================================
   分數魔法烘焙屋 3.0 題庫模組 (questions.js)
   包含四個關卡，每個關卡擴充至 15 題 (共 60 題)
   完全避開國字分數敘述，改為直式分數/數值分數與輸入格提示
   ========================================== */

const gameQuestions = {
    // 第一關：魔法麵包拼拼樂 (和 1 一樣大的分數) - 共 15 題
    1: [
        {
            id: "1_1",
            text: "要把一個大蛋糕平分成 6 份。 6/6 個蛋糕和 1 個蛋糕，哪一個比較多呢？",
            type: "choice",
            options: ["6/6個蛋糕比較多", "1個蛋糕比較多", "一樣多"],
            answer: "一樣多",
            visual: { totalSlices: 6, targetSlices: 6, interactiveType: "pie" },
            feedback: {
                wrongChoices: {
                    "6/6個蛋糕比較多": "哎呀！6/6個就是把蛋糕分成6份，拿了全部的6份，所以剛好就是1個完整的蛋糕，它們是一樣多的呢。",
                    "1個蛋糕比較多": "不對喔！6/6個就是把蛋糕分成6份，拿了全部的6份，剛好拼回1個完整的蛋糕，它們是一樣多的呢。"
                }
            }
        },
        {
            id: "1_2",
            text: "一盒雞蛋有 10 個。 ?/10 盒會等於 1 盒呢？",
            type: "fraction-input",
            answer: { num: 10, den: 10 },
            visual: { totalItems: 10, targetItems: 10, interactiveType: "discrete" },
            feedback: {
                wrongNum: "分子的數量不對喔！要拿滿整盒，分子必須和分母10一樣大呢。",
                wrongDen: "分母不對喔！一盒平分成10個，所以分母必須是10呢。",
                misconception: "記得！當分子和分母一樣大時，分數就等於整數1呢。"
            }
        },
        {
            id: "1_3",
            text: "紅色彩帶長 12/12 公尺，綠色彩帶長 3/3 公尺。這兩條彩帶有一樣長嗎？",
            type: "choice",
            options: ["紅色彩帶比較長", "綠色彩帶比較長", "一樣長"],
            answer: "一樣長",
            visual: {
                interactiveType: "ribbon-compare",
                r1: { num: 12, den: 12 },
                r2: { num: 3, den: 3 }
            },
            feedback: {
                wrongChoices: {
                    "紅色彩帶比較長": "不對喔！雖然12比3大，但12/12公尺就是1公尺，3/3公尺也是1公尺，所以它們是一樣長呢。",
                    "綠色彩帶比較長": "不對喔！12/12公尺是1公尺，3/3公尺也是1公尺，所以它們是一樣長呢。"
                }
            }
        },
        {
            id: "1_4",
            text: "盤子裡有 4 個 1/4 塊披薩，合起來是 ?/? 個披薩呢？",
            type: "fraction-input",
            answer: { num: 4, den: 4 },
            visual: { totalSlices: 4, targetSlices: 4, interactiveType: "pie" },
            feedback: {
                wrongNum: "不對喔！有4個1/4塊，合起來分子應該是4呢。",
                wrongDen: "不對喔！每個切片都是1/4個，表示披薩分成4份，分母必須是4呢。"
            }
        },
        {
            id: "1_5",
            text: "要把一條大吐司平分成 5 份。 5/5 條吐司和 1 條吐司，哪一條比較長呢？",
            type: "choice",
            options: ["5/5條吐司比較長", "1條吐司比較長", "一樣長"],
            answer: "一樣長",
            visual: { totalSlices: 5, targetSlices: 5, interactiveType: "pie" },
            feedback: {
                wrongChoices: {
                    "5/5條吐司比較長": "不對喔！5/5就是拿了全部5份，剛好就是1條完整的吐司，所以一樣長呢。",
                    "1條吐司比較長": "不對喔！5/5條和1條是一樣長的呢。"
                }
            }
        },
        {
            id: "1_6",
            text: "一盒果凍有 8 個。 ?/8 盒會等於 1 盒呢？",
            type: "fraction-input",
            answer: { num: 8, den: 8 },
            visual: { totalItems: 8, targetItems: 8, interactiveType: "discrete" },
            feedback: {
                wrongNum: "分子的數量不對喔！要拿滿整盒，分子必須是8呢。",
                wrongDen: "分母不對喔！一盒平分成8個，所以分母必須是8呢。"
            }
        },
        {
            id: "1_7",
            text: "藍色彩帶長 6/6 公尺，黃色彩帶長 9/9 公尺。這兩條彩帶有一樣長嗎？",
            type: "choice",
            options: ["藍色彩帶比較長", "黃色彩帶比較長", "一樣長"],
            answer: "一樣長",
            visual: {
                interactiveType: "ribbon-compare",
                r1: { num: 6, den: 6 },
                r2: { num: 9, den: 9 }
            },
            feedback: {
                wrongChoices: {
                    "藍色彩帶比較長": "不對喔！6/6公尺是1公尺，9/9公尺也是1公尺，所以它們是一樣長呢。",
                    "黃色彩帶比較長": "不對喔！兩條彩帶都是1公尺長，所以是一樣長呢。"
                }
            }
        },
        {
            id: "1_8",
            text: "桌上有 10 個 1/10 塊小鬆餅，合起來是 ?/? 個小鬆餅呢？",
            type: "fraction-input",
            answer: { num: 10, den: 10 },
            visual: { totalSlices: 10, targetSlices: 10, interactiveType: "pie" },
            feedback: {
                wrongNum: "不對喔！10個1/10塊，合起來分子是10呢。",
                wrongDen: "不對喔！每個鬆餅是1/10個，表示分母是10呢。"
            }
        },
        {
            id: "1_9",
            text: "要把一個披薩平分成 8 份。 8/8 個披薩和 1 個披薩，哪一個比較多呢？",
            type: "choice",
            options: ["8/8個披薩比較多", "1個披薩比較多", "一樣多"],
            answer: "一樣多",
            visual: { totalSlices: 8, targetSlices: 8, interactiveType: "pie" },
            feedback: {
                wrongChoices: {
                    "8/8個披薩比較多": "不對喔！8/8個披薩代表切成8等分後全部拿完，剛好就是1個完整的披薩呢。",
                    "1個披薩比較多": "不對喔！8/8和1是一樣多的呢。"
                }
            }
        },
        {
            id: "1_10",
            text: "一盒雞蛋有 12 個。 ?/12 盒會等於 1 盒呢？",
            type: "fraction-input",
            answer: { num: 12, den: 12 },
            visual: { totalItems: 12, targetItems: 12, interactiveType: "discrete" },
            feedback: {
                wrongNum: "分子要填入12，拿滿全部12個雞蛋才是一整盒呢。",
                wrongDen: "一盒有12個，所以分母是12呢。"
            }
        },
        {
            id: "1_11",
            text: "藍色彩帶長 5/5 公尺，紅色彩帶長 7/7 公尺。這兩條彩帶有一樣長嗎？",
            type: "choice",
            options: ["藍色彩帶比較長", "紅色彩帶比較長", "一樣長"],
            answer: "一樣長",
            visual: {
                interactiveType: "ribbon-compare",
                r1: { num: 5, den: 5 },
                r2: { num: 7, den: 7 }
            },
            feedback: {
                wrongChoices: {
                    "藍色彩帶比較長": "不對喔！因為5/5是1公尺，7/7也是1公尺，它們是一樣長的呢。",
                    "紅色彩帶比較長": "不對喔！兩條都是1公尺長，所以是一樣長的呢。"
                }
            }
        },
        {
            id: "1_12",
            text: "盤子裡有 6 個 1/6 塊披薩，合起來是 ?/? 個披薩呢？",
            type: "fraction-input",
            answer: { num: 6, den: 6 },
            visual: { totalSlices: 6, targetSlices: 6, interactiveType: "pie" },
            feedback: {
                wrongNum: "有6個1/6塊，分子是6呢。",
                wrongDen: "每一片都是1/6，所以分母是6呢。"
            }
        },
        {
            id: "1_13",
            text: "一盒巧克力有 10 顆。 ?/10 盒會等於 1 盒呢？",
            type: "fraction-input",
            answer: { num: 10, den: 10 },
            visual: { totalItems: 10, targetItems: 10, interactiveType: "discrete" },
            feedback: {
                wrongNum: "要拿滿全部10顆巧克力，分子要填入10呢。",
                wrongDen: "平分成10顆，分母應該是10呢。"
            }
        },
        {
            id: "1_14",
            text: "綠色彩帶長 4/4 公尺，黃色彩帶長 2/2 公尺。這兩條彩帶有一樣長嗎？",
            type: "choice",
            options: ["綠色彩帶比較長", "黃色彩帶比較長", "一樣長"],
            answer: "一樣長",
            visual: {
                interactiveType: "ribbon-compare",
                r1: { num: 4, den: 4 },
                r2: { num: 2, den: 2 }
            },
            feedback: {
                wrongChoices: {
                    "綠色彩帶比較長": "不對喔！4/4和2/2都等於1公尺，所以一樣長呢。",
                    "黃色彩帶比較長": "不對喔！兩條彩帶長度都是1公尺呢。"
                }
            }
        },
        {
            id: "1_15",
            text: "桌上有 9 個 1/9 塊餅乾，合起來是 ?/? 個餅乾呢？",
            type: "fraction-input",
            answer: { num: 9, den: 9 },
            visual: { totalSlices: 9, targetSlices: 9, interactiveType: "pie" },
            feedback: {
                wrongNum: "有9片餅乾，分子應該是9呢。",
                wrongDen: "每片是1/9個，分母是9呢。"
            }
        }
    ],

    // 第二關：魔法吐司大烤爐 (同分母分數的加法) - 共 15 題
    2: [
        {
            id: "2_1",
            text: "媽媽買了一個蛋糕，平分成 8 份。哥哥吃了 3/8 個，妹妹吃了 2/8 個，兩個人共吃了幾個蛋糕呢？",
            type: "equation",
            initialEq: "3/8 + 2/8 = ?/?",
            answer: { num1: 3, den1: 8, num2: 2, den2: 8, numAns: 5, denAns: 8 },
            visual: { totalSlices: 8, initialSlices: 3, addSlices: 2, interactiveType: "pie-add" },
            feedback: {
                denAddError: "哎呀！相加的時候分母不能相加喔！分母代表切片的大小，如果變成16，切片就變小了呢。分母要保持不變是8喔！",
                numError: "分子算錯了喔！3個1/8加上2個1/8，合起來應該是5個1/8，所以分子是5呢。"
            }
        },
        {
            id: "2_2",
            text: "冰箱裡原來有一些牛奶。姐姐和弟弟早餐共喝掉 4/9 公升，還剩下 3/9 公升。冰箱裡原來有幾公升牛奶呢？",
            type: "equation",
            initialEq: "4/9 + 3/9 = ?/?",
            answer: { num1: 4, den1: 9, num2: 3, den2: 9, numAns: 7, denAns: 9 },
            visual: { totalSlices: 9, initialSlices: 4, addSlices: 3, interactiveType: "bread-add" },
            feedback: {
                denAddError: "要注意！分母代表杯子的等份大小，相加時分母9是不變的呢。",
                numError: "把喝掉的 4/9 公升和剩下的 3/9 公升加起來，4加3應該是7，分子是7喔！"
            }
        },
        {
            id: "2_3",
            text: "子晴用兩條彩帶做一朵花。紅彩帶用了 5/12 公尺，綠彩帶用了 7/12 公尺。子晴共用了幾公尺的彩帶呢？",
            type: "equation-whole",
            initialEq: "5/12 + 7/12 = ?/? = ?",
            answer: { num1: 5, den1: 12, num2: 7, den2: 12, numAns: 12, denAns: 12, wholeAns: 1 },
            visual: { totalSlices: 12, initialSlices: 5, addSlices: 7, interactiveType: "ribbon-add" },
            feedback: {
                denAddError: "不對喔！分母代表彩帶的一公尺平分份數，加法時分母12保持不變呢。",
                numError: "分子是 5 加上 7，合起來是12。 12/12 公尺也就是 1 公尺呢。"
            }
        },
        {
            id: "2_4",
            text: "小烘焙師做甜點，用了 3/10 盒草莓餅乾和 6/10 盒巧克力餅乾。共用了幾盒餅乾呢？",
            type: "equation",
            initialEq: "3/10 + 6/10 = ?/?",
            answer: { num1: 3, den1: 10, num2: 6, den2: 10, numAns: 9, denAns: 10 },
            visual: { totalItems: 10, initialItems: 3, addItems: 6, interactiveType: "discrete-add" },
            feedback: {
                denAddError: "別忘記了，分母10代表一盒有10個，相加時分母是不會相加的呢。",
                numError: "3個十分之一盒加上6個十分之一盒，共是9個十分之一盒，分子是9喔！"
            }
        },
        {
            id: "2_5",
            text: "阿明吃了 2/6 盒鳳梨酥，小麗吃了 3/6 盒鳳梨酥，兩個人共吃了幾盒鳳梨酥呢？",
            type: "equation",
            initialEq: "2/6 + 3/6 = ?/?",
            answer: { num1: 2, den1: 6, num2: 3, den2: 6, numAns: 5, denAns: 6 },
            visual: { totalSlices: 6, initialSlices: 2, addSlices: 3, interactiveType: "pie-add" },
            feedback: {
                denAddError: "別忘了，分母代表一盒平分成6份，相加時分母6不變喔！",
                numError: "分子是 2 加上 3，等於 5 喔！"
            }
        },
        {
            id: "2_6",
            text: "一盒甜甜圈有 10 個。小華買了 4/10 盒，小英買了 5/10 盒，兩人共買了幾盒甜甜圈呢？",
            type: "equation",
            initialEq: "4/10 + 5/10 = ?/?",
            answer: { num1: 4, den1: 10, num2: 5, den2: 10, numAns: 9, denAns: 10 },
            visual: { totalItems: 10, initialItems: 4, addItems: 5, interactiveType: "discrete-add" },
            feedback: {
                denAddError: "分母10代表甜甜圈一盒有10個，加法時分母是不變的呢。",
                numError: "4個1/10加上5個1/10，分子應該是 9 喔！"
            }
        },
        {
            id: "2_7",
            text: "花瓶裡原來有 2/5 公升的水，爸爸又加進去 3/5 公升，現在花瓶裡有幾公升的水呢？",
            type: "equation-whole",
            initialEq: "2/5 + 3/5 = ?/? = ?",
            answer: { num1: 2, den1: 5, num2: 3, den2: 5, numAns: 5, denAns: 5, wholeAns: 1 },
            visual: { totalSlices: 5, initialSlices: 2, addSlices: 3, interactiveType: "bread-add" },
            feedback: {
                denAddError: "分母5代表公升的平分份數，加法時分母是不變的呢。",
                numError: "分子相加為 5，而 5/5 公升就剛好是 1 公升呢。"
            }
        },
        {
            id: "2_8",
            text: "小學徒包裝禮物用了紅彩帶 2/8 公尺，藍彩帶 5/8 公尺，共用了幾公尺的彩帶呢？",
            type: "equation",
            initialEq: "2/8 + 5/8 = ?/?",
            answer: { num1: 2, den1: 8, num2: 5, den2: 8, numAns: 7, denAns: 8 },
            visual: { totalSlices: 8, initialSlices: 2, addSlices: 5, interactiveType: "ribbon-add" },
            feedback: {
                denAddError: "相加時，分母8代表切片大小，是維持不變的喔！",
                numError: "2加5等於7，分子是7喔！"
            }
        },
        {
            id: "2_9",
            text: "媽媽做甜點用了 1/4 盒草莓和 2/4 盒芒果。媽媽共用了幾盒水果呢？",
            type: "equation",
            initialEq: "1/4 + 2/4 = ?/?",
            answer: { num1: 1, den1: 4, num2: 2, den2: 4, numAns: 3, denAns: 4 },
            visual: { totalSlices: 4, initialSlices: 1, addSlices: 2, interactiveType: "pie-add" },
            feedback: {
                denAddError: "分母4代表一盒分成4份，加法時分母不變喔！",
                numError: "1份加上2份是3份，分子是3喔！"
            }
        },
        {
            id: "2_10",
            text: "小烘焙師今天烤了 3/12 盒綠豆椪和 8/12 盒蛋黃酥。共烤了幾盒糕點呢？",
            type: "equation",
            initialEq: "3/12 + 8/12 = ?/?",
            answer: { num1: 3, den1: 12, num2: 8, den2: 12, numAns: 11, denAns: 12 },
            visual: { totalSlices: 12, initialSlices: 3, addSlices: 8, interactiveType: "bread-add" },
            feedback: {
                denAddError: "相加時分母12不變喔！",
                numError: "3份加上8份是11份，分子是11喔！"
            }
        },
        {
            id: "2_11",
            text: "水瓶裡原來有 1/6 公升的水，阿明又倒進去 5/6 公升。現在水瓶裡有幾公升的水呢？",
            type: "equation-whole",
            initialEq: "1/6 + 5/6 = ?/? = ?",
            answer: { num1: 1, den1: 6, num2: 5, den2: 6, numAns: 6, denAns: 6, wholeAns: 1 },
            visual: { totalSlices: 6, initialSlices: 1, addSlices: 5, interactiveType: "bread-add" },
            feedback: {
                denAddError: "分母6不變喔！",
                numError: "分子是 1 加 5 等於 6，而 6/6 公升就是 1 公升呢。"
            }
        },
        {
            id: "2_12",
            text: "妹妹買了紅彩帶 3/10 公尺和藍彩帶 4/10 公尺。共買了幾公尺的彩帶呢？",
            type: "equation",
            initialEq: "3/10 + 4/10 = ?/?",
            answer: { num1: 3, den1: 10, num2: 4, den2: 10, numAns: 7, denAns: 10 },
            visual: { totalSlices: 10, initialSlices: 3, addSlices: 4, interactiveType: "ribbon-add" },
            feedback: {
                denAddError: "相加時分母10保持不變呢。",
                numError: "3加4等於7，分子是7喔！"
            }
        },
        {
            id: "2_13",
            text: "廚房裡原本有 3/8 瓶沙拉油，媽媽又買了 4/8 瓶沙拉油。現在廚房裡有幾瓶沙拉油呢？",
            type: "equation",
            initialEq: "3/8 + 4/8 = ?/?",
            answer: { num1: 3, den1: 8, num2: 4, den2: 8, numAns: 7, denAns: 8 },
            visual: { totalSlices: 8, initialSlices: 3, addSlices: 4, interactiveType: "pie-add" },
            feedback: {
                denAddError: "分母8代表沙拉油瓶子等份，加法時分母是不變的呢。",
                numError: "3加4等於7，分子是7喔！"
            }
        },
        {
            id: "2_14",
            text: "哥哥喝了 2/9 公升椰子汁，妹妹喝了 5/9 公升椰子汁，兩個人共喝了幾公升椰子汁呢？",
            type: "equation",
            initialEq: "2/9 + 5/9 = ?/?",
            answer: { num1: 2, den1: 9, num2: 5, den2: 9, numAns: 7, denAns: 9 },
            visual: { totalSlices: 9, initialSlices: 2, addSlices: 5, interactiveType: "bread-add" },
            feedback: {
                denAddError: "分母9在計算時保持不變喔。",
                numError: "2份加5份等於7份，分子是7呢。"
            }
        },
        {
            id: "2_15",
            text: "一盒果凍有 10 個。小麗拿了 2/10 盒，小明拿了 8/10 盒。兩個人共拿了幾盒果凍呢？",
            type: "equation-whole",
            initialEq: "2/10 + 8/10 = ?/? = ?",
            answer: { num1: 2, den1: 10, num2: 8, den2: 10, numAns: 10, denAns: 10, wholeAns: 1 },
            visual: { totalItems: 10, initialItems: 2, addItems: 8, interactiveType: "discrete-add" },
            feedback: {
                denAddError: "分母10保持不變，代表一盒10個呢。",
                numError: "分子相加為 10，而 10/10 盒就是 1 整盒呢。"
            }
        }
    ],

    // 第三關：老鼠小偷的挑戰 (同分母分數的減法) - 共 15 題
    3: [
        {
            id: "3_1",
            text: "桌上有 6/10 塊大餅。弟弟吃掉了 2/10 塊。還剩下幾塊大餅呢？",
            type: "equation",
            initialEq: "6/10 - 2/10 = ?/?",
            answer: { num1: 6, den1: 10, num2: 2, den2: 10, numAns: 4, denAns: 10 },
            visual: { totalSlices: 10, initialSlices: 6, subSlices: 2, interactiveType: "pie-sub" },
            feedback: {
                denSubError: "哎呀！減法時分母不能相減喔！如果分母相減變成0，分數就沒有意義了呢。分母10要保持不變喔！",
                numError: "分子是 6 份減掉 2 份，應該剩下 4 份，分子是 4 喔！"
            }
        },
        {
            id: "3_2",
            text: "一盒鉛筆有 12 枝。弟弟有 7/12 盒。妹妹比弟弟少 2 枝。妹妹有幾盒鉛筆呢？",
            type: "equation-convert",
            initialEq: "7/12 - ?/12 = ?/?",
            answer: { num1: 7, den1: 12, num2: 2, den2: 12, numAns: 5, denAns: 12 },
            visual: { totalItems: 12, initialItems: 7, subItems: 2, interactiveType: "discrete-sub" },
            feedback: {
                convertError: "要注意！妹妹少2枝，因為一盒有12枝，所以2枝就是 2/12 盒喔！請先把2枝換算成分數呢。",
                denSubError: "相減時，分母12是保持不變的呢。",
                numError: "7個十二分之一減掉2個十二分之一，分子 7 減 2 應該是 5 喔！"
            }
        },
        {
            id: "3_3",
            text: "媽媽把 5/10 公升的柳橙汁加入一些芭樂汁，混合成 8/10 公升的綜合果汁。媽媽加了多少公升的芭樂汁呢？",
            type: "equation",
            initialEq: "8/10 - 5/10 = ?/?",
            answer: { num1: 8, den1: 10, num2: 5, den2: 10, numAns: 3, denAns: 10 },
            visual: { totalSlices: 10, initialSlices: 8, subSlices: 5, interactiveType: "bread-sub" },
            feedback: {
                denSubError: "減法運算中，分母10保持不變，代表杯子的刻度大小呢。",
                numError: "8個十分之一減去5個十分之一，分子應該是 8 減 5 等於 3 喔！"
            }
        },
        {
            id: "3_4",
            text: "詠安有 7/8 公尺的緞帶。包裝禮物用掉一些後，還剩下 3/8 公尺。包裝禮物用掉了多少公尺的緞帶呢？",
            type: "equation",
            initialEq: "7/8 - 3/8 = ?/?",
            answer: { num1: 7, den1: 8, num2: 3, den2: 8, numAns: 4, denAns: 8 },
            visual: { totalSlices: 8, initialSlices: 7, subSlices: 3, interactiveType: "ribbon-sub" },
            feedback: {
                denSubError: "別忘了，分母8代表彩帶平分後的等份大小，在減法時分母是不會變的呢。",
                numError: "7個八分之一減去剩下的3個八分之一，用掉的分子是 7 減 3 等於 4 喔！"
            }
        },
        {
            id: "3_5",
            text: "一盒馬卡龍有 8 個。桌上有 6/8 盒。小老鼠偷吃掉 3 個，還剩下幾盒馬卡龍呢？",
            type: "equation-convert",
            initialEq: "6/8 - ?/8 = ?/?",
            answer: { num1: 6, den1: 8, num2: 3, den2: 8, numAns: 3, denAns: 8 },
            visual: { totalItems: 8, initialItems: 6, subItems: 3, interactiveType: "discrete-sub" },
            feedback: {
                convertError: "注意！一盒有8個，偷吃3個就是吃掉 3/8 盒喔！請先換算成分數呢。",
                denSubError: "相減時，分母8要維持不變喔！",
                numError: "6減3等於3，分子是3喔！"
            }
        },
        {
            id: "3_6",
            text: "大餅平分成 10 塊。桌上有 9/10 塊。哥哥吃掉 5/10 塊，還剩下幾塊大餅呢？",
            type: "equation",
            initialEq: "9/10 - 5/10 = ?/?",
            answer: { num1: 9, den1: 10, num2: 5, den2: 10, numAns: 4, denAns: 10 },
            visual: { totalSlices: 10, initialSlices: 9, subSlices: 5, interactiveType: "pie-sub" },
            feedback: {
                denSubError: "相減時，分母代表大餅平分的總份數，分母10是不變的呢。",
                numError: "9減5等於4，分子是4喔！"
            }
        },
        {
            id: "3_7",
            text: "一瓶牛奶原來有 11/12 公升。做濃湯用掉 4/12 公升，還剩下幾公升的牛奶呢？",
            type: "equation",
            initialEq: "11/12 - 4/12 = ?/?",
            answer: { num1: 11, den1: 12, num2: 4, den2: 12, numAns: 7, denAns: 12 },
            visual: { totalSlices: 12, initialSlices: 11, subSlices: 4, interactiveType: "bread-sub" },
            feedback: {
                denSubError: "相減時分母維持12不變喔！",
                numError: "11減4等於7，分子是7喔！"
            }
        },
        {
            id: "3_8",
            text: "小烘焙師做了 5/6 盒小蛋糕。被客人拿走了一些後，還剩下 2/6 盒，請問被拿走了幾盒蛋糕呢？",
            type: "equation",
            initialEq: "5/6 - 2/6 = ?/?",
            answer: { num1: 5, den1: 6, num2: 2, den2: 6, numAns: 3, denAns: 6 },
            visual: { totalSlices: 6, initialSlices: 5, subSlices: 2, interactiveType: "pie-sub" },
            feedback: {
                denSubError: "減法計算時分母6不變喔！",
                numError: "5減2等於3，分子是3喔！"
            }
        },
        {
            id: "3_9",
            text: "桌上有 4/5 盒甜甜圈。小偷吃掉了 1/5 盒。桌上還剩下幾盒甜甜圈呢？",
            type: "equation",
            initialEq: "4/5 - 1/5 = ?/?",
            answer: { num1: 4, den1: 5, num2: 1, den2: 5, numAns: 3, denAns: 5 },
            visual: { totalSlices: 5, initialSlices: 4, subSlices: 1, interactiveType: "pie-sub" },
            feedback: {
                denSubError: "減法計算時分母5不變喔！",
                numError: "4個減掉1個是3個，分子是3喔！"
            }
        },
        {
            id: "3_10",
            text: "一盒雞蛋有 10 個。媽媽原本有 8/10 盒。今天做蛋糕用掉了 3 個。還剩下幾盒雞蛋呢？",
            type: "equation-convert",
            initialEq: "8/10 - ?/10 = ?/?",
            answer: { num1: 8, den1: 10, num2: 3, den2: 10, numAns: 5, denAns: 10 },
            visual: { totalItems: 10, initialItems: 8, subItems: 3, interactiveType: "discrete-sub" },
            feedback: {
                convertError: "注意！一盒有10個，用掉3個就是 3/10 盒喔！請先換算成分數呢。",
                denSubError: "相減時分母10保持不變呢。",
                numError: "8個1/10減去3個1/10，分子應該是 5 喔！"
            }
        },
        {
            id: "3_11",
            text: "姐姐有 7/9 公尺長的毛線。做圍巾用掉 5/9 公尺後，還剩下幾公尺的毛線呢？",
            type: "equation",
            initialEq: "7/9 - 5/9 = ?/?",
            answer: { num1: 7, den1: 9, num2: 5, den2: 9, numAns: 2, denAns: 9 },
            visual: { totalSlices: 9, initialSlices: 7, subSlices: 5, interactiveType: "ribbon-sub" },
            feedback: {
                denSubError: "減法運算中，分母9是不變的喔！",
                numError: "7個減5個是2個，分子是2喔！"
            }
        },
        {
            id: "3_12",
            text: "一盒布丁有 6 個。冰箱裡有 5/6 盒布丁。弟弟今天吃掉了 2 個。冰箱還剩下幾盒布丁呢？",
            type: "equation-convert",
            initialEq: "5/6 - ?/6 = ?/?",
            answer: { num1: 5, den1: 6, num2: 2, den2: 6, numAns: 3, denAns: 6 },
            visual: { totalItems: 6, initialItems: 5, subItems: 2, interactiveType: "discrete-sub" },
            feedback: {
                convertError: "冰箱布丁吃掉2個，也就是吃掉 2/6 盒喔！請先換算成盒數呢。",
                denSubError: "相減時分母6維持不變喔！",
                numError: "5份減去2份是3份，分子是3喔！"
            }
        },
        {
            id: "3_13",
            text: "水果店原來有 9/12 盒蘋果。早上賣出 5/12 盒後，水果店還剩下幾盒蘋果呢？",
            type: "equation",
            initialEq: "9/12 - 5/12 = ?/?",
            answer: { num1: 9, den1: 12, num2: 5, den2: 12, numAns: 4, denAns: 12 },
            visual: { totalSlices: 12, initialSlices: 9, subSlices: 5, interactiveType: "bread-sub" },
            feedback: {
                denSubError: "相減時分母12不變喔！",
                numError: "9減5等於4，分子是4喔！"
            }
        },
        {
            id: "3_14",
            text: "大餅平分成 8 塊。桌上有 7/8 塊大餅。弟弟吃掉 3/8 塊後，桌上還剩下幾塊大餅呢？",
            type: "equation",
            initialEq: "7/8 - 3/8 = ?/?",
            answer: { num1: 7, den1: 8, num2: 3, den2: 8, numAns: 4, denAns: 8 },
            visual: { totalSlices: 8, initialSlices: 7, subSlices: 3, interactiveType: "pie-sub" },
            feedback: {
                denSubError: "大餅相減時，分母8保持不變呢。",
                numError: "7個減3個剩下4個，分子是4喔！"
            }
        },
        {
            id: "3_15",
            text: "媽媽把 3/10 公升的芭樂汁加入一些柳橙汁，混合成 9/10 公升的綜合果汁。請問加了多少公升的柳橙汁呢？",
            type: "equation",
            initialEq: "9/10 - 3/10 = ?/?",
            answer: { num1: 9, den1: 10, num2: 3, den2: 10, numAns: 6, denAns: 10 },
            visual: { totalSlices: 10, initialSlices: 9, subSlices: 3, interactiveType: "bread-sub" },
            feedback: {
                denSubError: "分母10保持不變呢。",
                numError: "9份減3份是6份，分子是6喔！"
            }
        }
    ],

    // 第四關：神奇彩帶裝飾秀 (1 減分數的減法) - 共 15 題
    4: [
        {
            id: "4_1",
            text: "姐姐有一條長 1 公尺的彩帶。綁盒子用掉了 7/10 公尺。她還剩下多少公尺的彩帶呢？",
            type: "equation-whole-sub",
            initialEq: "1 - 7/10 = ?/? - 7/10 = ?/?",
            answer: { whole1: 1, num1: 10, den1: 10, num2: 7, den2: 10, numAns: 3, denAns: 10 },
            visual: { totalSlices: 10, initialSlices: 10, subSlices: 7, interactiveType: "ribbon-cut" },
            feedback: {
                convertError: "遇到整數1的減法，要先將1公尺換成十分之幾公尺喔！因為分母是10，所以要把1公尺換成 10/10 公尺呢。",
                numError: "10個十分之一減掉7個十分之一，分子 10 減 7 應該剩下 3 喔！"
            }
        },
        {
            id: "4_2",
            text: "一瓶 1 公升的牛奶。做蛋糕用了一些後，還剩下 3/5 公升。做蛋糕用了幾公升的牛奶呢？",
            type: "equation-whole-sub",
            initialEq: "1 - 3/5 = ?/? - 3/5 = ?/?",
            answer: { whole1: 1, num1: 5, den1: 5, num2: 3, den2: 5, numAns: 2, denAns: 5 },
            visual: { totalSlices: 5, initialSlices: 5, subSlices: 3, interactiveType: "bread-cut" },
            feedback: {
                convertError: "要先把1公升牛奶換算成五分之幾公升呢。因為剩下的分母是5，所以要把1換成 5/5 喔！",
                numError: "5個五分之一減去剩下的3個五分之一，分子 5 減 3 等於 2 喔！"
            }
        },
        {
            id: "4_3",
            text: "哥哥有一條緞帶。包裝禮物用了 3/7 公尺，還剩下 4/7 公尺。這條緞帶原來是幾公尺呢？",
            type: "equation-add-to-whole",
            initialEq: "3/7 + 4/7 = ?/? = ?",
            answer: { num1: 3, den1: 7, num2: 4, den2: 7, numAns: 7, denAns: 7, wholeAns: 1 },
            visual: { totalSlices: 7, initialSlices: 3, addSlices: 4, interactiveType: "ribbon-add-whole" },
            feedback: {
                denAddError: "相加時分母是不會變的呢，分母維持7喔！",
                numError: "3個七分之一加上4個七分之一，共是7個七分之一，所以分子是7。而 7/7 就等於整數 1 喔！"
            }
        },
        {
            id: "4_4",
            text: "一盒果凍有 6 個。品睿昨天和今天共吃了 5/6 盒。還剩下幾盒果凍呢？",
            type: "equation-whole-sub",
            initialEq: "1 - 5/6 = ?/? - 5/6 = ?/?",
            answer: { whole1: 1, num1: 6, den1: 6, num2: 5, den2: 6, numAns: 1, denAns: 6 },
            visual: { totalItems: 6, initialItems: 6, subItems: 5, interactiveType: "discrete-cut" },
            feedback: {
                convertError: "先將1盒果凍換算成六分之幾盒。一盒有6個，所以1盒就是 6/6 盒呢。",
                numError: "6個六分之一減掉吃了的5個六分之一，分子 6 減 5 應該剩下 1 喔！"
            }
        },
        {
            id: "4_5",
            text: "小明有一條長 1 公尺的長麵團。做麵包剪掉了 4/8 公尺，還剩下幾公尺的麵團呢？",
            type: "equation-whole-sub",
            initialEq: "1 - 4/8 = ?/? - 4/8 = ?/?",
            answer: { whole1: 1, num1: 8, den1: 8, num2: 4, den2: 8, numAns: 4, denAns: 8 },
            visual: { totalSlices: 8, initialSlices: 8, subSlices: 4, interactiveType: "ribbon-cut" },
            feedback: {
                convertError: "要先將1公尺換算成八分之幾公尺喔！也就是 8/8 公尺呢。",
                numError: "8減4等於4，分子是4喔！"
            }
        },
        {
            id: "4_6",
            text: "冰箱裡原來有一瓶 1 公升的蘋果汁。爸爸喝掉 5/12 公升，還剩下幾公升的蘋果汁呢？",
            type: "equation-whole-sub",
            initialEq: "1 - 5/12 = ?/? - 5/12 = ?/?",
            answer: { whole1: 1, num1: 12, den1: 12, num2: 5, den2: 12, numAns: 7, denAns: 12 },
            visual: { totalSlices: 12, initialSlices: 12, subSlices: 5, interactiveType: "bread-cut" },
            feedback: {
                convertError: "要先把1公升換算成十二分之幾公升，也就是 12/12 喔！",
                numError: "12個減掉5個，剩下7個，分子是7喔！"
            }
        },
        {
            id: "4_7",
            text: "一盒巧克力有 10 顆。妹妹今天吃掉 6 顆，還剩下幾盒巧克力呢？",
            type: "equation-whole-sub",
            initialEq: "1 - 6/10 = ?/? - 6/10 = ?/?",
            answer: { whole1: 1, num1: 10, den1: 10, num2: 6, den2: 10, numAns: 4, denAns: 10 },
            visual: { totalItems: 10, initialItems: 10, subItems: 6, interactiveType: "discrete-cut" },
            feedback: {
                convertError: "一盒有10顆，所以1盒就是 10/10 盒呢。吃掉6顆是吃掉 6/10 盒喔！",
                numError: "10減6等於4，分子是4喔！"
            }
        },
        {
            id: "4_8",
            text: "媽媽買了 1 盒布丁。分給小朋友們吃掉了 4/6 盒，還剩下幾盒布丁呢？",
            type: "equation-whole-sub",
            initialEq: "1 - 4/6 = ?/? - 4/6 = ?/?",
            answer: { whole1: 1, num1: 6, den1: 6, num2: 4, den2: 6, numAns: 2, denAns: 6 },
            visual: { totalItems: 6, initialItems: 6, subItems: 4, interactiveType: "discrete-cut" },
            feedback: {
                convertError: "要先把1盒換算成 6/6 盒，再扣去吃掉的 4/6 盒呢。",
                numError: "6減4等於2，分子是2喔！"
            }
        },
        {
            id: "4_9",
            text: "媽媽買了 1 盒水餃。做晚餐煮了 8/12 盒水餃，還剩下幾盒水餃呢？",
            type: "equation-whole-sub",
            initialEq: "1 - 8/12 = ?/? - 8/12 = ?/?",
            answer: { whole1: 1, num1: 12, den1: 12, num2: 8, den2: 12, numAns: 4, denAns: 12 },
            visual: { totalItems: 12, initialItems: 12, subItems: 8, interactiveType: "discrete-cut" },
            feedback: {
                convertError: "要先把1盒換算成 12/12 盒，再扣去煮了的 8/12 盒呢。",
                numError: "12減8等於4，分子是4喔！"
            }
        },
        {
            id: "4_10",
            text: "阿姨有 1 公升的牛奶。做鬆餅用掉了 2/5 公升後，還剩下幾公升的牛奶呢？",
            type: "equation-whole-sub",
            initialEq: "1 - 2/5 = ?/? - 2/5 = ?/?",
            answer: { whole1: 1, num1: 5, den1: 5, num2: 2, den2: 5, numAns: 3, denAns: 5 },
            visual: { totalSlices: 5, initialSlices: 5, subSlices: 2, interactiveType: "bread-cut" },
            feedback: {
                convertError: "做鬆餅用掉五分之二公升，所以要先把1公升換算成 5/5 喔！",
                numError: "5減2等於3，分子是3喔！"
            }
        },
        {
            id: "4_11",
            text: "姐姐有一條長彩帶。包裝禮物用了 5/9 公尺，還剩下 4/9 公尺。這條彩帶原來長幾公尺呢？",
            type: "equation-add-to-whole",
            initialEq: "5/9 + 4/9 = ?/? = ?",
            answer: { num1: 5, den1: 9, num2: 4, den2: 9, numAns: 9, denAns: 9, wholeAns: 1 },
            visual: { totalSlices: 9, initialSlices: 5, addSlices: 4, interactiveType: "ribbon-add-whole" },
            feedback: {
                denAddError: "相加時，分母9是不會變的呢。",
                numError: "5加4等於9，9/9 就等於整數 1 喔！"
            }
        },
        {
            id: "4_12",
            text: "爸爸有一條長 1 公尺的木頭。做椅子鋸掉了 3/8 公尺，還剩下幾公尺的木頭呢？",
            type: "equation-whole-sub",
            initialEq: "1 - 3/8 = ?/? - 3/8 = ?/?",
            answer: { whole1: 1, num1: 8, den1: 8, num2: 3, den2: 8, numAns: 5, denAns: 8 },
            visual: { totalSlices: 8, initialSlices: 8, subSlices: 3, interactiveType: "ribbon-cut" },
            feedback: {
                convertError: "要先將1公尺換算成 8/8 公尺，再進行計算呢。",
                numError: "8個減3個，分子應該是 5 喔！"
            }
        },
        {
            id: "4_13",
            text: "一盒櫻桃有 10 顆。小麗今天吃掉了 7 顆，還剩下幾盒櫻桃呢？",
            type: "equation-whole-sub",
            initialEq: "1 - 7/10 = ?/? - 7/10 = ?/?",
            answer: { whole1: 1, num1: 10, den1: 10, num2: 7, den2: 10, numAns: 3, denAns: 10 },
            visual: { totalItems: 10, initialItems: 10, subItems: 7, interactiveType: "discrete-cut" },
            feedback: {
                convertError: "吃掉7顆是吃掉 7/10 盒，所以要先把1盒換算成 10/10 盒喔！",
                numError: "10減7等於3，分子是3喔！"
            }
        },
        {
            id: "4_14",
            text: "哥哥買了 1 盒巧克力。分給妹妹吃掉了 2/6 盒後，還剩下幾盒巧克力呢？",
            type: "equation-whole-sub",
            initialEq: "1 - 2/6 = ?/? - 2/6 = ?/?",
            answer: { whole1: 1, num1: 6, den1: 6, num2: 2, den2: 6, numAns: 4, denAns: 6 },
            visual: { totalItems: 6, initialItems: 6, subItems: 2, interactiveType: "discrete-cut" },
            feedback: {
                convertError: "吃掉2/6盒，要先把1盒換算成 6/6 盒呢。",
                numError: "6減2等於4，分子是4喔！"
            }
        },
        {
            id: "4_15",
            text: "廚房裡有一瓶 1 公升的沙拉油。媽媽炒菜用掉一些後，剩下 4/10 公升。媽媽炒菜用掉了幾公升的沙拉油呢？",
            type: "equation-whole-sub",
            initialEq: "1 - 4/10 = ?/? - 4/10 = ?/?",
            answer: { whole1: 1, num1: 10, den1: 10, num2: 4, den2: 10, numAns: 6, denAns: 10 },
            visual: { totalSlices: 10, initialSlices: 10, subSlices: 4, interactiveType: "bread-cut" },
            feedback: {
                convertError: "要先把1公升沙拉油換算成 10/10 公升喔！",
                numError: "10減4等於6，分子是6喔！"
            }
        }
    ]
};

// 隨機獲取對戰模式下的混合題目
function getRandomBattleQuestions(topic, count) {
    let pool = [];
    
    if (topic === "add") {
        pool = [...gameQuestions[2], gameQuestions[4][2], gameQuestions[4][10]];
    } else if (topic === "sub") {
        pool = [...gameQuestions[3]];
    } else if (topic === "sub1") {
        pool = [
            gameQuestions[4][0], gameQuestions[4][1], gameQuestions[4][3], 
            gameQuestions[4][4], gameQuestions[4][5], gameQuestions[4][6], 
            gameQuestions[4][7], gameQuestions[4][8], gameQuestions[4][9],
            gameQuestions[4][11], gameQuestions[4][12], gameQuestions[4][13],
            gameQuestions[4][14]
        ];
    } else {
        pool = [
            ...gameQuestions[1].filter(q => q.type === "fraction-input"),
            ...gameQuestions[2],
            ...gameQuestions[3],
            ...gameQuestions[4]
        ];
    }
    
    // 洗牌算法 (Fisher-Yates Shuffle)
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // 取前 count 題，如果題池不夠，就重複取
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(shuffled[i % shuffled.length]);
    }
    
    return result;
}
