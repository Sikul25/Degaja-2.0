// China-market card concepts (心镜 series). Self-contained, zh-only: builds
// nothing and stays invisible unless the active language is "zh", so it
// never touches the DE/EN/etc. experience or i18n.js's key set.
(function () {
  function currentLang() {
    return window.degajaI18n ? window.degajaI18n.getLang() : "de";
  }
  if (currentLang() !== "zh") return;

  // Removing the attribute (not just clearing inline style) lifts the
  // index.html `[data-zh-only]{display:none!important}` rule for good, so
  // tabs.js's own inline-style tab switching takes over normally afterward.
  document.querySelectorAll("[data-zh-only]").forEach(function (el) {
    el.removeAttribute("data-zh-only");
  });

  var root = document.getElementById("chinaCardsRoot");
  if (!root) return;

  var style = document.createElement("style");
  style.textContent = [
    "#chinaCards{background:#F6F1E6;color:#241F19;padding:48px 16px;}",
    "#chinaCards *{box-sizing:border-box;}",
    "#chinaCards .cc-page{max-width:480px;margin:0 auto;display:flex;flex-direction:column;gap:30px;font-family:'Noto Sans SC','Noto Sans Hebrew',sans-serif;}",
    "#chinaCards .cc-hero{position:relative;overflow:hidden;background:radial-gradient(130% 150% at 50% -15%,#9E2B25,#6E1C19);border-radius:22px;padding:36px 20px 28px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;color:#FBEFDD;box-shadow:0 16px 32px rgba(0,0,0,.28);}",
    "#chinaCards .cc-medal{width:104px;height:104px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#D4A24C;border:3px dashed rgba(255,255,255,.55);margin-bottom:8px;}",
    "#chinaCards .cc-medal svg{width:54px;height:54px;color:#6E1C19;}",
    "#chinaCards .cc-eyebrow{font-size:12px;letter-spacing:.08em;opacity:.85;}",
    "#chinaCards .cc-fest-title{font-family:'Noto Serif SC',serif;font-weight:700;font-size:40px;margin:0;line-height:1;}",
    "#chinaCards .cc-fest-sub{margin:0;font-size:13px;opacity:.92;}",
    "#chinaCards .cc-badge{align-self:flex-start;font-size:11.5px;letter-spacing:.06em;color:#3E6B5B;background:#D8E6DF;border-radius:999px;padding:5px 11px;font-weight:600;}",
    "#chinaCards h1{font-family:'Noto Serif SC',serif;font-weight:700;font-size:32px;margin:0;line-height:1;}",
    "#chinaCards .cc-tagline{margin:0;color:#6B6155;font-size:14px;line-height:1.6;}",
    "#chinaCards .cc-deck-nav{display:flex;flex-wrap:wrap;gap:8px;}",
    "#chinaCards .cc-deck-nav a{font-size:12px;font-weight:600;color:#241F19;background:#fff;border:1px solid rgba(36,31,25,.14);border-radius:999px;padding:6px 12px;text-decoration:none;}",
    "#chinaCards .cc-deck{display:flex;flex-direction:column;gap:14px;scroll-margin-top:16px;}",
    "#chinaCards .cc-deck-eyebrow{font-size:12px;font-weight:600;color:#3E6B5B;}",
    "#chinaCards .cc-section-title{font-family:'Noto Serif SC',serif;font-size:19px;margin:0;display:flex;align-items:center;gap:8px;}",
    "#chinaCards .cc-section-title .cc-zh{color:#6B6155;font-size:13px;font-weight:400;}",
    "#chinaCards .cc-spread{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}",
    "#chinaCards .cc-card{all:unset;cursor:pointer;aspect-ratio:3/4.2;perspective:900px;display:block;}",
    "#chinaCards .cc-card-inner{position:relative;width:100%;height:100%;transition:transform .55s cubic-bezier(.3,.7,.2,1),opacity .3s ease;transform-style:preserve-3d;border-radius:14px;}",
    "#chinaCards .cc-card.flipped .cc-card-inner{transform:rotateY(180deg);}",
    "#chinaCards .cc-card.dim .cc-card-inner{opacity:.38;}",
    "#chinaCards .cc-card-face{position:absolute;inset:0;border-radius:14px;backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border:1px solid rgba(36,31,25,.14);box-shadow:0 4px 10px rgba(36,31,25,.16);}",
    "#chinaCards .cc-card-face.cc-back{background:repeating-linear-gradient(135deg,#2E4A40 0 2px,#436357 2px 4px);}",
    "#chinaCards .cc-card-face.cc-back svg{width:24px;height:24px;opacity:.75;color:#D8E6DF;}",
    "#chinaCards .cc-card-face.cc-front{background:#fff;transform:rotateY(180deg);padding:10px 6px;}",
    "#chinaCards .cc-card-face.cc-front svg{width:26px;height:26px;color:#3E6B5B;}",
    "#chinaCards .cc-card-face.cc-front strong{font-family:'Noto Serif SC',serif;font-size:15px;font-weight:600;}",
    "#chinaCards .cc-card-face.cc-front em{font-style:normal;font-size:10px;color:#6B6155;}",
    "#chinaCards .cc-deck-3 .cc-card-face.cc-back{background:repeating-linear-gradient(135deg,#6E1C19 0 2px,#9E2B25 2px 4px);}#chinaCards .cc-deck-3 .cc-card-face.cc-back svg{color:#D4A24C;}#chinaCards .cc-deck-3 .cc-card-face.cc-front svg,#chinaCards .cc-deck-3 .cc-card-face.cc-front strong{color:#6E1C19;}",
    "#chinaCards .cc-deck-6 .cc-card-face.cc-back{background:repeating-linear-gradient(135deg,#1F3A54 0 2px,#35567A 2px 4px);}#chinaCards .cc-deck-6 .cc-card-face.cc-back svg{color:#F2F0E6;}#chinaCards .cc-deck-6 .cc-card-face.cc-front svg,#chinaCards .cc-deck-6 .cc-card-face.cc-front strong{color:#1F3A54;}",
    "#chinaCards .cc-deck-7 .cc-card-face.cc-back{background:repeating-linear-gradient(135deg,#7A2E3D 0 2px,#C9697D 2px 4px);}#chinaCards .cc-deck-7 .cc-card-face.cc-back svg{color:#FBEAEC;}#chinaCards .cc-deck-7 .cc-card-face.cc-front svg,#chinaCards .cc-deck-7 .cc-card-face.cc-front strong{color:#7A2E3D;}",
    "#chinaCards .cc-deck-8 .cc-card-face.cc-back{background:repeating-linear-gradient(135deg,#20262E 0 2px,#3A4452 2px 4px);}#chinaCards .cc-deck-8 .cc-card-face.cc-back svg{color:#C9A227;}#chinaCards .cc-deck-8 .cc-card-face.cc-front svg,#chinaCards .cc-deck-8 .cc-card-face.cc-front strong{color:#20262E;}",
    "#chinaCards .cc-deck-9 .cc-card-face.cc-back{background:repeating-linear-gradient(135deg,#1D4E4A 0 2px,#2F726A 2px 4px);}#chinaCards .cc-deck-9 .cc-card-face.cc-back svg{color:#EAF4F1;}#chinaCards .cc-deck-9 .cc-card-face.cc-front svg,#chinaCards .cc-deck-9 .cc-card-face.cc-front strong{color:#1D4E4A;}",
    "#chinaCards .cc-deck-10 .cc-card-face.cc-back{background:repeating-linear-gradient(135deg,#2B2250 0 2px,#4A3D82 2px 4px);}#chinaCards .cc-deck-10 .cc-card-face.cc-back svg{color:#C9A94E;}#chinaCards .cc-deck-10 .cc-card-face.cc-front svg,#chinaCards .cc-deck-10 .cc-card-face.cc-front strong{color:#2B2250;}",
    "#chinaCards .cc-deck-11 .cc-card-face.cc-back{background:repeating-linear-gradient(135deg,#3A2E1F 0 2px,#5C4A32 2px 4px);}#chinaCards .cc-deck-11 .cc-card-face.cc-back svg{color:#D9B166;}#chinaCards .cc-deck-11 .cc-card-face.cc-front svg,#chinaCards .cc-deck-11 .cc-card-face.cc-front strong{color:#3A2E1F;}",
    "#chinaCards .cc-result{display:flex;flex-direction:column;gap:14px;animation:ccRise .4s ease both;}",
    "@keyframes ccRise{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}",
    "#chinaCards .cc-result-card{background:#fff;border:1px solid rgba(36,31,25,.14);border-radius:18px;padding:22px 20px;display:flex;flex-direction:column;gap:14px;box-shadow:0 10px 24px rgba(36,31,25,.16);}",
    "#chinaCards .cc-result-eyebrow{font-size:11.5px;letter-spacing:.08em;color:#C1623E;font-weight:600;}",
    "#chinaCards .cc-result-title{font-family:'Noto Serif SC',serif;font-size:24px;font-weight:700;margin:0;display:flex;align-items:baseline;gap:10px;}",
    "#chinaCards .cc-result-title span{font-size:13px;color:#6B6155;font-weight:400;}",
    "#chinaCards .cc-cn{margin:0;font-size:16px;line-height:1.85;}",
    "#chinaCards .cc-divider{height:1px;background:rgba(36,31,25,.14);}",
    "#chinaCards .cc-en{margin:0;font-size:13.5px;line-height:1.7;color:#6B6155;}",
    "#chinaCards .cc-he{margin:0;font-family:'Noto Sans Hebrew','Noto Sans SC',sans-serif;font-size:14px;line-height:1.75;color:#6B6155;}",
    "#chinaCards .cc-reset-btn,#chinaCards .cc-reveal-btn{all:unset;cursor:pointer;align-self:flex-start;font-size:13px;font-weight:600;}",
    "#chinaCards .cc-reset-btn{color:#3E6B5B;border-bottom:1px solid #3E6B5B;padding-bottom:2px;}",
    "#chinaCards .cc-reveal-btn{color:#fff;background:#5C4A32;border-radius:999px;padding:8px 16px;}",
    "#chinaCards .cc-foot{font-size:12px;color:#6B6155;text-align:center;}"
  ].join("\n");
  document.head.appendChild(style);

  var BACK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>';
  var QMARK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/></svg>';

  var DECKS = [
    { n: 1, id: "mirror", title: "情绪自我觉察卡", zh: "心镜",
      icons: {
        mirror:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="10" r="7"/><path d="M12 17v4M9 21h6" stroke-linecap="round"/></svg>',
        anchor:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="5" r="2"/><path d="M12 7v14M6 12H2a10 10 0 0 0 10 10 10 10 0 0 0 10-10h-4" stroke-linecap="round"/><path d="M7 9l-2 2M17 9l2 2" stroke-linecap="round"/></svg>',
        lighthouse:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3h4l1 4h-6z"/><path d="M8 22l1.5-15h5L16 22z"/><path d="M4 9l3 1M20 9l-3 1M3 22h18"/></svg>',
        seed:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c0-6 0-10 0-13"/><path d="M12 9c-4 0-6-3-6-6 4 0 6 2 6 6z"/><path d="M12 13c4 0 6-3 6-6-4 0-6 2-6 6z" opacity=".6"/></svg>',
        bridge:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 17c3-6 17-6 20 0"/><path d="M5 17v3M19 17v3M12 10v7"/></svg>',
        wind:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 13h15a3 3 0 1 1-3 3"/><path d="M3 18h8"/></svg>'
      },
      cards: [
        { id:'mirror', title:'镜子', py:'Mirror', eyebrow:'自我觉察 · Self-awareness',
          cn:'你选择了镜子，说明此刻你更想"看清自己"，而不是寻求别人的答案。试着写下今天最让你在意的一个念头。',
          en:'You chose the Mirror — right now you care more about seeing yourself clearly than about an answer from someone else.',
          he:'בחרת בראי - כרגע אתה רוצה לראות את עצמך בבירור יותר מאשר לקבל תשובה מישהו אחר.' },
        { id:'anchor', title:'锚', py:'Anchor', eyebrow:'安全感 · Need for stability',
          cn:'锚代表安全感。你可能正处在一个需要稳定的阶段——这不是软弱，而是提醒你先站稳，再往前走。',
          en:'The Anchor stands for the need for stability. That is not weakness, it is a reminder to find solid ground first.',
          he:'העוגן מייצג צורך ביציבות. זו לא חולשה, זו תזכורת למצוא קרקע יציבה.' },
        { id:'lighthouse', title:'灯塔', py:'Lighthouse', eyebrow:'寻找方向 · Seeking direction',
          cn:'灯塔出现，往往意味着你正站在一个十字路口上。你其实比自己以为的更清楚该往哪走。',
          en:'The Lighthouse often appears at a crossroads. You already know which way to go more than you think.',
          he:'המגדלור מופיע בצומת דרכים. אתה כבר יודע לאן ללכת יותר משאתה חושב.' },
        { id:'seed', title:'种子', py:'Seed', eyebrow:'新的开始 · New beginnings',
          cn:'种子提醒你：有些事现在看起来很小，却正在悄悄发芽。耐心，是你这个阶段最需要的礼物。',
          en:'The Seed reminds you something small is quietly taking root. Patience is the gift you need now.',
          he:'הזרע מזכיר לך שמשהו קטן מתחיל להשריש בשקט. סבלנות היא המתנה שאתה הכי צריך.' },
        { id:'bridge', title:'桥', py:'Bridge', eyebrow:'关系与连接 · Connection',
          cn:'桥代表关系。你内心其实很想跨出那一步去沟通，只是在等一个合适的时机。',
          en:'The Bridge represents connection. You want to reach out — you are waiting for the right moment.',
          he:'הגשר מייצג קשר. אתה רוצה ליצור קשר - אתה רק מחכה לרגע הנכון.' },
        { id:'wind', title:'风', py:'Wind', eyebrow:'变化将至 · Change is coming',
          cn:'风卡出现时，说明你已经感觉到变化的气息了。与其抗拒，不如把它当成一次呼吸的机会。',
          en:'When Wind appears, you have already sensed change in the air. Treat it as a chance to breathe.',
          he:'כשהרוח מופיעה, אתה כבר מרגיש שינוי באוויר. התייחס אליו כהזדמנות לנשום.' }
      ]
    },
    { n: 2, id: "number", title: "数字印记", zh: "今日能量数字",
      icons: {
        n1:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 6l4-2v16"/></svg>',
        n2:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a4 4 0 1 1 7 2.5L6 18h11"/></svg>',
        n3:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 6h8l-4 5a4 4 0 1 1-3.2 6.4"/></svg>',
        n4:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3l-8 11h9M14 3v18"/></svg>',
        n5:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H8l-1 8a4 4 0 1 1 1 7.5"/></svg>',
        n6:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4a7 7 0 1 0 3 6l-5 1"/></svg>'
      },
      cards: [
        { id:'n1', title:'1', py:'开始 Beginning', eyebrow:'今日能量 · Today’s energy',
          cn:'你被"1"吸引，说明今天你更想主导、先走出第一步。',
          en:'You were drawn to "1" — today you want to lead and take the first step.',
          he:'נמשכת ל"1" - היום אתה רוצה להוביל ולעשות את הצעד הראשון.' },
        { id:'n2', title:'2', py:'平衡 Balance', eyebrow:'今日能量 · Today’s energy',
          cn:'"2"代表平衡。你今天很在意公平和对方的感受。',
          en:'"2" is about balance. You care today about fairness and the other side.',
          he:'"2" מייצג איזון. אתה מתחשב היום בהוגנות וברגשות של האחר.' },
        { id:'n3', title:'3', py:'表达 Expression', eyebrow:'今日能量 · Today’s energy',
          cn:'"3"的能量适合表达自己。说出心里憋着的话，哪怕只对一个人说。',
          en:'"3" is energy for expression. Say what you’ve been holding in.',
          he:'האנרגיה של "3" מתאימה לביטוי עצמי. תגיד את מה שהחזקת בפנים.' },
        { id:'n4', title:'4', py:'稳固 Stability', eyebrow:'今日能量 · Today’s energy',
          cn:'"4"提醒你最近更看重踏实感。先把基础打牢——这不是停滞，是积累。',
          en:'"4" reminds you to build the foundation first — that is not standing still.',
          he:'"4" מזכיר לך לבסס קודם את היסודות - זו לא עצירה, זו צבירה.' },
        { id:'n5', title:'5', py:'自由 Freedom', eyebrow:'今日能量 · Today’s energy',
          cn:'"5"是自由的数字。你内心渴望一点变化和空间。',
          en:'"5" is the number of freedom. Part of you wants a bit of change and space.',
          he:'"5" הוא מספר החופש. חלק ממך רוצה קצת שינוי ומרחב.' },
        { id:'n6', title:'6', py:'关怀 Care', eyebrow:'今日能量 · Today’s energy',
          cn:'"6"的注意力常常放在别人身上。记得这份关怀也该留一些给自己。',
          en:'"6" points its attention at others. Save some of that care for yourself too.',
          he:'"6" שם לב בדרך כלל לאנשים אחרים. שמור קצת מהדאגה גם לעצמך.' }
      ]
    },
    { n: 3, id: "newyear", title: "新年祝福卡", zh: "New Year Blessings",
      icons: {
        wealth:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><rect x="9" y="9" width="6" height="6"/></svg>',
        health:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/></svg>',
        wishes:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10c0-3 3-5 6-5s4 2 4 4-2 3-4 3-3-1-3-3"/><path d="M9 12c2 2 6 2 9-1"/></svg>',
        dreams:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l2.6 5.9L21 10l-5 4.2L17.4 21 12 17.6 6.6 21 8 14.2 3 10l6.4-1.1z"/></svg>',
        family:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/></svg>',
        rising:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4v-4h4v-4h4v-4h4"/></svg>'
      },
      cards: [
        { id:'wealth', title:'恭喜发财', py:'Gōngxǐ fācái', eyebrow:'新年祝福 · New Year blessing',
          cn:'"恭喜发财"是最广为人知的新年祝福语。拜年时说这句话，对方常会用红包回应——不涉及预测。',
          en:'The best-known New Year greeting — a lighthearted exchange, not a prediction.',
          he:'ברכת השנה החדשה המוכרת ביותר - החלפת ברכות, לא תחזית.' },
        { id:'health', title:'身体健康', py:'Shēntǐ jiànkāng', eyebrow:'新年祝福 · New Year blessing',
          cn:'"身体健康"是送给长辈和家人最常见的祝福，表达的是关心而不是预言。',
          en:'The most common blessing for elders and family — it expresses care, not a prediction.',
          he:'הברכה הנפוצה ביותר לקשישים ולמשפחה - מביעה דאגה, לא תחזית.' },
        { id:'wishes', title:'万事如意', py:'Wànshì rúyì', eyebrow:'新年祝福 · New Year blessing',
          cn:'"万事如意"的意思是"愿一切都顺你的心意"，是温暖的鼓励。',
          en:'An all-purpose blessing, "may everything go as you wish" — a warm encouragement.',
          he:'ברכה כללית - "שהכל יתנהל כרצונך" - עידוד חם.' },
        { id:'dreams', title:'心想事成', py:'Xīnxiǎng shìchéng', eyebrow:'新年祝福 · New Year blessing',
          cn:'"心想事成"常用于祝福对方实现心愿，比如升学、工作或爱情。',
          en:'Often used for hopes around study, work or love.',
          he:'משמשת לרוב לאיחולים בלימודים, עבודה או אהבה.' },
        { id:'family', title:'阖家幸福', py:'Hé jiā xìngfú', eyebrow:'新年祝福 · New Year blessing',
          cn:'"阖家幸福"把祝福送给整个家庭——体现了春节最重视的价值：团圆。',
          en:'Extends the blessing to the whole family — togetherness.',
          he:'מרחיבה את הברכה לכל המשפחה - להיות ביחד.' },
        { id:'rising', title:'步步高升', py:'Bùbù gāoshēng', eyebrow:'新年祝福 · New Year blessing',
          cn:'"步步高升"常用于祝福事业或学业进步，鼓励持续的努力。',
          en:'Wishes progress in career or study, step by step.',
          he:'איחולי התקדמות בקריירה או בלימודים, צעד אחר צעד.' }
      ]
    },
    { n: 4, id: "mood", title: "今日心情", zh: "Daily Mood",
      icons: {
        calm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/></svg>',
        excited:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M4.5 4.5l2.8 2.8M16.7 16.7l2.8 2.8M3 12h4M17 12h4M4.5 19.5l2.8-2.8M16.7 7.3l2.8-2.8"/></svg>',
        tired:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3a9 9 0 1 0 6 15 7 7 0 0 1-6-15z"/></svg>',
        warm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M3 12h2M19 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5"/></svg>',
        lost:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19c3-6 2-9 6-9s2 5 6 5 2-7 6-7"/></svg>',
        determined:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h12l-3 4 3 4H5"/></svg>'
      },
      cards: [
        { id:'calm', title:'平静', py:'Calm', eyebrow:'今日心情 · Daily mood',
          cn:'你选的是平静。今天适合慢下来，给自己一点安静的时间。',
          en:'You picked Calm. Today is good for slowing down.',
          he:'בחרת ברוגע. היום מתאים להאט ולתת לעצמך קצת שקט.' },
        { id:'excited', title:'兴奋', py:'Excited', eyebrow:'今日心情 · Daily mood',
          cn:'你选的是兴奋。你心里有件事让你很期待，试着把它写下来。',
          en:'You picked Excited. Something is making you look forward to it.',
          he:'בחרת בהתרגשות. יש משהו שאתה מצפה לו.' },
        { id:'tired', title:'疲惫', py:'Tired', eyebrow:'今日心情 · Daily mood',
          cn:'你选的是疲惫。身体在提醒你需要休息，哪怕只是十分钟。',
          en:'You picked Tired. Your body is asking for rest.',
          he:'בחרת בעייפות. הגוף מבקש מנוחה.' },
        { id:'warm', title:'温暖', py:'Warm', eyebrow:'今日心情 · Daily mood',
          cn:'你选的是温暖。今天适合和在乎的人多聊聊。',
          en:'You picked Warm. Today suits reaching out to someone you care about.',
          he:'בחרת בחום. היום מתאים ליצור קשר עם מישהו שחשוב לך.' },
        { id:'lost', title:'迷茫', py:'Lost', eyebrow:'今日心情 · Daily mood',
          cn:'你选的是迷茫。先做眼前能做的一件小事，答案常常是走着走着才出现的。',
          en:'You picked Lost. Do one small thing in front of you.',
          he:'בחרת במבולבל. תעשה דבר קטן אחד שלפניך.' },
        { id:'determined', title:'坚定', py:'Determined', eyebrow:'今日心情 · Daily mood',
          cn:'你选的是坚定。今天就是迈出那一步的好机会。',
          en:'You picked Determined. Today is a good moment to take that step.',
          he:'בחרת בנחישות. היום הזדמנות טובה לעשות את הצעד.' }
      ]
    },
    { n: 5, id: "letter", title: "写给未来的自己", zh: "Letter to Future Self",
      icons: {
        dream:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3a9 9 0 1 0 6 15 7 7 0 0 1-6-15z"/><path d="M19 3l.6 1.4L21 5l-1.4.6L19 7l-.6-1.4L17 5l1.4-.6z"/></svg>',
        growth:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L20 4"/><path d="M20 4h-6M20 4v6"/></svg>',
        love:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/></svg>',
        friend:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/></svg>',
        family2:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
        courage:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-6 2 2-6z"/></svg>'
      },
      cards: [
        { id:'dream', title:'梦想', py:'Dream', eyebrow:'写给未来的自己',
          cn:'关于梦想。试着写一句"亲爱的自己，希望明年这个时候，我已经开始迈出那一步"。',
          en:'About dreams. Write "Dear me, I hope I’ve taken that first step."',
          he:'על חלומות. כתוב "יקר לי, אני מקווה שכבר עשיתי את הצעד הראשון".' },
        { id:'growth', title:'成长', py:'Growth', eyebrow:'写给未来的自己',
          cn:'关于成长。回想这一年最让你变化的一件事，写下"这件事教会了我..."',
          en:'About growth. Write "This taught me..."',
          he:'על צמיחה. כתוב "הדבר הזה לימד אותי..."' },
        { id:'love', title:'爱情', py:'Love', eyebrow:'写给未来的自己',
          cn:'关于感情。写下你现在最想对那个人说、却还没说出口的一句话。',
          en:'About love. Write the one thing you haven’t said yet.',
          he:'על אהבה. כתוב את מה שעוד לא אמרת.' },
        { id:'friend', title:'友情', py:'Friendship', eyebrow:'写给未来的自己',
          cn:'关于友情。想一个很久没联系的朋友，写下"下次见面我想告诉你..."',
          en:'About friendship. Think of a friend you haven’t talked to in a while.',
          he:'על חברות. חשוב על חבר שלא דיברת איתו הרבה זמן.' },
        { id:'family2', title:'家人', py:'Family', eyebrow:'写给未来的自己',
          cn:'关于家人。写一句你一直想对家人说、却总觉得"以后再说"的话。',
          en:'About family. Write the thing you keep putting off.',
          he:'על משפחה. כתוב את מה שתמיד דחית.' },
        { id:'courage', title:'勇气', py:'Courage', eyebrow:'写给未来的自己',
          cn:'关于勇气。写下一件你一直不敢做的小事，今天先从最小的一步开始。',
          en:'About courage. Write one small thing you’ve been afraid to do.',
          he:'על אומץ. כתוב דבר קטן שפחדת לעשות.' }
      ]
    },
    { n: 6, id: "wisdom", title: "古训卡", zh: "Ancient Wisdom Cards",
      icons: {
        horse:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M7 20V12a5 5 0 0 1 10 0v8"/><circle cx="7" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>',
        journey:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20c4-8 8-8 8-14"/><circle cx="12" cy="4" r="1.4"/></svg>',
        stone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c4 5 6 8 6 11a6 6 0 1 1-12 0c0-3 2-6 6-11z"/></svg>',
        self:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/></svg>',
        stillness:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 2-1 3-1 5a1 1 0 0 0 2 0"/><rect x="9" y="9" width="6" height="11"/></svg>',
        mistake:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h4v-4h4v-4h4v-4h4v-4"/></svg>'
      },
      cards: [
        { id:'horse', title:'塞翁失马', py:'Sāiwēng shī mǎ', eyebrow:'古训 · Ancient wisdom',
          cn:'古语说"塞翁失马，焉知非福"——现在看起来不顺的事，有时候是换了个方向的开始。',
          en:'"The old man lost his horse — who knows if it isn’t a blessing."',
          he:'"הזקן איבד את הסוס - מי יודע אם זו לא ברכה".' },
        { id:'journey', title:'千里之行', py:'Qiānlǐ zhī xíng', eyebrow:'古训 · Ancient wisdom',
          cn:'"千里之行，始于足下"——出自老子。再远的目标，也是从第一步开始的。',
          en:'"A journey of a thousand miles begins with a single step" — Laozi.',
          he:'"מסע של אלף מיל מתחיל בצעד אחד" - לאו דזה.' },
        { id:'stone', title:'水滴石穿', py:'Shuǐ dī shí chuān', eyebrow:'古训 · Ancient wisdom',
          cn:'"水滴石穿"——不是靠一次用力，而是靠不断地坚持。',
          en:'"Dripping water wears through stone" — steady persistence.',
          he:'"טיפה טיפה מחוררת את האבן" - התמדה, לא כוח חד פעמי.' },
        { id:'self', title:'自知者明', py:'Zì zhī zhě míng', eyebrow:'古训 · Ancient wisdom',
          cn:'"知人者智，自知者明"——出自《道德经》。了解自己才是真正的清醒。',
          en:'"Knowing others is wisdom, knowing yourself is enlightenment" — Tao Te Ching.',
          he:'"להכיר אחרים זו חוכמה, להכיר את עצמך זו הארה".' },
        { id:'stillness', title:'静以修身', py:'Jìng yǐ xiūshēn', eyebrow:'古训 · Ancient wisdom',
          cn:'"静以修身，俭以养德"——出自诸葛亮《诫子书》。安静能让人看清自己。',
          en:'"Stillness cultivates the self, frugality nurtures virtue" — Zhuge Liang.',
          he:'"שקט מטפח את העצמי, צניעות מטפחת מידה טובה".' },
        { id:'mistake', title:'吃一堑，长一智', py:'Chī yī qiàn, zhǎng yí zhì', eyebrow:'古训 · Ancient wisdom',
          cn:'"吃一堑，长一智"——每一次跌倒，都是在教你一点东西。',
          en:'"A fall into a pit is a gain in wit" — every stumble teaches you something.',
          he:'"נפילה לבור היא רווח בתבונה".' }
      ]
    },
    { n: 7, id: "heart", title: "心动卡", zh: "Heart-Flutter Cards",
      icons: {
        eyes:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/></svg>',
        honest:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v10H9l-4 4V5z"/></svg>',
        patience:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v4l-5 5 5 5v4H6v-4l5-5-5-5V3z"/></svg>',
        worth:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/><path d="M12 9l.6 1.3L14 11l-1.4.7L12 13l-.6-1.3L10 11l1.4-.7z"/></svg>',
        letgo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v10M8 8l4-5 4 5"/><path d="M5 13c2 5 5 8 7 8s5-3 7-8"/></svg>',
        express:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19s-6-4-7.5-7.5A4 4 0 0 1 12 8a4 4 0 0 1 7.5 3.5C18 15 12 19 12 19z"/></svg>'
      },
      cards: [
        { id:'eyes', title:'眼神', py:'Eye contact', eyebrow:'心动卡',
          cn:'你抽到了"眼神"。很多关系的开始，其实只是多一秒的对视。',
          en:'You drew "Eye Contact." Many connections start with one extra second of eye contact.',
          he:'בחרת ב"מבט". הרבה קשרים מתחילים רק משנייה נוספת של מבט.' },
        { id:'honest', title:'坦白', py:'Honesty', eyebrow:'心动卡',
          cn:'你抽到了"坦白"。关系里最难也最值得的一步，是说出你真正的感受。',
          en:'You drew "Honesty." The hardest and most worthwhile step is saying how you feel.',
          he:'בחרת ב"כנות". הצעד הקשה והמשתלם הוא לומר איך אתה באמת מרגיש.' },
        { id:'patience', title:'耐心', py:'Patience', eyebrow:'心动卡',
          cn:'你抽到了"耐心"。好的感情很少是一拍即合的。',
          en:'You drew "Patience." Good relationships rarely click instantly.',
          he:'בחרת ב"סבלנות". קשרים טובים לרוב לא קורים מיד.' },
        { id:'worth', title:'自我价值', py:'Self-worth', eyebrow:'心动卡',
          cn:'你抽到了"自我价值"。真正吸引人的，是你清楚自己值得被好好对待。',
          en:'You drew "Self-worth." What attracts people is knowing you deserve to be treated well.',
          he:'בחרת ב"ערך עצמי". מה שבאמת מושך זו הידיעה שאתה ראוי ליחס טוב.' },
        { id:'letgo', title:'放手', py:'Letting go', eyebrow:'心动卡',
          cn:'你抽到了"放手"。学会放手，也是爱自己的一种方式。',
          en:'You drew "Letting Go." Letting go is also a form of loving yourself.',
          he:'בחרת ב"שחרור". לשחרר זו גם צורה לאהוב את עצמך.' },
        { id:'express', title:'表达', py:'Expression', eyebrow:'心动卡',
          cn:'你抽到了"表达"。一句简单的"我在乎你"，有时候比什么都有用。',
          en:'You drew "Expression." A simple "I care about you" can be the most powerful thing.',
          he:'בחרת ב"ביטוי". משפט פשוט כמו "אכפת לי ממך" הוא לפעמים הכי חזק.' }
      ]
    },
    { n: 8, id: "decision", title: "决策卡", zh: "Decision Cards",
      icons: {
        risk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1" fill="currentColor" stroke="none"/></svg>',
        negotiate:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 7h14M5 7l-3 6h6zM19 7l-3 6h6z"/></svg>',
        lead:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18h16M4 18l1-9 4 4 3-6 3 6 4-4 1 9"/></svg>',
        timing:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
        resilience:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16c3 0 3-10 6-10s2 7 5 7 3-6 5-6"/></svg>',
        focus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none"/></svg>'
      },
      cards: [
        { id:'risk', title:'冒险', py:'Risk', eyebrow:'决策卡',
          cn:'你抽到了"冒险"。好的机会很少看起来百分百安全。',
          en:'You drew "Risk." What matters is whether you can handle the worst case.',
          he:'בחרת ב"סיכון". השאלה היא אם אתה יכול לשאת את התרחיש הגרוע ביותר.' },
        { id:'negotiate', title:'谈判', py:'Negotiation', eyebrow:'决策卡',
          cn:'你抽到了"谈判"。真正厉害的谈判是找到双方都能接受的那个点。',
          en:'You drew "Negotiation." Real skill is finding the point both sides accept.',
          he:'בחרת ב"משא ומתן". כישרון אמיתי הוא למצוא נקודה ששניכם יכולים לקבל.' },
        { id:'lead', title:'领导力', py:'Leadership', eyebrow:'决策卡',
          cn:'你抽到了"领导力"。好的领导者是愿意为团队的决定负责的人。',
          en:'You drew "Leadership." A good leader takes responsibility.',
          he:'בחרת ב"מנהיגות". מנהיג טוב מוכן לקחת אחריות.' },
        { id:'timing', title:'时机', py:'Timing', eyebrow:'决策卡',
          cn:'你抽到了"时机"。有时候不是方案不好，是时间还没到。',
          en:'You drew "Timing." Sometimes the plan isn’t bad, the timing isn’t right yet.',
          he:'בחרת ב"תזמון". לפעמים התוכנית לא רעה, רק שהזמן עוד לא הגיע.' },
        { id:'resilience', title:'韧性', py:'Resilience', eyebrow:'决策卡',
          cn:'你抽到了"韧性"。生意上的失败很少是终点。',
          en:'You drew "Resilience." Failure in business is rarely the end.',
          he:'בחרת ב"חוסן". כישלון עסקי לרוב הוא לא סוף הדרך.' },
        { id:'focus', title:'专注', py:'Focus', eyebrow:'决策卡',
          cn:'你抽到了"专注"。想做的事情太多，反而什么都做不好。',
          en:'You drew "Focus." Doing too many things often means doing none well.',
          he:'בחרת ב"מיקוד". לנסות לעשות יותר מדי לרוב אומר לא לעשות אף אחד טוב.' }
      ]
    },
    { n: 9, id: "exam", title: "考试减压卡", zh: "Exam Stress Cards",
      icons: {
        anxiety:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>',
        review:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6c-2-2-5-2-8-1v13c3-1 6-1 8 1 2-2 5-2 8-1V5c-3-1-6-1-8 1z"/></svg>',
        sleep:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3a9 9 0 1 0 6 15 7 7 0 0 1-6-15z"/></svg>',
        compare:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V10M12 20V4M19 20v14"/></svg>',
        fail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-4 10-10 3 3-10 10z"/><path d="M14 7l3 3"/></svg>',
        persist:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h4v-4h4v-4h4v-4h4v-4"/></svg>'
      },
      cards: [
        { id:'anxiety', title:'焦虑', py:'Anxiety', eyebrow:'考试减压卡',
          cn:'你抽到了"焦虑"。考试前紧张是正常的，身体只是在提醒你这件事很重要。',
          en:'You drew "Anxiety." Feeling nervous before an exam is normal.',
          he:'בחרת ב"חרדה". להיות עצבני לפני מבחן זה נורמלי.' },
        { id:'review', title:'复习', py:'Review method', eyebrow:'考试减压卡',
          cn:'你抽到了"复习"。先挑出自己最不确定的部分，集中突破。',
          en:'You drew "Review." Pick the part you’re least sure about first.',
          he:'בחרת ב"חזרה". תבחר את החלק שהכי פחות בטוח ותתמקד בו קודם.' },
        { id:'sleep', title:'睡眠', py:'Sleep', eyebrow:'考试减压卡',
          cn:'你抽到了"睡眠"。熬夜多看一小时书，往往不如睡好这一晚更有用。',
          en:'You drew "Sleep." One more hour studying is often worth less than sleep.',
          he:'בחרת ב"שינה". שעה נוספת של לימוד שווה פחות משינה טובה.' },
        { id:'compare', title:'比较', py:'Comparison', eyebrow:'考试减压卡',
          cn:'你抽到了"比较"。别人的进度不是你的进度。',
          en:'You drew "Comparison." Someone else’s pace isn’t your pace.',
          he:'בחרת ב"השוואה". הקצב של מישהו אחר הוא לא הקצב שלך.' },
        { id:'fail', title:'失败', py:'Fear of failure', eyebrow:'考试减压卡',
          cn:'你抽到了"失败"。一次考试决定不了你是谁。',
          en:'You drew "Failure." One exam doesn’t define who you are.',
          he:'בחרת ב"כישלון". מבחן אחד לא קובע מי אתה.' },
        { id:'persist', title:'坚持', py:'Perseverance', eyebrow:'考试减压卡',
          cn:'你抽到了"坚持"。今天多做一道题，长期加起来就是差距。',
          en:'You drew "Perseverance." One more problem today adds up over time.',
          he:'בחרת ב"התמדה". תרגיל אחד נוסף היום נצבר לאורך זמן.' }
      ]
    },
    { n: 10, id: "hebrew", title: "希伯来数字密码", zh: "Hebrew Number Code",
      icons: {
        aleph:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/></svg>',
        chet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16M18 4v16M6 8h12"/></svg>',
        lamed:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L20 4"/><path d="M20 4h-6M20 4v6"/></svg>',
        shin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 1 1 2 2 1-1-2-1-4 1-7z"/></svg>',
        yod:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2"/></svg>',
        gimel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 6v7M8 10l4 3 4-3M9 20l3-7 3 7"/></svg>'
      },
      cards: [
        { id:'aleph', title:'א Aleph', py:'数值 1', eyebrow:'希伯来数字密码',
          cn:'希伯来字母表的第一个字母，代表"开始"与"合一"。',
          en:'The first letter of the Hebrew alphabet, meaning beginning and oneness.',
          he:'האות הראשונה באלפבית העברי, מייצגת התחלה ואחדות.' },
        { id:'chet', title:'ח Chet', py:'数值 8', eyebrow:'希伯来数字密码',
          cn:'数值是8。在希伯来传统里，8代表超越自然循环之外的"新开始"。',
          en:'Its value is 8, traditionally a "new beginning" beyond the natural cycle.',
          he:'הערך שלה הוא 8, מייצג מסורתית "התחלה חדשה".' },
        { id:'lamed', title:'ל Lamed', py:'数值 30', eyebrow:'希伯来数字密码',
          cn:'这个字母的形状向上延伸，像一颗渴望学习的心。',
          en:'Shaped reaching upward, like a heart that longs to learn.',
          he:'הצורה שלה משתרעת כלפי מעלה, כמו לב שמשתוקק ללמוד.' },
        { id:'shin', title:'ש Shin', py:'数值 300', eyebrow:'希伯来数字密码',
          cn:'形状像一团火焰，象征转变与更新的力量。',
          en:'Shaped like a flame, symbolizing transformation and renewal.',
          he:'צורתה כמו להבה, מסמלת שינוי וחידוש.' },
        { id:'yod', title:'י Yod', py:'数值 10', eyebrow:'希伯来数字密码',
          cn:'希伯来字母里最小的一个，却被认为蕴含最大的潜力。',
          en:'The smallest letter, yet considered to hold the greatest potential.',
          he:'האות הקטנה ביותר, אך נחשבת לבעלת הפוטנציאל הגדול ביותר.' },
        { id:'gimel', title:'ג Gimel', py:'数值 3', eyebrow:'希伯来数字密码',
          cn:'它的形状像一个人伸腿向前走，传统上与"给予"联系在一起。',
          en:'Shaped like a person striding forward, linked with giving.',
          he:'צורתה כמו אדם שפוסע קדימה, קשורה לנתינה.' }
      ]
    }
  ];

  var RIDDLES = [
    { num:'01', q_cn:'什么东西，别人点燃了它，它却为别人发光，直到把自己燃尽？', a_cn:'答案：蜡烛。它燃烧自己照亮别人，直到完全烧尽。',
      q_en:'Someone lights it, and it shines for others until it burns itself out. What is it?', a_en:'Answer: a candle.',
      q_he:'מישהו מדליק אותה, והיא מאירה לאחרים עד שהיא נשרפת כליל. מה זה?', a_he:'תשובה: נר.' },
    { num:'02', q_cn:'什么东西要先打破，才能被好好使用？', a_cn:'答案：鸡蛋。要先打破蛋壳，才能用到里面的蛋。',
      q_en:'What must be broken before it can be put to good use?', a_en:'Answer: an egg.',
      q_he:'מה צריך לשבור לפני שאפשר להשתמש בו כמו שצריך?', a_he:'תשובה: ביצה.' },
    { num:'03', q_cn:'什么东西整天被别人叫来叫去，自己却从来不用它来称呼自己？', a_cn:'答案：名字。',
      q_en:'Something others call out all day, yet you never use it to refer to yourself?', a_en:'Answer: your name.',
      q_he:'משהו שאחרים קוראים לו כל היום, אבל אתה עצמך אף פעם לא משתמש בו כדי לקרוא לעצמך?', a_he:'תשובה: השם שלך.' },
    { num:'04', q_cn:'什么东西专门帮别人擦掉错误，自己却越用越小？', a_cn:'答案：橡皮擦。',
      q_en:'Something whose job is erasing mistakes, while it shrinks with every use?', a_en:'Answer: an eraser.',
      q_he:'משהו שתפקידו למחוק טעויות, אבל הוא עצמו מתכווץ עם כל שימוש?', a_he:'תשובה: מחק.' },
    { num:'05', q_cn:'什么东西有光就跟着你，没光就消失，你永远追不上也甩不掉？', a_cn:'答案：影子。',
      q_en:'Something that follows you whenever there is light, and vanishes without it?', a_en:'Answer: your shadow.',
      q_he:'משהו שעוקב אחריך כשיש אור, ונעלם בלעדיו?', a_he:'תשובה: הצל שלך.' },
    { num:'06', q_cn:'什么东西你对它说话，它就把你的话原样还给你，却从来没有自己的想法？', a_cn:'答案：回声。',
      q_en:'Something you speak to, and it repeats your words back exactly?', a_en:'Answer: an echo.',
      q_he:'משהו שאתה מדבר אליו, והוא מחזיר לך בדיוק את מה שאמרת?', a_he:'תשובה: הד.' }
  ];

  var html = '<div class="cc-page">' +
    '<section class="cc-hero">' +
      '<div class="cc-medal" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10c-2-3-1-6 1-6s2 3 1 5"/><path d="M16 10c2-3 1-6-1-6s-2 3-1 5"/><circle cx="12" cy="13" r="5"/><path d="M9 21c0-3 1-5 3-5s3 2 3 5"/></svg></div>' +
      '<span class="cc-eyebrow">2027年2月6日起 · From Feb 6, 2027</span>' +
      '<h2 class="cc-fest-title">火羊年</h2>' +
      '<p class="cc-fest-sub">Year of the Fire Goat</p>' +
    '</section>' +
    '<header>' +
      '<span class="cc-badge">中国市场创意合集</span>' +
      '<h1>心镜</h1>' +
      '<p class="cc-tagline">11 个为中文用户设计的互动卡牌体验</p>' +
      '<nav class="cc-deck-nav">' + DECKS.map(function(d){ return '<a href="#ccDeck' + d.n + '">' + d.title + '</a>'; }).join('') + '<a href="#ccDeck12">脑筋急转弯</a></nav>' +
    '</header>' +
    DECKS.map(function(d){
      return '<section class="cc-deck cc-deck-' + d.n + '" id="ccDeck' + d.n + '">' +
        '<span class="cc-deck-eyebrow">0' + d.n + '</span>' +
        '<h2 class="cc-section-title">' + d.title + ' <span class="cc-zh">' + d.zh + '</span></h2>' +
        '<div class="cc-spread" id="ccSpread' + d.n + '"></div>' +
        '<div class="cc-result" id="ccResult' + d.n + '" hidden></div>' +
      '</section>';
    }).join('') +
    '<section class="cc-deck cc-deck-11" id="ccDeck12">' +
      '<span class="cc-deck-eyebrow">12</span>' +
      '<h2 class="cc-section-title">脑筋急转弯 <span class="cc-zh">Brain-Teaser Riddles</span></h2>' +
      '<div class="cc-spread" id="ccSpread12"></div>' +
      '<div class="cc-result" id="ccResult12" hidden></div>' +
    '</section>' +
    '<p class="cc-foot">概念演示 · 非最终产品</p>' +
  '</div>';
  root.innerHTML = html;

  function buildDeck(spreadId, resultId, icons, cards) {
    var spread = document.getElementById(spreadId);
    var result = document.getElementById(resultId);
    var chosen = null;

    cards.forEach(function (c) {
      var btn = document.createElement("button");
      btn.className = "cc-card";
      btn.type = "button";
      btn.innerHTML =
        '<span class="cc-card-inner">' +
          '<span class="cc-card-face cc-back">' + BACK_ICON + "</span>" +
          '<span class="cc-card-face cc-front">' + icons[c.id] + "<strong>" + c.title + "</strong><em>" + c.py + "</em></span>" +
        "</span>";
      btn.addEventListener("click", function () { pick(c, btn); });
      spread.appendChild(btn);
    });

    function pick(c, btn) {
      if (chosen) return;
      chosen = c;
      Array.prototype.forEach.call(spread.children, function (el) {
        if (el === btn) el.classList.add("flipped");
        else el.classList.add("dim");
      });
      setTimeout(function () {
        result.innerHTML =
          '<div class="cc-result-card">' +
            '<span class="cc-result-eyebrow">' + c.eyebrow + "</span>" +
            '<h2 class="cc-result-title">' + c.title + "<span>" + c.py + "</span></h2>" +
            '<p class="cc-cn">' + c.cn + "</p>" +
            '<div class="cc-divider"></div>' +
            '<p class="cc-en">' + c.en + "</p>" +
            '<p class="cc-he" dir="rtl">' + c.he + "</p>" +
            '<button type="button" class="cc-reset-btn">再选一张 · Pick another</button>' +
          "</div>";
        result.hidden = false;
        result.querySelector(".cc-reset-btn").addEventListener("click", reset);
        result.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
      }, 420);
    }

    function reset() {
      chosen = null;
      Array.prototype.forEach.call(spread.children, function (el) { el.classList.remove("flipped", "dim"); });
      result.hidden = true;
      result.innerHTML = "";
    }
  }

  function buildRiddleDeck(spreadId, resultId, cards) {
    var spread = document.getElementById(spreadId);
    var result = document.getElementById(resultId);
    var chosen = null;

    cards.forEach(function (c) {
      var btn = document.createElement("button");
      btn.className = "cc-card";
      btn.type = "button";
      btn.innerHTML =
        '<span class="cc-card-inner">' +
          '<span class="cc-card-face cc-back">' + QMARK_ICON + "</span>" +
          '<span class="cc-card-face cc-front">' + QMARK_ICON + "<strong>谜题</strong><em>" + c.num + "</em></span>" +
        "</span>";
      btn.addEventListener("click", function () { pick(c, btn); });
      spread.appendChild(btn);
    });

    function pick(c, btn) {
      if (chosen) return;
      chosen = c;
      Array.prototype.forEach.call(spread.children, function (el) {
        if (el === btn) el.classList.add("flipped");
        else el.classList.add("dim");
      });
      setTimeout(function () {
        result.innerHTML =
          '<div class="cc-result-card">' +
            '<span class="cc-result-eyebrow">脑筋急转弯 · Riddle ' + c.num + "</span>" +
            '<p class="cc-cn">' + c.q_cn + "</p>" +
            '<div class="cc-divider"></div>' +
            '<p class="cc-en">' + c.q_en + "</p>" +
            '<p class="cc-he" dir="rtl">' + c.q_he + "</p>" +
            '<button type="button" class="cc-reveal-btn">显示答案 · Show answer</button>' +
            '<div class="cc-riddle-answer" hidden>' +
              '<div class="cc-divider"></div>' +
              '<p class="cc-cn">' + c.a_cn + "</p>" +
              '<p class="cc-en">' + c.a_en + "</p>" +
              '<p class="cc-he" dir="rtl">' + c.a_he + "</p>" +
            "</div>" +
            '<button type="button" class="cc-reset-btn">再抽一张 · Pick another</button>' +
          "</div>";
        result.hidden = false;
        result.querySelector(".cc-reveal-btn").addEventListener("click", function (e) {
          result.querySelector(".cc-riddle-answer").hidden = false;
          e.target.hidden = true;
        });
        result.querySelector(".cc-reset-btn").addEventListener("click", reset);
        result.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
      }, 420);
    }

    function reset() {
      chosen = null;
      Array.prototype.forEach.call(spread.children, function (el) { el.classList.remove("flipped", "dim"); });
      result.hidden = true;
      result.innerHTML = "";
    }
  }

  DECKS.forEach(function (d) {
    buildDeck("ccSpread" + d.n, "ccResult" + d.n, d.icons, d.cards);
  });
  buildRiddleDeck("ccSpread12", "ccResult12", RIDDLES);
})();
