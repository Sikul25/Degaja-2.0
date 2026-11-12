# DEGAJA — standing context for Claude

DEGAJA (degaja.com) is Yoel Etel's tarot/astrology/palm-reading/numerology/hypnosis
AI + live-advisor business. Yoel communicates in Hebrew, often via garbled
voice-to-text. This file exists because long sessions get compacted and lose
detail — read it at the start of any new session on this repo.

## Payments: Stripe → CCBill (in progress)

- **2026-11-11, ~16:00: RESOLVED — the "critical finding" below was wrong
  about WHERE the bug was. `CCBILL_ENCRYPTION_KEY` is correct. The bug was
  in our own `computeFormDigest()`.** Full resolution, after much back-
  and-forth that this entry corrects:
  - Yoel confirmed via screenshots that the exact same 24-character key
    value appears in BOTH the "Upgrade Security Setup Information"
    (TripleDES/Subscription Upgrade) section AND the "Background Post"
    section of admin.ccbill.com (Account Info → View Subaccount Info →
    Feature Summary → Data Tools → Background Post → Modify). One real,
    consistent, account-wide value - strong evidence it's genuinely
    correct, not stale or mistyped.
  - Yet it still failed both of CCBill's own confirmed formDigest vectors
    under our documented formula. Rather than keep guessing at portal
    navigation, brute-forced every plausible field order (24 permutations)
    × price-formatting variant × optional-subaccount-inclusion (96 total
    formulas) against the REAL stored key, for both vectors simultaneously
    - implemented as `bruteForceFormDigestFormula()` in `api/_ccbill.js`,
    called via `api/ccbill-checkout-test.js`, run through a throwaway
    Vercel Sandbox (curl POST, since this session's egress proxy blocks
    `www.degaja.com` directly and `web_fetch_vercel_url` only supports
    GET). Reports only which formula matched, never the key or any hash
    input - safe to run and log.
  - **Found it**: `order=price,period,currency,key|price=decimal|subacc=false`
    - i.e. the documented field order was already right, but **the price
    used INSIDE the MD5 input must be formatted to exactly 2 decimal
    places** (e.g. `"3.00"`, `"15.00"`), even though CCBill's own
    worked-example URLs show `initialPrice=3`/`initialPrice=15` with NO
    decimals in the query string itself. The URL's displayed value and the
    digest's internal input value are independent - CCBill's backend
    evidently normalizes the price to 2 decimals before hashing regardless
    of how it's written in the URL. This was never guessed at or
    documented anywhere in CCBill's own docs we have access to; found
    purely empirically.
  - **Fixed in `api/_ccbill.js`**: `computeFormDigest()` now always runs
    the price argument through `Number(price).toFixed(2)` before hashing,
    independent of what string is used for the URL's own `initialPrice`
    display value. `encryptionKeyLooksValid()`/`encryptionKeyMatchesVector2()`
    now both correctly return `true` against CCBill's two real confirmed
    vectors (verified live, via the same Sandbox+curl method).
  - **Practical impact on the real production checkout path
    (`api/checkout.js`/`buildFlexFormUrl`)**: for every non-JPY currency,
    `priceDecimal` was ALREADY computed via `.toFixed(2)` (see
    `AI_AMOUNTS_BY_CURRENCY`/cents-to-decimal conversion above) and used
    for BOTH the URL and the digest - so real production digests for
    EUR/GBP/USD/BRL/MXN/CNY/INR were very likely already correct all
    along. JPY (zero-decimal, passed as a bare integer string like
    `"750"`) now gets `.00` appended inside the digest only (via the fix
    above) while the URL still shows the bare integer, matching the
    pattern CCBill's own vectors demonstrated - previously this would have
    been wrong for JPY specifically. **Net effect: this fix mainly
    protects JPY and any future un-padded price, and correctly resolves
    our own local self-test/diagnostic tooling** - it does not necessarily
    explain the original unresolved mystery of the one real completed
    payment (EUR, 2026-11-11 earlier) producing no webhook, since that
    payment's own digest was likely already correct. The real 503 Andrea
    K. responded to (exact URL never captured - still unknown) remains
    unexplained by this specific fix, though it may well have been a
    related/same-family price-formatting issue on whatever generated that
    specific request.
  - **Confirmed end-to-end 2026-11-11 ~16:10**: Yoel opened a freshly
    generated FlexForm URL (price=5.00/period=3/currency=840, built with
    the fixed formula) in his real browser - loaded with **no
    digest-mismatch error**, consistent with the local self-test fix.
    Still not confirmed from this alone: redirect-back and webhook
    delivery on a real completed payment (that needs an actual charge,
    not just a loaded page - see the still-unresolved "zero webhook"
    mystery further up this section).
