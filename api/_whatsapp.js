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

async function sendViaMeta(to, body, templateName, templateVars, lang, buttonParam) {
  const { META_WA_TOKEN, META_WA_PHONE_NUMBER_ID } = process.env;
  if (!META_WA_TOKEN || !META_WA_PHONE_NUMBER_ID) return null;

  // Meta's Graph API expects digits only (country code + number), no "+".
  to = String(to).replace(/[^\d]/g, "");

  try {
    if (templateName) {
      const components = [{ type: "body", parameters: templateVars.map(v => ({ type: "text", text: String(v) })) }];
      // A dynamic-URL button component on the approved template itself -
      // the only way to deliver a tappable join link reliably (see the
      // comment below on why a free-text follow-up message cannot).
      if (buttonParam) {
        components.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: String(buttonParam) }] });
      }
      return await postToMeta({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: { name: templateName, language: { code: lang || "de" }, components }
      });
    }

    // No approved template configured (META_TEMPLATE_SESSION_CODE unset) -
    // this fallback is a known-unreliable last resort, not a real fix.
    // CORRECTED: sending Meta's pre-approved "hello_world" template does
    // NOT open WhatsApp's 24h customer-service window - that window only
    // opens when the RECIPIENT messages the business number first. A
    // business-initiated template, hello_world included, never opens it.
    // Confirmed empirically 2026-11-19: the advisor received hello_world
    // (twice) and nothing else - the free-text message below was silently
    // dropped both times. Kept only so something arrives instead of total
    // silence; the real fix is creating an approved WhatsApp template
    // (Meta Business Manager -> WhatsApp Manager -> Message templates)
    // with a dynamic URL button, then setting META_TEMPLATE_SESSION_CODE
    // to its name so the branch above is used instead.
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

// opts: { to, body, templateName, templateVars, lang, buttonParam }
export async function sendWhatsApp(opts) {
  const meta = await sendViaMeta(opts.to, opts.body, opts.templateName, opts.templateVars, opts.lang, opts.buttonParam);
  if (!meta) console.error("WhatsApp not configured: META_WA_TOKEN/META_WA_PHONE_NUMBER_ID missing");
  return meta || { sent: false, reason: "WhatsApp notifications not configured" };
}
