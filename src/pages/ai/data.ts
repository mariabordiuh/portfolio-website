// ============================================================
// /ai page content — THIS is the file Maria edits.
// Prices, slots, roster, FAQ, calculator assumptions all live here.
// Every user-visible string is a Copy ({ en, de }).
// ============================================================
import { c, type Copy } from './i18n';

// ------------------------------------------------------------
// Booking
// ------------------------------------------------------------
// Calendly scheduling page, e.g. 'https://calendly.com/mariabordiuh/15-min-intro'.
// Preferred over CAL_LINK when both are set. Leave '' to fall back to Cal.com,
// then to the email link if neither is set.
export const CALENDLY_LINK = 'https://calendly.com/mariabordiuh/15-min-intro';
// Cal.com link, e.g. 'mariabordiuh/intro'. Leave '' until the account
// exists — the page then shows the email/form path only.
export const CAL_LINK = '';
export const CONTACT_EMAIL = 'projects@mariabordiuh.com';
// WhatsApp Business number in E.164, digits only, no + (e.g. '4915112345678').
// Leave '' until the WhatsApp Business account exists — the button hides.
export const WHATSAPP_NUMBER = '491622057749';

// ------------------------------------------------------------
// Scarcity — MUST stay truthful (EU consumer law + basic decency).
// Update by hand as spots fill. Set foundingLeft to 0 to hide the counter.
// ------------------------------------------------------------
export const SCARCITY = {
  foundingTotal: 10,
  foundingLeft: 10,
  monthSlotsLeft: 3,
  monthLabel: c('for this month', 'für diesen Monat'),
};

// ------------------------------------------------------------
// Pricing ladder (numbers are net; VAT wording in the pricing footnote)
// ------------------------------------------------------------
export type Tier = {
  id: string;
  name: Copy;
  price: { regular: number | null; founding: number | null }; // null = on inquiry
  priceSuffix?: Copy; // e.g. '/month'
  blurb: Copy;
  bullets: Copy[];
  time: Copy;
  cta: Copy;
  featured?: boolean;
};

