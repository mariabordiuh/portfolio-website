// ============================================================
// /ai page content — THIS is the file Maria edits.
// Prices, slots, roster, FAQ, calculator assumptions all live here.
// Every user-visible string is a Copy ({ en, de }).
// ============================================================
import { c, type Copy } from './i18n';

// ------------------------------------------------------------
// Booking
// ------------------------------------------------------------
// Cal.com link, e.g. 'mariabordiuh/intro'. Leave '' until the account
// exists — the page then shows the email/form path only.
export const CAL_LINK = '';
export const CONTACT_EMAIL = 'projects@mariabordiuh.com';
// WhatsApp Business number in E.164, digits only, no + (e.g. '4915112345678').
// Leave '' until the WhatsApp Business account exists — the button hides.
export const WHATSAPP_NUMBER = '';

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
  setup?: number; // one-time setup fee (Signature)
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
      'Send one product photo. Get two finished, campaign-grade images back within 48 hours. Free, no call required.',
      'Senden Sie ein Produktfoto. Sie erhalten zwei fertige Kampagnenbilder innerhalb von 48 Stunden. Kostenlos, ohne Termin.',
    ),
    bullets: [
      c('1 product, 2 finished images', '1 Produkt, 2 fertige Bilder'),
      c('Real deliverable quality, not a mockup', 'Echte Lieferqualität, kein Mockup'),
      c('Yours to use — no strings attached', 'Frei verwendbar — ohne Bedingungen'),
    ],
    time: c('48 hours', '48 Stunden'),
    cta: c('Get a test shoot', 'Test-Shooting starten'),
  },
  {
    id: 'starter',
    name: c('Starter set', 'Starter-Set'),
    price: { regular: 490, founding: 340 },
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
    price: { regular: 1200, founding: 890 },
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
    price: { regular: 790, founding: 790 },
    priceSuffix: c('/month', '/Monat'),
    setup: 2400,
    blurb: c(
      'Your own exclusive model identity — trained for your brand, locked to your brand, delivering fresh image drops every month.',
      'Ihre eigene exklusive Model-Identität — für Ihre Marke trainiert, exklusiv für Ihre Marke, mit monatlichen Bild-Drops.',
    ),
    bullets: [
      c('Custom-trained model, exclusive to you', 'Individuell trainiertes Model, exklusiv für Sie'),
      c('Monthly image drops, ongoing art direction', 'Monatliche Bild-Drops, laufende Art Direction'),
      c('Same face across every campaign, forever', 'Dasselbe Gesicht in jeder Kampagne, dauerhaft'),
      c('Cancel monthly — identity setup is yours', 'Monatlich kündbar — das Identity-Setup gehört Ihnen'),
    ],
    time: c('~2 weeks setup', '~2 Wochen Setup'),
    cta: c('Ask about Signature', 'Signature anfragen'),
  },
];

export const ADDONS: Array<{ label: Copy; price: Copy }> = [
  { label: c('Roster-face exclusivity', 'Exklusivität eines Roster-Gesichts'), price: c('€250 / season', '250 € / Saison') },
  { label: c('Extra motion loop', 'Zusätzlicher Motion-Loop'), price: c('€90', '90 €') },
  { label: c('24h rush delivery', '24h-Express-Lieferung'), price: c('+30%', '+30 %') },
  { label: c('Digital twin of your real model or founder', 'Digitaler Zwilling Ihres echten Models oder Founders'), price: c('on inquiry', 'auf Anfrage') },
];

export const PRICING_FOOTNOTE = c(
  'Founding rates apply to the first 10 direct-booking brands and stay locked for those clients permanently. Every project comes with a proper German invoice and written usage rights.',
  'Founding-Preise gelten für die ersten 10 Direktkunden und bleiben für diese dauerhaft bestehen. Jedes Projekt kommt mit regulärer deutscher Rechnung und schriftlichen Nutzungsrechten.',
);

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
  'Ongoing need? Signature — your own exclusive model, from €790/month ›',
  'Laufender Bedarf? Signature — Ihr exklusives Model, ab €790/Monat ›',
);

