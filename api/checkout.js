export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { product, duration, email, name } = req.body || {};
  const voicePrices = {
    15: { name: "DEGAJA Live Audio – 15 Minuten", amount: 1999 },
    30: { name: "DEGAJA Live Audio – 30 Minuten", amount: 2999 },
    60: { name: "DEGAJA Live Audio – 60 Minuten", amount: 4999 }
  };
  const products = {
    single: { name: "DEGAJA AI – Einzelne Lesung", amount: 499, quantity: 1, type: "ai" },
    pack: { name: "DEGAJA AI – 3 Lesungen", amount: 999, quantity: 1, type: "ai" }
  };

  let item = products[product];
  let type = "ai";
  let voiceDuration = null;
  if (product === "voice") {
    voiceDuration = Number(duration);
    item = voicePrices[voiceDuration];
    type = "voice";
  }
  if (!item) return res.status(400).json({ error: "Invalid product" });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return res.status(503).json({ error: "Stripe is not configured" });

  const origin = req.headers.origin || `https://${req.headers.host}`;
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${origin}/?payment=cancelled`);
  body.set("line_items[0][price_data][currency]", "eur");
  body.set("line_items[0][price_data][product_data][name]", item.name);
  body.set("line_items[0][price_data][unit_amount]", String(item.amount));
  body.set("line_items[0][quantity]", String(item.quantity || 1));
  body.set("metadata[type]", type);
  if (voiceDuration) body.set("metadata[duration]", String(voiceDuration));
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
