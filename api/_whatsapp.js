// Sends a WhatsApp message via Meta's own WhatsApp Business Platform (Cloud
// API). Set META_WA_TOKEN + META_WA_PHONE_NUMBER_ID to enable it.

async function postToMeta(payload) {
  const { META_WA_TOKEN, META_WA_PHONE_NUMBER_ID } = process.env;
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
}

async function sendViaMeta(to, body, templateName, templateVars, lang) {
  const { META_WA_TOKEN, META_WA_PHONE_NUMBER_ID } = process.env;
  if (!META_WA_TOKEN || !META_WA_PHONE_NUMBER_ID) return null;

  // Meta's Graph API expects digits only (country code + number), no "+".
  to = String(to).replace(/[^\d]/g, "");

  try {
    if (templateName) {
      return await postToMeta({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: lang || "de" },
          components: [{ type: "body", parameters: templateVars.map(v => ({ type: "text", text: String(v) })) }]
        }
      });
    }

    // Free-form text only delivers inside an open 24h customer-service
    // window (i.e. after the recipient has messaged this business number).
    // For a first-time recipient that window is closed, so the API accepts
    // the request (200, message id) but WhatsApp silently drops it. Meta's
    // own pre-approved "hello_world" template is exempt from that
    // restriction and opens the window, so send it first, then the real
    // message right behind it.
    const opener = await postToMeta({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name: "hello_world", language: { code: "en_US" } }
    });
    if (!opener.sent) return opener;

    return await postToMeta({ messaging_product: "whatsapp", to, type: "text", text: { body } });
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
