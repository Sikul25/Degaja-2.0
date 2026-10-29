import { wasAlreadyRedeemed } from "./_redeemed.js";

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

    const paid =
      (session.payment_status === "paid" || session.payment_status === "no_payment_required") &&
      session.status === "complete";
    const type = session.metadata?.type || "ai";
    const topics = Number(session.metadata?.topics || 0);
    const advisorId = session.metadata?.advisorId || null;
    const credits = Number(session.metadata?.credits || 0);

    // Stripe will keep confirming this exact session as "paid" forever — it
    // has no concept of "already handed the credits out". Without tracking
    // redemption ourselves, reopening this same success URL later (or in
    // another browser/private window) would grant the credits again, for
    // free, indefinitely. Only check/mark this once we know it's genuinely
    // paid, so a cancelled/incomplete session never gets written.
    const alreadyRedeemed = paid && (await wasAlreadyRedeemed(sessionId));

    return res.status(200).json({
      paid,
      alreadyRedeemed,
      type,
      topics: topics || null,
      advisorId,
      credits: alreadyRedeemed ? 0 : credits || null,
      customerEmail: session.customer_details?.email || session.customer_email || null
    });
  } catch (error) {
    return res.status(500).json({ error: "Payment verification service error" });
  }
}
