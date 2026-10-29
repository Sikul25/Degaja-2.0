# DEGAJA — standing context for Claude

DEGAJA (degaja.com) is Yoel Etel's tarot/astrology/palm-reading/numerology/hypnosis
AI + live-advisor business. Yoel communicates in Hebrew, often via garbled
voice-to-text. This file exists because long sessions get compacted and lose
detail — read it at the start of any new session on this repo.

## Payments: Stripe → CCBill (in progress)

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

## Language / routing

German (`de`, site root `/`) is the default/canonical language and must
**stay** the default — Yoel explicitly decided against switching the root to
English for SEO/canonical-URL reasons. English-first audience targeting is
handled purely through marketing links (`degaja.com/en`, `/us`), not by
changing site-wide routing.

## Behavioral notes

- Never reintroduce Talmud/Judaism framing, or Chinese law/regulation
  commentary, into DEGAJA content unless Yoel explicitly reopens those
  topics himself.
- Conversations on this project are long-running and get compacted — when
  something feels like it should be "obviously known" but isn't, say so
  plainly and ask, rather than guessing or pretending to remember.
