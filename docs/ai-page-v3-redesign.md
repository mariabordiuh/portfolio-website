# /ai v3 — Light One-Pager Redesign (build spec)

**For the implementing agent:** this spec is the single source of truth. All decisions
below were made with Maria — do not re-litigate them, do not add sections, do not
switch back to a dark theme. The v2 code in `src/pages/ai/` is the starting point:
keep the architecture (data.ts / i18n.ts / components), restyle and restructure per
this document. German is the default language; every visible string stays a
`Copy = { en, de }` via the existing `c()` helper.

---

## 1. Context & audience

Maria sells AI photoshoots (stills + motion, consistent model identities) to
German-speaking SMEs — including and especially "boring" products: safety
workwear, tools, food, furniture, 60+ fashion. The buyer is busy, not
design-literate, and suspicious of hype. Most AI creatives chase pretty fashion
brands; our wedge is everyone else — they have real budgets and no one courting
them.

**Design goal in one line: zero confusion.** One idea per screen, one repeated
CTA, everyday language (Sie-Form), nothing that smells like high fashion or
"crazy design". **Final approved direction: Apple product-page structure +
monochrome ink palette + young/SaaS feel** (fonts Instrument Sans + Instrument
Serif italic). Reference DNA: Apple (bento, footnotes, "Ab €" pricing, frosted
nav, short-sentence cadence), letsplayfight.com (human sentences, friendly
contact), marketer.com/ember (claim → numbers → visual proof → one repeated
CTA). Rejected along the way (do not revisit): warm/beige palettes, lilac,
serif-editorial print look, loud red poster/Nutshell look, any dark-default or
colored-accent theme. Sales logic: Hormozi — demonstrate before asking; the
free test shoot converts cold traffic.

## 2. Page architecture — Apple-style one-pager with anchor nav

**Approved visual direction (2026-07-06):** Apple product-page structure +
mono-ink palette. Calm, high-clarity, bento grid. The final approved mockup is
the `ai_page_v3_mono_ink_full` visualization from the design conversation —
this section is its written form; build to match it.

Single page at `/ai`. **Frosted sticky top nav** (Apple pattern:
`background: rgba(255,255,255,.85); backdrop-filter: blur(10px)`, 0.5px bottom
border) — product name `Maria Bordiuh AI` left; anchors
`Beispiele · Ablauf · Preise · FAQ` + `DE·EN` toggle + compact black `Gratis-Test`
button (8px radius) right. Anchors smooth-scroll.

Section order:

1. **Hero** (centered) — serif-italic kicker `KI-Fotostudio für Produkte`
   (Instrument Serif italic); H1 **"Produktfotos, die verkaufen. Ohne
   Fotoshooting."**; sub in Apple cadence *"Foto schicken. 48 Stunden warten.
   Kampagne erhalten. So einfach ist das jetzt."*; primary CTA **"Gratis-Testshooting
   starten"** (black, 8px), secondary underlined text-link "15-Min-Call buchen ›".
   Below the hero copy: one full-width rounded image plate (the hero campaign
   shot) with a frosted caption chip bottom-left.
2. **Bento grid — "Warum es funktioniert."** A 6-col bento (Apple/Linear
   pattern) that MERGES v2's stats + before/after + models + motion + guarantee
   into one grid. Tiles:
   - `span 4`: the **before/after slider** (reuse `BeforeAfterSlider.tsx`) with a
     frosted "Vorher → Nachher. Ziehen Sie selbst." chip.
   - `span 2`: **black tile** big number `48h` + "Von Ihrem Foto zur fertigen
     Kampagne.¹"
   - `span 2`: gray tile `900+` + "Gelieferte Bilder, u. a. für Novo Nordisk und
     Nestlé Ukraine.²"
   - `span 2`: **models face-pile** (6 avatars, +3 overflow chip) + "6 Models, die
     immer gleich aussehen. In jeder Kampagne." (Keep `ROSTER` for the pile +
     booking dropdown; no selection UI.)
   - `span 2`: **motion tile** play icon + "Auch in Bewegung: Motion-Loops für
     Social und Shop."
   - `span 6`: **guarantee bar** shield icon + "**Passt-oder-nochmal-Garantie.**
     Sie geben ein Preview frei, bevor final produziert wird — plus volle
     kommerzielle Nutzungsrechte, schriftlich."
   Numbers count up when the grid scrolls into view (see §8 motion).
