// Single real advisor. To rename her, just change `name` below — the id
// stays internal (used in URLs/storage) and doesn't need to match the name.
export const ADVISORS = [
  { id: "papuli", name: "Papuli", title: "Tarot, Astrologie & Zukunft", specialty: ["Tarot", "Liebe & Beziehung", "Zukunft", "Astrologie", "Numerologie"], style: "warm, intuitiv, empathisch und direkt", active: true }
];

export const ADVISOR_CAPACITY = 100;

// Private contact info, keyed by advisor id — used only server-side to send
// WhatsApp session-code notifications. Never exposed via api/advisors.js.
export const ADVISOR_WHATSAPP = {
  papuli: "+491732960046"
};

export function getAdvisor(advisorId) {
  return ADVISORS.find(a => a.id === String(advisorId || "papuli").toLowerCase()) || ADVISORS[0];
}

// Single source of truth for live-audio pricing. amount is in cents (for Stripe),
// label is the display string used across the frontend. BRL gets its own
// fair-converted amount/label (not a same-digits symbol swap like GBP).
export const VOICE_PRICES = {
  15: { amount: 2999, label: "29,99", brl: { amount: 14999, label: "149,99" } },
  30: { amount: 5999, label: "59,99", brl: { amount: 29999, label: "299,99" } },
  60: { amount: 9999, label: "99,99", brl: { amount: 49999, label: "499,99" } }
};