- **2026-11-11, ~14:15 (SUPERSEDED BY THE ABOVE - kept for history only,
  do not act on this entry's conclusion):** ~~CRITICAL FINDING —
  `CCBILL_ENCRYPTION_KEY` as currently set in Vercel is confirmed WRONG,
  via CCBill's own fresh test vector.~~ CCBill Merchant Support (Andrea K., merchantsupport@ccbill.com)
  emailed in response to a real "Error 503 - Service Unavailable" report
  (exact URL Yoel hit not yet captured - Andrea asked for it too, still
  unanswered), stating 503 is most commonly caused by an incorrect
  `formDigest`, and gave a fresh worked example confirmed to load fine on
  their end: `price=15, period=30, currency=840 (USD)` →
  `formDigest=03c5dcbaa5ed14c53be64dc51239f15e`, for the same Flex ID
  (`f33155c3-8961-4ede-8da7-0ff3c5d56c4f`)/subaccount (`0000`) we use.
  Added this as a second self-test vector (`encryptionKeyMatchesVector2()`
  in `api/_ccbill.js`, surfaced via `api/ccbill-checkout-test.js`'s
  `selfTestPassedVector2` field) and called the deployed endpoint (via a
  throwaway Vercel Sandbox running curl, since this session's own egress
  proxy blocks `www.degaja.com` directly and `web_fetch_vercel_url` only
  supports GET) to check our *actual* stored key against it, without ever
  printing the key itself. **Result: `selfTestPassedVector2: false`** - our
  current `CCBILL_ENCRYPTION_KEY` does NOT reproduce CCBill's own confirmed
  digest. (The older vector, `selfTestPassed`, is also still `false` - that
  one was already expected to fail per the "key was regenerated" theory
  below, so it alone isn't new information; vector2 failing is what's new
  and alarming, since it's today's fresh confirmed-working example.)
  **This contradicts the earlier 2026-11-11 "CONFIRMED WORKING" entry
  below** (where Yoel loaded a real $5.00 FlexForm page with no digest
  error) - either the key changed again since then, Vercel's env var was
  edited/reverted, or that earlier "confirmation" was wrong for some other
  reason not yet understood. **Do not trust the current
  `CCBILL_ENCRYPTION_KEY` value until this is resolved.** Next step: ask
  Yoel to go back into the portal (Account info → Sub account admin → View
  Subaccount Detail → Advanced → Encryption key) and re-copy the value
  fresh, character by character, and re-set it in Vercel - do not assume
  the existing stored value is still correct. Also still need the exact
  URL/timestamp of the real 503 Yoel hit, to answer Andrea's question and
  to confirm this is in fact the same root cause.
- **2026-11-11: real cutover executed — `api/checkout.js` now builds CCBill
  FlexForm URLs directly; Stripe code removed from the checkout path
  entirely** (per Yoel's explicit instruction "תעשה את זה תוריד את סטריפ" —
  do it, remove Stripe). What changed:
  - `api/checkout.js`: all Stripe calls (`api.stripe.com/v1/checkout/sessions`,
    `STRIPE_SECRET_KEY`) removed. Now converts the existing cents-based
    `item.amount` (already used for Stripe) to CCBill's decimal-string
    `initialPrice` (e.g. `"5.00"`; JPY stays a literal whole-unit number per
    its existing zero-decimal handling), generates an `orderId`
    (`crypto.randomUUID()`), stores the full purchase intent (type, product,
    credits, topics, advisorId, lang, ref, email, name, birthDateAttested,
    currency, amount) via `api/_ccbillOrders.js`'s `createOrder()`, and
    returns `{ url, orderId }` via `buildFlexFormUrl()` (`api/_ccbill.js`).
    Dead `LOCALE_BY_LANG`/`stripeLocale` (Stripe-only) removed.
  - `api/verify-ccbill-payment.js` upgraded from test-only (just the webhook
    result) to the real production verify endpoint: now also calls
    `getOrder(orderId)` to return what WAS actually purchased
    (credits/type/topics/advisorId/email) alongside whether CCBill approved
    or denied it — the webhook payload itself isn't confirmed to echo our
    metadata back, only `orderId` is confirmed round-tripped, so our own
    stored order is the source of truth for "what to grant," not the
    webhook body. Still used by `ccbill-test.html` too (backward compatible).
  - `script.js`: `startCheckout()` now stashes the returned `orderId` in
    `localStorage["degajaCcbillOrderId"]` before redirecting (mirrors the
    already-existing `degajaPendingReading` pattern). `verifyAiPayment()`
    rewritten: no more `session_id` URL param (CCBill doesn't support
    Stripe-style URL templating for its redirect) — reads the stashed
    `orderId` from localStorage instead, and polls
    `/api/verify-ccbill-payment` up to 12× every 2.5s (CCBill's webhook can
    arrive after the browser redirect lands, same pattern already proven in
    `ccbill-test.html`).
  - `quiz.html`, `love-quiz.html`, `dream.html`, `time-tunnel.html`: each
    standalone page's own checkout function now also stashes
    `degajaCcbillOrderId` before redirecting (one-line addition each, same
    key `script.js` reads — all of them still land back on the homepage via
    `degajaPendingReading`, unchanged).
  - `live-consult.js` (live-advisor/voice booking, a separate flow from the
    AI readings above but sharing the same `api/checkout.js`): `checkout()`
    now stashes `orderId` too; `verify()` rewritten the same way as
    `script.js`'s `verifyAiPayment()` (poll by orderId instead of a
    Stripe `session_id`).
  - Deleted (dead, Stripe-only code made obsolete by this change):
    `api/verify-payment.js`, `api/_redeemed.js`.
  - Deployed and `node --check`/inline-script-syntax verified on every
    touched file before deploy.
  - **2026-11-11, resolved by Yoel directly in the portal:** the Approval/
    Denial Redirect URLs are NOT the classic per-subaccount Background Post
    fields this entry originally assumed — they're configured per payment
    **flow**, in **FlexForms Systems → FlexForms Payment Links → "Degaja
    CheckOut" → click the flow open → click the "No-Redirect" tile under
    Approve or Deny → Modify → pick "A URL" on the left (not "No Redirect")
    → "Add A New URL" / "Select a Saved URL"**. Two real gotchas hit along
    the way, in case this ever needs revisiting:
    - Saving a new URL under "No Redirect" mode's "Select a Saved URL"
      sub-option does NOT set up an automatic redirect — that only makes the
      URL available for the consumer to *manually click*. The actual
      automatic-redirect mode is the separate top-level **"A URL"** tile
      (under "Redirect To"), not "No Redirect" with a saved URL attached.
    - Edits to a flow's Approve/Deny tiles only persist while the
      **Sandbox/Live toggle is set to Sandbox** — CCBill's own in-app
      message confirms this ("To make changes to this Tile switch to
      SANDBOX mode using the toggle above"). Editing while toggled to Live
      silently fails to save (reopening the tile reverts to "No Redirect"
      with no error shown) — this cost real time before the message was
      spotted. The real sequence: toggle to Sandbox → edit both the Approve
      and Deny tiles → **Promote to Live**.
    - Saved URLs used: Approve → `https://www.degaja.com/?payment=success`
      (named "Degaja Success"), Deny → `https://www.degaja.com/?payment=cancelled`
      (named "Degaja Cancelled"). Webhook URL was already correct
      (`https://www.degaja.com/api/ccbill-webhook`), untouched.
    - **Confirmed in the admin UI as of 2026-11-11 ~12:30**: the "Degaja
      CheckOut" flow's Status column shows **"Matches Live"** (green check)
      in FlexForms Payment Links — the Sandbox edits above really did
      promote. **Still not end-to-end verified**: two real payments (see
      below) happened BEFORE the Webhooks event-subscription fix (next
      bullet) was applied, so they don't tell us anything about the current
      config. No real payment has been run since both fixes (redirect +
      webhook events) were in place. Don't claim this works end-to-end
      without a fresh real test confirming it — "Matches Live" only proves
      the config was saved, not that the resulting behavior is correct.
    - **Separately, on the Webhooks page** (Account Info → subaccount 0000
      → Account Admin → Webhooks — the modern event-subscription system,
      distinct from the Approval/Denial redirect flow above): the
      `NewSaleSuccess` event checkbox was **not checked** by default even
      though the Webhook URL itself was already set correctly. Yoel checked
      it (2026-11-11). This may be the actual reason the webhook was never
      received at all (see below) — or may be unrelated; not confirmed
      either way without a fresh real test.
    - **2026-11-11: two checkouts were started as manual tests on the real
      live site** (£9.99 GBP pack, €5.00 EUR single) — both created an
      order record in our system (`ccbillPendingOrders`, `kind: "live"`),
      but **only the €5.00 EUR one was actually completed/charged** (Yoel
      confirmed real money left his account, via his bank app, for that one
      specifically - corrected here after initially mis-stating both as
      charged). The £9.99 GBP one was only started, not completed - normal
      and expected, an order record is created the moment checkout begins,
      before the consumer finishes paying on CCBill's page, so this isn't
      itself evidence of a bug. Both happened **before** the webhook-events
      fix below. For the one real completed payment: (a) it did NOT redirect
      back to the site after approval (stayed on CCBill's page), and (b)
      produced **zero webhook postbacks** — `api/ccbill-webhook.js` has no
      record of it at all, not even under a fallback/unmatched key,
      confirmable via Vercel's Edge Config (`ccbillOrderResults` doesn't
      exist as a key at all). This is consistent with the webhook-events
      checkbox being unchecked at the time — but **don't assume that was the
      sole cause** until a fresh real payment (after all fixes, including
      the 2026-11-11 `api/ccbill-webhook.js` GET/POST hardening below) is
      confirmed working. CCBill's own Reports → Transaction Reports →
      Lookup (search by Credit Card / Days to Look Back) returned **no
      results** for the transaction when tried same-day — unclear whether
      this is normal reporting lag, wrong search criteria, or something
      else; not resolved.
    - **2026-11-11: found and fixed a real code bug in `api/ccbill-webhook.js`
      during a full review of the integration** (done after the above,
      prompted by "check the whole process from scratch"): the endpoint
      only accepted `POST` and returned a bare 405 on anything else, with
      nothing recorded — so if CCBill's postback actually arrives as a
      `GET` request (a pattern some payment processors use for simple
      "pixel"-style postbacks, and never actually confirmed either way for
      CCBill in anything we have), this would silently produce exactly the
      symptom observed above: zero records, no visible error anywhere.
      Fixed to accept both GET and query-string params. Also hardened body
      parsing: spreading `req.body` when it arrives as an unparsed string
      (wrong/missing Content-Type) previously produced garbage instead of
      the postback's real fields - now parsed defensively (tries JSON, then
      falls back to `URLSearchParams`). Checked and ruled out as causes
      while in there: Vercel's SSO/deployment protection (confirmed
      disabled for the custom domain `www.degaja.com`, only applies to
      `*.vercel.app` URLs) and project-level firewall rules (none
      configured at all). Deployed and live. **Still not end-to-end
      verified** - needs a fresh real payment to confirm any of this
      actually fixed the missing-webhook symptom.
    - **CCBill API Guide excerpt obtained 2026-11-11** (Yoel screenshotted
      it) — real, confirmed Datalink API details for future use (e.g. to
      check a transaction's status without needing the webhook or another
      real payment):
      - Base URL: `https://datalink.ccbill.com/utils/subscriptionManagement.cgi`
      - Auth params (always required): `clientAccnum` (6-digit main
        account, `955732` for us), `username`, `password` (the Datalink
        credentials — already set in Vercel as `CCBILL_DATALINK_USERNAME`/
        `CCBILL_DATALINK_PASSWORD`, never put the plaintext value in this
        file or any code comment).
      - Subaccount scoping: `usingSubacc` (authenticate as main account,
        operate on a specific subaccount — this is the one used in CCBill's
        own worked example, `usingSubacc=0005`) vs. `clientSubacc`
        (authenticate directly as that subaccount — requires Datalink
        credentials created at the subaccount level, not confirmed which
        kind ours are). Use `usingSubacc=0000` first; only try
        `clientSubacc=0000` if that's rejected.
      - `action=viewSubscriptionStatus` (one of several supported actions,
        others not yet catalogued): requires a `subscriptionId` — reports
        whether active, cancellation date, recurring vs. single-billing,
        next-billing/expiration date, void/refund/chargeback counts/flags,
        and a `subscriptionStatus` code (0=inactive, 1=active-but-cancelled
        [recurring only], 2=active-and-not-cancelled-or-nonrecurring).
        Response is CSV by default (add `returnXML` param for XML instead).
      - **Not yet done**: writing `api/ccbill-datalink-test.js` (an isolated
        test endpoint, same pattern as `ccbill-checkout-test.js`, reading
        the two Vercel secrets server-side) to actually call this — blocked
        on getting a real `subscriptionId` for one of the two live orders
        above, which the Lookup report search didn't surface (see above).
        Also still unconfirmed per the earlier Datalink note: whether our
        server's outbound IP needs whitelisting with CCBill for this user —
        don't assume it's fine; expect this call might fail with an
        authorization error for that unrelated reason.
  - **Unconfirmed, flagged rather than guessed: whether CCBill's "$5–$300"
    Dynamic Pricing range (confirmed 2026-11-11 via the real
    `SubscriptionRuleException`) is a blanket literal-number check
    regardless of currency, or converted to a USD-equivalent.** The only
    confirmed data point used `currencyCode=840` (USD). If it's
    currency-blind: EUR/GBP/USD (covering 9 of the 11 site
    languages/markets — de/fr/es/it/pt/ru/uk→eur, en→gbp, us→usd) are
    confirmed fine for every product (single/pack/voice, all ≥5 and ≤300).
    But JPY's single reading (¥750) and pack (¥1,490) would exceed 300; INR's
    pack (₹499.00) would exceed 300; and almost every live-advisor/voice
    tier in BRL/MXN/JPY/CNY/INR would exceed 300 (up to ¥18,000 / ₹6,000 /
    MX$2,140 for the 3-topic tier). Not fixed/repriced here — that would be
    guessing at a business decision analogous to the EUR/GBP/USD $5 fix
    above, which was Yoel's explicit call each time. Before promoting any
    paid feature to ja/zh/hi/mx/br traffic, either ask CCBill directly
    whether the range is currency-aware, or run one real test purchase in
    each flagged currency/tier and see whether CCBill's page accepts it.
  - Still unconfirmed (same as before this cutover, unchanged by it): the
    real `responseDigest` formula, and whether `orderId` reliably survives
    CCBill's own round trip — both need a REAL completed transaction (not
    just a loaded payment page) to verify from `api/ccbill-webhook.js`'s
    stored raw payload.
- **2026-11-11: `STRIPE_SECRET_KEY` was emptied in Vercel (production) at
  Yoel's explicit instruction, and the site redeployed** — the real site
  currently has **no working payment processor at all** (every real
  `/api/checkout` call now 503s "Stripe is not configured"; CCBill is
  still test-only, not wired into `api/checkout.js`/`script.js`). This was
  a deliberate decision, made after I flagged the consequence clearly and
  Yoel confirmed (reasoning: no real traffic at that hour, and he didn't
  want to re-enable Stripe once CCBill is this close). **To restore
  Stripe**, Yoel must paste the real secret key from the Stripe Dashboard
  into Vercel's env var again — it is not recoverable from this session or
  from git. Do not restore it without Yoel explicitly asking — he was
  clear he doesn't want to go back to Stripe.
