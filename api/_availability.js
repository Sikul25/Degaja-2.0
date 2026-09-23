// Advisor "available now" status, shared across all serverless invocations via
// Vercel's Global Config store (formerly "Edge Config" — a small key-value
// store read at request time, no redeploy needed when an advisor toggles her
// own status). Requires two one-time project settings: a Global Config store
// connected to this project (gives GLOBAL_CONFIG, still named EDGE_CONFIG on
// older projects) and a Vercel API token with write access (VERCEL_API_TOKEN).
// If either is missing, every advisor reads as unavailable rather than the
// site claiming she's online when we can't actually confirm it.

const TEAM_ID = "team_fnwR6mhKjhFrsnKW36UPriM5";
const STALE_AFTER_MS = 2 * 60 * 60 * 1000; // auto-expire a forgotten "available" toggle
const CACHE_MS = 20 * 1000;

let cache = null;
let cachedAt = 0;

function edgeConfigParts() {
  const raw = process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG || "";
  // Vercel renamed Edge Config to Global Config, which also changed the
  // connection string's host from edge-config.vercel.com to
  // global-config.vercel.com. Accept either so this keeps working regardless.
  const match = raw.match(/^https:\/\/(global-config|edge-config)\.vercel\.com\/([^?]+)\?token=([^&]+)/);
  if (!match && raw) {
    console.error("GLOBAL_CONFIG is set but didn't match the expected format. Starts with:", raw.slice(0, 40));
  }
  return match ? { host: match[1], id: match[2], readToken: match[3] } : null;
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
    const r = await fetch(`https://${parts.host}.vercel.com/${parts.id}/item/advisorStatus?token=${parts.readToken}`);
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
    const missing = [!parts && "GLOBAL_CONFIG/EDGE_CONFIG (missing or wrong format)", !token && "VERCEL_API_TOKEN"]
      .filter(Boolean)
      .join(", ");
    throw new Error(`Not configured: missing ${missing}`);
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