export const TIERS: Tier[] = [
  {
    id: 'test',
    name: c('Test shoot', 'Test-Shooting'),
    price: { regular: 0, founding: 0 },
    blurb: c(
      'Send one product photo. Get one finished, campaign-grade image back within 48 hours. Free, no call required.',
      'Senden Sie ein Produktfoto. Sie erhalten ein fertiges Kampagnenbild innerhalb von 48 Stunden. Kostenlos, ohne Termin.',
    ),
    bullets: [
      c('1 product, 1 finished image', '1 Produkt, 1 fertiges Bild'),
      c('Real deliverable quality, not a mockup', 'Echte Lieferqualität, kein Mockup'),
      c('Yours to use — no strings attached', 'Frei verwendbar — ohne Bedingungen'),
    ],
    time: c('48 hours', '48 Stunden'),
    cta: c('Get a test shoot', 'Test-Shooting starten'),
  },
  {
    id: 'starter',
    name: c('Starter set', 'Starter-Set'),
    price: { regular: 489, founding: 349 },
    blurb: c(
      'A focused set for one product or look — e-commerce ready, with one roster model.',
      'Ein fokussiertes Set für ein Produkt oder einen Look — E-Commerce-fertig, mit einem Model aus dem Roster.',
    ),
    bullets: [
      c('15 finished images', '15 fertige Bilder'),
      c('1 roster model, 1 product or look', '1 Roster-Model, 1 Produkt oder Look'),
      c('Art-directed set, consistent light and frame logic', 'Art-direktiertes Set, konsistentes Licht und Bildlogik'),
      c('Full commercial usage rights', 'Volle kommerzielle Nutzungsrechte'),
    ],
    time: c('48–72 hours', '48–72 Stunden'),
    cta: c('Book a starter set', 'Starter-Set buchen'),
    featured: true,
  },
  {
    id: 'campaign',
    name: c('Campaign set', 'Kampagnen-Set'),
    price: { regular: 1199, founding: 889 },
    blurb: c(
      'A full campaign world: multiple looks, stills plus motion, and a direction document your team can reuse.',
      'Eine komplette Kampagnenwelt: mehrere Looks, Stills plus Motion und ein Direction-Dokument für Ihr Team.',
    ),
    bullets: [
      c('30–40 finished images across looks', '30–40 fertige Bilder über mehrere Looks'),
      c('2 motion loops for social & site', '2 Motion-Loops für Social & Website'),
      c('Art-direction document (reusable)', 'Art-Direction-Dokument (wiederverwendbar)'),
      c('Direction preview before final delivery', 'Direction-Preview vor finaler Lieferung'),
    ],
    time: c('3–5 days', '3–5 Tage'),
    cta: c('Book a campaign set', 'Kampagnen-Set buchen'),
  },
  {
    id: 'signature',
    name: c('Signature identity', 'Signature-Identity'),
    // €79 is the price for CREATING the custom AI avatar itself (the trained
    // identity). Shoots with it are booked as normal sets on top.
    price: { regular: 79, founding: 79 },
    blurb: c(
      'Your own custom AI model — created exclusively for your brand, yours permanently. Shoots with it are booked as normal sets.',
      'Ihr eigenes KI-Model — exklusiv für Ihre Marke erstellt, gehört Ihnen dauerhaft. Shootings damit buchen Sie als normale Sets.',
    ),
    bullets: [
      c('Custom-created model, exclusive to you', 'Individuell erstelltes Model, exklusiv für Sie'),
      c('Same face across every campaign, forever', 'Dasselbe Gesicht in jeder Kampagne, dauerhaft'),
      c('The model is yours — for good, not per season', 'Das Model gehört Ihnen — für immer, nicht pro Saison'),
    ],
    time: c('~2 weeks setup', '~2 Wochen Setup'),
    cta: c('Ask about Signature', 'Signature anfragen'),
  },
];

// ------------------------------------------------------------
// Price anchor — what the alternative actually costs. Shown above the tiers
// so "ab 349 €" has a reference point. Ranges must stay defensible: a typical
// German product shoot with model, studio, photographer and retouching.
// ------------------------------------------------------------
export const ANCHOR = {
  heading: c('For comparison', 'Zum Vergleich'),
  traditional: {
    label: c('Traditional product shoot', 'Klassisches Produktshooting'),
    rows: [
      c('€1,500–3,700 per shoot', '1.500–3.700 € pro Shooting'),
      c('4–6 weeks from booking to final files', '4–6 Wochen von Buchung bis zu finalen Daten'),
      c('Re-shoot means a new budget and a new date', 'Re-Shoot heißt: neues Budget, neuer Termin'),
    ],
  },
  ai: {
    label: c('Maria Bordiuh AI', 'Maria Bordiuh AI'),
    rows: [
      c('From €349 per set', 'Ab 349 € pro Set'),
      c('48–72 hours to finished images', '48–72 Stunden bis zu fertigen Bildern'),
      c('Redirects included — fits, or we redo it', 'Nachjustieren inklusive — passt, oder nochmal'),
    ],
  },
};

