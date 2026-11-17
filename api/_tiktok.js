// TikTok Events API (server-side) - a second, more reliable path for the
// same Purchase conversion the browser pixel already sends via
// fireTikTokPurchase() in script.js/live-consult.js (see CLAUDE.md's
// "TikTok Pixel installed" entry). Browser-side tracking alone misses
// visitors with ad blockers or iOS tracking protection; this fires from
// our own server, which CCBill's webhook (api/ccbill-webhook.js) already
// confirms as a genuine approval.
//
// TIKTOK_EVENTS_API_ACCESS_TOKEN is the Access Token from Events Manager
// > [pixel] > Events API > "Generate" - a real secret, set only as a
// Vercel env var, never committed here or anywhere in this repo.
//
// Uses the same event_id (our orderId) as the browser-side ttq.track()
// call so TikTok can deduplicate the two into a single conversion instead
// of double-counting.
const PIXEL_CODE = "DBU37GRC77UB463C4KE0";

// Uses the same global Web Crypto `crypto` object api/checkout.js already
// relies on for crypto.randomUUID() - no Node "crypto" module import needed.
async function sha256Hex(str) {
  const bytes = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function sendTikTokPurchaseEvent({ orderId, email, amount, currency, contentName }) {
  const accessToken = process.env.TIKTOK_EVENTS_API_ACCESS_TOKEN;
  if (!accessToken) return; // not configured yet - never block webhook processing on this

  const normalizedEmail = (email || "").trim().toLowerCase();
  const payload = {
    pixel_code: PIXEL_CODE,
    event: "Purchase",
    event_id: orderId,
    timestamp: new Date().toISOString(),
    context: normalizedEmail ? { user: { email: await sha256Hex(normalizedEmail) } } : {},
    properties: {
      contents: [{ content_id: orderId, content_type: "product", content_name: contentName || "reading" }],
      value: Number(amount) || undefined,
      currency: (currency || "").toUpperCase() || undefined
    }
  };

  try {
    const response = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Token": accessToken },
      body: JSON.stringify({ event_source: "web", event_source_id: PIXEL_CODE, data: [payload] })
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("TikTok Events API non-OK response", response.status, text);
    }
  } catch (error) {
    // Never let a TikTok API hiccup affect webhook processing or credit granting.
    console.error("TikTok Events API call failed", error?.message);
  }
}
