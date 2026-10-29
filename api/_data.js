// Real advisors only - this list renders directly as the public advisor
// cards on the site, so never add a placeholder/fake entry here. To
// onboard a new advisor once they're real and ready: add an entry below
// (id is internal, used in URLs/storage, doesn't need to match the display
// name), add their WhatsApp number to ADVISOR_WHATSAPP and a PIN to
// ADVISOR_TOKENS below, and send them their own /berater.html?advisor=<id>
// link - the availability toggle, the live-call picker and the admin tools
// all already work generically across however many advisors are listed here.
export const ADVISORS = [
  { id: "papuli", name: "Papuli", title: "Tarot, Astrologie & Zukunft", specialty: ["Tarot", "Liebe & Beziehung", "Zukunft", "Astrologie", "Numerologie"], style: "warm, intuitiv, empathisch und direkt", active: true }
];

export const ADVISOR_CAPACITY = 100;

// Private contact info, keyed by advisor id — used only server-side to send
// WhatsApp session-code notifications. Never exposed via api/advisors.js.
export const ADVISOR_WHATSAPP = {
  papuli: "+491732960046"
};

// Private per-advisor PIN that authorizes her own "available now" toggle at
// /berater.html. She types it once; the browser remembers it after that.
// Never exposed via api/advisors.js.
export const ADVISOR_TOKENS = {
  papuli: "161098"
};

export function getAdvisor(advisorId) {
  return ADVISORS.find(a => a.id === String(advisorId || "papuli").toLowerCase()) || ADVISORS[0];
}

// Single source of truth for live-audio pricing. Priced per number of topics
// covered in the session, not per time slot — more topics means a longer,
// deeper call, so the price scales with topic count instead of a clock.
// amount is in cents (for Stripe), label is the display string used across
// the frontend. BRL/MXN/JPY/CNY/INR each get their own fair-converted
// amount/label (not a same-digits symbol swap like GBP) — computed with the
// same per-currency ratio already used for the AI single-reading price in
// api/checkout.js's AI_AMOUNTS_BY_CURRENCY (e.g. mxn ratio = 8900/499),
// applied to the base EUR amount and rounded to a clean number. Without a
// currency-specific entry, checkout.js previously fell through to the raw
// EUR-cents amount even when actually charging in that currency — e.g. an
// INR customer was charged ₹49.99 for a live session instead of ₹2,500.
export const VOICE_PRICES = {
  1: {
    amount: 4999, label: "49,99",
    brl: { amount: 24999, label: "249,99" },
    mxn: { amount: 89000, label: "890,00" },
    jpy: { amount: 7500, label: "7.500" },
    cny: { amount: 39000, label: "390,00" },
    inr: { amount: 250000, label: "2.500,00" }
  },
  2: {
    amount: 8990, label: "89,90",
    brl: { amount: 44990, label: "449,90" },
    mxn: { amount: 160000, label: "1.600,00" },
    jpy: { amount: 13500, label: "13.500" },
    cny: { amount: 70000, label: "700,00" },
    inr: { amount: 450000, label: "4.500,00" }
  },
  3: {
    amount: 11990, label: "119,90",
    brl: { amount: 59990, label: "599,90" },
    mxn: { amount: 214000, label: "2.140,00" },
    jpy: { amount: 18000, label: "18.000" },
    cny: { amount: 94000, label: "940,00" },
    inr: { amount: 600000, label: "6.000,00" }
  }
};