// ------------------------------------------------------------
// Anonymized case tiles (NDA-safe proof). The section stays hidden while this
// array is empty. TODO(Maria): confirm each fact, then move the drafts below
// into the array — do not publish unconfirmed numbers.
//
// Drafts to confirm:
//   { sector: c('Safety-workwear brand, DACH', 'Arbeitsschutz-Marke, DACH'),
//     fact: c('Recurring production', 'Laufende Produktion'),
//     detail: c('40 images per quarter — on-model and product.', '40 Bilder pro Quartal — am Model und als Produkt-Shot.') },
//   { sector: c('Fashion brand 60+, e-commerce', 'Fashion-Marke 60+, E-Commerce'),
//     fact: c('Full season campaign', 'Komplette Saison-Kampagne'),
//     detail: c('One consistent 60+ identity across the whole drop.', 'Eine konsistente 60+-Identität über den gesamten Drop.') },
//   { sector: c('Marketing agency, white-label', 'Marketingagentur, White-Label'),
//     fact: c('Ongoing NDA production', 'Laufende NDA-Produktion'),
//     detail: c('Campaign sets delivered under the agency’s name.', 'Kampagnen-Sets, geliefert unter dem Namen der Agentur.') },
// ------------------------------------------------------------
export const CASE_TILES: Array<{ sector: Copy; fact: Copy; detail: Copy }> = [];

// ------------------------------------------------------------
// Bento stats — the two big numbers. ¹² footnote markers resolve in FOOTNOTES.
// TODO(Maria): confirm 900+ with a 10-min folder count before launch.
// ------------------------------------------------------------
export const STATS = {
  speed: { value: '48h', label: c('From your photo to a finished campaign.', 'Von Ihrem Foto zur fertigen Kampagne.'), note: 1 },
  volume: {
    value: '900+',
    label: c('Images delivered, incl. campaigns for Novo Nordisk and Nestlé Ukraine.', 'Gelieferte Bilder, u. a. für Novo Nordisk und Nestlé Ukraine.'),
    note: 2,
  },
};

// Apple-style fine print. Markers ¹²³ attach to bento tiles + price labels.
export const FOOTNOTES: Copy[] = [
  c(
    '¹ 48-hour delivery applies to test shoots and starter sets after direction approval. Campaign sets: 3–5 business days.',
    '¹ 48-Stunden-Lieferung gilt für Test-Shootings und Starter-Sets nach Freigabe der Richtung. Kampagnen-Sets: 3–5 Werktage.',
  ),
  c(
    '² Count across all productions since 2023, including white-label work for agencies; some campaign experience under agency contract.',
    '² Zählung über alle Produktionen seit 2023, inkl. White-Label-Arbeit für Agenturen; Kampagnenerfahrung teilweise im Agenturauftrag.',
  ),
  c(
    '³ Founding rates apply to the first 10 direct-booking brands and stay locked for them permanently. Every project with a proper German invoice and written usage rights.',
    '³ Founding-Preise gelten für die ersten 10 Direktkunden und bleiben für diese dauerhaft bestehen. Jedes Projekt mit regulärer deutscher Rechnung und schriftlichen Nutzungsrechten.',
  ),
];

// The one-line pointer to the Signature tier that sits under the price cards.
export const SIGNATURE_LINK = c(
  'Want your own model that belongs to you forever? Signature — from €79 ›',
  'Ihr eigenes Model, das Ihnen für immer gehört? Signature — ab 79 € ›',
);

// Personal sign-off in the dark contact panel. Text only — no photo/avatar
// of Maria anywhere on the page (her call).
export const SIGNOFF = {
  intro: c('Hi, I’m Maria', 'Hi, ich bin Maria'),
  line: c(
    '— art director from Hamburg. I read every request personally.',
    '— Art Directorin aus Hamburg. Ich sehe jede Anfrage persönlich.',
  ),
};

// Caption under the bento models face-pile. No fixed count — Maria can create
// unlimited identities, including models the client owns.
export const MODELS_CAPTION = c(
  'Consistent models — the same face in every campaign. As many as you need, including your own.',
  'Konsistente Models — dasselbe Gesicht in jeder Kampagne. So viele Sie brauchen, auch Ihr eigenes.',
);

// ------------------------------------------------------------
// Roster — 7 identities + custom. Images expected under /ai/roster/:
//   {id}-portrait.jpg, {id}-output-1.jpg, {id}-output-2.jpg (see public/ai/README.md)
// Deliberately name-only, no "best used for" copy per identity — assigning
// use-cases per face (by look, gender, age, skin tone...) reads as typecasting.
// TODO(Maria): "jonas" is a working name — rename when decided (id + files).
// ------------------------------------------------------------
export type RosterIdentity = {
  id: string;
  name: string;
};

