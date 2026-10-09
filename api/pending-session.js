import { getAdvisor } from "./_data.js";
import { getPending, setPending } from "./_pending.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const advisorId = getAdvisor(req.query?.advisorId).id;
    const entry = await getPending(advisorId);
    return res.status(200).json({ pending: entry || null });
  }

  if (req.method === "POST") {
    const { advisorId, code, customerName, link } = req.body || {};
    if (!code || !/^\d{6}$/.test(String(code))) {
      return res.status(400).json({ error: "Valid 6-digit code required" });
    }
    const advisor = getAdvisor(advisorId);
    const ok = await setPending(advisor.id, {
      code: String(code),
      customerName: String(customerName || "").slice(0, 60),
      link: typeof link === "string" ? link.slice(0, 200) : "",
      createdAt: Date.now()
    });
    return res.status(200).json({ ok });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
