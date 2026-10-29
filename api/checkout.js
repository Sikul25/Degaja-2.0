import { VOICE_PRICES } from "./_data.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { product, topics, email, name, advisorId, ref, birthDate, lang = "de" } = req.body || {};

  // Self-attested date of birth, required for every paid product. Checked
  // server-side (not just client-side) so there's an enforced, timestamped
  // record tied to the actual Stripe payment if age is ever disputed later
  // (e.g. a chargeback claiming the buyer was a minor).
  function isAdultBirthDate(dateStr) {
    const parsed = new Date(dateStr);
    if (!dateStr || isNaN(parsed.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - parsed.getFullYear();
    const monthDiff = today.getMonth() - parsed.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) age--;
    return age >= 18;
  }
  if (!isAdultBirthDate(birthDate)) {
    return res.status(400).json({ error: "A valid date of birth confirming you are 18 or older is required." });
  }
  const CURRENCY_BY_LANG = { en: "gbp", us: "usd", br: "brl", mx: "mxn", ja: "jpy", zh: "cny", hi: "inr" };
  const LOCALE_BY_LANG = { de: "de", en: "en-GB", us: "en", fr: "fr", es: "es", it: "it", pt: "pt", ru: "ru", uk: "auto", br: "pt-BR", mx: "es", ja: "ja", zh: "zh", hi: "auto" };
  const currency = CURRENCY_BY_LANG[lang] || "eur";
  const stripeLocale = LOCALE_BY_LANG[lang] || "de";
  const PRODUCT_NAMES = {
    de: { single: "DEGAJA AI – Einzelne Lesung", pack: "DEGAJA AI – 3 Lesungen", voice: n => `DEGAJA Live Audio – ${n} ${n === 1 ? "Thema" : "Themen"}` },
    en: { single: "DEGAJA AI – Single Reading", pack: "DEGAJA AI – 3 Readings", voice: n => `DEGAJA Live Audio – ${n} ${n === 1 ? "Topic" : "Topics"}` },
    us: { single: "DEGAJA AI – Single Reading", pack: "DEGAJA AI – 3 Readings", voice: n => `DEGAJA Live Audio – ${n} ${n === 1 ? "Topic" : "Topics"}` },
    fr: { single: "DEGAJA AI – Lecture unique", pack: "DEGAJA AI – 3 Lectures", voice: n => `DEGAJA Live Audio – ${n} ${n === 1 ? "Sujet" : "Sujets"}` },
    es: { single: "DEGAJA AI – Lectura individual", pack: "DEGAJA AI – 3 Lecturas", voice: n => `DEGAJA Live Audio – ${n} ${n === 1 ? "Tema" : "Temas"}` },
    it: { single: "DEGAJA AI – Lettura singola", pack: "DEGAJA AI – 3 Letture", voice: n => `DEGAJA Live Audio – ${n} ${n === 1 ? "Argomento" : "Argomenti"}` },
    pt: { single: "DEGAJA AI – Leitura única", pack: "DEGAJA AI – 3 Leituras", voice: n => `DEGAJA Live Audio – ${n} ${n === 1 ? "Tema" : "Temas"}` },
    ru: { single: "DEGAJA AI – Разовый расклад", pack: "DEGAJA AI – 3 расклада", voice: n => `DEGAJA Live Audio – ${n} ${n === 1 ? "тема" : "темы"}` },
    uk: { single: "DEGAJA AI – Одноразовий розклад", pack: "DEGAJA AI – 3 розклади", voice: n => `DEGAJA Live Audio – ${n} ${n === 1 ? "тема" : "теми"}` },
    br: { single: "DEGAJA AI – Leitura única", pack: "DEGAJA AI – 3 Leituras", voice: n => `DEGAJA Live Audio – ${n} ${n === 1 ? "Tema" : "Temas"}` },
    mx: { single: "DEGAJA AI – Lectura individual", pack: "DEGAJA AI – 3 Lecturas", voice: n => `DEGAJA Live Audio – ${n} ${n === 1 ? "Tema" : "Temas"}` },
    ja: { single: "DEGAJA AI – 単発鑑定", pack: "DEGAJA AI – 3回鑑定パック", voice: n => `DEGAJA ライブ音声 – ${n}テーマ` },
    zh: { single: "DEGAJA AI – 单次解读", pack: "DEGAJA AI – 3次解读", voice: n => `DEGAJA 实时语音 – ${n}个主题` },
    hi: { single: "DEGAJA AI – सिंगल रीडिंग", pack: "DEGAJA AI – 3 रीडिंग्स", voice: n => `DEGAJA लाइव ऑडियो – ${n} विषय` }
  };
  const names = PRODUCT_NAMES[lang] || PRODUCT_NAMES.de;

  // BRL, MXN, JPY, CNY and INR are priced as fair converted values, not a
  // same-digits symbol swap like GBP, so they need their own amounts here
  // and for voice topic tiers below. Stripe amounts are in the currency's
  // smallest unit (cents/centavos/paise) EXCEPT zero-decimal currencies
  // like JPY, where the amount is the literal whole-unit price - ¥750 is
  // unit_amount 750, not 75000. Getting this wrong would silently charge
  // either 100x too much or too little.
  const AI_AMOUNTS_BY_CURRENCY = {
    brl: { single: 2499, pack: 4999 },
    mxn: { single: 8900, pack: 17900 },
    jpy: { single: 750, pack: 1490 },
    cny: { single: 3900, pack: 7900 },
    inr: { single: 24900, pack: 49900 }
  };
  const aiAmounts = AI_AMOUNTS_BY_CURRENCY[currency] || { single: 499, pack: 999 };
  const products = {
    single: { name: names.single, amount: aiAmounts.single, quantity: 1, type: "ai", credits: 1 },
    pack: { name: names.pack, amount: aiAmounts.pack, quantity: 1, type: "ai", credits: 3 }
  };

  let item = products[product];
  let type = "ai";
  let voiceTopics = null;
  if (product === "voice") {
    voiceTopics = Number(topics);
    const price = VOICE_PRICES[voiceTopics];
    const priceForCurrency = price && price[currency] ? price[currency] : price;
    item = priceForCurrency ? { name: names.voice(voiceTopics), amount: priceForCurrency.amount } : null;
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
  body.set("allow_promotion_codes", "true");
  // Card only: without this Stripe also offers Link, which can prompt
  // returning customers for an identity-verification code mid-checkout.
  body.set("payment_method_types[0]", "card");
  body.set("line_items[0][price_data][currency]", currency);
  body.set("line_items[0][price_data][product_data][name]", item.name);
  body.set("line_items[0][price_data][unit_amount]", String(item.amount));
  body.set("line_items[0][quantity]", String(item.quantity || 1));
  body.set("metadata[type]", type);
  body.set("metadata[product]", String(product));
  body.set("metadata[lang]", String(lang));
  if (voiceTopics) body.set("metadata[topics]", String(voiceTopics));
  if (item.credits) body.set("metadata[credits]", String(item.credits));
  if (advisorId) body.set("metadata[advisorId]", String(advisorId).slice(0, 100));
  if (ref) body.set("metadata[ref]", String(ref).slice(0, 40));
  if (email) body.set("customer_email", String(email));
  if (email) body.set("client_reference_id", String(email).slice(0, 200));
  if (name) body.set("metadata[name]", String(name).slice(0, 200));
  body.set("metadata[birthDateAttested]", String(birthDate).slice(0, 20));

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