export const ROSTER: RosterIdentity[] = [
  { id: 'aiko', name: 'Aiko' },
  { id: 'fernando', name: 'Fernando' },
  { id: 'anna', name: 'Anna' },
  { id: 'clara', name: 'Clara' },
  { id: 'zuri', name: 'Zuri' },
  { id: 'jonas', name: 'Jonas' },
  { id: 'hans', name: 'Hans' },
];

export const CUSTOM_IDENTITY = {
  name: c('Custom', 'Custom'),
  badge: c('Bespoke', 'Maßgeschneidert'),
  short: c(
    'A model identity built around your product, audience, and visual direction — any age, any look, exclusively yours.',
    'Eine Model-Identität rund um Ihr Produkt, Ihre Zielgruppe und Ihre visuelle Richtung — jedes Alter, jeder Look, exklusiv für Sie.',
  ),
};

// ------------------------------------------------------------
// Before / after pairs — /ai/before-after/{id}-before.jpg, {id}-after.jpg
// (4:5, SAME crop/framing for both so the drag-reveal actually lines up).
// Add/remove entries freely; the grid adapts. #1 has real photos; the rest
// show placeholders until matching files exist.
// ------------------------------------------------------------
export const BEFORE_AFTER: Array<{ id: string; label: Copy }> = [
  { id: '1', label: c('Shop photo → studio shot', 'Ladenfoto → Studioaufnahme') },
  { id: '2', label: c('Product photo → campaign hero', 'Produktfoto → Kampagnen-Hero') },
  { id: '3', label: c('Flat-lay → on-model lifestyle', 'Flat-Lay → On-Model-Lifestyle') },
];

// ------------------------------------------------------------
// Showcase gallery — /ai/sets/item-{n}.jpg — deliberately mixed:
// the message is "anything can look premium", not a niche list.
// Add/remove items freely; the grid adapts.
// ------------------------------------------------------------
export const SHOWCASE_ITEMS: Array<{ id: string; caption: Copy }> = [
  { id: '1', caption: c('Safety vest, on model', 'Warnschutzjacke, am Model') },
  { id: '2', caption: c('Hair oil, campaign hero', 'Haaröl, Kampagnen-Hero') },
  { id: '3', caption: c('Cheesecake, food editorial', 'Käsekuchen, Food-Editorial') },
  { id: '4', caption: c('Cordless drill, in hand', 'Akkuschrauber, in der Hand') },
  { id: '5', caption: c('Knitwear, 60+ model', 'Strick, 60+ Model') },
  { id: '6', caption: c('Fine jewelry, macro', 'Feinschmuck, Makro') },
  { id: '7', caption: c('Sofa, interior scene', 'Sofa, Interior-Szene') },
  { id: '8', caption: c('Sneakers, catalogue', 'Sneaker, Katalog') },
];

