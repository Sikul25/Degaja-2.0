import { getAdvisor, ADVISOR_WHATSAPP } from "./_data.js";

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
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, TEST_WHATSAPP_TO } = process.env;
  const toNumber = TEST_WHATSAPP_TO || ADVISOR_WHATSAPP[advisor.id];

  if (!toNumber || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    return res.status(200).json({ sent: false, reason: "WhatsApp notifications not configured" });
  }

  const body = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To: `whatsapp:${toNumber}`,
    Body: `DEGAJA: Jemand wollte dich live erreichen, du warst offline (Sprache: ${String(lang || "de").slice(0, 5)}). Kontakt: ${trimmed}`
  });

  try {
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      }
    );
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return res.status(502).json({ sent: false, error: "Twilio request failed", detail });
    }
    return res.status(200).json({ sent: true });
  } catch (error) {
    return res.status(500).json({ sent: false, error: "WhatsApp notification failed" });
  }
}
