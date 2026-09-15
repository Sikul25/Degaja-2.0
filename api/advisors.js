const ADVISORS = [
  { id: "anna", name: "Anna", title: "Tarot & Liebe", specialty: ["Liebe & Beziehung", "Tarot"], active: true },
  { id: "sophie", name: "Sophie", title: "Beziehung & Gefühle", specialty: ["Liebe & Beziehung"], active: true },
  { id: "lea", name: "Lea", title: "Zukunft & Karten", specialty: ["Zukunft", "Tarot"], active: true },
  { id: "maria", name: "Maria", title: "Numerologie", specialty: ["Numerologie", "Zukunft"], active: true },
  { id: "clara", name: "Clara", title: "Astrologie", specialty: ["Astrologie", "Zukunft"], active: true },
  { id: "julia", name: "Julia", title: "Liebe & Partnerschaft", specialty: ["Liebe & Beziehung"], active: true },
  { id: "elena", name: "Elena", title: "Tarot & Intuition", specialty: ["Tarot", "Zukunft"], active: true },
  { id: "laura", name: "Laura", title: "Beruf & Lebensweg", specialty: ["Beruf & Karriere", "Zukunft"], active: true },
  { id: "nina", name: "Nina", title: "Karten & Beziehungen", specialty: ["Tarot", "Liebe & Beziehung"], active: true },
  { id: "isabella", name: "Isabella", title: "Astrologie & Numerologie", specialty: ["Astrologie", "Numerologie"], active: true }
];

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  return res.status(200).json({ advisors: ADVISORS, capacity: 100 });
}