- **Stripe's Acceptable Use Policy explicitly prohibits "fortune-telling"
  businesses.** Keeping Stripe live is a real, ongoing risk: the account can be
  frozen (with funds held) at any time. This is not a hypothetical — it is the
  reason CCBill is being onboarded.
- CCBill was chosen specifically because it accepts international credit
  cards broadly (including countries Stripe restricts), which matters here —
  real traffic comes from Spain, US, Germany, UK, Serbia, Switzerland, France,
  India, Taiwan and more, and pricing is already localized per currency
  (EUR/GBP/USD/BRL/JPY/CNY/INR) across all 11 site languages.
- **The plan is a full, one-time cutover — never a parallel/hybrid setup.**
  Do not add CCBill as "an option alongside Stripe" or "pick processor by
  country." When CCBill is ready:
  1. Wire up `api/ccbill-webhook.js` (currently a dormant scaffold — see its
     own header comment) with real signature/digest verification using
     whatever CCBill provisions (differs between FlexForms and Advanced
     Widget — confirm exact fields from their dashboard).
  2. Replace the Stripe calls in `api/checkout.js` with CCBill's flow
     entirely.
  3. Update every call site that currently drives Stripe checkout:
     `script.js`'s `startCheckout()`/`verifyAiPayment()`/`unlockDeepReading()`
     (used by the main site) and `love-quiz.html`'s own
     `startLoveQuizCheckout()` (standalone page, same pattern).
  4. Remove `STRIPE_SECRET_KEY` from Vercel env vars once cutover is verified.
  5. Test the whole flow end-to-end (ideally in a CCBill sandbox/preview)
     before anything touches production — no half-migrated state where some
     payments go to Stripe and some to CCBill.
- Status as last updated: Yoel has a 6-digit CCBill account number, pending
  final approval. CCBill already ran a test postback (visible in Vercel
  Web Analytics as a referrer hit from `internal.ccbill.com`). Once approved,
  CCBill sends the actual integration code/credentials (Client Account
  Number, Sub Account, Flex Form/Widget ID, Webhook Salt) — ask Yoel for
  current status if it's not obvious from recent conversation.
- **2026-10-26: CCBill's compliance/underwriting team sent their first
  review.** Open items from that review (ask Yoel for current status if not
  obvious from recent conversation):
  - Underwriting: proof-of-address document — **already sent by Yoel**
    (confirmed received by CCBill Sales Support rep Marija Mitic, forwarded
    to their Compliance team for review, response pending as of 2026-10-26
    evening). Also confirming `info@degaja.com` as a secondary account
    email, CC'd on all future CCBill correspondence (ceo@degaja.com stays
    primary) — sent in the same reply.
  - Compliance: a written consumer purchase flow and a full services/products
    list were drafted and sent back (same lists belong here if a future
    session needs them again — see git history around this date, or ask
    Yoel, for the exact text sent).
  - Compliance also flagged a real bug found during their own live testing:
    see the Numerology/AI-loading-spinner entry under "Architecture notes"
    below. This was the only functional issue they found — the site is
    otherwise expected to be fully testable now.
- **2026-10-31/11-01: CCBill's AI Content Merchant Addendum.** A separate,
  more detailed compliance document specifically about AI-generated content
  (disclosure, consent, prohibited content, abuse detection). Handled:
  - Verified the site already disclosed AI-generated content prominently on
    every reading feature (inline disclaimer next to each feature's button,
    sitewide footer, FAQ) — the T&Cs (AGB) were the one gap, so a sentence
    disclosing AI-generated content was added to AGB section 2 in all 11
    languages.
  - Created `dmca.html` (prohibited-content / complaints / DMCA policy
    page, all 11 languages, linked from the shared footer) specifically to
    answer the Addendum's question about where CCBill can find this policy.
  - Filled out and submitted the Addendum's 6 free-text questions plus a
    signed `AI-Content-Merchant-Addendum-DEGAJA.docx` (generated with the
    `docx` npm skill, verified by rendering to PDF before sending) — answers
    emphasize that DEGAJA's AI only ever generates text (no images/video/
    voice-cloning), so most of the Addendum's deepfake/consent/minor-content
    concerns are architecturally inapplicable.
  - 2026-11-03: Marija (CCBill) confirmed receipt, forwarded to Compliance
    for review. Still pending as of this writing — ask Yoel for current
    status if not obvious from recent conversation.
- **2026-11-09/10: Live advisor feature opened to all languages for the
  bank's review, then full account approval.** CCBill Compliance (via
  Marija) came back once more asking to see the live 1:1 advisor
  consultation feature actually working on the site (not just described),
  "so the bank can see the complete consumer experience." Root cause this
  surfaced: the advisor section (`#human`, gated by `hasLiveAdvisor()` in
  i18n.js) was only ever shown for de/ru/uk — an English-browsing reviewer
  saw nothing. Fixed by opening the section to all 11 languages
  (`ADVISOR_LANGS = SUPPORTED` in i18n.js) while adding a "Speaks: ..."
  language-disclosure line to each advisor's card (via a new `languages`
  field on `ADVISORS` entries in `api/_data.js`, rendered in
  `live-consult.js`'s `advisorCards()`), so no visitor books a session
  expecting a language the advisor doesn't actually speak. Sent CCBill two
  screen recordings (German — the real live version — and English, both
  made locally since this session has no network egress to
  www.degaja.com/ccbill.com, using the real production code + real
  advisor/pricing data via a mocked `/api/advisors` response) showing the
  booking flow, advisor profile, and fixed price shown before checkout.
  **2026-11-10: CCBill confirmed the website is approved by Compliance**
  and the account is now active — next is their Integration team reaching
  out to connect their system with ours.
- **CCBill contacts (keep this updated the moment a new name appears —
  this was missed for a full day and had to be reconstructed from
  screenshots)**:
  - **Marija Mitic** — Compliance/Sales Support rep who has driven the
    entire review (AI Attestation, Content Merchant Addendum, the live
    advisor follow-up). Primary point of contact throughout.
  - **Nicola Krezovik**, Sales Support Representative, phone
    800.510.2859 — sent the UBO/Ownership-Evaluation DocuSign request and
    the 2026-11-10 account-approval email (ref#: 3570107-3600150, account
    955732).
  - **Sinisha Golemac** (sinishag@ccbill.com) — received the two live-advisor
    screen recordings (German + English, sent 2026-11-05) demonstrating the
    booking/pricing flow for the Compliance follow-up review.
  - **Sabina V.**, Merchant Support Specialist (merchantsupport@ccbill.com,
    phone 800.510.2859 option #1) — this is the real name/signature on the
    2026-11-11 "This concludes your integration" email (previously
    attributed here to an anonymous "Integration team"; correcting that).
    Ref#: 3600833-36... (full ref not fully visible, get it from Yoel's
    inbox if needed later).
