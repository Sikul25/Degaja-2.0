// Sends a WhatsApp message via Meta's own WhatsApp Business Platform (Cloud
// API). Set META_WA_TOKEN + META_WA_PHONE_NUMBER_ID to enable it.

async function sendViaMeta(to, body, templateName, templateVars, lang) {
  const { META_WA_TOKEN, META_WA_PHONE_NUMBER_ID } = process.env;
  if (!META_WA_TOKEN || !META_WA_PHONE_NUMBER_ID) return null;

  // Meta's Graph API expects digits only (country code + number), no "+".
  to = String(to).replace(/[^\d]/g, "");

  const payload = templateName
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: lang || "de" },
          components: [{ type: "body", parameters: templateVars.map(v => ({ type: "text", text: String(v) })) }]
        }
      }
    : { messaging_product: "whatsapp", to, type: "text", text: { body } };

  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${META_WA_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${META_WA_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Meta WhatsApp send failed:", response.status, JSON.stringify(data));
      return { sent: false, error: "Meta request failed", detail: JSON.stringify(data) };
    }
    // Log the resolved WhatsApp ID and message id so a silent delivery
    // failure (API accepts the request but never actually delivers) can be
    // cross-checked against what number Meta actually resolved "to" into.
    console.log("Meta WhatsApp accepted:", JSON.stringify(data));
    return { sent: true, via: "meta" };
  } catch (error) {
    console.error("Meta WhatsApp send threw:", error);
    return { sent: false, error: "Meta WhatsApp notification failed" };
  }
}

// opts: { to, body, templateName, templateVars, lang }
export async function sendWhatsApp(opts) {
  const meta = await sendViaMeta(opts.to, opts.body, opts.templateName, opts.templateVars, opts.lang);
  if (!meta) console.error("WhatsApp not configured: META_WA_TOKEN/META_WA_PHONE_NUMBER_ID missing");
  return meta || { sent: false, reason: "WhatsApp notifications not configured" };
}
