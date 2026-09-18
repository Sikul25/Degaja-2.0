import { getAdvisor, ADVISOR_WHATSAPP } from "./_data.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { advisorId, code, customerName } = req.body || {};
  if (!code || !/^\d{6}$/.test(String(code))) {
    return res.status(400).json({ error: "Valid 6-digit code required" });
  }

  const advisor = getAdvisor(advisorId);
  const toNumber = ADVISOR_WHATSAPP[advisor.id];
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, TWILIO_CONTENT_SID } = process.env;

  if (!toNumber || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    // Not configured yet (missing advisor number or Twilio credentials) —
    // no-op rather than error, so the live-call flow never breaks on this.
    return res.status(200).json({ sent: false, reason: "WhatsApp notifications not configured" });
  }

  const name = String(customerName || "Ein Kunde").slice(0, 60);
  const body = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To: `whatsapp:${toNumber}`
  });

  if (TWILIO_CONTENT_SID) {
    body.set("ContentSid", TWILIO_CONTENT_SID);
    body.set("ContentVariables", JSON.stringify({ 1: name, 2: String(code) }));
  } else {
    body.set("Body", `DEGAJA: Neue Beratungsanfrage von ${name}. Sitzungscode: ${code}`);
  }

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
      return res.status(502).json({ sent: false, error: "Twilio request failed" });
    }
    return res.status(200).json({ sent: true });
  } catch (error) {
    return res.status(500).json({ sent: false, error: "WhatsApp notification failed" });
  }
}