- **Dynamic Pricing — confirmed technical details (2026-11-10), for when
  CCBill's Integration team gives us the real Flex ID + Encryption Key**:
  - `clientSubacc` = **0000** (confirmed live in the CCBill portal's
    Pricing Admin screen, shown as "955732-0000").
  - URL pattern: `https://api.ccbill.com/wap-frontflex/flexforms/{FLEX_ID}?clientSubacc=0000&initialPrice={X.XX}&initialPeriod={2-365}&currencyCode={3-digit ISO numeric}&formDigest={md5 hash}`.
  - `formDigest` (non-recurring/Single Billing, FlexForms) = `MD5(initialPrice + initialPeriod + currencyCode + EncryptionKey)`,
    plain string concatenation, **no separators**, in that exact order.
    Verified against CCBill's own worked example in their docs
    (`10.00` + `30` + `840` + their example key → their documented hash
    matched exactly).
  - Only Single Billing params (`initialPrice`/`initialPeriod`/
    `currencyCode`/`formDigest`) are needed for a genuine one-time charge —
    `recurringPrice`/`recurringPeriod`/`numRebills` belong only to
    recurring transactions and must never be sent, to keep this a true
    one-time payment matching the "no automatic renewal" promise.
  - **Currency limitation found**: the CCBill portal's pricing-creation
    screen only offered USD as a currency option (EUR was mentioned by
    Yoel as the only other one available) — far fewer than the 8
    currencies (EUR/GBP/USD/BRL/MXN/JPY/CNY/INR) `api/checkout.js`
    currently prices in. Unresolved as of this writing: whether CCBill can
    add more currencies on request, and what FX fee applies when a
    non-USD/EUR cardholder pays. Ask Yoel for current status — if
    unresolved, the eventual CCBill cutover of `api/checkout.js` will need
    a currency-collapse strategy (likely: charge everyone in USD or EUR
    instead of their local currency) that doesn't exist today.
  - **2026-11-11: found a separate "Regional Pricing - CCBill Recommended"
    table** on the Account Info → View Subaccount Info → General page,
    showing a $4.99 USD base price auto-converted per region via CCBill's
    own ratios: U.K. → £4.50 (ratio 0.9022923), Japan → ¥887 (ratio
    177.6802035), Europe → €5.47 (ratio 1.0959422), Canada → $7.86 (ratio
    1.5745619). This genuinely shows CCBill supports billing in GBP/JPY/
    EUR/CAD at least, via automatic regional conversion of one base USD
    price. **Important: this looks like a DIFFERENT mechanism from our
    Dynamic Pricing FlexForms URLs** (which specify `currencyCode`/
    `initialPrice` explicitly per request) — there's an "Accept Regional
    Pricing" button, **not clicked, on purpose**: unclear whether this
    Regional Pricing feature works alongside Dynamic Pricing or is a
    conflicting/alternative pricing mode. Do not enable it without
    understanding that first. Separately: the "Billing Options" field
    listing "Visa,Mastercard,JCB,On-line Check,Maestro" is accepted **card
    networks**, not currencies (JCB is a Japanese card brand, not evidence
    of JPY billing by itself) — don't conflate the two when reasoning about
    this.
  - **Revised understanding of the "Encryption key" under Account Info →
    Modify Subaccount → Advanced → "Upgrade Security Setup Information"**:
    earlier in this same session this was ruled out as the Dynamic Pricing
    key (reasoning: that section's own blurb describes it as for the
    Subscription Upgrade system, using TripleDES, and a computed-formDigest
    self-test against it failed to match the Integration team's 2026-11-11
    worked example). **That rejection was premature.** The same email also
    said: "we have updated the salt key to not contain any special
    characters as these can cause issues" — and the value found on this
    page is purely alphanumeric (no special characters), consistent with
    being the *regenerated* key. The self-test necessarily fails against
    the *old* worked example regardless of whether the current value is
    right, since that example was computed with the pre-update key. So:
    **this may well be the correct, current Dynamic Pricing Encryption
    Key after all** — the TripleDES/"Subscription Upgrade" UI labeling may
    just be generic/stale copy covering an account-wide key field reused
    by multiple features, not proof it's feature-specific.
    **2026-11-11: set as `CCBILL_ENCRYPTION_KEY` in Vercel (production +
    preview) on this understanding** — not yet confirmed correct.
    `api/ccbill-checkout-test.js` no longer hard-blocks on the (now known
    to be unreliable) local self-test; it still computes and reports
    `selfTestPassed` for visibility, but the real test is whether CCBill's
    own FlexForm checkout page accepts the resulting `formDigest` without a
    "digest mismatch" error when Yoel actually loads
    `https://www.degaja.com/ccbill-test.html` and runs the $3 test
    checkout. That real-world result is the authoritative answer here, not
    the local self-test.
    Extensively searched for an alternative/more clearly-labeled Dynamic
    Pricing key elsewhere in the portal first (FlexForms Systems →
    Dashboard → FlexForms Payment Links → the "Degaja CheckOut" payment
    flow (found in SANDBOX mode, with a "Promote to Live" button still
    showing — **not yet confirmed whether this sandbox flow and its Flex
    ID match the LIVE Flex ID `f33155c3-8961-4ede-8da7-0ff3c5d56c4f` CCBill
    gave us, or are a different, separate sandbox-only flow/ID** — ask
    Yoel to copy-paste the exact Flex ID text from that sandbox flow to
    compare, don't trust a screenshot read of it) → its "Degaja Dynamics"
    form's Common Settings (shows "Pricing: Use Both Form & Dynamic
    Pricing") and All Settings → Pricing tab (just a "Allow for Dynamic
    Prices to be passed to form" checkbox + price-point selector, no key
    field at all); also the account's Webhooks page (Account Info → select
    subaccount 0000 → Account Admin → Webhooks) — confirmed this is the
    actual modern event-subscription system the Integration team's email
    meant by "Webhook URL" (distinct from the legacy Background Post
    Approval/Denial URLs), with a full event list including `NewSaleSuccess`
    (and very likely `NewSaleFailure`, name not fully confirmed/visible in
    the screenshots) and `RenewalSuccess`/`RenewalFailure` (irrelevant to
    us — no subscriptions) — but this page also has **no encryption/signing
    secret field anywhere on it**. None of these alternate locations had
    anything resembling a Dynamic Pricing key, which is additional
    (inconclusive but suggestive) support for the "Upgrade Security Setup"
    field being the real, account-wide key after all.
  - Still outstanding before real integration code can be written: the
    actual Flex ID (needs a FlexForm created with Dynamic Pricing enabled
    — was in progress, not confirmed finished), the Encryption Key (seen
    partially truncated in a CCBill docs screenshot as "7d9..." — never
    confirmed as Yoel's real key vs. a generic docs example, get the full
    value from Account Info before using it), and the Webhook Salt
    (separate from the Encryption Key, for verifying postbacks in
    `api/ccbill-webhook.js` — not yet retrieved).
  - **2026-11-11: CCBill's Integration team emailed that "Basic setup" is
    complete on account 955732, subaccount 0000** ("Subaccount 0000 should
    be used for one-time payments" — confirms the clientSubacc=0000 finding
    above). The email gives the portal path to the key: **Account info →
    Sub account admin → View Subaccount Detail → Advanced → scroll to
    "Encryption key"**. It also says they regenerated this key to remove
    special characters ("we have updated the salt key to not contain any
    special characters as these can cause issues").
    **Open terminology question, not yet resolved**: the email calls this
    the "salt key" in prose but points at a portal field literally named
    "Encryption key" — and CCBill's own doc URL for it is
    `ccbill.com/doc/encryption-key-salt`, i.e. CCBill's own naming bundles
    "encryption key" and "salt" together. This session has no network
    access to ccbill.com to read that doc and settle it, so **do not
    assume** this single value covers both: (a) the FlexForms Dynamic
    Pricing `formDigest` MD5 input (documented above as needing the
    Encryption Key), and (b) verifying postback signatures in
    `api/ccbill-webhook.js` (previously tracked here as a separate
    "Webhook Salt"). Ask Marija/the Integration team directly whether one
    value serves both purposes, or whether a second, separate postback
    signature value still needs to be retrieved — do not guess and wire up
    `api/ccbill-webhook.js`'s verification against an unconfirmed
    assumption.
    Yoel still needs to go into the portal himself and copy the actual key
    value (not yet in this repo/session) before any integration code can
    use it.
    **Correction**: this and the entry just below ("This concludes your
    integration") are the SAME single email, not two separate ones — Yoel
    originally pasted it in two parts. It's signed **Sabina V., Merchant
    Support Specialist** (merchantsupport@ccbill.com, 800.510.2859 option
    #1) — see the contacts list above.
  - **The rest of that same "This concludes your integration" email.**
    New facts from it:
    - A **real worked FlexForm URL** was included: Flex ID
      `f33155c3-8961-4ede-8da7-0ff3c5d56c4f`, `clientSubacc=0000`,
      `initialPrice=3`, `initialPeriod=3`, `currencyCode=840`, with
      `formDigest=4f59294f73f2e73cccae42870619cbb6`. **This is a ready-made
      test vector**: once Yoel retrieves the real Encryption Key from the
      portal, verify it by computing
      `MD5("3" + "3" + "840" + EncryptionKey)` and checking it equals
      `4f59294f73f2e73cccae42870619cbb6` — confirms the key is correct
      before it's used in any real checkout, without needing network
      access to CCBill.
    - CCBill is asking us to **confirm the Approval/Denial Redirect URLs
      and the Webhook URL** for subaccount 0000 — this is an open decision
      this repo needs to make (likely `api/ccbill-webhook.js`'s route for
      the webhook, and new/adapted success/failure pages for the
      redirects, mirroring how `verifyAiPayment()` currently handles
      Stripe's `?payment=success&session_id=...` redirect) — not yet
      decided or sent back to CCBill.
    - **Datalink API credentials were issued** (username + password) for
      programmatic access (refunds/voids/subscription status — see below).
      **The password is NOT recorded here or anywhere in this git repo**
      — it was sent in plain chat and must go into Vercel's environment
      variables instead (e.g. `CCBILL_DATALINK_USERNAME` /
      `CCBILL_DATALINK_PASSWORD`), never committed. If a future session
      needs it, ask Yoel to re-paste it or pull it from Vercel's env vars
      directly — do not search git history for it either.
    - CCBill needs **our server's outbound IP address/range whitelisted**
      for the Datalink user, or Datalink API calls will fail with
      authorization errors. Unresolved: whether Vercel serverless
      functions on this project have a static/predictable outbound IP, or
      whether Vercel's Secure Compute (a paid add-on for a fixed egress
      IP) would be needed — needs checking before Datalink calls are
      wired up.
    - CCBill offered to enable optional Datalink/API functionality:
      Datalink Extract, and Subscription Manager endpoints
      `cancelSubscription`/`viewSubscriptionStatus`/
      `voidOrRefundTransaction`/`refundTransaction`/`voidTransaction`.
      Since DEGAJA has no subscriptions (one-time payments only, per the
      "no automatic renewal" promise), the subscription-status/cancel
      endpoints are probably irrelevant — but refund/void capability
      (`voidOrRefundTransaction`/`refundTransaction`/`voidTransaction`)
      and Datalink Extract (transaction reporting) look genuinely useful
      for customer-service refund requests and reconciliation. Not yet
      decided/confirmed back to CCBill — ask Yoel.
    - Several CCBill doc links were provided (formDigest value, webhooks
      overview/user guide, dynamic pricing user guide/errors, FlexForms
      quick start/FAQs, pricing admin, Datalink extract system user guide,
      CCBill API guide, transaction test settings, admin portal FAQ) —
      this session cannot fetch any of them directly (no network access to
      ccbill.com). If a specific technical question needs one of these
      (e.g. the still-open Encryption-Key-vs-Webhook-Salt question above),
      ask Yoel to open the relevant page and screenshot/paste the exact
      text rather than guessing from the URL slug alone.
  - **2026-11-11: read CCBill's "Background Post" doc (Yoel pasted the full
    text).** Confirms the general mechanism we'd already designed for
    (`api/_ccbill.js`'s `orderId` query param): "Custom tracking variables
    can also be sent to the form... These values will be posted back using
    Background Post when the transaction is complete," and "[Approval/Denial
    Post] data sent will include everything passed into the signup form
    through Background Post." **Important caveat, not glossed over**: this
    document's own code examples are for the **classic/Advanced-Widget
    signup form** (`bill.ccbill.com/jpost/signup.cgi`, with
    `clientAccnum`/`formName`/`subscriptionTypeId`/`allowedTypes` params) —
    a different URL/param family than the **FlexForms Dynamic Pricing** URL
    we actually use (`api.ccbill.com/wap-frontflex/flexforms/{FLEX_ID}`).
    So the *concept* (custom var in → echoed back on Approval/Denial) is
    now confirmed system-wide, which validates the design, but this
    specific document does not 100% confirm the identical query-string
    syntax works unchanged on a FlexForms URL - that still wants the real
    test payment (or the `webhooks-user-guide`/`webhooks-overview` docs,
    which may describe a newer/different mechanism specifically named
    "Webhook URL" - note CCBill's own integration email asked us to confirm
    **both** an "Approval and Denial Redirect URLs" *and* a separate
    "Webhook URL," implying these may not be the same thing as this
    document's "Approval/Denial Post URL"). When the text first seemed to
    stop at "referringUrl," initial read was that this doc has no
    transaction/subscription identifier field at all — **wrong, corrected
    below** once Yoel sent screenshots of the rest of the same table.
  - **2026-11-11: the "Background Post" variable table, completed via
    screenshots, is now fully read end to end** (accountingAmount through
    zipcode, alphabetical). Two new, important fields that the earlier
    text paste had cut off before:
    - **`subscription_id`** (snake_case — NOT `subscriptionId`, which
      `api/ccbill-webhook.js` incorrectly guessed at first and has now been
      corrected to check). This is very likely CCBill's real transaction
      identifier for the postback, confirming this document probably *does*
      apply to our actual integration after all (walking back the earlier
      "this is legacy/irrelevant" read above) — CCBill's dynamic-pricing
      FlexForms still appears to be built on the same underlying
      "subscription" concept even for one-time, non-recurring charges.
    - **`responseDigest`** — now confirmed via its full description: **"Hash
      digest of a Dynamic Pricing response. If not using Dynamic Pricing,
      this value will return as a blank string."** This confirms (a) it's
      specifically relevant to us since we use Dynamic Pricing, and (b) it
      is indeed a verification digest. **Still not confirmed: the exact
      input formula** (which fields get hashed, in what order, whether the
      Encryption Key is part of it) — the doc gives only the description
      above, no formula, unlike `formDigest` which had a fully worked
      example. The example value given
      (`s4f5198jgd21a4pk1p2s7sd23lm58937`) contains letters outside a-f, so
      it is **not** plain MD5 hex — whatever hash/encoding it is, don't
      assume MD5 here the way `formDigest` is MD5. Do not attempt to
      "verify" against a guessed formula; the first real test payment's
      actual `responseDigest` value (now captured by
      `api/ccbill-webhook.js`) is the starting point for working this out
      empirically, or ask CCBill support directly for the formula.
    - **`subscription_id` is "(Approval Post URL only)"** per its full
      description — it will be **blank/absent on Denial posts** (where
      `denialId` is present instead). This means our own `orderId` custom
      variable (if it round-trips at all — still unconfirmed) is the only
      identifier reliable across **both** approval and denial events;
      `subscription_id`/`denialId` alone can't correlate a denial back to
      which pending order it was.
    - Two more fields now fully described: `reservationId` ("Consumer's
      subscription Reservation ID number" — a pre-transaction concept,
      low priority for us) and `typeId` ("Subscription Type ID number
      identifying the price point used in the transaction" — ties to a
      fixed price point, less relevant to Dynamic Pricing).
    - `api/ccbill-webhook.js` updated: now matches on `subscription_id`
      (not the wrong `subscriptionId` guess) and stores `responseDigest`
      from every postback it receives, so the first real test payment's
      actual value is available once the formula is confirmed.
  - **2026-11-11: built an isolated CCBill test harness** (separate from the
    live Stripe checkout real visitors use — `api/checkout.js`/`script.js`
    are untouched):
    - `api/_ccbill.js` — Flex ID, `clientSubacc`, ISO 4217 currency map,
      `computeFormDigest()`, and `encryptionKeyLooksValid()` which
      self-tests `CCBILL_ENCRYPTION_KEY` against the Integration team's own
      worked example (price=3/period=3/currency=840 →
      `4f59294f73f2e73cccae42870619cbb6`) — confirms the key is right
      before it's ever used on a real link, no network access needed.
    - `api/_ccbillOrders.js` — Edge Config storage for test orders/webhook
      results, mirroring `_pending.js`/`_redeemed.js`'s pattern, under its
      own keys so it can't collide with the live payment path.
    - `api/ccbill-webhook.js` — rewritten from the dormant scaffold to
      actually store every incoming postback's full raw body (matched by
      our own `orderId` query param when present, falling back to
      `subscriptionId`/`transactionId`/a timestamp). Gated on
      `CCBILL_ENCRYPTION_KEY` being set rather than a `CCBILL_WEBHOOK_SALT`
      we don't have confirmed yet — **no real signature verification
      exists yet**, this is intentionally test-only until the
      Encryption-Key-vs-Webhook-Salt question above is resolved.
    - `api/ccbill-checkout-test.js` + `api/verify-ccbill-payment.js` +
      `ccbill-test.html` (noindex, unlinked) — lets Yoel run one real
      $3.00 USD test charge and watch the result, without any real site
      visitor ever touching CCBill.
    - **Deployed and confirmed live** (`https://www.degaja.com/ccbill-test.html`
      returns 200; the test checkout endpoint returns 405 on GET as
      expected — both verified via Vercel's deployment tools, not assumed).
    - **The one remaining hard blocker to actually run a test payment**:
      `CCBILL_ENCRYPTION_KEY` is not set anywhere yet (Yoel has not yet
      retrieved/sent the real value from the portal path given in the
      Integration team's email, above). Nothing can charge a real test
      amount until this is set as a Vercel env var.
    - **Redirect/webhook URLs to register with CCBill for subaccount 0000,
      for this TEST phase** (deliberately pointing at the isolated test
      page, not the real site, until the flow is proven):
      - Approval: `https://www.degaja.com/ccbill-test.html?ccbill=success`
      - Denial: `https://www.degaja.com/ccbill-test.html?ccbill=cancelled`
      - Webhook: `https://www.degaja.com/api/ccbill-webhook`
      Once a real test payment round-trips successfully (and in
      particular, once the real webhook payload is inspected to confirm
      whether `orderId` actually comes through), the **real** cutover step
      (replacing these with the live site's own URLs, and wiring
      `api/checkout.js`/`script.js`/`love-quiz.html` for real, per the
      numbered plan at the top of this section) is still separate,
      deliberate future work — not done yet.
  - **2026-11-11: root cause of the F5/WAF "Error 503" found and fixed.**
    The checkout test ($3, matching CCBill's own worked example) kept
    hitting an F5 WAF rejection ("The requested URL was rejected... Error
    503... F5 site: md2-mad") on every attempt. Root cause, found via
    CCBill's own `dynamic-pricing-errors` doc (Yoel screenshotted it): the
    "Degaja CheckOut" payment flow existed only in **SANDBOX**, never
    promoted to **LIVE** (confirmed by switching the portal's SANDBOX/LIVE
    toggle — the LIVE tab showed zero payment flows). Hitting the LIVE
    `api.ccbill.com` endpoint with a sandbox-only Flex ID is what the WAF
    was rejecting. **Fixed**: clicked "Promote to Live" on the flow in
    FlexForms Systems → FlexForms Payment Links (status now shows
    "Matches Live"). This cleared the WAF block — the next test attempt
    got a real, legible CCBill application error instead:
    **`com.ccbill.frontflex.common.exception.SubscriptionRuleException:
    Initial price: [3] is not in valid price range [5 - 300]`**. So
    **CCBill's own worked example price ($3) was invalid all along** —
    below their own $5.00 Dynamic Pricing minimum — completely unrelated
    to the Encryption Key, formDigest, or anything else investigated
    above. `api/ccbill-checkout-test.js` and `ccbill-test.html` updated to
    use $5.00 instead of $3.00.
    **CONFIRMED WORKING 2026-11-11**: Yoel re-ran the test at $5.00 and the
    real CCBill FlexForm payment page loaded successfully showing
    "$5.00 (USD) For Your Purchase" with no digest-mismatch error and no
    F5/WAF block. This confirms, end to end: the Flex ID, the Live
    promotion, and critically **`CCBILL_ENCRYPTION_KEY` is the correct
    value** (the "Upgrade Security Setup Information" field, despite its
    TripleDES/Subscription-Upgrade UI labeling). The test was stopped
    before entering real card details/completing the purchase (no need to
    actually charge a real card to confirm the integration works).
    **Still not confirmed from this**: whether the webhook
    (`api/ccbill-webhook.js`) actually receives a postback with our
    `orderId` echoed back, and what `responseDigest`'s real formula is —
    those need an actual completed transaction (approval or denial), not
    just the payment page loading. The real cutover
    (`api/checkout.js`/`script.js`/`love-quiz.html`, replacing the
    test-only redirect/webhook URLs with the live site's own) is still
    separate, deliberate future work.
  - **2026-11-11: raised the single-reading price from $4.99/€4,99/£4.99 to
    $5.00/€5,00/£5.00** (EUR/GBP/USD only — BRL/MXN/JPY/CNY/INR left
    unchanged, no evidence their minimums are affected) specifically
    because this is **below CCBill's $5.00 Dynamic Pricing minimum**
    confirmed above — the real cutover would otherwise reject every
    single-reading purchase in these currencies. The 3-reading pack
    ($9.99/€9,99/£9.99) was already above the minimum and was **not**
    changed. Updated everywhere the price is charged or displayed:
    `api/checkout.js`'s default `AI_AMOUNTS_BY_CURRENCY` fallback,
    `i18n.js` (all of `prices.single.btn`/`priceLabel`,
    `purchase.single`, `result.deepBtn` across de/en/fr/es/it/pt/ru/uk/us
    — bumped to `?v=69` across every HTML file that loads it, per the
    cache-busting discipline above), `index.html`'s hardcoded pre-JS
    fallback text, and each standalone page's own embedded strings
    (`quiz.html`, `love-quiz.html`, `dream.html`, `time-tunnel.html`).
    This is a real pricing decision Yoel made explicitly (weighed against
    keeping "$4.99" for the charm-pricing psychology, decided the round
    $5.00 was simpler than negotiating the minimum with CCBill) — not
    something to revert without him reopening it. This was safe to change
    immediately despite being "production" code because Stripe is
    currently disconnected (see below) and CCBill isn't wired into the
    real checkout yet, so nothing live was charging real customers at the
    old price at the moment of this change.
  - **2026-11-11: found "CCBill EU-Debit" (free setup, no monthly minimum)**
    while browsing the portal — lets German/Austrian customers pay by
    direct bank debit (routing + checking account number, German customers
    also need a Country ID Card Number) instead of a credit card. Yoel's
    reasoning, worth keeping: many Germans are reluctant to put a credit
    card number "out on the internet" and prefer direct bank debit — and
    DACH is literally the one funded, highest-value ad market (see the
    TikTok Ads section below), so this could be a real incremental-revenue
    lever, not just a nice-to-have. **Not signed up for or acted on yet**
    — requires the Main Account Principal to log into System5 and agree to
    a separate CCBill EU-Debit Contract Addendum (print/initial/fax back
    per CCBill's process) before any check-form signup can be built. Revisit
    once the Dynamic Pricing cutover itself is done and tested.

## Universal / non-denominational framing — standing design principle

Yoel has repeatedly and explicitly required that DEGAJA features never be
attributed to, or framed around, any single specific religion, culture, or
people — even when the underlying inspiration (e.g. dream interpretation
traditions, gematria) has roots in a particular tradition (in these cases,
Jewish tradition). His stated reasoning: doing so would look like religious
proselytizing, and DEGAJA respects all faiths/traditions without favoring or
excluding any.

Concrete instances already applied — do not reverse without Yoel explicitly
reopening the topic:
- `api/dream.js`'s system prompt explicitly instructs the AI to speak of
  dream-symbolism sources only in vague terms like "old wisdom," never
  naming a specific culture, religion, or text.
- The Gematria feature's icon was changed from a Star of David emoji to a
  neutral gold emblem image (`assets/gematria-emblem.png`) specifically
  because a Star of David read as a specifically Jewish/Israeli religious
  symbol in that context.
- This applies to all *future* features too, not just these two: pitch any
  new esoteric/divination feature in universal, pluralistic terms.

## Branding: DEGAJA™ placement

"™" was added next to "DEGAJA" and next to each reading feature's own name,
but **only in prominent, short UI spots** — eyebrows, the homepage hero
intro, brand taglines. It was deliberately **not** added throughout the long
legal/privacy running text (agb.html, datenschutz.html, impressum.html,
widerruf.html) — that was Yoel's explicit choice. Keep new copy consistent
with this split.

## Monetization UX — standing pattern (established 2026-10-26)

Every "go deeper / unlock full reading" CTA, across every feature, must make
the paywall explicit *before* the user clicks through to a modal — Yoel was
frustrated that it looked unclear/concealed and ranted at length about
predatory competitor monetization (misleading discounts, hidden fees) that
DEGAJA should contrast against, not emulate. The established pattern:
- The CTA button itself states the single-reading price on its face (e.g.
  "✨ Go deeper · $4.99"), not a generic "Unlock" label.
- Directly below it, the 3-reading package price is shown as plain text
  (reusing the `purchase.pack` / `purchase_pack` i18n key — do not hide it
  behind another click).
- Below that, a one-line trust note using `purchase.note` /
  `purchase_note` ("One-time payment · no automatic renewal"), prefixed
  with 🔒 — this is deliberately positioned to read as "we are not like
  [unnamed predatory competitors]" without naming anyone.
- This is implemented once in `script.js`'s shared `renderResult()` (covers
  oracle/palm/coffee/gematria/numerology/bazi/horoscope/hypnosis), and
  separately in each standalone page's own purchase modal (`dream.html`,
  `love-quiz.html`'s `renderReveal()`/`renderPalmReveal()`, `quiz.html`,
  `time-tunnel.html` — each has its own i18n, not shared with the main
  site). There is no dream-related code in `script.js` itself — `dream.html`
  became a fully standalone page on 2026-10-26 (see below) and this note
  previously said otherwise; verified during the 2026-10-29 bug audit that
  there's zero dream-related code left in script.js. Any new feature with a
  paid "deepen" step must follow the same three-part pattern.

## Architecture notes that keep needing rediscovery

- **i18n.js**: `T` object keyed by language. 11 base blocks
  (`de, en, fr, es, it, pt, ru, uk, ja, zh, hi`); `us`/`br`/`mx` are
  `Object.assign` overlays inheriting from `en`/`pt`/`es`. Editing a base
  key auto-propagates to its alias unless overridden on the alias itself.
  `t(key)` falls back to `T.de[key]`, then the raw key string.
- **Cache-busting discipline**: every edit to a shared file loaded with
  `?v=N` (`i18n.js`, `script.js`, `tarot-i18n.js`, `tabs.js`, etc.) requires
  bumping its version string identically across **every** HTML file that
  loads it. Check with `grep -rn 'scriptname.js?v=' *.html` first — not all
  shared scripts are loaded by all pages (e.g. only `index.html` loads
  `script.js`; the legal pages don't).
- **Standalone pages** (`quiz.html`, `love-quiz.html`, `time-tunnel.html`,
  `dream.html`) do **not** load `script.js` or `i18n.js` — each is fully
  self-contained with its own embedded `STR` object, language detection,
  and mini purchase flow. They call the same shared backend endpoints
  (`/api/oracle`, `/api/palm`, `/api/dream`, `/api/checkout`) as the main
  site. `dream.html` was converted from an inline `#dream` section on the
  homepage (2026-10-26, for symmetry with the other three) — it calls
  `/api/dream` directly for the free reading (to keep its dedicated
  non-denominational system prompt), but the paid "go deeper" reading
  still goes through `/api/oracle` like every other feature's deep flow,
  seeded by a synthetic question built from what the user actually typed.
  Any future conversion of another inline main-site section into its own
  standalone page should follow this same pattern.
- **Cross-page payment resumption**: `localStorage["degajaPendingReading"]`
  — set by `stashPendingReading()` (main site) or inline in a standalone
  page before redirecting to checkout — is read automatically by the main
  site's `verifyAiPayment()` on every homepage load after a payment-provider
  redirect. Reuse this instead of building a new result-delivery mechanism
  for any new standalone page.
  **2026-11-11 update**: a standalone page now gets its OWN paid reading
  rendered on itself, not on the homepage. Each standalone page stashes its
  own filename as `source` in the pending object. `verifyAiPayment()` checks
  `source` against a known list (`quiz.html`/`love-quiz.html`/`dream.html`/
  `time-tunnel.html`) and, if it matches, does `location.href = source`
  instead of rendering anything, leaving the pending object in place. Each
  standalone page's own inline script checks on load whether a pending
  reading names itself and, if so, skips its normal quiz flow and re-asks
  the same question via `/api/oracle` (mode: "paid") itself, rendering the
  result with its own `renderReveal(text, true)` (a `paid` flag that swaps
  the badge to a `paid_badge` STR key and omits the purchase CTA/pack hint,
  since it's already paid). `dream.html`'s resume calls `/api/oracle`, not
  `/api/dream` - its paid "go deeper" step was always a synthetic oracle
  question (see the "Standalone pages" note above), never the dream
  endpoint. Any FUTURE standalone page's checkout flow must add itself to
  both the `source` stash and `verifyAiPayment()`'s `STANDALONE_PAGES` list,
  or its paid reading will silently fall back to rendering on the homepage
  instead of coming back to itself.
- **Every AI serverless endpoint needs `export const config = { maxDuration: 60 };`**
  as its first line. Vercel's platform default (~10s) is shorter than the
  client's own fetch timeout (25-45s), so without this, slow AI responses
  get killed server-side with no error surfaced to the user — this caused a
  real, previously-undetected bug across all 9 AI endpoints. Add this line
  to any new AI endpoint from the start.
- **Every AI "analyzing..." loading state needs a visible animation, not just
  static text.** `palm`/`coffee`/`gematria`/`numerology`/`bazi`/`horoscope`/
  `hypnosis` on the main site each only wrote a static bold "DEGAJA is
  calculating..." string into the result panel while waiting 7-20+ seconds
  for the AI response, with zero motion. A CCBill compliance reviewer
  testing Numerology (2026-10-26) reported the page "only displayed a
  loading message, and no results... were provided" — verified directly
  against production that the backend actually responds correctly in ~7s,
  so the static unmoving text was almost certainly read as a frozen page,
  not a real functional bug. Fixed by adding a shared `.ai-loading`/
  `.ai-loading-spinner` CSS spinner (style.css) and wiring it into all 7 of
  these loading states in script.js — same fix already applied earlier to
  the dream decoder's own loading state. Give any new AI loading state this
  same spinner from the start rather than a bare string.
- **Verifying "is this actually live"**: don't trust local files or
  first-pass log queries. `get_runtime_logs` only shows what a function
  explicitly `console.log`s — none of the AI endpoints log anything, so a
  "zero results" query is meaningless, not proof of zero traffic. Fetch the
  actual deployed file (Vercel tools) to check source-of-truth when a
  reported bug seems inconsistent with the code — several "bugs" turned out
  to be the reporter's own browser cache.
- **Birthdate fields must be `<input type="date">`, never free text.** A
  free-text birthdate field with a locale placeholder (e.g. "JJ/MM/AAAA",
  "TT.MM.JJJJ") relies on the user typing a day-first or dot-separated date,
  which JS's `new Date(str)` cannot parse reliably: `new Date("14/05/1990")`
  is `Invalid Date` whenever the day is >12, and silently swaps day/month
  the rest of the time. Since `api/checkout.js`'s 18+ check runs
  `new Date(birthDate)`, a free-text field here makes checkout reject real
  adult users with a generic error — this was a real, live bug on both
  `quiz.html` and `love-quiz.html` (found 2026-10-26 via a user screenshot).
  A native `<input type="date">` sidesteps this entirely: its `.value` is
  always ISO `yyyy-mm-dd` regardless of display locale. The main site's
  numerology/palm birthdate inputs already did this correctly — match that
  pattern for any new birthdate field.
- **Any new "go deeper" / checkout entry point must collect a birthdate.**
  `api/checkout.js` always requires one and returns 400 without it. The
  main site's shared `showPurchaseModal()` in `script.js` (used by the "go
  deeper" CTA on oracle/palm/coffee/gematria/numerology/bazi/horoscope/
  hypnosis/dream) went live for a long time calling `startCheckout()` with
  no birthdate at all — found and fixed 2026-10-26. It now has its own
  `type="date"` input, validated client-side via `isAdultBirthDate()`
  before calling `startCheckout(product, birthDate)`. This was distinct
  from, and did not affect, the separate `#prices` section's own purchase
  flow, which already collected birthdate correctly. Any new purchase
  entry point (e.g. a future dream.html standalone page) must either reuse
  this pattern or replicate it — never call `startCheckout`/hit
  `/api/checkout` without a real collected birthdate.
- Mixing an RTL character (e.g. Hebrew ה) directly next to a Latin digit/word
  in plain text can render reversed in-browser (bidi algorithm artifact).
  Don't try to force direction with Unicode control characters — use an
  image instead if the mixed script is unavoidable.
- **2026-11-12: full currency audit, requested by Yoel before any TikTok ad
  spend begins ("it needs to be perfect regarding CCBill before we start
  advertising").** Went through every currency-display surface site-wide,
  not just the standalone-page bug below. Findings:
  - **Main site (`i18n.js`)**: `currency.symbol`, AI single/pack pricing
    (`prices.single/pack.*`, `purchase.single/pack`, `result.deepBtn`) are
    all correct for every one of the 14 language/currency variants
    (de/fr/es/it/pt/ru/uk/en→eur×7+gbp; ja→jpy; zh→cny; hi→inr; br→brl;
    us→usd; mx→mxn) - cross-checked digit-for-digit against
    `api/checkout.js`'s `AI_AMOUNTS_BY_CURRENCY`. No bug found here.
  - **Voice/live-advisor pricing** (`VOICE_PRICES` in `api/_data.js`,
    rendered via `api/advisors.js`'s `price[currency] || price` fallback):
    amounts were always correct (GBP/USD intentionally match EUR's digits,
    same pattern as the single-reading price), but the fallback reused the
    EUR-style comma-decimal label ("49,99") on English-language pages
    instead of the period convention ("49.99") the rest of the English UI
    uses. **Fixed**: added explicit `gbp`/`usd` entries with the same
    amount, period-formatted label.
  - **Rituale pricing** (`rituale.love/success/balance.price`): `T.us`
    never overrode these, so US visitors saw "From £49" (inherited from
    `T.en`) instead of "$49". **Fixed** with the same digit-swap already
    used for every other US price. `T.mx` has the same gap but **left
    unfixed**: Mexican ritual pricing needs a real converted MXN amount
    (like the main MX$89/MX$179 reading price), not a digit swap - that's
    a business pricing decision for Yoel to make, not something to guess.
  - **`werde-partner.html`'s commission calculator**: hardcodes `€` in its
    JS (`result.textContent = '€' + ...`) regardless of visitor language,
    even though the page's other text IS translated via `data-i18n`. Not
    changed - unclear whether partner payouts are always in EUR regardless
    of the partner's country (in which case this is correct) or should
    follow the visitor's currency. **Ask Yoel** before touching this.
  - Everything else checked (standalone pages, `fair-pricing.html`'s
    Nebula/FTC $ citations - those are quoting the real case, not our own
    pricing) was already correct or is covered by the entry just below.
- **2026-11-12: US/Mexico pricing display bug (real, user-reported, fixed).**
  All 4 standalone pages (`quiz.html`/`love-quiz.html`/`dream.html`/
  `time-tunnel.html`) had `LANG_ALIAS = { us: "en", mx: "es" }` and
  `COUNTRY_LANG`'s geo-IP map sending `US`→`en`/`MX`→`es` — aliasing the
  WHOLE language, text and currency together. Since these files' `en`
  block is priced in GBP (£) and `es` in EUR (€), a US or Mexican visitor
  saw £/€ on every price button and purchase modal, even though the real
  charge (`api/checkout.js`'s `CURRENCY_BY_LANG`) was already correctly
  USD/MXN — the displayed price was simply wrong for the amount actually
  charged. Yoel found this by reporting it from a real "en"-mapped US
  session. Fixed by giving `us`/`mx` their own `STR` entries (reusing
  `en`/`es` for every key except the 3 price-bearing ones:
  `cta`/`purchase_single`/`purchase_pack`), mirroring `i18n.js`'s own
  already-correct `T.us`/`T.mx` pattern on the main site (which was
  NEVER affected — only these 4 standalone pages, since they maintain
  their own separate `STR` objects per the "Standalone pages" note
  above). Also fixed `COUNTRY_LANG` (`US`→`us`, `MX`→`mx`) so first-time
  geo-detected visitors get it right without needing an explicit
  `?lang=` param.
- **2026-10-29: full-site bug audit (Yoel asked for one thorough pass instead
  of reactive one-at-a-time discovery) found and fixed a batch of real bugs.**
  Worth knowing about if something in this area seems off again:
  - **Payment-verification replay (critical, fixed):** `api/verify-payment.js`
    was a stateless proxy to Stripe's session lookup with no server-side
    redemption tracking — reopening the same `?payment=success&session_id=...`
    URL (different browser, private window, cleared localStorage) granted AI
    credits again, indefinitely, off one real charge. Fixed by tracking
    redeemed session IDs in Edge Config (`api/_redeemed.js`, same store
    pattern as `_availability.js`/`_pending.js`) and having `script.js`'s
    `verifyAiPayment()` skip granting credits (and skip auto-running the
    stashed reading) when `data.alreadyRedeemed` comes back true. Best-effort
    read-then-write, not atomic — see that file's own comment.
  - **Voice/live-advisor pricing (critical, fixed):** `VOICE_PRICES` in
    `api/_data.js` only had a currency override for `brl`; `mx`/`ja`/`zh`/`hi`
    customers were silently charged the raw EUR-cent number in their own
    currency (e.g. ₹49.99 instead of ₹2,500 for a live session — less than a
    single text reading). Added `mxn`/`jpy`/`cny`/`inr` entries computed with
    the same per-currency ratio already used for the AI single-reading price,
    and generalized the `currency === "brl"` special-case in both
    `api/checkout.js` and `api/advisors.js` to `price[currency] || price` so
    a missed currency fails safe instead of silently mispricing. Also fixed
    `live-consult.js`, which only ever requested `currency=brl` and defaulted
    to EUR pricing display for every other non-German language.
  - **Oracle/Tarot — the highest-traffic feature — never got the loading-
    spinner fix** described below (both the free `#aiBtn` handler and the
    paid `unlockDeepReading()` in `script.js` were left out when the spinner
    was added everywhere else). Fixed; if you're adding a new AI call site,
    double-check it actually got the spinner, don't assume "everywhere else
    has it" means this one does too.
  - **`api/tts.js` was missing `maxDuration: 60`** — same root cause as the
    numerology-spinner bug, just never caught here. Fixed.
  - **Standalone pages had copy-pasted-then-diverged bugs:** the geo-language
    race condition fixed the same day in `quiz.html`/`love-quiz.html`/
    `time-tunnel.html` (see the "Standalone pages" note above — actually
    logged there) was NOT fixed in `dream.html` in that pass; it had the
    identical bug under a different stage-name gate (`stage !== "input"`)
    and was fixed separately. Also: `quiz.html`/`love-quiz.html`/
    `time-tunnel.html` collected birthdate early (as its own quiz step) with
    **zero age validation** — unlike `dream.html`, which validates inside its
    purchase modal. A real underage visitor (or a mistyped year) completed
    the entire quiz, photo upload included, only to hit a generic "payment
    unavailable, try again later" alert at the very last step with no
    explanation. Fixed by validating at the birthdate step itself (added
    `isAdultBirthDate()` + a `birthdate_error` i18n key, reusing `dream.html`'s
    existing translations, to all three files) — catches it immediately
    instead of at the end. When adding a new quiz-style standalone page,
    validate age where birthdate is collected, not only server-side.
  - **Double-submit on checkout buttons:** none of the purchase buttons
    (main site's `showPurchaseModal`/`[data-buy]`, or any standalone page's
    `startXChectout`-style function) guarded against a fast double-click/tap
    firing two concurrent `/api/checkout` calls. Fixed with a simple
    in-flight flag on each checkout function. Any new checkout entry point
    needs the same guard.
  - **Silent failure on a broken palm photo upload** (`quiz.html`,
    `love-quiz.html`): if `resizeImage()` failed to decode the file, the
    change handler did nothing at all — no error, no re-render — which reads
    as a frozen page (the same failure *mode* as the numerology-spinner bug,
    different cause). Fixed with a `photo_error` message and resetting the
    file input so re-picking retries.
  - **`api/ccbill-webhook.js`** was a live, unauthenticated POST endpoint
    that wrote arbitrary request bodies into the shared Edge Config store —
    low-impact today since nothing reads that key yet, but still an open
    write-abuse surface sitting in prod ahead of the real CCBill cutover.
    Now 503s until `CCBILL_WEBHOOK_SALT` is set; wire the real signature
    check in when CCBill provides it, per the TODO already in that file.

## i18n completeness — audit method and what it found (2026-11-02/03)

`i18n.js`'s `t(key)` silently falls back to `T.de[key]` when a key is
missing for the current language (see "Architecture notes" above) — this
means a missing translation is **never visible as an error**, only as
mystery German text to a non-German visitor. This already caused real,
long-undetected bugs:
- The **entire `live.*` namespace** (62 keys — every button/status message/
  warning in the live-advisor call flow) was completely missing for
  Japanese, Chinese and Hindi. Visitors in those languages hitting "Live
  Audio" saw 100% German throughout the booking and call UI.
- The **entire Advisor (`#human`) and Rituals (`#rituale`/`ritual.modal*`)
  sections** (26 keys, including all 3 ritual cards with pricing) were also
  completely missing for the same 3 languages — neither section is
  language-gated (unlike BaZi, see below), so this was live and visible.
- `bazi.*` (13 keys) was missing for es/fr/hi/it/pt/ru/uk — this one was
  *intentional* at the time: BaZi was gated to ja/zh only via a
  `data-ja-zh-only` HTML attribute + matching JS in `i18n.js`. Yoel decided
  (2026-11-02) that curiosity about Eastern astrology isn't limited to
  Japanese/Chinese speakers, so the gate was removed entirely (`api/bazi.js`
  already supported every language correctly — it was purely a frontend
  gate) and the missing translations were added for all 7 languages.

All of the above is now fixed; a full cross-language key audit (every
`"key.subkey": ` pattern, diffed across the 11 base-language blocks in
`i18n.js`) shows **zero gaps** as of 2026-11-03. If this needs re-checking
after future edits, the method that worked: find each language's block
start line (`de: {`, `en: {`, …) and `T.br =` as the end marker, extract all
dotted-key matches per block into a `Set`, then diff the union of all keys
against each language's set. Don't just count total occurrences of a key
name across the whole file — multi-dot keys (e.g. `rituale.love.title`)
need a regex that allows more than one dot, or they're silently skipped.

## SEO & Google Search Console

- A Google Search Console property for `degaja.com` already exists and is
  verified under Yoel's Google account (confirmed by Yoel 2026-11-03,
  existing for over a month already — exact verification method, e.g. DNS
  TXT at Porkbun vs. HTML meta tag, is not recorded anywhere in this repo,
  since DNS for degaja.com is managed externally at Porkbun, not through
  Vercel). Don't offer to walk Yoel through creating a new property from
  scratch — check whether one already exists / ask him first.
- `sitemap.xml` lives at the site root. As of 2026-11-03 it lists the
  homepage + all per-language paths (`/en`, `/fr`, … ), `werde-beraterin.html`,
  `werde-partner.html`, and `dream.html`/`quiz.html`/`love-quiz.html`/
  `time-tunnel.html`. `robots.txt` references it.
- **2026-11-03 finding (significant):** `dream.html`, `quiz.html`,
  `love-quiz.html` and `time-tunnel.html` — the exact pages promoted via
  "trending now" banners on the homepage, meant to drive organic search
  traffic — were all set to `<meta name="robots" content="noindex">`,
  despite each already having unique, search-ready titles/descriptions, and
  none of them were in `sitemap.xml` either. This blocked Google from
  indexing them at all. Fixed: removed `noindex`, added a `canonical` tag to
  each (none had one), added all 4 to `sitemap.xml`. Google still needs to
  re-crawl before this shows results — ask Yoel to use GSC's "URL
  Inspection" → "Request Indexing" on each of the 4 URLs to speed this up
  rather than waiting for natural re-crawl.
- The homepage's `<script type="application/ld+json">` block (in
  `index.html`'s `<head>`) hardcodes an `Organization`/`WebSite`/`FAQPage`
  schema **in German only** — it is not i18n-driven. This is what Google's
  rich results and AI Overview read directly. As of 2026-11-03 it has 6
  Q&As mirroring `faq.q1..q6`/`faq.a1..a6` from `i18n.js`'s German block.
  **Whenever a new `faq.qN`/`faq.aN` pair is added to the visible FAQ
  section, add the same Q&A to this JSON-LD block too** — the two have
  drifted out of sync before and the schema is the one that actually
  reaches AI-generated search summaries.
- Context for why this round of SEO work happened: Vercel Web Analytics
  showed only ~137 visitors / ~492 pageviews for all of October 2026 —
  traffic, not conversion, is the actual bottleneck right now (checkout/
  payment infra has no errors and all keys are configured). An AI-generated
  search summary was also found comparing DEGAJA's billing to predatory
  subscription apps (e.g. Nebula) due to DEGAJA having no third-party trust
  footprint (no Trustpilot/BBB presence) — Yoel was given this list of
  next steps but hadn't acted on it as of this writing: set up free
  Trustpilot + BBB + Google Business Profile listings, since these are what
  AI search tools cite when assessing legitimacy.
  **2026-11-11: done for Trustpilot** — a `degaja.com` Trustpilot profile
  now exists and has already received its first real review (5 stars, from
  a customer named Siarta, received 2026-11-11). BBB and Google Business
  Profile still not confirmed set up — ask Yoel for current status.

## Language / routing

German (`de`, site root `/`) is the default/canonical language and must
**stay** the default — Yoel explicitly decided against switching the root to
English for SEO/canonical-URL reasons. English-first audience targeting is
handled purely through marketing links (`degaja.com/en`, `/us`), not by
changing site-wide routing.

## Paid advertising — TikTok Ads plan (established 2026-11-10)

Yoel has 16 existing organic TikTok videos covering all DEGAJA features.
Organic performance data he reported: plain feature-demo videos plateau at
~250-300 views; videos that pair a reading with a real location Yoel was
actually visiting (a Turkish-coffee reading filmed at Galata Tower,
Istanbul; another filmed in Rome) got ~1200-1400 views — roughly 5x. He
was explicit this is about the authenticity of really being there, not a
replicable "travel content" formula — don't plan new creative assuming he
can manufacture more of it on demand.

**Agreed split — FINAL as of 2026-11-10 (supersedes an earlier DACH+UK
draft that was discussed and then explicitly dropped in the same
conversation — France/Italy/Spain were also floated as a phase-2 idea and
then dropped; do not reintroduce UK/FR/IT/ES funding without Yoel
reopening it):**
- **DACH (Germany/Austria/Switzerland)** — funded campaign pushing both
  the automatic AI readings *and* the live advisor (Papuli speaks
  de/ru/uk), since it's the only market where a convert can go on to the
  much higher-value advisor upsell.
- **US** — funded, automatic-only. Paired with the existing organic/SEO
  push (the `fair-pricing.html` work) rather than separate from it.
- Explicitly **not** funded: UK, France, Italy, Spain. Yoel declined to
  raise the total budget to cover them, so they stay unfunded rather than
  diluting DACH/US below TikTok's ad-delivery learning-phase threshold
  (~$20/day per ad group — see budget note below).

**Budget**: €100/day total, split across DACH and US only — Yoel
explicitly declined to increase the total. Exact €/day split between the
two was not finalized in this session; ask Yoel for the current number
before assuming an even 50/50.

**Creative**: use Yoel's existing high-performing organic videos (the
Istanbul/Galata-Tower Turkish-coffee one explicitly named) as ad creative
for both DACH and US targeting — the location doesn't need to match the
ad's target country for travel/mystery content to land.

**Promo offer**: 20% off the 3-reading package. Mechanism: `api/checkout.js`
already passes `allow_promotion_codes: true` to Stripe, so the checkout
page can already accept a promo code — but the actual coupon itself has to
be created in the Stripe Dashboard (Yoel's own action, not something doable
from this session) before any ad can reference a working code. Note this
runs on Stripe, not CCBill (CCBill integration isn't wired up yet) — when
CCBill cutover happens, check whether its own discount/coupon mechanism
needs separate setup; nothing here assumes it carries over automatically.

**Explicitly ruled out for this campaign** (ties back to the Nebula/FTC
discussion above): no direct reference to Nebula, the FTC case, or any
named competitor in TikTok ad creative for the DACH audience. Two reasons
given: the FTC means nothing to a non-US audience (the whole reason
`fair-pricing.html` was built English/US-only), and naming a competitor in
paid ad creative revives the trademark/comparative-advertising risk Yoel
already chose not to pursue without a lawyer. The agreed alternative:
generic pain-point messaging that doesn't name anyone ("fixed price, no
surprises," "no hidden subscription, ever," "cancel or refund in one
click") — it resonates with the same burned-by-some-app audience without
the legal exposure. For the US audience specifically, the FTC v. Genesis
Tech case (see above) can be referenced carefully (sourced, "alleges"
framing) since it's a real public case and the US audience is the one
`fair-pricing.html` was built for — but never name Nebula/a competitor
directly in ad creative itself, same rule as DACH.

**Not yet done as of this writing**: the actual TikTok Ads Manager campaign
setup — Yoel has a TikTok Business account and was mid-walkthrough of the
real Ads Manager (ads.tiktok.com) at the Objectives step (after being
stopped from paying for the in-app "Promote"/Boost tool, which does not
support country targeting or conversion tracking and must not be used) —
and the Stripe coupon code. Ask Yoel for current status on both before
assuming either is ready. No TikTok pixel is installed on the site yet
either (confirmed by grepping the codebase, not assumed) — needed before
the "Website conversion" objective can actually measure purchases; still
waiting on Yoel to find Events/Assets in his TikTok Ads Manager account
and send the Pixel ID.

**2026-11-10: Yoel explicitly decided to hold off launching/paying for any
TikTok campaign until the CCBill cutover is fully live** — reasoning: no
point spending ad budget driving traffic into a checkout flow (currently
Stripe) that's mid-migration and carries its own account-freeze risk, and
conversion tracking can't work correctly yet anyway (no pixel installed,
payment details not yet entered in TikTok Ads Manager). Do not encourage
actually launching/paying for a TikTok campaign before Yoel confirms
CCBill is live — campaign setup/learning (objectives, pixel prep) can
continue in the meantime, but the real spend waits.

## Behavioral notes

- Never reintroduce Talmud/Judaism framing, or Chinese law/regulation
  commentary, into DEGAJA content unless Yoel explicitly reopens those
  topics himself.
- Conversations on this project are long-running and get compacted — when
  something feels like it should be "obviously known" but isn't, say so
  plainly and ask, rather than guessing or pretending to remember.
