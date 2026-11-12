// Polled by the frontend (script.js's verifyAiPayment, live-consult.js's
// verify, and each standalone page's checkout flow, plus ccbill-test.html)
// to find out whether api/ccbill-webhook.js has recorded an approval/denial
// yet for a given orderId. Reads from the CCBill-specific Edge Config keys
// (api/_ccbillOrders.js). getOrder() returns what WE stored at checkout time
// (product/credits/topics/advisorId/email) - the webhook payload itself
// isn't confirmed to echo those back, so this is the source of truth for
// "what was purchased," while getOrderResult() is the source of truth for
// "did CCBill approve or deny it."
import { getOrder, getOrderResult, wasAlreadyRedeemed } from "./_ccbillOrders.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const orderId = String(req.query?.order_id || "");
  if (!orderId) return res.status(400).json({ error: "Missing order_id" });

  const result = await getOrderResult(orderId);
  if (!result) return res.status(200).json({ found: false });

  // CONFIRMED 2026-11-12: CCBill's real eventType is "NewSaleSuccess" on
  // approval (ccbill-webhook.js stores it verbatim) - "approval" was never
  // a real value and this check was always false for a genuine postback.
  const approved = result.eventType === "NewSaleSuccess" || result.eventType === "approval";
  const order = (await getOrder(orderId)) || {};
  const alreadyRedeemed = approved && (await wasAlreadyRedeemed(orderId));

  return res.status(200).json({
    found: true,
    approved,
    alreadyRedeemed,
    eventType: result.eventType,
    type: order.type || "ai",
    credits: alreadyRedeemed ? 0 : (order.credits || 0),
    topics: order.topics || null,
    advisorId: order.advisorId || null,
    customerEmail: order.email || result.email || null,
    raw: result.raw
  });
}
