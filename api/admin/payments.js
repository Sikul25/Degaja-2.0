// Admin-only: lists recent paid Stripe Checkout Sessions with Stripe's own
// fee and net (via the charge's balance transaction), so the owner can see
// both revenue and what Stripe takes, broken down per currency (payments
// run in several currencies and must never be summed together as if they
// were the same money).
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const adminToken = process.env.ADMIN_TOKEN;
  const token = req.headers["x-admin-token"];
  if (!adminToken || !token || token !== adminToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return res.status(503).json({ error: "Stripe is not configured" });

  const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
  const sinceTs = Math.floor(Date.now() / 1000) - days * 86400;

  const rows = [];
  let startingAfter = null;
  let pages = 0;
  const MAX_PAGES = 3;

  try {
    while (pages < MAX_PAGES) {
      const params = new URLSearchParams();
      params.set("limit", "100");
      params.set("created[gte]", String(sinceTs));
      params.append("expand[]", "data.payment_intent.latest_charge.balance_transaction");
      if (startingAfter) params.set("starting_after", startingAfter);

      const response = await fetch(`https://api.stripe.com/v1/checkout/sessions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${secret}` }
      });
      const data = await response.json();
      if (!response.ok) return res.status(502).json({ error: "Unable to fetch payments from Stripe" });

      const sessions = Array.isArray(data.data) ? data.data : [];
      for (const s of sessions) {
        if (s.payment_status !== "paid") continue;
        const pi = s.payment_intent && typeof s.payment_intent === "object" ? s.payment_intent : null;
        const charge = pi?.latest_charge && typeof pi.latest_charge === "object" ? pi.latest_charge : null;
        const bt = charge?.balance_transaction && typeof charge.balance_transaction === "object" ? charge.balance_transaction : null;
        rows.push({
          id: s.id,
          created: s.created,
          email: s.customer_details?.email || s.customer_email || null,
          name: s.metadata?.name || null,
          amount: s.amount_total,
          currency: s.currency,
          type: s.metadata?.type || null,
          product: s.metadata?.product || null,
          duration: s.metadata?.duration ? Number(s.metadata.duration) : null,
          advisorId: s.metadata?.advisorId || null,
          lang: s.metadata?.lang || null,
          stripeFee: bt ? bt.fee : null,
          net: bt ? bt.net : null
        });
      }
      pages++;
      if (!data.has_more || sessions.length === 0) break;
      startingAfter = sessions[sessions.length - 1].id;
    }

    rows.sort((a, b) => b.created - a.created);

    const summary = rows.reduce((acc, r) => {
      acc.count++;
      acc.grossByCurrency[r.currency] = (acc.grossByCurrency[r.currency] || 0) + (r.amount || 0);
      if (r.stripeFee != null) acc.feeByCurrency[r.currency] = (acc.feeByCurrency[r.currency] || 0) + r.stripeFee;
      if (r.net != null) acc.netByCurrency[r.currency] = (acc.netByCurrency[r.currency] || 0) + r.net;
      const key = r.lang || "?";
      acc.byLang[key] = (acc.byLang[key] || 0) + 1;
      return acc;
    }, { count: 0, grossByCurrency: {}, feeByCurrency: {}, netByCurrency: {}, byLang: {} });

    return res.status(200).json({ rows, summary, days });
  } catch (error) {
    return res.status(500).json({ error: "Admin payments service error" });
  }
}
