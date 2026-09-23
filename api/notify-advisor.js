import { getAdvisor, ADVISOR_WHATSAPP } from "./_data.js";
import { sendWhatsApp } from "./_whatsapp.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { advisorId, code, customerName } = req.body || {};
  if (!code || !/^\d{6}$/.test(String(code))) {
    return res.status(400).json({ error: "Valid 6-digit code required" });
  }

  const advisor = getAdvisor(advisorId);
  // Optional override for end-to-end testing without touching real advisor numbers in code.
  const toNumber = process.env.TEST_WHATSAPP_TO || ADVISOR_WHATSAPP[advisor.id];
  if (!toNumber) {
    return res.status(200).json({ sent: false, reason: "No advisor number configured" });
  }

  const name = String(customerName || "Ein Kunde").slice(0, 60);
  const result = await sendWhatsApp({
    to: toNumber,
    body: `DEGAJA: Neue Beratungsanfrage von ${name}. Sitzungscode: ${code}`,
    templateName: process.env.META_TEMPLATE_SESSION_CODE,
    templateVars: [name, String(code)],
    contentSid: process.env.TWILIO_CONTENT_SID,
    contentVariables: { 1: name, 2: String(code) }
  });

  return res.status(result.sent === false && result.error ? 502 : 200).json(result);
}
