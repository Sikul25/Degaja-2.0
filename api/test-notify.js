import notifyAdvisor from "./notify-advisor.js";

// TEMPORARY test-only endpoint (GET) to trigger a real WhatsApp send without
// a browser client. Only works when TEST_WHATSAPP_TO is set, so it never
// does anything once that env var is removed. Delete this file once the
// end-to-end test is confirmed.
export default async function handler(req, res) {
  if (!process.env.TEST_WHATSAPP_TO) {
    return res.status(404).json({ error: "Test not enabled" });
  }
  const fakeReq = {
    method: "POST",
    body: { advisorId: "papuli", code: "123456", customerName: "Testkunde" }
  };
  return notifyAdvisor(fakeReq, res);
}
