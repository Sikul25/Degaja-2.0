import { ADVISORS, ADVISOR_CAPACITY, VOICE_PRICES } from "./_data.js";

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const prices = Object.fromEntries(
    Object.entries(VOICE_PRICES).map(([duration, price]) => [duration, price.label])
  );

  return res.status(200).json({ advisors: ADVISORS, capacity: ADVISOR_CAPACITY, prices });
}
