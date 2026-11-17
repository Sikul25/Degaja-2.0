// Called by the client ONLY after it has already granted credits/access
// for a CCBill order locally (localStorage updated, UI updated) - marks
// the order redeemed server-side so a later replay (reopening the same
// success URL/bookmark) can't grant credits twice. See _ccbillOrders.js's
// markRedeemed() comment for why this is a separate step from the GET
// verify poll: marking redeemed as a side effect of merely being asked
// (the old behavior) could permanently lock a paying customer out of
// their own credits if that one poll's response never reached the
// client. Best-effort, fire-and-forget from the client's side - a lost
// ack just means the replay window stays open a bit longer, never that a
// customer loses credits they already received.
import { markRedeemed } from "./_ccbillOrders.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const orderId = String(req.body?.order_id || req.query?.order_id || "");
  if (!orderId) return res.status(400).json({ error: "Missing order_id" });

  await markRedeemed(orderId);
  return res.status(200).json({ ok: true });
}
