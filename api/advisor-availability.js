import { ADVISORS, ADVISOR_TOKENS } from "./_data.js";
import { getAvailability, setAvailable } from "./_availability.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const status = await getAvailability();
    const available = {};
    for (const a of ADVISORS) available[a.id] = !!status[a.id];
    return res.status(200).json({ available });
  }

  if (req.method === "POST") {
    const { advisorId, token, available } = req.body || {};
    const expected = advisorId && ADVISOR_TOKENS[advisorId];
    if (!expected || expected !== token) {
      return res.status(403).json({ error: "Invalid token" });
    }
    try {
      await setAvailable(advisorId, !!available);
      return res.status(200).json({ ok: true, available: !!available });
    } catch (error) {
      return res.status(500).json({ error: "Could not update status", detail: String(error.message || error) });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
