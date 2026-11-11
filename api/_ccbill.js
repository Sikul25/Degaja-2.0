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

// Real worked examples from CCBill's own Merchant Support team, for THIS
// account/Flex ID - let us verify CCBILL_ENCRYPTION_KEY is the actual key
// before it's ever used on a real checkout link, with no network access to
// CCBill needed. Two independent vectors from two separate emails - if both
// match, the key is confirmed beyond doubt; if only one matches, the key
// changed between the two emails (ask Merchant Support which is current).
const KNOWN_VECTOR = { price: "3", period: "3", currency: "840", digest: "4f59294f73f2e73cccae42870619cbb6" };
// From Andrea K. (Merchant Support), sent in response to a real "Error 503 -
// Service Unavailable" report - their email states this exact URL "is
// loading the Form without any issues", and that 503 on our side is most
// commonly caused by an incorrect formDigest.
const KNOWN_VECTOR_2 = { price: "15", period: "30", currency: "840", digest: "03c5dcbaa5ed14c53be64dc51239f15e" };

export function encryptionKeyLooksValid() {
  const key = process.env.CCBILL_ENCRYPTION_KEY;
  if (!key) return false;
  return computeFormDigest(KNOWN_VECTOR.price, KNOWN_VECTOR.period, KNOWN_VECTOR.currency, key) === KNOWN_VECTOR.digest;
}

export function encryptionKeyMatchesVector2() {
  const key = process.env.CCBILL_ENCRYPTION_KEY;
  if (!key) return false;
  return computeFormDigest(KNOWN_VECTOR_2.price, KNOWN_VECTOR_2.period, KNOWN_VECTOR_2.currency, key) === KNOWN_VECTOR_2.digest;
}

// Both known vectors failing against the stored key as-is could mean the key
// itself is wrong, OR it could mean the key is right but got mangled in
// transit into Vercel (a trailing newline/space from copy-pasting out of a
// textarea is a very common real-world cause of exactly this symptom).
// Try a few cheap, lossless transforms of the SAME stored value and report
// only which transform (if any) matches which vector - never the key value
// itself - so this is safe to call and log without exposing the secret.
export function diagnoseEncryptionKey() {
  const raw = process.env.CCBILL_ENCRYPTION_KEY;
  if (!raw) return { configured: false };
  const variants = {
    asStored: raw,
    trimmed: raw.trim(),
    noWhitespace: raw.replace(/\s+/g, ""),
    noTrailingNewlineOnly: raw.replace(/[\r\n]+$/, "")
  };
  const vectors = { vector1: KNOWN_VECTOR, vector2: KNOWN_VECTOR_2 };
  const matches = [];
  for (const [variantName, variantValue] of Object.entries(variants)) {
    for (const [vectorName, v] of Object.entries(vectors)) {
      if (computeFormDigest(v.price, v.period, v.currency, variantValue) === v.digest) {
        matches.push(`${variantName}+${vectorName}`);
      }
    }
  }
  return {
    configured: true,
    rawLength: raw.length,
    trimmedLength: raw.trim().length,
    hasLeadingWhitespace: /^\s/.test(raw),
    hasTrailingWhitespace: /\s$/.test(raw),
    hasInternalWhitespace: /\s/.test(raw.trim()),
    matches
  };
}

// Yoel confirmed (2026-11-11) that the SAME key value appears in both the
// "Upgrade Security Setup Information" (TripleDES/Subscription Upgrade)
// field AND the "Background Post" section's own key field - strong evidence
// it's one real, correct, account-wide value, not a wrong/stale one. Yet it
// fails both known formDigest vectors under our documented formula. That
// shifts the likely bug from "wrong key" to "wrong formula" - the
// price/period/currency+key concatenation order, or price's string format
// (e.g. "3" vs "3.00"), may not match what CCBill's backend actually hashed
// when it generated these two vectors. Brute-force every plausible
// permutation of the four fields, crossed with a couple of price-formatting
// variants, against the REAL stored key, for BOTH vectors at once - only a
// formula that reproduces BOTH confirms the true formula. Reports only
// which formula name(s) matched, never the key or any intermediate hash
// input.
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permutations(rest)) result.push([arr[i], ...p]);
  }
  return result;
}

export function bruteForceFormDigestFormula() {
  const key = process.env.CCBILL_ENCRYPTION_KEY;
  if (!key) return { configured: false };

  const vectors = [
    { name: "vector1", price: "3", priceDecimal: "3.00", period: "3", currency: "840", digest: KNOWN_VECTOR.digest },
    { name: "vector2", price: "15", priceDecimal: "15.00", period: "30", currency: "840", digest: KNOWN_VECTOR_2.digest }
  ];

  const fieldNames = ["price", "period", "currency", "key"];
  const orders = permutations(fieldNames);
  const priceModes = ["plain", "decimal"];
  const includeSubaccOptions = [false, true];

  const matchedBoth = [];
  for (const order of orders) {
    for (const priceMode of priceModes) {
      for (const includeSubacc of includeSubaccOptions) {
        let allMatch = true;
        for (const v of vectors) {
          const values = {
            price: priceMode === "decimal" ? v.priceDecimal : v.price,
            period: v.period,
            currency: v.currency,
            key
          };
          let input = order.map(f => values[f]).join("");
          if (includeSubacc) input += CCBILL_CLIENT_SUBACC;
          const digest = crypto.createHash("md5").update(input).digest("hex");
          if (digest !== v.digest) { allMatch = false; break; }
        }
        if (allMatch) {
          matchedBoth.push(`order=${order.join(",")}|price=${priceMode}|subacc=${includeSubacc}`);
        }
      }
    }
  }
  return { configured: true, matchedBoth, totalFormulasTried: orders.length * priceModes.length * includeSubaccOptions.length };
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
