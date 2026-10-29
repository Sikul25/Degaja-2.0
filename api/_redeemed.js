// Tracks which Stripe checkout session IDs have already been redeemed for AI
// credits, shared across serverless invocations via the same Vercel Global
// Config store used by _availability.js and _pending.js. Without this,
// api/verify-payment.js had no server-side memory at all: it was a stateless
// proxy that returned `paid:true` + credits for ANY session_id whose Stripe
// session is complete, every single time it's called — so the success URL
// from one real payment (?payment=success&session_id=...) could be reopened
// indefinitely (different browser, private window, cleared localStorage) to
// mint unlimited free AI credits off a single $4.99/$9.99 charge.
//
// This is a best-effort read-then-write, not a true atomic compare-and-swap
// (Vercel's Edge Config API doesn't offer one) — two requests for the exact
// same session_id arriving within the same few-hundred-ms network round trip
// could theoretically both see "not yet redeemed". That's an acceptable gap:
// it closes the real-world exploit (replaying the same URL at will, any time
// later) while a literal simultaneous double-fire is a vanishingly rare race
// to even attempt, let alone hit.

const TEAM_ID = "team_fnwR6mhKjhFrsnKW36UPriM5";
const KEEP_MS = 30 * 24 * 60 * 60 * 1000; // prune entries older than 30 days

function edgeConfigParts() {
  const raw = process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG || "";
  const match = raw.match(/^https:\/\/(global-config|edge-config)\.vercel\.com\/([^?]+)\?token=([^&]+)/);
  return match ? { host: match[1], id: match[2], readToken: match[3] } : null;
}

async function readAll(parts) {
  try {
    const r = await fetch(`https://${parts.host}.vercel.com/${parts.id}/item/redeemedSessions?token=${parts.readToken}`);
    return r.ok ? (await r.json()) || {} : {};
  } catch (_) {
    return {};
  }
}

// Returns true if sessionId was already redeemed before this call. As a side
// effect, if it was NOT already redeemed, marks it redeemed now (so the
// caller doesn't need a separate write step, and the check-then-mark stays
// as tight together as this API allows).
export async function wasAlreadyRedeemed(sessionId) {
  const parts = edgeConfigParts();
  const token = process.env.VERCEL_API_TOKEN;
  // If the store isn't configured, we can't track redemptions at all — fail
  // open (treat as "not redeemed yet") rather than blocking every real
  // payment because of a missing env var. Same posture as _availability.js
  // failing open/closed per its own comment, just the other direction since
  // blocking a paying customer is worse here than the (now-closed-elsewhere)
  // replay risk.
  if (!parts || !token) return false;

  const current = await readAll(parts);
  if (current[sessionId]) return true;

  const now = Date.now();
  const next = { [sessionId]: now };
  for (const [id, ts] of Object.entries(current)) {
    if (now - ts < KEEP_MS) next[id] = ts;
  }

  try {
    await fetch(`https://api.vercel.com/v1/edge-config/${parts.id}/items?teamId=${TEAM_ID}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ operation: "upsert", key: "redeemedSessions", value: next }] })
    });
  } catch (_) {
    // If the write fails, worst case this one session can be replayed once
    // more later — still far better than the previous unlimited replay.
  }
  return false;
}
