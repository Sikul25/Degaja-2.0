// Tracks CCBill checkout orders we've initiated, and the webhook results
// that arrive for them, via the same Vercel Global Config store used by
// _availability.js/_pending.js/_redeemed.js. Separate keys (not reusing
// those files' keys) so this stays fully isolated from the live Stripe
// payment path while CCBill is being tested.

const TEAM_ID = "team_fnwR6mhKjhFrsnKW36UPriM5";
const KEEP_MS = 30 * 24 * 60 * 60 * 1000; // prune entries older than 30 days

function edgeConfigParts() {
  const raw = process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG || "";
  const match = raw.match(/^https:\/\/(global-config|edge-config)\.vercel\.com\/([^?]+)\?token=([^&]+)/);
  return match ? { host: match[1], id: match[2], readToken: match[3] } : null;
}

async function readKey(parts, key) {
  try {
    const r = await fetch(`https://${parts.host}.vercel.com/${parts.id}/item/${key}?token=${parts.readToken}`);
    return r.ok ? (await r.json()) || {} : {};
  } catch (_) {
    return {};
  }
}

async function writeKey(parts, token, key, value) {
  const res = await fetch(`https://api.vercel.com/v1/edge-config/${parts.id}/items?teamId=${TEAM_ID}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ operation: "upsert", key, value } ] })
  });
  return res.ok;
}

function pruneOld(map) {
  const now = Date.now();
  const next = {};
  for (const [id, entry] of Object.entries(map)) {
    if (now - (entry.createdAt || entry.updatedAt || 0) < KEEP_MS) next[id] = entry;
  }
  return next;
}

export async function createOrder(orderId, details) {
  const parts = edgeConfigParts();
  const token = process.env.VERCEL_API_TOKEN;
  if (!parts || !token) throw new Error("Global Config not configured (GLOBAL_CONFIG/VERCEL_API_TOKEN)");
  const current = await readKey(parts, "ccbillPendingOrders");
  const next = pruneOld({ ...current, [orderId]: { ...details, createdAt: Date.now() } });
  const ok = await writeKey(parts, token, "ccbillPendingOrders", next);
  if (!ok) throw new Error("Could not write pending CCBill order");
}

export async function getOrder(orderId) {
  const parts = edgeConfigParts();
  if (!parts) return null;
  const all = await readKey(parts, "ccbillPendingOrders");
  return all[orderId] || null;
}

// Called by api/ccbill-webhook.js for every postback it receives, matched by
// whatever identifier is available (see that file's comments on how
// uncertain the exact field name still is before the first real test).
export async function recordWebhookResult(orderId, result) {
  const parts = edgeConfigParts();
  const token = process.env.VERCEL_API_TOKEN;
  if (!parts || !token) return false;
  try {
    const current = await readKey(parts, "ccbillOrderResults");
    const next = pruneOld({ ...current, [orderId]: { ...result, updatedAt: Date.now() } });
    return await writeKey(parts, token, "ccbillOrderResults", next);
  } catch (_) {
    return false;
  }
}

export async function getOrderResult(orderId) {
  const parts = edgeConfigParts();
  if (!parts) return null;
  const all = await readKey(parts, "ccbillOrderResults");
  return all[orderId] || null;
}

// Best-effort "already redeemed" tracking, same pattern/reasoning as
// _redeemed.js (not atomic, but closes the realistic replay risk).
export async function wasAlreadyRedeemed(orderId) {
  const parts = edgeConfigParts();
  const token = process.env.VERCEL_API_TOKEN;
  if (!parts || !token) return false;
  const current = await readKey(parts, "ccbillRedeemedOrders");
  if (current[orderId]) return true;
  const next = pruneOld({ ...current, [orderId]: { createdAt: Date.now() } });
  try {
    await writeKey(parts, token, "ccbillRedeemedOrders", next);
  } catch (_) { /* worst case this order can be replayed once more */ }
  return false;
}
