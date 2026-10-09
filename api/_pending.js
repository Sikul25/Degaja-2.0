// A pending live-call session, shared across serverless invocations via the
// same Vercel Global Config store used by _availability.js. This lets the
// advisor's own browser poll for a new session directly from our server —
// no WhatsApp/Meta involved, so it isn't at the mercy of a third party's
// delivery policies.

const TEAM_ID = "team_fnwR6mhKjhFrsnKW36UPriM5";
const STALE_AFTER_MS = 10 * 60 * 1000; // a session nobody joined in 10 min is gone

function edgeConfigParts() {
  const raw = process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG || "";
  const match = raw.match(/^https:\/\/(global-config|edge-config)\.vercel\.com\/([^?]+)\?token=([^&]+)/);
  return match ? { host: match[1], id: match[2], readToken: match[3] } : null;
}

export async function getPending(advisorId) {
  const parts = edgeConfigParts();
  if (!parts) return null;
  try {
    const r = await fetch(`https://${parts.host}.vercel.com/${parts.id}/item/pendingSession?token=${parts.readToken}`);
    const all = r.ok ? (await r.json()) || {} : {};
    const entry = all[advisorId];
    if (!entry || Date.now() - entry.createdAt > STALE_AFTER_MS) return null;
    return entry;
  } catch (_) {
    return null;
  }
}

export async function setPending(advisorId, entry) {
  const parts = edgeConfigParts();
  const token = process.env.VERCEL_API_TOKEN;
  if (!parts || !token) return false;
  try {
    const current = await fetch(`https://${parts.host}.vercel.com/${parts.id}/item/pendingSession?token=${parts.readToken}`)
      .then(r => (r.ok ? r.json() : {}))
      .catch(() => ({}));
    const next = { ...current, [advisorId]: entry };
    const res = await fetch(`https://api.vercel.com/v1/edge-config/${parts.id}/items?teamId=${TEAM_ID}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ operation: "upsert", key: "pendingSession", value: next }] })
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}
