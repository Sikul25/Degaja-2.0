export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const sessionId = String(req.query?.session_id || "");
  if (!sessionId) return res.status(400).json({ error: "Missing session_id" });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return res.status(503).json({ error: "Stripe is not configured" });

  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${secret}` }
    });
    const session = await response.json();
    if (!response.ok) return res.status(502).json({ error: "Unable to verify payment" });

    const paid = session.payment_status === "paid" && session.status === "complete";
    const type = session.metadata?.type || "ai";
    const duration = Number(session.metadata?.duration || 0);

    return res.status(200).json({
      paid,
      type,
      duration: duration || null,
      customerEmail: session.customer_details?.email || session.customer_email || null
    });
  } catch (error) {
    return res.status(500).json({ error: "Payment verification service error" });
  }
}
