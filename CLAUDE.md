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
  oracle/palm/coffee/gematria/numerology/bazi/horoscope/hypnosis), once more
  in the dream decoder's own inline handler (also in `script.js`, since it
  doesn't use the shared `#aiResult` panel), and separately in
  `love-quiz.html`'s own `renderReveal()`/`renderPalmReveal()` (standalone
  page, own i18n). Any new feature with a paid "deepen" step must follow the
  same three-part pattern.

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
- **Standalone quiz pages** (`quiz.html`, `love-quiz.html`) do **not** load
  `script.js` or `i18n.js` — each is fully self-contained with its own
  embedded `STR` object, language detection, and mini purchase flow. They
  call the same shared backend endpoints (`/api/oracle`, `/api/palm`,
  `/api/checkout`) as the main site.
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
- Mixing an RTL character (e.g. Hebrew ה) directly next to a Latin digit/word
  in plain text can render reversed in-browser (bidi algorithm artifact).
  Don't try to force direction with Unicode control characters — use an
  image instead if the mixed script is unavoidable.

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
