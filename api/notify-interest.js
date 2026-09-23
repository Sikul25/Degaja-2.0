import { getAdvisor, ADVISOR_WHATSAPP } from "./_data.js";
import { sendWhatsApp } from "./_whatsapp.js";

// A visitor who found an advisor offline can leave a WhatsApp number or
// email so she can reach out once she's back online. This forwards straight
// to the advisor's own WhatsApp (same pattern as notify-advisor.js) rather
// than storing a list or messaging the visitor back — no new persistence,
// and no outbound WhatsApp to a customer who hasn't opened a session with us.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { advisorId, contact, lang } = req.body || {};
  const trimmed = String(contact || "").trim();
  if (!trimmed || trimmed.length > 120) {
    return res.status(400).json({ error: "Valid contact required" });
  }

  const advisor = getAdvisor(advisorId);
  const toNumber = process.env.TEST_WHATSAPP_TO || ADVISOR_WHATSAPP[advisor.id];
  if (!toNumber) {
    return res.status(200).json({ sent: false, reason: "No advisor number configured" });
  }

  const safeLang = String(lang || "de").slice(0, 5);
  const result = await sendWhatsApp({
    to: toNumber,
    body: `DEGAJA: Jemand wollte dich live erreichen, du warst offline (Sprache: ${safeLang}). Kontakt: ${trimmed}`,
    templateName: process.env.META_TEMPLATE_INTEREST,
    templateVars: [safeLang, trimmed]
  });

  return res.status(result.sent === false && result.error ? 502 : 200).json(result);
}
