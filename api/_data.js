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
// the frontend. BRL gets its own fair-converted amount/label (not a
// same-digits symbol swap like GBP).
export const VOICE_PRICES = {
  1: { amount: 4999, label: "49,99", brl: { amount: 24999, label: "249,99" } },
  2: { amount: 8990, label: "89,90", brl: { amount: 44990, label: "449,90" } },
  3: { amount: 11990, label: "119,90", brl: { amount: 59990, label: "599,90" } }
};
