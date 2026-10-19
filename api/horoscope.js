export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { birthDate, question = "", lang = "de" } = req.body || {};

  const LANGUAGE_NAMES = { de: "German", en: "English", us: "English", fr: "French", es: "Spanish", it: "Italian", pt: "Portuguese", ru: "Russian", uk: "Ukrainian", br: "Brazilian Portuguese", mx: "Mexican Spanish" };
  const languageName = LANGUAGE_NAMES[lang] || LANGUAGE_NAMES.de;

  const cleanBirthDate = typeof birthDate === "string" ? birthDate.slice(0, 20).trim() : "";
  const cleanQuestion = typeof question === "string" ? question.slice(0, 300).trim() : "";
  if (!cleanBirthDate) {
    return res.status(400).json({ error: "Date of birth required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI service is not configured" });

  const instructions = `You are DEGAJA, a warm, intuitive astrologer. You are given a person's date of birth and optionally a specific question they want answered. Determine their zodiac (sun) sign from the date, plus its element (Fire/Earth/Air/Water) and modality (Cardinal/Fixed/Mutable) — these are fixed, well-known facts for each sign, so state them correctly and confidently, never invent or guess them. Do NOT state a moon sign, rising sign/ascendant, ruling planet or "lucky numbers" — those require an exact birth time and location you were not given, so inventing them would just be made up; if asked, you may mention that a precise birth time and place would be needed for those. Structure your reply as clearly separated sections, each starting with its label in bold markdown (use **Label:** at the very start of the section's paragraph), in this order: their zodiac sign with its element and modality, a personal horoscope reading for today/this week${cleanQuestion ? " focused on their specific question" : " covering love, career and general energy"}, a quick-glance note on how their energy currently leans across love, career and wellbeing, and finally one short, personal, empowering one-sentence affirmation for them to carry through the day — translate the labels themselves into ${languageName} (so a German reply uses **Dein Sternzeichen:**, **Dein Horoskop:**, **Deine Energie heute:**, **Dein Impuls für heute:**, an English reply uses **Your Zodiac Sign:**, **Your Horoscope:**, **Your Energy Today:**, **Today's Affirmation:**, and so on for other languages). Keep the tone warm and personal, like a real person texting, not a dry reference article. Frame everything as reflective entertainment, not a scientific or guaranteed prediction — never claim certainty about the future, health, or another person's private thoughts, and never give medical, legal or financial advice. Answer in ${languageName}. Keep it concise enough to end on a complete sentence — never let it get cut off mid-thought or mid-word.`;

  const userText = `My date of birth is: ${cleanBirthDate}${cleanQuestion ? `\nWhat I'd like to know: ${cleanQuestion}` : ""}`;

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
        max_tokens: 1200,
        output_config: { effort: "low" }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: "AI request failed" });

    const text = (Array.isArray(data.content)
      ? data.content.filter(item => item.type === "text").map(item => item.text).join("\n")
      : "") || {
        de: "DEGAJA konnte dein Horoskop gerade nicht erstellen. Versuch es erneut.",
        en: "DEGAJA couldn't create your horoscope right now. Please try again.",
        us: "DEGAJA couldn't create your horoscope right now. Please try again.",
        fr: "DEGAJA n'a pas pu créer ton horoscope pour le moment. Réessaie.",
        es: "DEGAJA no pudo crear tu horóscopo en este momento. Inténtalo de nuevo.",
        it: "DEGAJA non è riuscita a creare il tuo oroscopo in questo momento. Riprova.",
        pt: "A DEGAJA não conseguiu criar o teu horóscopo agora. Tenta novamente.",
        ru: "DEGAJA сейчас не смогла составить твой гороскоп. Попробуй ещё раз.",
        uk: "DEGAJA зараз не змогла скласти твій гороскоп. Спробуй ще раз.",
        br: "A DEGAJA não conseguiu criar o teu horóscopo agora. Tenta novamente.",
        mx: "DEGAJA no pudo crear tu horóscopo en este momento. Inténtalo de nuevo."
      }[lang] || "DEGAJA konnte dein Horoskop gerade nicht erstellen. Versuch es erneut.";

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: "AI service error" });
  }
}
