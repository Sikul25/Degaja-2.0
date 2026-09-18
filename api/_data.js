export const ADVISORS = [
  { id: "anna", name: "Anna", title: "Tarot & Liebe", specialty: ["Liebe & Beziehung", "Tarot"], style: "warm, intuitiv, empathisch und direkt", active: true },
  { id: "sophie", name: "Sophie", title: "Beziehung & Gefühle", specialty: ["Liebe & Beziehung"], style: "sanft, emotional intelligent und beruhigend", active: true },
  { id: "lea", name: "Lea", title: "Zukunft & Karten", specialty: ["Zukunft", "Tarot"], style: "mystisch, reflektiert und prägnant", active: true },
  { id: "maria", name: "Maria", title: "Numerologie", specialty: ["Numerologie", "Zukunft"], style: "ruhig, analytisch und spirituell", active: true },
  { id: "clara", name: "Clara", title: "Astrologie", specialty: ["Astrologie", "Zukunft"], style: "elegant, aufmerksam und optimistisch", active: true },
  { id: "julia", name: "Julia", title: "Liebe & Partnerschaft", specialty: ["Liebe & Beziehung"], style: "freundlich, unterstützend und praktisch", active: true },
  { id: "elena", name: "Elena", title: "Tarot & Intuition", specialty: ["Tarot", "Zukunft"], style: "tief, intuitiv und mitfühlend", active: true },
  { id: "laura", name: "Laura", title: "Beruf & Lebensweg", specialty: ["Beruf & Karriere", "Zukunft"], style: "klar, motivierend und bodenständig", active: true },
  { id: "nina", name: "Nina", title: "Karten & Beziehungen", specialty: ["Tarot", "Liebe & Beziehung"], style: "sanft, feinfühlig und persönlich", active: true },
  { id: "isabella", name: "Isabella", title: "Astrologie & Numerologie", specialty: ["Astrologie", "Numerologie"], style: "warm, kultiviert und reflektiert", active: true }
];

export const ADVISOR_CAPACITY = 100;

export function getAdvisor(advisorId) {
  return ADVISORS.find(a => a.id === String(advisorId || "anna").toLowerCase()) || ADVISORS[0];
}

// Single source of truth for live-audio pricing. amount is in cents (for Stripe),
// label is the display string used across the frontend.
export const VOICE_PRICES = {
  15: { amount: 2999, label: "29,99" },
  30: { amount: 5999, label: "59,99" },
  60: { amount: 9999, label: "99,99" }
};
