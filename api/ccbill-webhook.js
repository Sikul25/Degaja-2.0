// CCBill's server-to-server postback/webhook receiver.
//
// STATUS: wired up for TESTING ONLY (api/ccbill-checkout-test.js +
// ccbill-test.html), NOT connected to the live site's real checkout path
// (api/checkout.js/script.js still use Stripe for every real visitor - see
// CLAUDE.md's "Payments: Stripe -> CCBill" section for the full cutover
// plan, which this is one step of, not the whole thing).
//
// We do NOT yet have a confirmed signature/digest scheme for verifying a
// postback is genuinely from CCBill (CCBill's Integration team's
// 2026-11-11 email gave us the Encryption Key - used for FlexForms'
// formDigest - but it's unconfirmed whether that same value also signs
// webhook postbacks, or whether a separate value is needed; see CLAUDE.md).
// Rather than guess a verification scheme, this endpoint instead: (1)
// requires CCBILL_ENCRYPTION_KEY to be configured at all (closes the
// "anyone who finds this URL can write anything" surface while CCBill
// hasn't been set up yet), and (2) stores the FULL raw body of every
// postback it receives, matched to our own orderId when present. The first
// real test payment's raw stored payload is what tells us which fields
// CCBill actually sends and whether our orderId passthrough (see
// _ccbill.js's buildFlexFormUrl) survived the round trip - inspect it
// before trusting this endpoint with real production credit-granting.
import { recordWebhookResult } from "./_ccbillOrders.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.CCBILL_ENCRYPTION_KEY) {
    return res.status(503).json({ error: "CCBill not yet configured" });
  }

  const body = req.body || {};
  // Try every plausible identifier field so this keeps working whichever
  // one CCBill actually uses - confirm from a real test payload, don't
  // assume. orderId is ours (see _ccbill.js); the rest are CCBill's own
  // field names per their general docs, unconfirmed for this exact event.
  const orderId = body.orderId || body.subscriptionId || body.transactionId || `unmatched_${Date.now()}`;

  const eventType = body.denialId ? "denial" : (body.eventType || "approval");

  await recordWebhookResult(orderId, {
    eventType,
    transactionId: body.transactionId || null,
    subscriptionId: body.subscriptionId || null,
    email: body.email || null,
    raw: body
  });

  return res.status(200).json({ received: true });
}