// Personal sign-off in the dark contact panel (founder-face trust).
export const SIGNOFF = {
  intro: c('Hi, I’m Maria', 'Hi, ich bin Maria'),
  line: c(
    '— art director from Hamburg. I read every request personally.',
    '— Art Directorin aus Hamburg. Ich sehe jede Anfrage persönlich.',
  ),
  initials: 'MB',
};

// Caption under the bento models face-pile.
export const MODELS_CAPTION = c(
  '6 models that always look the same. In every campaign.',
  '6 Models, die immer gleich aussehen. In jeder Kampagne.',
);

// ------------------------------------------------------------
// Roster — 6 identities + custom. Images expected under /ai/roster/:
//   {id}-portrait.jpg  and  {id}-output.jpg   (see public/ai/README.md)
// TODO(Maria): "jonas" is a working name — rename when decided (id + files).
// ------------------------------------------------------------
export type RosterIdentity = {
  id: string;
  name: string;
  badge: Copy;
  short: Copy;
  heroLine: Copy;
  rosterTitle: Copy;
  available: boolean;
  stats: Array<{ term: Copy; value: Copy }>;
};

export const ROSTER: RosterIdentity[] = [
  {
    id: 'aiko',
    name: 'Aiko',
    badge: c('Editorial', 'Editorial'),
    short: c('Cool, precise, built for sharper fashion language.', 'Cool, präzise, gemacht für schärfere Fashion-Sprache.'),
    heroLine: c('Sharper editorial direction for fashion-led launches.', 'Schärfere Editorial-Direction für Fashion-Launches.'),
    rosterTitle: c('High-fashion precision', 'High-Fashion-Präzision'),
    available: true,
    stats: [
      { term: c('Use', 'Einsatz'), value: c('Editorial / campaign', 'Editorial / Kampagne') },
      { term: c('Energy', 'Energie'), value: c('Cool / exact / graphic', 'Cool / exakt / grafisch') },
      { term: c('Best for', 'Ideal für'), value: c('Fashion, accessories, concept sets', 'Fashion, Accessoires, Konzept-Sets') },
    ],
  },
  {
    id: 'fernando',
    name: 'Fernando',
    badge: c('Commercial', 'Commercial'),
    short: c('Realism-forward and versatile — broad brand trust.', 'Realistisch und vielseitig — breites Markenvertrauen.'),
    heroLine: c('Commercial realism for product stories that need trust.', 'Kommerzieller Realismus für Produktgeschichten mit Vertrauen.'),
    rosterTitle: c('Premium commercial realism', 'Premium-Commercial-Realismus'),
    available: true,
    stats: [
      { term: c('Use', 'Einsatz'), value: c('E-commerce / lifestyle / workwear', 'E-Commerce / Lifestyle / Workwear') },
      { term: c('Energy', 'Energie'), value: c('Grounded / polished / approachable', 'Geerdet / poliert / nahbar') },
      { term: c('Best for', 'Ideal für'), value: c('Conversion-led visuals, broad audiences', 'Conversion-Visuals, breite Zielgruppen') },
    ],
  },
  {
    id: 'anna',
    name: 'Anna',
    badge: c('Lifestyle', 'Lifestyle'),
    short: c('Warm, natural light energy — beauty and everyday brands.', 'Warm, natürliches Licht — Beauty- und Everyday-Marken.'),
    heroLine: c('Natural lifestyle warmth for beauty and daily-use products.', 'Natürliche Lifestyle-Wärme für Beauty- und Alltagsprodukte.'),
    rosterTitle: c('Warm lifestyle realism', 'Warmer Lifestyle-Realismus'),
    available: true,
    stats: [
      { term: c('Use', 'Einsatz'), value: c('Beauty / lifestyle / social', 'Beauty / Lifestyle / Social') },
      { term: c('Energy', 'Energie'), value: c('Warm / open / candid', 'Warm / offen / ungestellt') },
      { term: c('Best for', 'Ideal für'), value: c('Beauty, skincare, everyday products', 'Beauty, Skincare, Alltagsprodukte') },
    ],
  },
  {
    id: 'clara',
    name: 'Clara',
    badge: c('Premium', 'Premium'),
    short: c('Quiet luxury — precise detail work for premium objects.', 'Quiet Luxury — präzise Detailarbeit für Premium-Objekte.'),
    heroLine: c('Understated premium direction for jewelry and accessories.', 'Zurückhaltende Premium-Direction für Schmuck und Accessoires.'),
    rosterTitle: c('Quiet-luxury detail', 'Quiet-Luxury-Detail'),
    available: true,
    stats: [
      { term: c('Use', 'Einsatz'), value: c('Jewelry / accessories / premium', 'Schmuck / Accessoires / Premium') },
      { term: c('Energy', 'Energie'), value: c('Minimal / refined / still', 'Minimal / edel / ruhig') },
      { term: c('Best for', 'Ideal für'), value: c('Detail-led luxury product stories', 'Detailgeführte Luxus-Produktstories') },
    ],
  },
  {
    id: 'zuri',
    name: 'Zuri',
    badge: c('Campaign', 'Kampagne'),
    short: c('Bold presence — statement campaigns and strong color.', 'Starke Präsenz — Statement-Kampagnen und kräftige Farben.'),
    heroLine: c('Bold campaign energy for launches that need to be seen.', 'Mutige Kampagnen-Energie für Launches mit Sichtbarkeit.'),
    rosterTitle: c('Statement campaign energy', 'Statement-Kampagnen-Energie'),
    available: true,
    stats: [
      { term: c('Use', 'Einsatz'), value: c('Campaign / editorial / beauty', 'Kampagne / Editorial / Beauty') },
      { term: c('Energy', 'Energie'), value: c('Bold / graphic / direct', 'Mutig / grafisch / direkt') },
      { term: c('Best for', 'Ideal für'), value: c('Launch heroes, strong art direction', 'Launch-Heroes, starke Art Direction') },
    ],
  },
  {
    id: 'jonas',
    name: 'Jonas',
    badge: c('Utility', 'Utility'),
    short: c('Grounded and credible — workwear, tools, function-first brands.', 'Geerdet und glaubwürdig — Workwear, Tools, funktionale Marken.'),
    heroLine: c('Credible utility direction for workwear and industry.', 'Glaubwürdige Utility-Direction für Workwear und Industrie.'),
    rosterTitle: c('Function-first credibility', 'Funktionale Glaubwürdigkeit'),
    available: true,
    stats: [
      { term: c('Use', 'Einsatz'), value: c('Workwear / PSA / outdoor / tools', 'Workwear / PSA / Outdoor / Tools') },
      { term: c('Energy', 'Energie'), value: c('Solid / honest / practical', 'Solide / ehrlich / praktisch') },
      { term: c('Best for', 'Ideal für'), value: c('Safety & function-led brands', 'Sicherheits- & funktionsorientierte Marken') },
    ],
  },
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
// Credibility strip — ⚠️ wording is "experience across", not "clients".
// ------------------------------------------------------------
export const CREDIBILITY = {
  lede: c(
    'Led by an art director with campaign experience across',
    'Geleitet von einer Art Directorin mit Kampagnenerfahrung u. a. für',
  ),
  items: ['Novo Nordisk', 'Nestlé Ukraine', c('Safety workwear (PSA)', 'Arbeitsschutz (PSA)'), c('60+ fashion e-commerce', '60+ Fashion E-Commerce')] as Array<string | Copy>,
  note: c(
    'Most of our production runs white-label behind agency NDAs. Direct booking is new — the work is not.',
    'Der Großteil unserer Produktion läuft white-label hinter Agentur-NDAs. Neu ist die Direktbuchung — nicht die Arbeit.',
  ),
};

// ------------------------------------------------------------
// Before / after pairs — /ai/before-after/{id}-before.jpg, {id}-after.jpg
// ------------------------------------------------------------
export const BEFORE_AFTER: Array<{ id: string; label: Copy }> = [
  { id: '1', label: c('Product photo → campaign hero', 'Produktfoto → Kampagnen-Hero') },
  { id: '2', label: c('Flat-lay → on-model lifestyle', 'Flat-Lay → On-Model-Lifestyle') },
  { id: '3', label: c('Catalog shot → editorial world', 'Katalogbild → Editorial-Welt') },
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
  { id: '4', caption: c('Cordless drill, lifestyle', 'Akkuschrauber, Lifestyle') },
  { id: '5', caption: c('Knitwear, 60+ model', 'Strick, 60+ Model') },
  { id: '6', caption: c('Fine jewelry, macro', 'Feinschmuck, Makro') },
  { id: '7', caption: c('Sofa, interior scene', 'Sofa, Interior-Szene') },
  { id: '8', caption: c('Sneakers, editorial', 'Sneaker, Editorial') },
];

// ------------------------------------------------------------
// Motion loops — /ai/motion/loop-{1..3}.mp4 (+ loop-{n}-poster.jpg)
// ------------------------------------------------------------
export const MOTION_CLIPS: Array<{ id: string; caption: Copy }> = [
  { id: '1', caption: c('Product loop for social', 'Produkt-Loop für Social') },
  { id: '2', caption: c('On-model motion for site headers', 'On-Model-Motion für Website-Header') },
  { id: '3', caption: c('Campaign teaser loop', 'Kampagnen-Teaser-Loop') },
];

// ------------------------------------------------------------
// Cost calculator assumptions (typical DACH production ranges — keep defensible)
// ------------------------------------------------------------
export const CALC = {
  photographerDay: 950,
  studioDay: 450,
  stylingDay: 550,
  modelDay: 750,
  postPerImage: 45,
  motionProduction: 1200,
  looksPerDay: 3,
  disclaimer: c(
    'Traditional estimate based on typical DACH production ranges (photographer, studio, styling, model day rates, post-production). Actual quotes vary.',
    'Traditionelle Schätzung basierend auf üblichen DACH-Produktionskosten (Fotograf:in, Studio, Styling, Model-Tagessätze, Postproduktion). Tatsächliche Angebote variieren.',
  ),
};

// ------------------------------------------------------------
// Anonymized case tiles (NDA-safe — facts only, no names)
// TODO(Maria): confirm the numbers are accurate before launch.
// ------------------------------------------------------------
export const CASES: Array<{ sector: Copy; fact: Copy }> = [
  {
    sector: c('Safety workwear brand — DACH', 'Arbeitsschutz-Marke — DACH'),
    fact: c('Catalog imagery without a studio day: model-worn PSA shots delivered as a consistent set.', 'Katalogbilder ohne Studiotag: PSA am Model, geliefert als konsistentes Set.'),
  },
  {
    sector: c('60+ fashion e-commerce', '60+ Fashion E-Commerce'),
    fact: c('Age-accurate on-model imagery for a segment most studios cast poorly.', 'Altersgerechte On-Model-Bilder für ein Segment, das viele Studios schlecht besetzen.'),
  },
  {
    sector: c('Agency partnership', 'Agentur-Partnerschaft'),
    fact: c('Ongoing white-label AI production for client campaigns under NDA.', 'Laufende White-Label-KI-Produktion für Kundenkampagnen unter NDA.'),
  },
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
    q: c('Can a roster face be exclusive to our brand?', 'Kann ein Roster-Gesicht exklusiv für unsere Marke sein?'),
    a: c(
      'Yes — roster exclusivity is available per season, and the Signature tier gives you a fully custom identity that is yours alone.',
      'Ja — Roster-Exklusivität gibt es pro Saison, und das Signature-Paket liefert eine komplett eigene Identität, die nur Ihnen gehört.',
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
