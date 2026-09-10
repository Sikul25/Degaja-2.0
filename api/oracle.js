export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question, topic, mode = "free" } = req.body || {};
  if (!question || typeof question !== "string") return res.status(400).json({ error: "Question required" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI service is not configured" });

  const instructions = `You are DEGAJA AI Oracle, a German-language spiritual guidance assistant. Be warm, empathetic, concise and engaging. Frame tarot, astrology and numerology as reflective entertainment/guidance, not guaranteed predictions or professional advice. Never claim certainty about another person's private thoughts or the future. Do not give medical, legal or financial professional advice. Answer in German. ${mode === "paid" ? "This is a paid deeper reading: give a richer interpretation and invite thoughtful follow-up questions." : "This is the free first reading: give a useful, emotionally engaging but concise interpretation, then leave room for a deeper paid reading."}`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-mini",
        instructions,
        input: `Themenbereich: ${topic || "Allgemein"}\nFrage: ${question}`,
        max_output_tokens: mode === "paid" ? 700 : 350,
        temperature: 0.9
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: "AI request failed" });
    const text = data.output_text || data.output?.flatMap(item => item.content || []).filter(item => item.type === "output_text").map(item => item.text).join("\n") || "DEGAJA konnte gerade keine Antwort erstellen.";
    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: "AI service error" });
  }
}
