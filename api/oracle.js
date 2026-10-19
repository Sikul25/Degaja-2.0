import { getAdvisor } from "./_data.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    question,
    topic,
    mode = "free",
    advisorId = "papuli",
    conversationId = null,
    history = [],
    lang = "de",
    profile = {}
  } = req.body || {};

  const LANGUAGE_NAMES = { de: "German", en: "English", us: "English", fr: "French", es: "Spanish", it: "Italian", pt: "Portuguese", ru: "Russian", uk: "Ukrainian", br: "Brazilian Portuguese", mx: "Mexican Spanish" };
  const languageName = LANGUAGE_NAMES[lang] || LANGUAGE_NAMES.de;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Question required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI service is not configured" });

  // Sanitize the quiz profile the same way palm.js/coffee.js do: plain
  // strings only, length-capped, never trusted beyond "short text to weave in".
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

  const advisor = getAdvisor(advisorId);
  const safeHistory = Array.isArray(history)
    ? history.slice(-12).filter(item => item && typeof item.role === "string" && typeof item.content === "string").map(item => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: item.content.slice(0, 3000)
      }))
    : [];

  const specialty = Array.isArray(advisor.specialty) ? advisor.specialty.join(", ") : advisor.specialty;
  const instructions = `You are ${advisor.name}, DEGAJA's German-language spiritual advisor for ${advisor.title}. Your specialties are ${specialty}. Your personality is ${advisor.style}. Write the way a real person texts in a warm private conversation, not like marketing copy or a template: vary your sentence openings, vary your word choice, and never reuse a phrase, sentence structure or opening line you already used earlier in this same conversation (check the conversation context below before you write). Prefer shorter, natural sentences over long formal ones, and occasionally ask a genuine follow-up question instead of only stating an interpretation. Remember the conversational context supplied to you and build on it instead of repeating generic advice the user has already heard. Address the user's actual situation specifically rather than restating their question back to them.${profileLines ? ` You were also given some personal context about them before they asked their question — weave it in where it genuinely fits (address them by name if given, infer and mention their zodiac sign from the date of birth if given, let their focus area/relationship status/mood color the tone), but the question itself must stay the actual basis of the reading.` : ""} Frame tarot, astrology and numerology as reflective entertainment/guidance, not guaranteed predictions or professional advice. Never claim certainty about another person's private thoughts or the future. Do not give medical, legal or financial professional advice. Answer in ${languageName}, regardless of the language the topic or question below is written in. ${mode === "paid" ? "This is a paid deeper reading: give a richer, highly personal interpretation." : "This is the free first reading: give a useful, emotionally engaging but concise interpretation."} If three tarot cards were drawn, keep each card's interpretation brief enough that all three, plus a short closing thought, comfortably fit and end on a complete sentence — never let the reply get cut off mid-thought or mid-word.`;

  const historyText = safeHistory.length
    ? `\nBisheriger Gesprächskontext:\n${safeHistory.map(item => `${item.role === "assistant" ? advisor.name : "User"}: ${item.content}`).join("\n")}`
    : "";

  const input = `Themenbereich: ${topic || "Allgemein"}\nFrage: ${question}${conversationId ? `\nSession: ${String(conversationId).slice(0, 120)}` : ""}${profileLines ? `\n\nPersonal context:\n${profileLines}` : ""}${historyText}`;

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
        messages: [{ role: "user", content: input }],
        max_tokens: mode === "paid" ? 1100 : 900,
        output_config: { effort: "low" }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: "AI request failed" });

    const text = (Array.isArray(data.content)
      ? data.content.filter(item => item.type === "text").map(item => item.text).join("\n")
      : "") || {
        de: "DEGAJA konnte gerade keine Antwort erstellen.",
        en: "DEGAJA couldn't create an answer right now.",
        us: "DEGAJA couldn't create an answer right now.",
        fr: "DEGAJA n'a pas pu générer de réponse pour le moment.",
        es: "DEGAJA no pudo generar una respuesta en este momento.",
        it: "DEGAJA non è riuscita a creare una risposta in questo momento.",
        pt: "A DEGAJA não conseguiu criar uma resposta neste momento.",
        ru: "DEGAJA сейчас не смогла подготовить ответ.",
        uk: "DEGAJA зараз не змогла підготувати відповідь.",
        br: "A DEGAJA não conseguiu criar uma resposta neste momento.",
        mx: "DEGAJA no pudo generar una respuesta en este momento."
      }[lang] || "DEGAJA konnte gerade keine Antwort erstellen.";

    return res.status(200).json({
      text,
      advisor: {
        id: String(advisorId || "papuli").toLowerCase(),
        name: advisor.name,
        title: advisor.title
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "AI service error" });
  }
}
