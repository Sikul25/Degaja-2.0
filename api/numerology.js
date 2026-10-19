export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, birthDate, lang = "de" } = req.body || {};

  const LANGUAGE_NAMES = { de: "German", en: "English", us: "English", fr: "French", es: "Spanish", it: "Italian", pt: "Portuguese", ru: "Russian", uk: "Ukrainian", br: "Brazilian Portuguese", mx: "Mexican Spanish" };
  const languageName = LANGUAGE_NAMES[lang] || LANGUAGE_NAMES.de;

  const cleanName = typeof name === "string" ? name.slice(0, 60).trim() : "";
  const cleanBirthDate = typeof birthDate === "string" ? birthDate.slice(0, 20).trim() : "";
  if (!cleanName || !cleanBirthDate) {
    return res.status(400).json({ error: "Name and date of birth required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI service is not configured" });

  const instructions = `You are DEGAJA, a warm, intuitive numerologist working in the classic Pythagorean numerology tradition. You are given a person's full name and date of birth. Calculate their Life Path number by reducing the digits of the birth date (reduce to a single digit, except keep master numbers 11, 22 and 33 unreduced), and calculate their Expression/Destiny number by converting the letters of their name to numbers using the standard Pythagorean letter-number chart and reducing the same way. Show your work briefly, then interpret both numbers. Structure your reply as clearly separated sections, each starting with its label in bold markdown (use **Label:** at the very start of the section's paragraph), in this order: Life Path number (with the calculation shown briefly), Expression/Destiny number (with the calculation shown briefly), and a personal closing reflection on how the two numbers interact — translate the labels themselves into ${languageName} (so a German reply uses **Lebenszahl:**, **Ausdruckszahl:**, **Persönliche Reflexion:**, an English reply uses **Life Path Number:**, **Expression Number:**, **Personal Reflection:**, and so on for other languages). Keep the tone warm and personal, like a real person texting, not a dry reference article. Frame everything as reflective entertainment, not a scientific or guaranteed prediction — never claim certainty about the future, health, or another person's private thoughts, and never give medical, legal or financial advice. Answer in ${languageName}, regardless of what language the name is written in. Keep it concise enough to end on a complete sentence — never let it get cut off mid-thought or mid-word.`;

  const userText = `My name is: ${cleanName}\nMy date of birth is: ${cleanBirthDate}`;

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
        max_tokens: 1000,
        output_config: { effort: "low" }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: "AI request failed" });

    const text = (Array.isArray(data.content)
      ? data.content.filter(item => item.type === "text").map(item => item.text).join("\n")
      : "") || {
        de: "DEGAJA konnte deine Numerologie gerade nicht berechnen. Versuch es erneut.",
        en: "DEGAJA couldn't calculate your numerology right now. Please try again.",
        us: "DEGAJA couldn't calculate your numerology right now. Please try again.",
        fr: "DEGAJA n'a pas pu calculer ta numérologie pour le moment. Réessaie.",
        es: "DEGAJA no pudo calcular tu numerología en este momento. Inténtalo de nuevo.",
        it: "DEGAJA non è riuscita a calcolare la tua numerologia in questo momento. Riprova.",
        pt: "A DEGAJA não conseguiu calcular a tua numerologia agora. Tenta novamente.",
        ru: "DEGAJA сейчас не смогла рассчитать твою нумерологию. Попробуй ещё раз.",
        uk: "DEGAJA зараз не змогла розрахувати твою нумерологію. Спробуй ще раз.",
        br: "A DEGAJA não conseguiu calcular a tua numerologia agora. Tenta novamente.",
        mx: "DEGAJA no pudo calcular tu numerología en este momento. Inténtalo de nuevo."
      }[lang] || "DEGAJA konnte deine Numerologie gerade nicht berechnen. Versuch es erneut.";

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: "AI service error" });
  }
}
