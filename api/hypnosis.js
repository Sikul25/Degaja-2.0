export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { focus, note, lang = "de" } = req.body || {};

  const LANGUAGE_NAMES = { de: "German", en: "English", us: "English", fr: "French", es: "Spanish", it: "Italian", pt: "Portuguese", ru: "Russian", uk: "Ukrainian", br: "Brazilian Portuguese", mx: "Mexican Spanish" };
  const languageName = LANGUAGE_NAMES[lang] || LANGUAGE_NAMES.de;

  const cleanFocus = typeof focus === "string" ? focus.slice(0, 60).trim() : "";
  const cleanNote = typeof note === "string" ? note.slice(0, 300).trim() : "";
  if (!cleanFocus) {
    return res.status(400).json({ error: "Focus area required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI service is not configured" });

  const instructions = `You are DEGAJA, writing a short, light guided relaxation script for personal entertainment, inspired by calming visualization techniques. Keep it purely a pleasant, calming moment — not therapy, not treatment, not advice about the listener's situation. The script is read aloud (via text-to-speech): write it as flowing, spoken, second-person narration ("Close your eyes... breathe in slowly...") with natural pauses shown as ellipses, not as an article or list. The person's chosen focus is given in German regardless of the reply language — translate its meaning into ${languageName} naturally. Structure your reply with three short bolded section labels at the very start of each section's paragraph, translated into ${languageName} (German example: **Einstieg:**, **Vertiefung:**, **Rückkehr:**; English example: **Settling In:**, **Deepening:**, **Returning:**): a brief settling-in/breathing passage, a short visualization passage matching their focus, and a brief closing passage that leaves them calm. Keep each section short. Keep the tone warm and gentle. Answer in ${languageName}. End on a complete sentence.`;

  const userText = `Focus area (given in German): ${cleanFocus}${cleanNote ? `\nSomething personal they'd like included: ${cleanNote}` : ""}`;

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
        de: "DEGAJA konnte deine geführte Sitzung gerade nicht erstellen. Versuch es erneut.",
        en: "DEGAJA couldn't create your guided session right now. Please try again.",
        us: "DEGAJA couldn't create your guided session right now. Please try again.",
        fr: "DEGAJA n'a pas pu créer ta séance guidée pour le moment. Réessaie.",
        es: "DEGAJA no pudo crear tu sesión guiada en este momento. Inténtalo de nuevo.",
        it: "DEGAJA non è riuscita a creare la tua sessione guidata in questo momento. Riprova.",
        pt: "A DEGAJA não conseguiu criar a tua sessão guiada agora. Tenta novamente.",
        ru: "DEGAJA сейчас не смогла создать твою сессию. Попробуй ещё раз.",
        uk: "DEGAJA зараз не змогла створити твою сесію. Спробуй ще раз.",
        br: "A DEGAJA não conseguiu criar a tua sessão guiada agora. Tenta novamente.",
        mx: "DEGAJA no pudo crear tu sesión guiada en este momento. Inténtalo de nuevo."
      }[lang] || "DEGAJA konnte deine geführte Sitzung gerade nicht erstellen. Versuch es erneut.";

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: "AI service error" });
  }
}
