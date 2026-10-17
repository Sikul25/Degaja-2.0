// Scaffold for CCBill's server-to-server postback/webhook, built ahead of
// receiving the real CCBill account details. Deliberately NOT wired into
// checkout.js, verify-payment.js, or the frontend — this file is dormant
// until CCBill account numbers + webhook secret/salt arrive, so it carries
// zero risk to the live Stripe checkout.
//
// CCBill sends approval/denial/cancellation events as an HTTP POST
// (form-encoded) to a URL you register in their admin portal. Fields vary by
// event type, but commonly include: subscriptionId, transactionId,
// clientAccnum, clientSubacc, initialPrice, initialPeriod, currencyCode,
// email, and a digest/signature for verifying the postback is genuinely
// from CCBill (exact field name/algorithm depends on the integration CCBill
// provisions — confirm with Sinisha once the account is set up).
//
// TODO once real CCBill details arrive:
//   1. Set CCBILL_WEBHOOK_SALT (or whatever CCBill calls their shared
//      secret) as a Vercel env var and verify the postback signature below.
//   2. Confirm the exact event/field names from CCBill's dashboard config
//      (this differs between FlexForms and the Advanced Widget).
//   3. Decide the order-reference scheme (e.g. pass our own orderId through
//      as a custom field so this webhook can map it back to a DEGAJA order).

const TEAM_ID = "team_fnwR6mhKjhFrsnKW36UPriM5";

// Duplicated from _pending.js (not imported) so this file touches nothing
// in the existing, live payment/session code paths.
function edgeConfigParts() {
  const raw = process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG || "";
  const match = raw.match(/^https:\/\/(global-config|edge-config)\.vercel\.com\/([^?]+)\?token=([^&]+)/);
  return match ? { host: match[1], id: match[2], readToken: match[3] } : null;
}

async function storeResult(orderId, result) {
  const parts = edgeConfigParts();
  const token = process.env.VERCEL_API_TOKEN;
  if (!parts || !token) return false;
  try {
    const current = await fetch(`https://${parts.host}.vercel.com/${parts.id}/item/ccbillOrders?token=${parts.readToken}`)
      .then(r => (r.ok ? r.json() : {}))
      .catch(() => ({}));
    const next = { ...current, [orderId]: { ...result, updatedAt: Date.now() } };
    const res = await fetch(`https://api.vercel.com/v1/edge-config/${parts.id}/items?teamId=${TEAM_ID}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ operation: "upsert", key: "ccbillOrders", value: next }] })
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // TODO: verify this request genuinely came from CCBill (signature/digest
  // check, and/or restrict by CCBill's published postback IP ranges) before
  // trusting any of the fields below.

  const body = req.body || {};
  const orderId = body.orderId || body.clientAccnum || null;
  if (!orderId) return res.status(400).json({ error: "Missing order reference" });

  const eventType = body.eventType || body.denialId ? "denial" : "approval";

  await storeResult(orderId, {
    eventType,
    transactionId: body.transactionId || null,
    email: body.email || null,
    raw: body
  });

  return res.status(200).json({ received: true });
}
