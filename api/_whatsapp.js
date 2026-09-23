// Sends a WhatsApp message via Meta's own WhatsApp Business Platform (Cloud
// API) when configured, falling back to Twilio otherwise. This lets us move
// off Twilio without breaking the live-call flow until the Meta side is set
// up — set META_WA_TOKEN + META_WA_PHONE_NUMBER_ID and it takes over
// automatically, no code change needed at that point.

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
      return { sent: false, error: "Meta request failed", detail };
    }
    return { sent: true, via: "meta" };
  } catch (error) {
    return { sent: false, error: "Meta WhatsApp notification failed" };
  }
}

async function sendViaTwilio(to, body, contentSid, contentVariables) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) return null;

  const params = new URLSearchParams({ From: TWILIO_WHATSAPP_FROM, To: `whatsapp:${to}` });
  if (contentSid) {
    params.set("ContentSid", contentSid);
    params.set("ContentVariables", JSON.stringify(contentVariables));
  } else {
    params.set("Body", body);
  }

  try {
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return { sent: false, error: "Twilio request failed", detail };
    }
    return { sent: true, via: "twilio" };
  } catch (error) {
    return { sent: false, error: "Twilio WhatsApp notification failed" };
  }
}

// opts: { to, body, templateName, templateVars, contentSid, contentVariables, lang }
export async function sendWhatsApp(opts) {
  const meta = await sendViaMeta(opts.to, opts.body, opts.templateName, opts.templateVars, opts.lang);
  if (meta) return meta;
  const twilio = await sendViaTwilio(opts.to, opts.body, opts.contentSid, opts.contentVariables);
  if (twilio) return twilio;
  return { sent: false, reason: "WhatsApp notifications not configured" };
}
