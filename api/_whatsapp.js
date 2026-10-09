// Sends a WhatsApp message via Meta's own WhatsApp Business Platform (Cloud
// API). Set META_WA_TOKEN + META_WA_PHONE_NUMBER_ID to enable it.

async function sendViaMeta(to, body, templateName, templateVars, lang) {
  const { META_WA_TOKEN, META_WA_PHONE_NUMBER_ID } = process.env;
  if (!META_WA_TOKEN || !META_WA_PHONE_NUMBER_ID) return null;

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
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Meta WhatsApp send failed:", response.status, detail);
      return { sent: false, error: "Meta request failed", detail };
    }
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
