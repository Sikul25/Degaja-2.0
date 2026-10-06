export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { image, mediaType = "image/jpeg", lang = "de", profile = {} } = req.body || {};

  const LANGUAGE_NAMES = { de: "German", en: "English", us: "English", fr: "French", es: "Spanish", it: "Italian", pt: "Portuguese", ru: "Russian", uk: "Ukrainian", br: "Brazilian Portuguese", mx: "Mexican Spanish" };
  const languageName = LANGUAGE_NAMES[lang] || LANGUAGE_NAMES.de;

  if (!image || typeof image !== "string") {
    return res.status(400).json({ error: "Image required" });
  }

  const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const safeMediaType = ALLOWED_MEDIA_TYPES.includes(mediaType) ? mediaType : "image/jpeg";

  // Accept either a raw base64 string or a full data: URL from the client.
  const base64Data = image.includes(",") ? image.split(",").pop() : image;

  // Rough size guard: base64 is ~4/3 the size of the raw bytes. The client
  // resizes images before upload, so a legitimate photo stays well under this.
  if (base64Data.length > 6_000_000) {
    return res.status(413).json({ error: "Image too large" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI service is not configured" });

  // Sanitize the quiz profile: plain strings only, length-capped, same spirit
  // as oracle.js's history sanitation — this is free text a visitor typed,
  // never trust it beyond "short string to weave into a reading".
  const cleanField = (value, max = 60) => (typeof value === "string" ? value.slice(0, max).trim() : "");
  const safeProfile = {
    name: cleanField(profile.name, 40),
    birthDate: cleanField(profile.birthDate, 20),
    gender: cleanField(profile.gender, 20),
    focus: cleanField(profile.focus, 40),
    relationship: cleanField(profile.relationship, 40),
    mood: cleanField(profile.mood, 30),
    bigQuestion: cleanField(profile.bigQuestion, 120),
    worldview: cleanField(profile.worldview, 60),
    curiosity: cleanField(profile.curiosity, 40),
    wish: cleanField(profile.wish, 120)
  };

  const profileLines = [
    safeProfile.name && `Name: ${safeProfile.name}`,
    safeProfile.birthDate && `Date of birth: ${safeProfile.birthDate}`,
    safeProfile.gender && `Gender: ${safeProfile.gender}`,
    safeProfile.focus && `Current focus: ${safeProfile.focus}`,
    safeProfile.relationship && `Relationship status: ${safeProfile.relationship}`,
    safeProfile.mood && `Current mood: ${safeProfile.mood}`,
    safeProfile.bigQuestion && `Their biggest question right now: ${safeProfile.bigQuestion}`,
    safeProfile.worldview && `Their view on fate: ${safeProfile.worldview}`,
    safeProfile.curiosity && `Most curious about: ${safeProfile.curiosity}`,
    safeProfile.wish && `What they wish someone would tell them: ${safeProfile.wish}`
  ].filter(Boolean).join("\n");

  const instructions = `You are DEGAJA, a warm, intuitive palm reader (palmistry/chiromancy). You are shown a photo of someone's open palm${profileLines ? ", along with some personal context they shared beforehand" : ""}. Analyze the palm as a skilled palm reader would, covering the life line, heart line, head line and fate line (if visible), plus hand shape and any mounts that stand out. Structure your reply as clearly separated sections, each starting with its label in bold markdown (use **Label:** at the very start of the section's paragraph), in this order: an overview section first, then the life line, heart line, head line and fate line — translate the labels themselves into ${languageName} too (so a German reply uses **Überblick:**, **Lebenslinie:**, **Herzlinie:**, **Kopflinie:**, **Schicksalslinie:**, an English reply uses **Overview:**, **Life Line:**, **Heart Line:**, **Head Line:**, **Fate Line:**, and so on for other languages). Within each section write 2-4 warm, personal sentences — not a dry definition of what the line generally means, an actual reading of what you see in THIS palm.${profileLines ? ` Weave in the personal context you were given where it genuinely fits (address them by name if given, infer and mention their zodiac sign from the date of birth if given, let their focus area/relationship status/mood color the tone) — but the palm image itself must stay the actual basis of the reading, never turn this into a generic horoscope that ignores the photo.` : ""} Write the way a real person texts in a warm private conversation, not like marketing copy or a template. Frame everything as reflective entertainment/guidance, not a guaranteed prediction or medical/professional diagnosis — never claim certainty about health, lifespan or specific future events, and never give medical advice. If the photo does not clearly show an open palm (for example it's blurry, shows the wrong body part, or no hand at all), skip the section structure and instead gently explain that and ask for a clearer photo of an open palm in good light. Answer in ${languageName}, regardless of any other language that might appear in the image or the personal context. Keep each section concise enough that the whole reading ends on a complete sentence — never let it get cut off mid-thought or mid-word.`;

  const userText = profileLines
    ? `Please read my palm. Here's a bit about me:\n${profileLines}`
    : "Please read my palm.";

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
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: safeMediaType, data: base64Data } },
            { type: "text", text: userText }
          ]
        }],
        max_tokens: 900,
        output_config: { effort: "low" }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: "AI request failed" });

    const text = (Array.isArray(data.content)
      ? data.content.filter(item => item.type === "text").map(item => item.text).join("\n")
      : "") || {
        de: "DEGAJA konnte deine Hand gerade nicht lesen. Versuch es mit einem klareren Foto erneut.",
        en: "DEGAJA couldn't read your palm right now. Try again with a clearer photo.",
        us: "DEGAJA couldn't read your palm right now. Try again with a clearer photo.",
        fr: "DEGAJA n'a pas pu lire votre main pour le moment. Réessayez avec une photo plus nette.",
        es: "DEGAJA no pudo leer tu mano en este momento. Intenta con una foto más clara.",
        it: "DEGAJA non è riuscita a leggere la tua mano in questo momento. Riprova con una foto più chiara.",
        pt: "A DEGAJA não conseguiu ler a sua mão agora. Tente novamente com uma foto mais nítida.",
        ru: "DEGAJA сейчас не смогла прочитать вашу ладонь. Попробуйте снова с более четким фото.",
        uk: "DEGAJA зараз не змогла прочитати вашу долоню. Спробуйте ще раз із чіткішим фото.",
        br: "A DEGAJA não conseguiu ler a sua mão agora. Tente novamente com uma foto mais nítida.",
        mx: "DEGAJA no pudo leer tu mano en este momento. Intenta con una foto más clara."
      }[lang] || "DEGAJA konnte deine Hand gerade nicht lesen. Versuch es mit einem klareren Foto erneut.";

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: "AI service error" });
  }
}
