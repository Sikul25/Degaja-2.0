// Single real advisor. To rename her, just change `name` below — the id
// stays internal (used in URLs/storage) and doesn't need to match the name.
export const ADVISORS = [
  { id: "papuli", name: "Papuli", title: "Tarot, Astrologie & Zukunft", specialty: ["Tarot", "Liebe & Beziehung", "Zukunft", "Astrologie", "Numerologie"], style: "warm, intuitiv, empathisch und direkt", active: true }
];

export const ADVISOR_CAPACITY = 100;

export function getAdvisor(advisorId) {
  return ADVISORS.find(a => a.id === String(advisorId || "papuli").toLowerCase()) || ADVISORS[0];
}

// Single source of truth for live-audio pricing. amount is in cents (for Stripe),
// label is the display string used across the frontend.
export const VOICE_PRICES = {
  15: { amount: 2999, label: "29,99" },
  30: { amount: 5999, label: "59,99" },
  60: { amount: 9999, label: "99,99" }
};
