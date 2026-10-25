export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, lang = "de" } = req.body || {};

  const LANGUAGE_NAMES = { de: "German", en: "English", us: "English", fr: "French", es: "Spanish", it: "Italian", pt: "Portuguese", ru: "Russian", uk: "Ukrainian", br: "Brazilian Portuguese", mx: "Mexican Spanish" };
  const languageName = LANGUAGE_NAMES[lang] || LANGUAGE_NAMES.de;

  const cleanName = typeof name === "string" ? name.slice(0, 60).trim() : "";
  if (!cleanName) {
    return res.status(400).json({ error: "Name required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI service is not configured" });

  const instructions = `You are DEGAJA, a warm, intuitive guide to Hebrew gematria (the Jewish mystical tradition of assigning numeric values to letters and reading meaning into the result). You are given a person's name. Transliterate the name into Hebrew letters as a skilled gematria reader would (using standard transliteration conventions), compute its standard (Mispar Hechrachi / absolute value) gematria total, and show your work briefly, then interpret what that number traditionally symbolizes and what it suggests about the person. Structure your reply as clearly separated sections, each starting with its label in bold markdown (use **Label:** at the very start of the section's paragraph), in this order: the Hebrew transliteration and total value, the traditional meaning of that number, and a personal closing reflection — translate the labels themselves into ${languageName} (so a German reply uses **Hebräische Schreibweise & Zahlenwert:**, **Bedeutung der Zahl:**, **Persönliche Reflexion:**, an English reply uses **Hebrew Spelling & Number:**, **Meaning of the Number:**, **Personal Reflection:**, and so on for other languages). Keep the tone warm and personal, like a real person texting, not a dry reference article. Frame everything as reflective entertainment and a cultural tradition, not a scientific or guaranteed prediction — never claim certainty about the future, health, or another person's private thoughts, and never give medical, legal or financial advice. Answer in ${languageName}, regardless of what script or language the name itself is written in. Keep it concise enough to end on a complete sentence — never let it get cut off mid-thought or mid-word.`;

  const userText = `My name is: ${cleanName}`;

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
        de: "DEGAJA konnte deinen Namen gerade nicht berechnen. Versuch es erneut.",
        en: "DEGAJA couldn't calculate your name right now. Please try again.",
        us: "DEGAJA couldn't calculate your name right now. Please try again.",
        fr: "DEGAJA n'a pas pu calculer ton nom pour le moment. Réessaie.",
        es: "DEGAJA no pudo calcular tu nombre en este momento. Inténtalo de nuevo.",
        it: "DEGAJA non è riuscita a calcolare il tuo nome in questo momento. Riprova.",
        pt: "A DEGAJA não conseguiu calcular o teu nome agora. Tenta novamente.",
        ru: "DEGAJA сейчас не смогла рассчитать твоё имя. Попробуй ещё раз.",
        uk: "DEGAJA зараз не змогла розрахувати твоє ім'я. Спробуй ще раз.",
        br: "A DEGAJA não conseguiu calcular o teu nome agora. Tenta novamente.",
        mx: "DEGAJA no pudo calcular tu nombre en este momento. Inténtalo de nuevo."
      }[lang] || "DEGAJA konnte deinen Namen gerade nicht berechnen. Versuch es erneut.";

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: "AI service error" });
  }
}
