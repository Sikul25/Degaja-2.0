export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { product } = req.body || {};
  const products = {
    single: { name: "DEGAJA AI – Einzelne Lesung", amount: 499, quantity: 1 },
    pack: { name: "DEGAJA AI – 3 Lesungen", amount: 999, quantity: 1 }
  };
  const item = products[product];
  if (!item) return res.status(400).json({ error: "Invalid product" });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return res.status(503).json({ error: "Stripe is not configured" });

  const origin = req.headers.origin || `https://${req.headers.host}`;
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${origin}/?payment=success`);
  body.set("cancel_url", `${origin}/?payment=cancelled`);
  body.set("line_items[0][price_data][currency]", "eur");
  body.set("line_items[0][price_data][product_data][name]", item.name);
  body.set("line_items[0][price_data][unit_amount]", String(item.amount));
  body.set("line_items[0][quantity]", String(item.quantity));

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