3. **Beispiele (gallery)** — headline *"Alles kann premium aussehen."* + sub
   *"Fashion ist einfach. Interessant wird es bei allem anderen."* Mixed 4-up grid
   from `SHOWCASE_ITEMS`, deliberately unglamorous-to-premium (safety vest, hair
   oil, drill, 60+ knit, jewelry, cheesecake…); 1–2 cells are inline `<video>`
   motion loops. Quiet caption line under the grid. (No before/after here — it
   lives in the bento. No roster row here — it lives in the bento.)
4. **Ablauf — "Drei Schritte. Keine Überraschungen."** 3 icon cards (circle-black
   icon badge, Tabler icons `photo-up / eye-check / package`): Foto schicken →
   Richtung freigeben → Kampagne erhalten. Guarantee already covered in the bento,
   so steps stay short.
5. **Preise — "Welches Paket passt zu Ihnen?"** 3 cards; **middle (Starter) is
   the black featured card** with a white "Beliebt" pill (the mono-ink way to
   feature — inversion, not a colored border). Prices as **"Ab €340³ / Ab €890³"**
   (Apple "Ab" pattern) with `<s>€490</s> — Founding-Preis` beneath. Keep founding
   logic + `SCARCITY` from data.ts; plain strikethrough, never "später". Test card
   = €0. Buttons 8px: featured = white-on-black, others = black-on-white / bordered.
   Signature is NOT a 4th card — one underlined link below: *"Laufender Bedarf?
   Signature — Ihr exklusives Model, ab €790/Monat ›"*. Calculator (`CostCalculator.tsx`,
   restyled mono) may sit directly under the cards or be cut for v3 launch — Maria's
   call; if kept, it replaces v2's calculator + comparison sections.
6. **FAQ** — keep all 8 items from data.ts. Add one: *"Warum keine Kundennamen?"
   → "NDAs. Deshalb machen wir es anders: Schicken Sie uns ein Produktfoto und
   beurteilen Sie das Ergebnis selbst — kostenlos."* NDA answered exactly once,
   here. Delete v2's CASES section entirely.
7. **Kontakt — dark closing panel** (`#111112`, cream text, 22px radius — the one
   dark block on the page): headline *"Schicken Sie uns ein Foto."* + sub *"Wir
   zeigen Ihnen, was daraus wird. Kostenlos."* Three actions as pill/8px buttons:
   **Gratis-Testshooting** (white, solid) · **WhatsApp** (wa.me, outline) ·
   **15-Min-Call** (Cal.com/Calendly, outline). Below: Maria sign-off — real photo
   avatar + *"Hi, ich bin Maria — Art Directorin aus Hamburg. Ich sehe jede
   Anfrage persönlich."* The **test-shoot mini form** (`BookingSection.tsx`: name,
   email, product link) and the Cal embed live here too (form can sit above the
   dark panel or inside it; keep mailto + `CAL_LINK` fallbacks from data.ts).
8. **Footnotes** — Apple-style fine print row at the very bottom, ~10px muted:
   ¹ delivery-time scope, ² the stats-counting disclosure (this is where the honest
   "seit 2023, inkl. White-Label / Agenturauftrag" wording lives — see §5),
   ³ founding-price + invoice + usage-rights terms. The ¹²³ markers attach to the
   matching bento tiles and price labels.

Mobile: sticky bottom CTA bar ("Gratis-Testshooting starten") appears after
scrolling past the hero; bento collapses to 1–2 cols; gallery to 2 cols.

## 3. Design system (mono ink — APPROVED)

