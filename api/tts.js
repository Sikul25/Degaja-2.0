const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel — works well with the multilingual model

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text } = req.body || {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Text required" });
  }

  const { ELEVENLABS_API_KEY } = process.env;
  if (!ELEVENLABS_API_KEY) {
    return res.status(503).json({ error: "TTS not configured" });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text: text.slice(0, 2000),
        model_id: "eleven_multilingual_v2"
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
