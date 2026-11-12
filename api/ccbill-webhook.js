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
  // Accept GET as well as POST: "Background Post" strongly implies POST,
  // but this is not actually confirmed anywhere in CCBill's docs we have,
  // and the classic signup.cgi-era postback pattern some processors use
  // (including possibly CCBill) is a simple GET "pixel" call with query
  // params, not a POST body. Rejecting GET with 405 would produce exactly
  // the symptom seen on 2026-11-11's two real test payments: zero records
  // here at all, not even a fallback-keyed one, with no error visible
  // anywhere else either. Accepting both costs nothing (this endpoint does
  // no mutation beyond recording) and removes that failure mode as a
  // possibility without guessing which method CCBill actually uses.
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.CCBILL_ENCRYPTION_KEY) {
    return res.status(503).json({ error: "CCBill not yet configured" });
  }

  // Vercel auto-parses req.body into an object for json/urlencoded
  // Content-Types, but if CCBill sends a Content-Type it doesn't recognize
  // (or none at all), req.body arrives as an unparsed string - spreading a
  // string directly would silently produce garbage (object-spreading a
  // string yields one numeric key per character). Parse it defensively
  // instead of assuming the Content-Type will always be right.
  let parsedBody = req.body;
  if (typeof parsedBody === "string" && parsedBody.length) {
    try {
      parsedBody = JSON.parse(parsedBody);
    } catch (_) {
      parsedBody = Object.fromEntries(new URLSearchParams(parsedBody));
    }
  }
  const body = { ...(req.query || {}), ...(parsedBody && typeof parsedBody === "object" ? parsedBody : {}) };
  // CONFIRMED 2026-11-12 via a real successful test payment's raw postback
  // body (see CLAUDE.md): CCBill prefixes every custom pass-through field
  // from the FlexForm URL with "X-" - our own orderId comes back as
  // "X-orderId", NOT "orderId" as originally guessed. That guess meant this
  // matched on transactionId/subscriptionId instead and silently filed the
  // result under CCBill's own id rather than ours - exactly the kind of
  // bug that would have broken every real customer's payment confirmation
  // after the real cutover (verify-ccbill-payment.js looks up by OUR
  // orderId). Also confirmed real and camelCase: "subscriptionId" (NOT
  // "subscription_id" snake_case, which the docs implied but a real
  // payload never contained).
  const orderId = body["X-orderId"] || body.orderId || body.subscriptionId || body.subscription_id || body.transactionId || `unmatched_${Date.now()}`;

  // CONFIRMED 2026-11-12 via real postbacks: CCBill sends its own literal
  // event name here - "NewSaleSuccess" on approval, "NewSaleFailure" on
  // denial (both seen in real payloads, denialId never appeared in either) -
  // not the generic "approval"/"denial" strings this previously invented.
  // Stored as-is; verify-ccbill-payment.js derives "approved" from it.
  const eventType = body.eventType || (body.denialId ? "denial" : "unknown");

  await recordWebhookResult(orderId, {
    eventType,
    subscriptionId: body.subscriptionId || body.subscription_id || null,
    // CONFIRMED 2026-11-12: on a real NewSaleSuccess postback this field is
    // named "dynamicPricingValidationDigest", not "responseDigest" (which
    // was a guess from CCBill's own doc table and never actually appeared).
    // Formula still not confirmed - just the real field name.
    responseDigest: body.dynamicPricingValidationDigest || body.responseDigest || null,
    email: body.email || null,
    raw: body
  });

  return res.status(200).json({ received: true });
}
