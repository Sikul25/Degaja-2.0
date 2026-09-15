const ADVISORS = {
  anna: {
    name: "Anna",
    title: "Tarot & Liebe",
    specialty: "Liebe & Beziehung, Tarot",
    style: "warm, intuitiv, empathisch und direkt"
  },
  sophie: {
    name: "Sophie",
    title: "Beziehung & Gefühle",
    specialty: "Liebe & Beziehung",
    style: "sanft, emotional intelligent und beruhigend"
  },
  lea: {
    name: "Lea",
    title: "Zukunft & Karten",
    specialty: "Zukunft, Tarot",
    style: "mystisch, reflektiert und prägnant"
  },
  maria: {
    name: "Maria",
    title: "Numerologie",
    specialty: "Numerologie, Zukunft",
    style: "ruhig, analytisch und spirituell"
  },
  clara: {
    name: "Clara",
    title: "Astrologie",
    specialty: "Astrologie, Zukunft",
    style: "elegant, aufmerksam und optimistisch"
  },
  julia: {
    name: "Julia",
    title: "Liebe & Partnerschaft",
    specialty: "Liebe & Beziehung",
    style: "freundlich, unterstützend und praktisch"
  },
  elena: {
    name: "Elena",
    title: "Tarot & Intuition",
    specialty: "Tarot, Zukunft",
    style: "tief, intuitiv und mitfühlend"
  },
  laura: {
    name: "Laura",
    title: "Beruf & Lebensweg",
    specialty: "Beruf & Karriere, Zukunft",
    style: "klar, motivierend und bodenständig"
  },
  nina: {
    name: "Nina",
    title: "Karten & Beziehungen",
    specialty: "Tarot, Liebe & Beziehung",
    style: "sanft, feinfühlig und persönlich"
  },
  isabella: {
    name: "Isabella",
    title: "Astrologie & Numerologie",
    specialty: "Astrologie, Numerologie",
    style: "warm, kultiviert und reflektiert"
  }
};

function getAdvisor(advisorId) {
  return ADVISORS[String(advisorId || "anna").toLowerCase()] || ADVISORS.anna;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    question,
    topic,
    mode = "free",
    advisorId = "anna",
    conversationId = null,
    history = []
  } = req.body || {};

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Question required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI service is not configured" });

  const advisor = getAdvisor(advisorId);
  const safeHistory = Array.isArray(history)
    ? history.slice(-12).filter(item => item && typeof item.role === "string" && typeof item.content === "string").map(item => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: item.content.slice(0, 3000)
      }))
    : [];

  const instructions = `You are ${advisor.name}, DEGAJA's German-language spiritual advisor for ${advisor.title}. Your specialties are ${advisor.specialty}. Your personality is ${advisor.style}. Be warm, personal, consistent and engaging. Remember the conversational context supplied to you and do not repeat generic advice when the user has already provided relevant details. Address the user's actual situation and ask a useful follow-up question when appropriate. Frame tarot, astrology and numerology as reflective entertainment/guidance, not guaranteed predictions or professional advice. Never claim certainty about another person's private thoughts or the future. Do not give medical, legal or financial professional advice. Answer in German. ${mode === "paid" ? "This is a paid deeper reading: give a richer, highly personal interpretation." : "This is the free first reading: give a useful, emotionally engaging but concise interpretation."}`;

  const historyText = safeHistory.length
    ? `\nBisheriger Gesprächskontext:\n${safeHistory.map(item => `${item.role === "assistant" ? advisor.name : "User"}: ${item.content}`).join("\n")}`
    : "";

  const input = `Themenbereich: ${topic || "Allgemein"}\nFrage: ${question}${conversationId ? `\nSession: ${String(conversationId).slice(0, 120)}` : ""}${historyText}`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-mini",
        instructions,
        input,
        max_output_tokens: mode === "paid" ? 700 : 350,
        temperature: 0.9
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: "AI request failed" });

    const text = data.output_text || data.output?.flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n") || "DEGAJA konnte gerade keine Antwort erstellen.";

    return res.status(200).json({
      text,
      advisor: {
        id: String(advisorId || "anna").toLowerCase(),
        name: advisor.name,
        title: advisor.title
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "AI service error" });
  }
}
