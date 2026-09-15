/*
 * DEGAJA Advisor Registry
 *
 * The engine is intentionally data-driven: adding advisor 11, 12 ... 100
 * means adding a profile here. The AI/oracle engine does not need to be
 * duplicated per advisor.
 */

window.DEGAJA_ADVISORS = [
  {
    id: "anna",
    name: "Anna",
    title: "Tarot & Liebe",
    specialty: ["Liebe & Beziehung", "Tarot"],
    style: "warm, intuitive, empathetic and direct",
    active: true,
    voice: "german-female-1"
  },
  {
    id: "sophie",
    name: "Sophie",
    title: "Beziehung & Gefühle",
    specialty: ["Liebe & Beziehung"],
    style: "gentle, emotionally intelligent and reassuring",
    active: true,
    voice: "german-female-2"
  },
  {
    id: "lea",
    name: "Lea",
    title: "Zukunft & Karten",
    specialty: ["Zukunft", "Tarot"],
    style: "mystical, reflective and concise",
    active: true,
    voice: "german-female-3"
  },
  {
    id: "maria",
    name: "Maria",
    title: "Numerologie",
    specialty: ["Numerologie", "Zukunft"],
    style: "calm, analytical and spiritual",
    active: true,
    voice: "german-female-4"
  },
  {
    id: "clara",
    name: "Clara",
    title: "Astrologie",
    specialty: ["Astrologie", "Zukunft"],
    style: "elegant, thoughtful and optimistic",
    active: true,
    voice: "german-female-5"
  },
  {
    id: "julia",
    name: "Julia",
    title: "Liebe & Partnerschaft",
    specialty: ["Liebe & Beziehung"],
    style: "friendly, supportive and practical",
    active: true,
    voice: "german-female-6"
  },
  {
    id: "elena",
    name: "Elena",
    title: "Tarot & Intuition",
    specialty: ["Tarot", "Zukunft"],
    style: "deep, intuitive and compassionate",
    active: true,
    voice: "german-female-7"
  },
  {
    id: "laura",
    name: "Laura",
    title: "Beruf & Lebensweg",
    specialty: ["Beruf & Karriere", "Zukunft"],
    style: "clear, motivating and grounded",
    active: true,
    voice: "german-female-8"
  },
  {
    id: "nina",
    name: "Nina",
    title: "Karten & Beziehungen",
    specialty: ["Tarot", "Liebe & Beziehung"],
    style: "soft, perceptive and personal",
    active: true,
    voice: "german-female-9"
  },
  {
    id: "isabella",
    name: "Isabella",
    title: "Astrologie & Numerologie",
    specialty: ["Astrologie", "Numerologie"],
    style: "refined, warm and reflective",
    active: true,
    voice: "german-female-10"
  }
];

window.DEGAJA_ADVISOR_LIMIT = 100;

/* Central live-consultation price guard.
 * The live-consult.js card already uses these values. This observer also
 * corrects the legacy consultation modal in script.js so the public UI
 * cannot continue showing the previous prices.
 */
window.DEGAJA_LIVE_PRICES = {
  15: "29,99",
  30: "54,99",
  60: "99,99"
};

(() => {
  "use strict";

  const prices = window.DEGAJA_LIVE_PRICES;

  function fixText(root = document) {
    const replacements = [
      ["€19,99", `€${prices[15]}`],
      ["€24,99", `€${prices[15]}`],
      ["€29,99", `€${prices[30]}`],
      ["€34,99", `€${prices[30]}`],
      ["€49,99", `€${prices[60]}`],
      ["€54,99", `€${prices[60]}`]
    ];

    const walker = document.createTreeWalker(root.body || root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    nodes.forEach(textNode => {
      let value = textNode.nodeValue;
      replacements.forEach(([from, to]) => {
        if (value.includes(from)) value = value.split(from).join(to);
      });
      if (value !== textNode.nodeValue) textNode.nodeValue = value;
    });
  }

  function init() {
    fixText();
    const observer = new MutationObserver(() => fixText());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
