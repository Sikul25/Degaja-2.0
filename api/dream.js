export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { dream, lang = "de" } = req.body || {};

  const LANGUAGE_NAMES = { de: "German", en: "English", us: "English", fr: "French", es: "Spanish", it: "Italian", pt: "Portuguese", ru: "Russian", uk: "Ukrainian", br: "Brazilian Portuguese", mx: "Mexican Spanish", ja: "Japanese", zh: "Chinese", hi: "Hindi" };
  const languageName = LANGUAGE_NAMES[lang] || LANGUAGE_NAMES.de;

  const cleanDream = typeof dream === "string" ? dream.slice(0, 400).trim() : "";
  if (!cleanDream) {
    return res.status(400).json({ error: "Dream description required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI service is not configured" });

  const instructions = `You are DEGAJA, a warm, enigmatic dream interpreter. You are given a short, free-form description of something a person saw, felt or experienced in a dream — it may be just a single word or image, or a longer description. Interpret it as a meaningful symbol, drawing on old and widespread dream-symbolism traditions, but never name or attribute it to any single specific culture, religion, people or historical text — speak of the source only in vague, evocative terms like "old wisdom", "something people used to know" or "what was once understood", never more specific than that. Structure your reply as clearly separated sections, each starting with its label in bold markdown (use **Label:** at the very start of the section's paragraph), in this order: the Symbol itself and what it has long been said to represent, its Meaning for this person's life right now, and a closing Reflection that invites them to sit with the insight — translate the labels themselves into ${languageName}. Keep the tone mysterious, warm and a little hushed, like someone sharing something not often spoken of out loud — never clinical, never a dry encyclopedia entry. Frame everything as reflective entertainment, never a scientific or guaranteed prediction — never give medical or psychological advice, and never claim the dream reveals anything about another real person's private life or intentions. Answer in ${languageName}, regardless of what language the dream description is written in. Keep it concise enough to end on a complete sentence — never let it get cut off mid-thought or mid-word.`;

  const userText = `This is what I saw in my dream: ${cleanDream}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-opus-5",
        system: instructions,
        messages: [{ role: "user", content: userText }],
        max_tokens: 900,
        output_config: { effort: "low" }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: "AI request failed" });

    const text = (Array.isArray(data.content)
      ? data.content.filter(item => item.type === "text").map(item => item.text).join("\n")
      : "") || {
        de: "DEGAJA konnte deinen Traum gerade nicht entschlüsseln. Versuch es erneut.",
        en: "DEGAJA couldn't decode your dream right now. Please try again.",
        us: "DEGAJA couldn't decode your dream right now. Please try again.",
        fr: "DEGAJA n'a pas pu déchiffrer ton rêve pour le moment. Réessaie.",
        es: "DEGAJA no pudo descifrar tu sueño en este momento. Inténtalo de nuevo.",
        it: "DEGAJA non è riuscita a decifrare il tuo sogno in questo momento. Riprova.",
        pt: "A DEGAJA não conseguiu decifrar o teu sonho agora. Tenta novamente.",
        ru: "DEGAJA сейчас не смогла расшифровать твой сон. Попробуй ещё раз.",
        uk: "DEGAJA зараз не змогла розшифрувати твій сон. Спробуй ще раз.",
        br: "A DEGAJA não conseguiu decifrar o seu sonho agora. Tente novamente.",
        mx: "DEGAJA no pudo descifrar tu sueño en este momento. Inténtalo de nuevo.",
        ja: "DEGAJAは今、夢を解き明かせませんでした。もう一度お試しください。",
        zh: "DEGAJA暂时无法解读你的梦，请重试。",
        hi: "DEGAJA अभी तुम्हारे सपने को नहीं खोल सकी। कृपया फिर कोशिश करो।"
      }[lang] || "DEGAJA konnte deinen Traum gerade nicht entschlüsseln. Versuch es erneut.";

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: "AI service error" });
  }
}
