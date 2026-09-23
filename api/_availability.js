// Advisor "available now" status, shared across all serverless invocations via
// Vercel Edge Config (a small key-value store read at request time — no
// redeploy needed when an advisor toggles her own status). Requires two
// one-time project settings: an Edge Config store connected to this project
// (gives EDGE_CONFIG) and a Vercel API token with write access (VERCEL_API_TOKEN).
// If either is missing, every advisor reads as unavailable rather than the
// site claiming she's online when we can't actually confirm it.

const TEAM_ID = "team_fnwR6mhKjhFrsnKW36UPriM5";
const STALE_AFTER_MS = 2 * 60 * 60 * 1000; // auto-expire a forgotten "available" toggle
const CACHE_MS = 20 * 1000;

let cache = null;
let cachedAt = 0;

function edgeConfigParts() {
  const raw = process.env.EDGE_CONFIG || "";
  const match = raw.match(/^https:\/\/edge-config\.vercel\.com\/([^?]+)\?token=([^&]+)/);
  return match ? { id: match[1], readToken: match[2] } : null;
}

async function readAll() {
  const now = Date.now();
  if (cache && now - cachedAt < CACHE_MS) return cache;
  const parts = edgeConfigParts();
  if (!parts) {
    cache = {};
    cachedAt = now;
    return cache;
  }
  try {
    const r = await fetch(`https://edge-config.vercel.com/${parts.id}/item/advisorStatus?token=${parts.readToken}`);
    cache = r.ok ? (await r.json()) || {} : {};
  } catch (_) {
    cache = cache || {};
  }
  cachedAt = now;
  return cache;
}

function isFresh(entry) {
  return !!(entry && entry.available && entry.since && Date.now() - entry.since < STALE_AFTER_MS);
}

export async function getAvailability() {
  const all = await readAll();
  const out = {};
  for (const id of Object.keys(all)) out[id] = isFresh(all[id]);
  return out;
}

export async function setAvailable(advisorId, available) {
  const parts = edgeConfigParts();
  const token = process.env.VERCEL_API_TOKEN;
  if (!parts || !token) {
    throw new Error("Not configured: missing EDGE_CONFIG or VERCEL_API_TOKEN");
  }
  const current = await readAll();
  const next = { ...current, [advisorId]: { available: !!available, since: Date.now() } };
  const res = await fetch(`https://api.vercel.com/v1/edge-config/${parts.id}/items?teamId=${TEAM_ID}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ operation: "upsert", key: "advisorStatus", value: next }] })
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Edge Config write failed: ${detail}`);
  }
  cache = next;
  cachedAt = Date.now();
  return next;
}
