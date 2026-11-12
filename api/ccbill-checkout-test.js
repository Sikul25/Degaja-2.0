// Test-only CCBill checkout initiator - completely separate from the real
// site's api/checkout.js (which still uses Stripe for every real visitor).
// Used only by ccbill-test.html so Yoel can run one real CCBill test
// payment without touching the live payment path at all. See
// api/_ccbill.js and CLAUDE.md's "Payments: Stripe -> CCBill" section.
import crypto from "node:crypto";
import { encryptionKeyLooksValid, encryptionKeyMatchesVector2, diagnoseEncryptionKey, bruteForceFormDigestFormula, buildFlexFormUrl, CCBILL_CURRENCY_NUMERIC, CCBILL_TEST_FLEX_ID } from "./_ccbill.js";
import { createOrder } from "./_ccbillOrders.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.CCBILL_ENCRYPTION_KEY) {
    return res.status(503).json({ error: "CCBILL_ENCRYPTION_KEY is not set yet" });
  }
  // NOT blocking on encryptionKeyLooksValid() here: that check is only
  // valid against CCBill's original worked-example hash, which their own
  // 2026-11-11 email says was computed with a key they have since
  // regenerated ("we have updated the salt key to not contain any special
  // characters"). A stale self-test would wrongly block a key that's
  // actually correct now. The real, authoritative test is whether CCBill's
  // own checkout page accepts the formDigest built below without a
  // "digest mismatch" error - that's what this endpoint is for.
  const selfTestPassed = encryptionKeyLooksValid();
  const selfTestPassedVector2 = encryptionKeyMatchesVector2();

  try {
    const orderId = crypto.randomUUID();
    await createOrder(orderId, { kind: "test", note: "Manual test payment from ccbill-test.html", selfTestPassed, selfTestPassedVector2 });

    // CCBill's own worked example (price=3) turned out to be invalid -
    // their real app returned "SubscriptionRuleException: Initial price:
    // [3] is not in valid price range [5 - 300]" once the F5/WAF block was
    // cleared (by promoting the payment flow to Live). $5.00 is the
    // documented minimum for Dynamic Pricing.
    // Uses the dedicated "Degaja Test Only" flow (promoted to Live
    // 2026-11-12) so CCBill's free Test Transaction User test-card
    // mechanism never touches the real "Degaja CheckOut" flow's config.
    const url = buildFlexFormUrl({ price: "5.00", period: "3", currencyCode: CCBILL_CURRENCY_NUMERIC.usd, orderId, flexId: CCBILL_TEST_FLEX_ID });

    return res.status(200).json({ url, orderId, selfTestPassed, selfTestPassedVector2, keyDiagnosis: diagnoseEncryptionKey(), formulaSearch: bruteForceFormDigestFormula() });
  } catch (error) {
    return res.status(500).json({ error: String(error.message || error) });
  }
}
