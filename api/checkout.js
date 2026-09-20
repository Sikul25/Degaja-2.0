import { VOICE_PRICES } from "./_data.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { product, duration, email, name, advisorId, lang = "de" } = req.body || {};
  const CURRENCY_BY_LANG = { en: "gbp" };
  const LOCALE_BY_LANG = { de: "de", en: "en-GB", fr: "fr", es: "es", it: "it", pt: "pt", ru: "ru", uk: "auto" };
  const currency = CURRENCY_BY_LANG[lang] || "eur";
  const stripeLocale = LOCALE_BY_LANG[lang] || "de";
  const PRODUCT_NAMES = {
    de: { single: "DEGAJA AI – Einzelne Lesung", pack: "DEGAJA AI – 3 Lesungen", voice: minutes => `DEGAJA Live Audio – ${minutes} Minuten` },
    en: { single: "DEGAJA AI – Single Reading", pack: "DEGAJA AI – 3 Readings", voice: minutes => `DEGAJA Live Audio – ${minutes} Minutes` },
    fr: { single: "DEGAJA AI – Lecture unique", pack: "DEGAJA AI – 3 Lectures", voice: minutes => `DEGAJA Live Audio – ${minutes} Minutes` },
    es: { single: "DEGAJA AI – Lectura individual", pack: "DEGAJA AI – 3 Lecturas", voice: minutes => `DEGAJA Live Audio – ${minutes} Minutos` },
    it: { single: "DEGAJA AI – Lettura singola", pack: "DEGAJA AI – 3 Letture", voice: minutes => `DEGAJA Live Audio – ${minutes} Minuti` },
    pt: { single: "DEGAJA AI – Leitura única", pack: "DEGAJA AI – 3 Leituras", voice: minutes => `DEGAJA Live Audio – ${minutes} Minutos` },
    ru: { single: "DEGAJA AI – Разовый расклад", pack: "DEGAJA AI – 3 расклада", voice: minutes => `DEGAJA Live Audio – ${minutes} минут` },
    uk: { single: "DEGAJA AI – Одноразовий розклад", pack: "DEGAJA AI – 3 розклади", voice: minutes => `DEGAJA Live Audio – ${minutes} хвилин` }
  };
  const names = PRODUCT_NAMES[lang] || PRODUCT_NAMES.de;

  const products = {
    single: { name: names.single, amount: 499, quantity: 1, type: "ai", credits: 1 },
    pack: { name: names.pack, amount: 999, quantity: 1, type: "ai", credits: 3 }
  };

  let item = products[product];
  let type = "ai";
  let voiceDuration = null;
  if (product === "voice") {
    voiceDuration = Number(duration);
    const price = VOICE_PRICES[voiceDuration];
    item = price ? { name: names.voice(voiceDuration), amount: price.amount } : null;
    type = "voice";
  }
  if (!item) return res.status(400).json({ error: "Invalid product" });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return res.status(503).json({ error: "Stripe is not configured" });

  const origin = req.headers.origin || `https://${req.headers.host}`;
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("locale", stripeLocale);
  body.set("success_url", `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${origin}/?payment=cancelled`);
  body.set("line_items[0][price_data][currency]", currency);
  body.set("line_items[0][price_data][product_data][name]", item.name);
  body.set("line_items[0][price_data][unit_amount]", String(item.amount));
  body.set("line_items[0][quantity]", String(item.quantity || 1));
  body.set("metadata[type]", type);
  if (voiceDuration) body.set("metadata[duration]", String(voiceDuration));
  if (item.credits) body.set("metadata[credits]", String(item.credits));
  if (advisorId) body.set("metadata[advisorId]", String(advisorId).slice(0, 100));
  if (email) body.set("customer_email", String(email));
  if (email) body.set("client_reference_id", String(email).slice(0, 200));
  if (name) body.set("metadata[name]", String(name).slice(0, 200));

  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    const data = await response.json();
    if (!response.ok || !data.url) return res.status(502).json({ error: "Stripe checkout failed" });
    return res.status(200).json({ url: data.url });
  } catch (error) {
    return res.status(500).json({ error: "Checkout service error" });
  }
}