// ------------------------------------------------------------
// FAQ (also the SEO surface for the legal/trust questions)
// ------------------------------------------------------------
export const FAQ: Array<{ q: Copy; a: Copy }> = [
  {
    q: c('Why no client names?', 'Warum keine Kundennamen?'),
    a: c(
      'NDAs. So we do it differently: send us a product photo and judge the result yourself — free.',
      'NDAs. Deshalb machen wir es anders: Schicken Sie uns ein Produktfoto und beurteilen Sie das Ergebnis selbst — kostenlos.',
    ),
  },
  {
    q: c('Who owns the images? Can we use them commercially?', 'Wem gehören die Bilder? Dürfen wir sie kommerziell nutzen?'),
    a: c(
      'You receive full commercial usage rights for all delivered images — web shop, ads, social, print. That is part of every tier, in writing.',
      'Sie erhalten volle kommerzielle Nutzungsrechte für alle gelieferten Bilder — Shop, Ads, Social, Print. Das ist Teil jedes Pakets, schriftlich.',
    ),
  },
  {
    q: c('Are the model faces real people?', 'Sind die Model-Gesichter echte Personen?'),
    a: c(
      'No. Roster identities are proprietary, consistently trained AI identities — they are not based on real individuals. Digital twins of real people (e.g. your founder) are only created with written consent and a signed likeness agreement.',
      'Nein. Roster-Identitäten sind eigene, konsistent trainierte KI-Identitäten — sie basieren nicht auf realen Personen. Digitale Zwillinge echter Personen (z. B. Ihres Founders) entstehen nur mit schriftlicher Einwilligung und Likeness-Vereinbarung.',
    ),
  },
  {
    q: c('Is this GDPR-safe?', 'Ist das DSGVO-konform?'),
    a: c(
      'Yes. No personal data of real models is processed for roster shoots — there is no model release problem because there is no real model. Product files you send are used only for your production.',
      'Ja. Für Roster-Shootings werden keine personenbezogenen Daten echter Models verarbeitet — es gibt kein Model-Release-Problem, weil es kein echtes Model gibt. Ihre Produktdaten werden nur für Ihre Produktion verwendet.',
    ),
  },
  {
    q: c('Will it actually look real?', 'Sieht das wirklich echt aus?'),
    a: c(
      'That is exactly what the free test shoot is for: send one product photo and judge the finished quality yourself before spending anything.',
      'Genau dafür gibt es das kostenlose Test-Shooting: Senden Sie ein Produktfoto und beurteilen Sie die fertige Qualität selbst, bevor Sie etwas ausgeben.',
    ),
  },
  {
    q: c('What if we don’t like the direction?', 'Was, wenn uns die Richtung nicht gefällt?'),
    a: c(
      'You approve a direction preview before full delivery. If it misses, we redirect and re-shoot until it fits — that is the guarantee.',
      'Sie geben ein Direction-Preview frei, bevor final geliefert wird. Passt es nicht, justieren wir und shooten neu, bis es passt — das ist die Garantie.',
    ),
  },
  {
    q: c('How fast is delivery, honestly?', 'Wie schnell ist die Lieferung wirklich?'),
    a: c(
      'Test shoots and starter sets: 48–72 hours. Campaign sets: 3–5 days. We only take on what the calendar can hold — that is why slots are limited.',
      'Test-Shootings und Starter-Sets: 48–72 Stunden. Kampagnen-Sets: 3–5 Tage. Wir nehmen nur an, was der Kalender hergibt — deshalb sind die Slots limitiert.',
    ),
  },
  {
    q: c('Can we have our own model?', 'Können wir ein eigenes Model haben?'),
    a: c(
      'Yes, two ways: lock a roster face exclusively per season — or we build a custom model just for you that you own permanently and can use forever (Signature). A digital twin of your real founder or model is possible too, with written consent.',
      'Ja, auf zwei Wegen: Ein Roster-Gesicht exklusiv pro Saison sichern — oder wir bauen ein eigenes Model nur für Sie, das Ihnen dauerhaft gehört und das Sie für immer nutzen können (Signature). Auch ein digitaler Zwilling Ihres echten Founders oder Models ist möglich, mit schriftlicher Einwilligung.',
    ),
  },
  {
    q: c('We already have product photos. Do you need a shoot from us?', 'Wir haben bereits Produktfotos. Brauchen Sie ein Shooting von uns?'),
    a: c(
      'No shoot needed. Clean photos of the product (even phone shots on white) are enough — we build the campaign world around them.',
      'Kein Shooting nötig. Saubere Produktfotos (auch Handyfotos auf Weiß) reichen — wir bauen die Kampagnenwelt darum herum.',
    ),
  },
];
