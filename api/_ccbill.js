// Shared CCBill FlexForms Dynamic Pricing helpers. See CLAUDE.md's
// "Payments: Stripe -> CCBill" section for the full history/sourcing of
// every fact used here - nothing here is guessed.

import crypto from "node:crypto";

// Confirmed directly from Yoel's CCBill account/portal and from the
// Integration team's 2026-11-11 emails.
export const CCBILL_FLEX_ID = "f33155c3-8961-4ede-8da7-0ff3c5d56c4f";
export const CCBILL_CLIENT_SUBACC = "0000";

// ISO 4217 numeric currency codes - a public standard, not CCBill-specific,
// and currencyCode=840 (USD) is independently confirmed by CCBill's own
// worked example below.
export const CCBILL_CURRENCY_NUMERIC = {
  usd: "840", eur: "978", gbp: "826", brl: "986",
  mxn: "484", jpy: "392", cny: "156", inr: "356"
};

// formDigest (Single Billing / non-recurring) = MD5(initialPrice + initialPeriod
// + currencyCode + EncryptionKey), plain concatenation, no separators, in
// this exact order - verified against two separate CCBill worked examples
// (their general docs' 10.00/30/840 example, and the Integration team's own
// 2026-11-11 email for this exact account, below).
export function computeFormDigest(initialPrice, initialPeriod, currencyCode, encryptionKey) {
  const input = `${initialPrice}${initialPeriod}${currencyCode}${encryptionKey}`;
  return crypto.createHash("md5").update(input).digest("hex");
}

// Real worked example from CCBill's Integration team email (2026-11-11), for
// THIS account/Flex ID - lets us verify CCBILL_ENCRYPTION_KEY is the actual
// key before it's ever used on a real checkout link, with no network access
// to CCBill needed.
const KNOWN_VECTOR = { price: "3", period: "3", currency: "840", digest: "4f59294f73f2e73cccae42870619cbb6" };

export function encryptionKeyLooksValid() {
  const key = process.env.CCBILL_ENCRYPTION_KEY;
  if (!key) return false;
  return computeFormDigest(KNOWN_VECTOR.price, KNOWN_VECTOR.period, KNOWN_VECTOR.currency, key) === KNOWN_VECTOR.digest;
}

// price: decimal string/number in whole currency units (e.g. "4.99"), NOT
// cents - CCBill's initialPrice is not the same shape as Stripe's
// unit_amount. period: days, 2-365 per CCBill's documented range; using the
// documented minimum (2) since this is a one-time charge with no recurring
// fields sent (recurringPrice/recurringPeriod/numRebills are deliberately
// omitted - see CLAUDE.md) and the "correct" business value for a one-time
// product's initialPeriod isn't confirmed anywhere yet.
export function buildFlexFormUrl({ price, period = "2", currencyCode, orderId }) {
  const key = process.env.CCBILL_ENCRYPTION_KEY;
  if (!key) throw new Error("CCBILL_ENCRYPTION_KEY not configured");
  const formDigest = computeFormDigest(price, period, currencyCode, key);
  const params = new URLSearchParams({
    clientSubacc: CCBILL_CLIENT_SUBACC,
    initialPrice: String(price),
    initialPeriod: String(period),
    currencyCode: String(currencyCode),
    formDigest
  });
  // Our own order reference, passed through as an extra query param per the
  // scheme api/ccbill-webhook.js's original scaffold comment anticipated.
  // NOT CONFIRMED that CCBill echoes this back on the redirect/webhook -
  // this is exactly what the first real test payment needs to verify
  // (inspect the raw webhook body api/ccbill-webhook.js stores). If it
  // doesn't come back, the order is still recoverable via the browser's own
  // localStorage (see ccbill-test.html), just not via server-side webhook
  // matching until a confirmed alternative is found.
  if (orderId) params.set("orderId", orderId);
  return `https://api.ccbill.com/wap-frontflex/flexforms/${CCBILL_FLEX_ID}?${params.toString()}`;
}
