// Test-only CCBill checkout initiator - completely separate from the real
// site's api/checkout.js (which still uses Stripe for every real visitor).
// Used only by ccbill-test.html so Yoel can run one real CCBill test
// payment without touching the live payment path at all. See
// api/_ccbill.js and CLAUDE.md's "Payments: Stripe -> CCBill" section.
import crypto from "node:crypto";
import { encryptionKeyLooksValid, buildFlexFormUrl, CCBILL_CURRENCY_NUMERIC } from "./_ccbill.js";
import { createOrder } from "./_ccbillOrders.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.CCBILL_ENCRYPTION_KEY) {
    return res.status(503).json({ error: "CCBILL_ENCRYPTION_KEY is not set yet" });
  }
  if (!encryptionKeyLooksValid()) {
    return res.status(503).json({
      error: "CCBILL_ENCRYPTION_KEY failed the self-test against CCBill's own worked example - this is not the right key"
    });
  }

  try {
    const orderId = crypto.randomUUID();
    await createOrder(orderId, { kind: "test", note: "Manual test payment from ccbill-test.html" });

    // Deliberately the EXACT same price/period/currency as CCBill's own
    // worked example in their 2026-11-11 email (price=3, period=3,
    // currency=840/USD) - if this real checkout page also accepts it
    // without a "digest mismatch" error, that's a second, independent
    // confirmation the key is correct (beyond the local MD5 self-test).
    const url = buildFlexFormUrl({ price: "3", period: "3", currencyCode: CCBILL_CURRENCY_NUMERIC.usd, orderId });

    return res.status(200).json({ url, orderId });
  } catch (error) {
    return res.status(500).json({ error: String(error.message || error) });
  }
}
