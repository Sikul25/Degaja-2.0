export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, birthDate, birthTime, lang = "de" } = req.body || {};

  const LANGUAGE_NAMES = { de: "German", en: "English", us: "English", fr: "French", es: "Spanish", it: "Italian", pt: "Portuguese", ru: "Russian", uk: "Ukrainian", br: "Brazilian Portuguese", mx: "Mexican Spanish", ja: "Japanese", zh: "Chinese", hi: "Hindi" };
  const languageName = LANGUAGE_NAMES[lang] || LANGUAGE_NAMES.de;

  const cleanName = typeof name === "string" ? name.slice(0, 60).trim() : "";
  const cleanBirthDate = typeof birthDate === "string" ? birthDate.slice(0, 20).trim() : "";
  const cleanBirthTime = typeof birthTime === "string" ? birthTime.slice(0, 10).trim() : "";
  if (!cleanName || !cleanBirthDate) {
    return res.status(400).json({ error: "Name and date of birth required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI service is not configured" });

  const instructions = `You are DEGAJA, a warm, intuitive reader working in the Chinese Four Pillars of Destiny tradition (BaZi / 八字, known in Japan as Shichū Suimei / 四柱推命). You are given a person's full name, date of birth, and optionally their time of birth. Determine the Year Pillar, Month Pillar and Day Pillar (each a Heavenly Stem paired with an Earthly Branch) from the date of birth using the traditional sexagenary cycle, and the Hour Pillar as well if a time of birth was given (if no time was given, skip the Hour Pillar and say briefly that it needs a birth time). Briefly note which of the Five Elements (Wood, Fire, Earth, Metal, Water) is most and least present across the pillars. Structure your reply as clearly separated sections, each starting with its label in bold markdown (use **Label:** at the very start of the section's paragraph), in this order: Year Pillar, Month Pillar, Day Pillar, Hour Pillar (only if a birth time was given), Five Elements Balance, and a personal closing reflection on what the overall chart suggests — translate the labels themselves into ${languageName} (so a Japanese reply uses **年柱:**, **月柱:**, **日柱:**, **時柱:**, **五行のバランス:**, **まとめ:**; a Chinese reply uses **年柱：**, **月柱：**, **日柱：**, **时柱：**, **五行平衡：**, **总结：**; a German reply uses **Jahressäule:**, **Monatssäule:**, **Tagessäule:**, **Stundensäule:**, **Fünf-Elemente-Balance:**, **Persönliche Reflexion:**, and so on for other languages). Keep the tone warm and personal, like a real person texting, not a dry reference article or a technical almanac. Frame everything as reflective entertainment, not a scientific or guaranteed prediction — never claim certainty about the future, health, or another person's private thoughts, and never give medical, legal or financial advice. Answer in ${languageName}, regardless of what language the name is written in. Keep it concise enough to end on a complete sentence — never let it get cut off mid-thought or mid-word.`;

  const userText = `My name is: ${cleanName}\nMy date of birth is: ${cleanBirthDate}${cleanBirthTime ? `\nMy time of birth is: ${cleanBirthTime}` : ""}`;

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
        de: "DEGAJA konnte deine vier Säulen gerade nicht berechnen. Versuch es erneut.",
        en: "DEGAJA couldn't calculate your Four Pillars right now. Please try again.",
        us: "DEGAJA couldn't calculate your Four Pillars right now. Please try again.",
        fr: "DEGAJA n'a pas pu calculer tes quatre piliers pour le moment. Réessaie.",
        es: "DEGAJA no pudo calcular tus cuatro pilares en este momento. Inténtalo de nuevo.",
        it: "DEGAJA non è riuscita a calcolare i tuoi quattro pilastri in questo momento. Riprova.",
        pt: "A DEGAJA não conseguiu calcular os teus quatro pilares agora. Tenta novamente.",
        ru: "DEGAJA сейчас не смогла рассчитать твои четыре столпа. Попробуй ещё раз.",
        uk: "DEGAJA зараз не змогла розрахувати твої чотири стовпи. Спробуй ще раз.",
        br: "A DEGAJA não conseguiu calcular os teus quatro pilares agora. Tenta novamente.",
        mx: "DEGAJA no pudo calcular tus cuatro pilares en este momento. Inténtalo de nuevo.",
        ja: "DEGAJAは今、命式を算出できませんでした。もう一度お試しください。",
        zh: "DEGAJA暂时无法排出你的八字，请重试。",
        hi: "DEGAJA अभी तुम्हारे चार स्तंभों की गणना नहीं कर सकी। कृपया फिर कोशिश करो।"
      }[lang] || "DEGAJA konnte deine vier Säulen gerade nicht berechnen. Versuch es erneut.";

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: "AI service error" });
  }
}
