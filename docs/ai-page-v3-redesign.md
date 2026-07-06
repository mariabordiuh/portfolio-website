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
"crazy design". References Maria approved: bymonolog.com (light, restrained,
work carries color), letsplayfight.com (short human sentences, friendly
contact), marketer.com/ember (claim → numbers → visual proof → one repeated
CTA). Sales logic: Hormozi — demonstrate value before asking for money; the
free test shoot is the offer that makes cold traffic convert.

## 2. Page architecture — one-pager with anchor nav

Single page at `/ai`. Sticky top nav with anchor links that smooth-scroll:

`Beispiele · Ablauf · Preise · FAQ · Kontakt` + EN/DE pill toggle + a compact
CTA button ("Gratis-Test") always visible in the nav.

Section order (7 sections, down from v2's 12):

1. **Hero** — kicker `KI-Fotostudio für Produkte`; H1 **"Produktfotos, die
   verkaufen. Ohne Fotoshooting."** (EN: "Product photos that sell. No photo
   shoot needed."); sub: *"Sie schicken ein Foto. Wir liefern fertige
   Kampagnenbilder in 48 Stunden."*; primary CTA **"Gratis-Testshooting
   starten"** (anchors to contact), secondary text-link "oder 15-Minuten-Call
   buchen". Below: ONE large before/after slider (reuse
   `BeforeAfterSlider.tsx`), not three.
2. **Stats bar** — quiet single row (see §5 for approved numbers). No logos, no
   NDA talk anywhere above the fold.
3. **Beispiele (gallery)** — mixed grid, `SHOWCASE_ITEMS` from data.ts stays
   deliberately unglamorous-to-premium (safety vest, hair oil, cheesecake,
   drill, 60+ knitwear, jewelry, sofa, sneakers). Motion loops render inline in
   the same grid (2 of the 12 cells are `<video>` loops — merge v2's separate
   motion section into this grid). Headline: *"Alles kann premium aussehen. Ja,
   auch Ihr Produkt."* Second before/after slider can sit at the end of this
   section. Roster becomes a small face-strip row at the bottom of this
   section: 6 faces + caption *"Unsere Models — immer dasselbe Gesicht, in
   jeder Kampagne. Wir schlagen das passende vor."* No selection UI, no cards,
   no stats. (Keep `ROSTER` data for the strip + booking dropdown.)
4. **Ablauf** — 3 steps, keep existing copy pattern: Foto schicken → Richtung
   freigeben → Kampagne erhalten. Add one line under step 3: the named
   guarantee *"Passt-oder-nochmal-Garantie: Sie geben die Richtung frei, bevor
   final geliefert wird."* (v2's separate guarantee section is deleted; this
   line and a pricing-card bullet replace it.)
5. **Preise** — 3 cards: Gratis-Test / Starter €340 ~~€490~~ / Kampagne €890
   ~~€1200~~ (keep founding logic + `SCARCITY` from data.ts; plain
   strikethrough, never the word "später"). Signature is NOT a 4th card: a
   quiet full-width band below — *"Laufender Bedarf? Eigenes exklusives Model +
   monatliche Bild-Drops — Signature ab €790/Monat →"* linking to contact.
   Below the cards: the simplified calculator (keep `CostCalculator.tsx`,
   restyle light; it replaces v2's separate calculator section AND the old
   comparison table). Footnote stays (invoice + usage rights, no VAT talk).
6. **FAQ** — keep all 8 items from data.ts. Add one: *"Warum keine
   Kundennamen?" → "NDAs. Deshalb machen wir es anders: Schicken Sie uns ein
   Produktfoto und beurteilen Sie das Ergebnis selbst — kostenlos."* NDA is
   answered exactly once, here, in one dry sentence. Delete v2's CASES section
   entirely.
7. **Kontakt** — headline *"Schreiben Sie uns. Wir antworten schnell."* Three
   equal, obvious options side by side: **WhatsApp** (wa.me link, see §6) ·
   **Test-Shooting-Formular** (keep the mini form from `BookingSection.tsx`:
   name, email, product link — nothing more) · **15-Min-Call** (Cal.com or
   Calendly embed — `CAL_LINK` in data.ts; if empty, show email fallback as
   today). Personal sign-off block: real photo of Maria + 2 lines — *"Hi, ich
   bin Maria — Art Directorin aus Hamburg. Ich sehe jede Anfrage persönlich."*
   (founder-face trust, Monolog-style; this is where the personal brand lives).

Mobile: sticky bottom CTA bar ("Gratis-Testshooting starten") appears after
scrolling past the hero.

## 3. Design system (light theme)

Replace the `.ai-page` token block in `src/styles/ai-page.css`:

```css
--ai-bg: #faf7f2;            /* warm paper, not clinical white */
--ai-fg: #1c1a17;            /* near-black ink */
--ai-accent: #e05c2a;        /* ONE warm accent (CTA, highlights, savings) */
--ai-border-soft: rgba(28,26,23,.10);
--ai-border-strong: rgba(28,26,23,.22);
--ai-fg-muted: rgba(28,26,23,.68);
--ai-fg-subtle: rgba(28,26,23,.45);
--ai-bg-lift: #ffffff;       /* cards */
--ai-shadow: 0 10px 30px rgba(28,26,23,.07);
```

Typography: **sentence case everywhere** — remove `text-transform: uppercase`
from headings (keep it only for tiny kickers/labels). Headings stay Archivo
Expanded but at calmer sizes (hero ~clamp(2.2rem, 4.5vw, 4rem)); body DM Sans
1rem/1.65. Buttons: solid accent bg for primary, generous height (≥3rem),
sentence case labels. Images do the shouting; UI stays quiet. Keep all
focus-visible styles and the reduced-motion block. Verify contrast: accent on
paper for large text/buttons only; body text always ink.

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

`___+ Bilder geliefert seit 2023 · ___ Kampagnen & Projekte · Lieferung in 48h`

Counting guidance for Maria: images = every final delivered image incl. agency
white-label work + published lab/IG sets since 2023 (regular 15-image gigs add
up fast — count delivery folders, round DOWN to a floor like 900+ only if the
count supports it). Campaigns = distinct briefs incl. agency briefs and
self-initiated brand projects (Hanse-Hase, MIRA, pink33 count). Zero-risk
stats that need no counting and may pad the bar: `seit 2023 · 6 konsistente
Model-Identitäten · 100% Nutzungsrechte inklusive`.

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

Hero roster strip picker · separate motion section · CASES/NDA section ·
separate guarantee section · comparison table section · 4th pricing card ·
credibility-strip NDA note ("sounds like an excuse" — Maria) · all-caps
headings · dark theme. The Novo Nordisk/Nestlé credibility line moves into the
personal sign-off block in Kontakt ("Kampagnenerfahrung u. a. für Novo Nordisk
und Nestlé Ukraine") — small, factual, near her face, not a wall of claims.

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
