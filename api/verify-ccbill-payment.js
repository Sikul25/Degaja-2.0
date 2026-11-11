// Test-only: lets ccbill-test.html poll whether api/ccbill-webhook.js has
// recorded a result yet for a given orderId. Mirrors api/verify-payment.js's
// shape loosely, but reads from the CCBill-specific Edge Config keys
// (api/_ccbillOrders.js) so this cannot interact with the live Stripe path.
import { getOrderResult, wasAlreadyRedeemed } from "./_ccbillOrders.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const orderId = String(req.query?.order_id || "");
  if (!orderId) return res.status(400).json({ error: "Missing order_id" });

  const result = await getOrderResult(orderId);
  if (!result) return res.status(200).json({ found: false });

  const approved = result.eventType === "approval";
  const alreadyRedeemed = approved && (await wasAlreadyRedeemed(orderId));

  return res.status(200).json({
    found: true,
    approved,
    alreadyRedeemed,
    eventType: result.eventType,
    raw: result.raw
  });
}