Palette is **monochrome: white, ink, grays only.** No accent hue — the product
photos are the only color on the page. This was chosen over lilac/coral/blue/
green/luxury options explicitly (Maria: "mono ink", "minimalistic luxury but
saas vibes, not old, white only, no green no purple"). Do NOT reintroduce a
brand color.

Replace the `.ai-page` token block in `src/styles/ai-page.css`:

```css
--ai-bg: #ffffff;            /* pure white page */
--ai-fg: #111112;            /* near-black ink (text, primary buttons, featured card, dark panel) */
--ai-fill: #f2f2f3;          /* light gray bento/step tiles */
--ai-fill-2: #f7f7f8;        /* slightly cooler gray for pricing/step cards */
--ai-border-soft: rgba(17,17,18,.09);
--ai-border-strong: rgba(17,17,18,.15);
--ai-fg-muted: rgba(17,17,18,.60);
--ai-fg-subtle: rgba(17,17,18,.45);
--ai-fg-faint: rgba(17,17,18,.42);   /* footnotes */
--ai-panel: #111112;         /* dark closing contact panel */
--ai-on-panel: rgba(255,255,255,.60);
--ai-shadow: 0 8px 30px rgba(17,17,18,.06);
/* image-placeholder grays (SmartImage fallback), light→dark: #ececed #dcdcdd #909092 #6f6f71 #8d8d8f */
```

Fonts (self-host both via the existing `scripts/selfhost-fonts.mjs` pipeline —
do NOT hotlink Google Fonts; CSP forbids it):
- **Instrument Sans** — all UI, body, headings. Weights 400/500/600.
- **Instrument Serif (italic only)** — used sparingly for the "voice" moments:
  the hero kicker `KI-Fotostudio für Produkte` and any editorial accent. Never
  for body or buttons.

Typography rules: **sentence case everywhere** (no uppercase headings; tiny
mono/label bits may stay uppercase). Hero H1 `font-weight:600;
font-size:clamp(2.2rem,5vw,2.9rem); letter-spacing:-.03em; line-height:1.02`.
Section headings ~27px/600/-.025em, centered. Body 1rem/1.55, muted gray.
Big bento numbers 36px/600/-.03em.

Shape language (Apple/SaaS): **buttons `border-radius:8px`** (NOT pills — pills
read old; the one exception is small status chips like "Beliebt"). Cards/tiles
`border-radius:18px`; hero/gallery plates `14–20px`; dark panel `22px`. Frosted
nav + frosted caption chips use `backdrop-filter:blur(10px)`. Primary button =
ink bg / white text; secondary = underlined ink text-link; on the dark panel,
invert (white button, outline buttons). Featured pricing = full ink card with
white "Beliebt" chip (inversion, no colored border).

Images do all the talking; UI stays monochrome and quiet. Keep every
focus-visible style and the reduced-motion block. Contrast is trivially safe
(ink on white, white on ink) — just verify muted grays ≥4.5:1 for body.

## 4. Copy voice rules

Sie-Form. Short sentences. No anglicisms where German works ("Testshooting" is
fine). No superlatives, no "revolutionär" — Germans distrust hype; specificity
sells (Ember pattern): numbers, hours, deliverables. Every section headline
passes the test: *would a tired Mittelstand owner understand it in 2 seconds?*

## 5. Stats bar — numbers must be TRUE (legal + trust)

⚠️ Invented statistics are an UWG (unfair competition) liability in Germany and
poison for trust if ever questioned. Rule: publish only floors Maria can defend
with a 10-minute count. Approved format (fill after Maria counts — placeholders
must not ship):

`___+ Bilder geliefert · ___ Kampagnen & Projekte · Lieferung in 48h`

Counting guidance for Maria: images = every final delivered image incl. agency
white-label work + published lab/IG sets (regular 15-image gigs add up fast —
count delivery folders, round DOWN to a floor like 900+ only if the count
supports it). Campaigns = distinct briefs incl. agency briefs and
self-initiated brand projects (Hanse-Hase, MIRA, pink33 count). Zero-risk
stats that need no counting and may pad the bar: `Mit KI seit 2023 · 6
konsistente Model-Identitäten · 100% Nutzungsrechte inklusive`.
⚠️ Do NOT date the images/consistency claims to 2023 — 2023 is when Maria
started working with AI at all (Midjourney), not when consistent-identity
production began. "Mit KI seit 2023" is the only approved use of the year.

## 6. Contact plumbing

- **WhatsApp Business**: Maria sets up the WhatsApp Business app (separate
  business number or same number — her choice; business profile with hours +
  auto-greeting). Page uses `https://wa.me/<E164number>?text=<urlencoded>` with
  prefilled DE text: "Hallo Maria! Ich interessiere mich für ein
  Gratis-Testshooting." Plain link + button, no SDK, no CSP changes needed.
  Add WhatsApp mention to /datenschutz processing list.
- **Calendar**: `CAL_LINK` in data.ts. CSP in firebase.json already allows
  app.cal.com/cal.com. If Maria chooses Calendly instead, add
  `https://calendly.com https://*.calendly.com` to frame-src.
- **Form**: keep mailto submission for v3 (works, zero backend); a Firestore
  `inquiries` collection is a later upgrade.

## 7. What dies from v2 (explicit deletions)

Hero roster strip picker · separate motion section (→ into bento) · separate
stats bar (→ into bento) · CASES/NDA section · separate guarantee section (→
bento bar) · comparison table section · 4th pricing card · credibility-strip
NDA note ("sounds like an excuse" — Maria) · all-caps headings · warm/beige
palette · any accent hue. The Novo Nordisk/Nestlé line lives in the bento
`900+` tile footnote ² and the Kontakt sign-off — small, factual, not a wall.

## 7a. Motion — young but calm (reveal, never rearrange)

Maria wants it to feel modern/awwwards-adjacent, NOT loud. Motion must never
move content around or delay comprehension. Use Motion (already a dep) +
`useReducedMotion` (kill everything when set). Approved:
- Staggered fade-up reveal per section on scroll-into-view (the existing
  `reveal` pattern) — the whole page's default entrance.
- Hero: headline fades/rises on load; the serif kicker can draw in slightly
  after.
- Bento `48h` / `900+` numbers **count up** once when the grid enters view.
- Before/after slider is genuinely draggable (pointer + keyboard, already built).
- Buttons: subtle lift/scale on hover (no magnetic-cursor gimmicks — too loud
  for mono).
- Gallery tiles: gentle scale-in on hover; a motion cell autoplays its muted
  loop (respect reduced-motion → show poster).
Nothing parallax-heavy, no marquees, no rotating stickers (those belonged to
the rejected poster direction).

## 8. Technical notes

- Keep: `i18n.ts` (DE default already), `data.ts` single-edit-point pattern,
  `SmartImage` placeholder fallback + `public/ai/README.md` filename contract,
  `BeforeAfterSlider`, `CostCalculator` (restyle), `BookingSection` (split into
  the 3-option contact layout), trailing-slash fix in `App.tsx`,
  `trailingSlash: false` + Cal CSP in `firebase.json`, German baked meta for
  /ai in `scripts/generate-route-meta.mjs`.
- Anchor nav: plain `#beispiele #ablauf #preise #faq #kontakt` ids; /ai has
  smooth scroll via `.ai-page { scroll-behavior: smooth }` (Lenis is disabled
  on /ai by design — do not enable it).
- Sticky mobile CTA: fixed bottom bar, hidden while hero is in viewport
  (IntersectionObserver), respects safe-area-inset-bottom.
- Verify per the existing checklist: `npm run check`, preview click-through EN
  + DE, 375px pass with zero horizontal overflow, reduced-motion, placeholder
  fallbacks, `dist/ai/index.html` German meta, /ai absent from main site nav.

## 9. Content Maria must supply (blocks polish, not build)

Roster portraits (6) · 12 gallery images + 2 motion loops · 2 before/after
pairs (hero + gallery) · her portrait photo for the sign-off block · counted
stats (§5) · WhatsApp Business number · Cal.com/Calendly link · final price
sign-off. Everything renders with styled placeholders until supplied.

## 10. Later phases (explicitly out of scope for v3)

Ohneis-style demo videos (proof-as-content: each video teaches one trick while
showing her output; ElevenLabs voiceover) → becomes the content engine for
IG/TikTok + ads. Cold outreach kit (free test shoot as the hook). Firestore
inquiries + admin inbox. English static route variant for crawlers.
