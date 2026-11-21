// Fires a WhatsApp notification (reusing the same Meta WhatsApp Cloud API
// already wired up for live-advisor join links, see api/_whatsapp.js) the
// moment a candidate submits the advisor application form on
// werde-beraterin.html - including her written answers to Papuli's short
// skills test, so Papuli/Yoel see the submission instantly instead of only
// whenever the candidate's own mailto: email happens to arrive.
//
// Best-effort only: the form's own mailto: submission (cs@degaja.com) is
// the real application record and is never blocked or replaced by this -
// if WhatsApp delivery fails (e.g. the 24h customer-service window isn't
// open and no approved template is set for this message), the application
// still goes through via email exactly as before.
import { sendWhatsApp } from "./_whatsapp.js";

// Comma-separated list of destination numbers, e.g. "+491732960046,+..." -
// set as an env var so recipients can change without a code deploy.
// Papuli's own number is always included as a safe default even if the
// env var is unset or doesn't list her.
const DEFAULT_RECIPIENTS = ["+491732960046"];

function recipients() {
  const fromEnv = (process.env.ADVISOR_QUIZ_NOTIFY_PHONES || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  const all = new Set([...DEFAULT_RECIPIENTS, ...fromEnv]);
  return Array.from(all);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, phone, specialty, social, message, q1, q2, q3card2, q3card3 } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: "Missing name/email" });

  const lines = [
    "📋 Neue Beraterinnen-Bewerbung",
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Telefon: ${phone || "-"}`,
    `Erfahrung: ${specialty || "-"}`,
    `Social: ${social || "-"}`,
    "",
    "Fachtest-Antworten:",
    `1) ${q1 || "-"}`,
    `2) ${q2 || "-"}`,
    `3) Karte 2: ${q3card2 || "-"} / Karte 3: ${q3card3 || "-"}`
  ];
  if (message) lines.push("", "Nachricht:", message);
  const body = lines.join("\n");

  const results = await Promise.all(recipients().map(to => sendWhatsApp({ to, body })));
  const anySent = results.some(r => r && r.sent);

  // Never fail the candidate's own submission because of this - it's a
  // best-effort side notification, not the application record itself.
  return res.status(200).json({ notified: anySent, results });
}
