// Preferred ElevenLabs voice NAME per language — matched case-insensitively
// against the account's voice library. Update as the user auditions voices
// per language; "fr" is set first as that's the one already chosen.
const VOICE_NAME_BY_LANG = {
  fr: "manon",
  ru: "ariana",
  es: "cristina",
  uk: "kateryna",
  br: "raquel",
  pt: "barbara"
};
const DEFAULT_VOICE_NAME = "victoria";

// Cached briefly per warm serverless instance so we don't call /v1/voices on every request.
let cachedVoices = null;
let cachedAt = 0;
const VOICE_CACHE_MS = 10 * 60 * 1000;

async function getVoices(apiKey) {
  if (cachedVoices && Date.now() - cachedAt < VOICE_CACHE_MS) return cachedVoices;

  const response = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey }
  });
  if (!response.ok) return null;

  const data = await response.json().catch(() => null);
  const voices = data?.voices || [];
  if (!voices.length) return null;

  cachedVoices = voices;
  cachedAt = Date.now();
  return voices;
}

async function resolveVoiceId(apiKey, lang) {
  const voices = await getVoices(apiKey);
  if (!voices) return null;

  const wantedName = VOICE_NAME_BY_LANG[lang] || DEFAULT_VOICE_NAME;
  const byWantedName = voices.find(v => (v.name || "").toLowerCase() === wantedName.toLowerCase());
  const byDefaultName = voices.find(v => (v.name || "").toLowerCase() === DEFAULT_VOICE_NAME.toLowerCase());

  return (byWantedName || byDefaultName || voices[0]).voice_id;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, lang } = req.body || {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Text required" });
  }

  const { ELEVENLABS_API_KEY } = process.env;
  if (!ELEVENLABS_API_KEY) {
    return res.status(503).json({ error: "TTS not configured" });
  }

  try {
    const voiceId = await resolveVoiceId(ELEVENLABS_API_KEY, String(lang || "").toLowerCase());
    if (!voiceId) {
      return res.status(503).json({ error: "No voice available in ElevenLabs account" });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text: text.slice(0, 2000),
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
          style: 0.1,
          use_speaker_boost: true,
          speed: 0.75
        }
      })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return res.status(502).json({ error: "TTS request failed", detail });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).json({ error: "TTS failed" });
  }
}
