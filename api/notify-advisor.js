import { getAdvisor, ADVISOR_WHATSAPP } from "./_data.js";
import { sendWhatsApp } from "./_whatsapp.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { advisorId, code, customerName, link } = req.body || {};
  if (!code || !/^\d{6}$/.test(String(code))) {
    return res.status(400).json({ error: "Valid 6-digit code required" });
  }

  const advisor = getAdvisor(advisorId);
  // Optional override for end-to-end testing without touching real advisor numbers in code.
  const toNumber = process.env.TEST_WHATSAPP_TO || ADVISOR_WHATSAPP[advisor.id];
  if (!toNumber) {
    console.error("notify-advisor: no WhatsApp number configured for", advisor.id);
    return res.status(200).json({ sent: false, reason: "No advisor number configured" });
  }

  const name = String(customerName || "Ein Kunde").slice(0, 60);
  const safeLink = typeof link === "string" && /^https:\/\/[\w.-]*degaja\.com\//.test(link) ? link.slice(0, 200) : "";
  const body = safeLink
    ? `DEGAJA: Neue Beratungsanfrage von ${name}. Zum Annehmen antippen: ${safeLink}`
    : `DEGAJA: Neue Beratungsanfrage von ${name}. Sitzungscode: ${code}`;
  const result = await sendWhatsApp({
    to: toNumber,
    body,
    templateName: process.env.META_TEMPLATE_SESSION_CODE,
    templateVars: [name, String(code)]
  });
  if (!result.sent) console.error("notify-advisor: WhatsApp not sent:", result);
  else console.log("notify-advisor: WhatsApp sent to", toNumber.slice(-4));

  return res.status(result.sent === false && result.error ? 502 : 200).json(result);
}
