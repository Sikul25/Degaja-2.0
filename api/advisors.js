import { ADVISORS, ADVISOR_CAPACITY, VOICE_PRICES } from "./_data.js";

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const currency = String(req.query.currency || "").toLowerCase();
  const prices = Object.fromEntries(
    Object.entries(VOICE_PRICES).map(([duration, price]) => {
      const forCurrency = currency === "brl" && price.brl ? price.brl : price;
      return [duration, forCurrency.label];
    })
  );

  return res.status(200).json({ advisors: ADVISORS, capacity: ADVISOR_CAPACITY, prices });
}
