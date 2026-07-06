import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { JsonLd } from '../../components/JsonLd';
import { PrefetchLink } from '../../components/PrefetchLink';
import { Seo, SITE_URL } from '../../components/Seo';
import '../../styles/ai-page.css';
import {
  ADDONS,
  BEFORE_AFTER,
  CASES,
  CREDIBILITY,
  FAQ,
  MOTION_CLIPS,
  PRICING_FOOTNOTE,
  ROSTER,
  SCARCITY,
  SHOWCASE_ITEMS,
  TIERS,
} from './data';
import { c, useLang } from './i18n';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { BookingSection } from './components/BookingSection';
import { CostCalculator } from './components/CostCalculator';
import { CustomRosterCard, RosterCard } from './components/RosterCard';
import { MotionShowcase } from './components/MotionShowcase';
import { SmartImage } from './components/SmartImage';

const AI_TITLE = c(
  'AI Photoshoots with Consistent Models — Stills & Motion | Maria Bordiuh AI',
  'KI-Fotoshootings mit konsistenten Models — Stills & Motion | Maria Bordiuh AI',
);

const AI_DESCRIPTION = c(
  'Campaign-grade AI photoshoots with consistent model identities — art-directed by a human, delivered in days. Stills and motion for e-commerce, product and fashion brands.',
  'Kampagnenreife KI-Fotoshootings mit konsistenten Model-Identitäten — art-direktiert von einem Menschen, geliefert in Tagen. Stills und Motion für E-Commerce-, Produkt- und Fashion-Marken.',
);

const AI_OG_IMAGE = '/og/ai.jpg';

const revealTransition = {
  duration: 0.68,
  ease: [0.22, 1, 0.36, 1] as const,
};

// ---- page copy (structural strings; content data lives in ./data) ----
const T = {
  announcement: c('Direct booking now open — {left} of {total} founding-brand rates left · Free test shoot in 48h', 'Direktbuchung jetzt offen — {left} von {total} Founding-Preisen frei · Kostenloses Test-Shooting in 48h'),
  navHow: c('How it works', 'So funktioniert’s'),
  navRoster: c('Roster', 'Roster'),
  navWork: c('Work', 'Arbeiten'),
  navPricing: c('Pricing', 'Preise'),
  navBook: c('Book', 'Termin'),
  kicker: c('AI photoshoots · stills + motion', 'KI-Fotoshootings · Stills + Motion'),
  heroTitle: c('Campaign-grade AI photoshoots, art-directed by a human.', 'Kampagnenreife KI-Fotoshootings, art-direktiert von einem Menschen.'),
  heroBody: c(
    'Consistent model identities, any product, stills and motion — delivered in days for a fraction of a physical production.',
    'Konsistente Model-Identitäten, jedes Produkt, Stills und Motion — geliefert in Tagen, für einen Bruchteil einer echten Produktion.',
  ),
  heroCtaPrimary: c('Get a free test shoot', 'Kostenloses Test-Shooting'),
  heroCtaSecondary: c('Book a 15-min call', '15-Minuten-Call buchen'),
  heroSlots: c('{n} production slots left {month}', '{n} Produktions-Slots frei {month}'),
  baKicker: c('Before / after', 'Vorher / Nachher'),
  baTitle: c('You send a product photo. We send back a campaign.', 'Sie senden ein Produktfoto. Wir liefern eine Kampagne.'),
  baBefore: c('Your photo', 'Ihr Foto'),
  baAfter: c('Our delivery', 'Unsere Lieferung'),
  rosterKicker: c('The roster', 'Das Roster'),
  rosterTitle: c('Six consistent identities. Or one built only for you.', 'Sechs konsistente Identitäten. Oder eine nur für Sie.'),
  rosterBody: c(
    'Every identity stays consistent across shoots — same face, same presence, every campaign. Exclusivity per season available.',
    'Jede Identität bleibt über Shootings hinweg konsistent — gleiches Gesicht, gleiche Präsenz, jede Kampagne. Exklusivität pro Saison möglich.',
  ),
  workKicker: c('Selected sets', 'Ausgewählte Sets'),
  workTitle: c('Anything can look premium. Yes, even your product.', 'Alles kann premium aussehen. Ja, auch Ihr Produkt.'),
  workNote: c('Fashion is easy. The interesting part is everything else.', 'Fashion ist einfach. Interessant wird es bei allem anderen.'),
  motionKicker: c('Motion', 'Motion'),
  motionTitle: c('Stills are where it starts.', 'Stills sind erst der Anfang.'),
  motionBody: c(
    'Motion loops for product pages, social and ads — from the same shoot, the same identity, the same direction.',
    'Motion-Loops für Produktseiten, Social und Ads — aus demselben Shooting, derselben Identität, derselben Direction.',
  ),
  howKicker: c('How it works', 'So funktioniert’s'),
  howTitle: c('From product photo to campaign in three steps', 'Vom Produktfoto zur Kampagne in drei Schritten'),
  calcKicker: c('The math', 'Die Rechnung'),
  calcTitle: c('What a traditional production costs — and what this does', 'Was eine traditionelle Produktion kostet — und was das hier kostet'),
  pricingKicker: c('Pricing', 'Preise'),
  pricingTitle: c('Start free. Scale when it works.', 'Kostenlos starten. Skalieren, wenn es funktioniert.'),
  founding: c('Founding rate', 'Founding-Preis'),
  setup: c('setup', 'Setup'),
  free: c('Free', 'Kostenlos'),
  addonsTitle: c('Add-ons', 'Add-ons'),
  guaranteeKicker: c('The guarantee', 'Die Garantie'),
  guaranteeTitle: c('You approve the direction before final delivery.', 'Sie geben die Richtung frei, bevor final geliefert wird.'),
  guaranteeBody: c(
    'Every paid set starts with a direction preview. If it misses, we redirect and re-shoot until it fits your brand — that is the deal.',
    'Jedes bezahlte Set beginnt mit einem Direction-Preview. Passt es nicht, justieren wir und shooten neu, bis es zu Ihrer Marke passt — das ist der Deal.',
  ),
  casesKicker: c('Under NDA, but real', 'Unter NDA, aber real'),
  casesTitle: c('Produced for clients we can’t name', 'Produziert für Kunden, die wir nicht nennen dürfen'),
  faqKicker: c('FAQ', 'FAQ'),
  faqTitle: c('The questions German buyers actually ask', 'Die Fragen, die wirklich gestellt werden'),
  steps: [
    {
      title: c('Send a product photo', 'Produktfoto senden'),
      body: c('Clean shots are enough — even phone photos on white. No shoot, no shipping, no studio day.', 'Saubere Fotos reichen — auch Handyfotos auf Weiß. Kein Shooting, kein Versand, kein Studiotag.'),
    },
    {
      title: c('Approve the direction', 'Richtung freigeben'),
      body: c('Pick a roster identity and a mood. You see a direction preview before the full set is produced.', 'Wählen Sie eine Roster-Identität und einen Mood. Sie sehen ein Direction-Preview, bevor das volle Set produziert wird.'),
    },
    {
      title: c('Receive the campaign', 'Kampagne erhalten'),
      body: c('A coherent, campaign-ready set — stills and motion — delivered in days, with full commercial rights.', 'Ein kohärentes, kampagnenfertiges Set — Stills und Motion — geliefert in Tagen, mit vollen kommerziellen Rechten.'),
    },
  ],
};

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

export const AiLanding = () => {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { lang, setLang, tx } = useLang();
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [selectedIdentity, setSelectedIdentity] = useState(ROSTER[0].id);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const reveal = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.18 },
        transition: revealTransition,
      };

  const selected = ROSTER.find((identity) => identity.id === selectedIdentity) ?? ROSTER[0];

  const aiStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Maria Bordiuh AI',
    url: `${SITE_URL}/ai`,
    description: tx(AI_DESCRIPTION),
    provider: { '@type': 'Person', name: 'Maria Bordiuh', url: SITE_URL },
    areaServed: ['Germany', 'Europe', 'Remote'],
    serviceType: [
      'AI photoshoots',
      'AI visual production',
      'Campaign imagery',
      'Product visuals',
      'Custom model identities',
      'AI motion design',
    ],
  };

  return (
    <>
      <Seo
        title={tx(AI_TITLE)}
        description={tx(AI_DESCRIPTION)}
        canonicalPath="/ai"
        image={AI_OG_IMAGE}
        imageWidth={1200}
        imageHeight={630}
        imageAlt="Maria Bordiuh AI photoshoots preview"
      />
      <JsonLd id="ai-structured-data" data={aiStructuredData} />
      <div className="ai-page">
        {announcementVisible && SCARCITY.foundingLeft > 0 ? (
          <div className="ai-announcement">
            <div className="ai-announcement__inner">
              <p className="ai-announcement__copy">
                {fill(tx(T.announcement), { left: SCARCITY.foundingLeft, total: SCARCITY.foundingTotal })}
              </p>
              <div className="ai-announcement__actions">
                <a className="ai-announcement__link" href="#ai-test-shoot">
                  {tx(T.heroCtaPrimary)}
                </a>
                <button
                  type="button"
                  className="ai-announcement__dismiss"
                  aria-label="Dismiss announcement"
                  onClick={() => setAnnouncementVisible(false)}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <header className="ai-nav">
          <div className="ai-nav__inner">
            <PrefetchLink className="ai-nav__brand" to="/" aria-label="Back to Maria Bordiuh home">
              Maria Bordiuh
            </PrefetchLink>
            <nav className="ai-nav__links" aria-label="AI page sections">
              <a href="#ai-how">{tx(T.navHow)}</a>
              <a href="#ai-roster">{tx(T.navRoster)}</a>
              <a href="#ai-work">{tx(T.navWork)}</a>
              <a href="#ai-pricing">{tx(T.navPricing)}</a>
              <a href="#ai-book">{tx(T.navBook)}</a>
            </nav>
            <div className="ai-nav__lang" role="group" aria-label="Language">
              <button type="button" className={lang === 'en' ? 'is-active' : ''} onClick={() => setLang('en')}>
                EN
              </button>
              <span aria-hidden="true">/</span>
              <button type="button" className={lang === 'de' ? 'is-active' : ''} onClick={() => setLang('de')}>
                DE
              </button>
            </div>
          </div>
        </header>

        <main className="ai-page__main">
          {/* HERO */}
          <section className="ai-hero" aria-labelledby="ai-hero-title">
            <motion.div
              className="ai-hero__intro"
              {...(prefersReducedMotion
                ? {}
                : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.76, ease: [0.22, 1, 0.36, 1] as const } })}
            >
              <p className="ai-kicker">{tx(T.kicker)}</p>
              <h1 id="ai-hero-title" className="ai-hero__title">
                {tx(T.heroTitle)}
              </h1>
              <p className="ai-hero__body">{tx(T.heroBody)}</p>
              <div className="ai-hero__actions">
                <a className="ai-button ai-button--solid" href="#ai-test-shoot">
                  {tx(T.heroCtaPrimary)}
                </a>
                <a className="ai-button ai-button--ghost" href="#ai-call">
                  {tx(T.heroCtaSecondary)}
                </a>
              </div>
              <p className="ai-hero__slots">
                {fill(tx(T.heroSlots), { n: SCARCITY.monthSlotsLeft, month: tx(SCARCITY.monthLabel) })}
              </p>
            </motion.div>

            <div className="ai-hero__strip" aria-label="Recent AI photoshoot examples">
              {ROSTER.map((identity) => (
                <button
                  key={identity.id}
                  type="button"
                  className={`ai-hero__strip-item ${selectedIdentity === identity.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedIdentity(identity.id)}
                  aria-label={`${identity.name} — ${tx(identity.rosterTitle)}`}
                >
                  <SmartImage
                    src={`/ai/roster/${identity.id}-output.jpg`}
                    alt={`${identity.name} — ${tx(identity.rosterTitle)}`}
                    className="ai-hero__strip-img"
                    placeholderClassName="ai-placeholder--strip"
                    label={identity.name}
                  />
                </button>
              ))}
            </div>
            <p className="ai-hero__strip-caption">
              {selected.name} — {tx(selected.heroLine)}
            </p>
          </section>

          {/* CREDIBILITY */}
          <motion.section className="ai-cred" aria-label="Experience" {...reveal}>
            <p className="ai-cred__lede">{tx(CREDIBILITY.lede)}</p>
            <ul className="ai-cred__items">
              {CREDIBILITY.items.map((item, index) => (
                <li key={index}>{typeof item === 'string' ? item : tx(item)}</li>
              ))}
            </ul>
            <p className="ai-cred__note">{tx(CREDIBILITY.note)}</p>
          </motion.section>

          {/* BEFORE / AFTER */}
          <motion.section className="ai-ba-section" aria-labelledby="ai-ba-title" {...reveal}>
            <div className="ai-section-heading">
              <p className="ai-kicker">{tx(T.baKicker)}</p>
              <h2 id="ai-ba-title" className="ai-section-title">
                {tx(T.baTitle)}
              </h2>
            </div>
            <div className="ai-ba-section__grid">
              {BEFORE_AFTER.map((pair) => (
                <BeforeAfterSlider
                  key={pair.id}
                  beforeSrc={`/ai/before-after/${pair.id}-before.jpg`}
                  afterSrc={`/ai/before-after/${pair.id}-after.jpg`}
                  label={tx(pair.label)}
                  beforeTag={tx(T.baBefore)}
                  afterTag={tx(T.baAfter)}
                />
              ))}
            </div>
          </motion.section>

          {/* ROSTER */}
          <motion.section className="ai-roster" id="ai-roster" aria-labelledby="ai-roster-title" {...reveal}>
            <div className="ai-section-heading">
              <p className="ai-kicker">{tx(T.rosterKicker)}</p>
              <h2 id="ai-roster-title" className="ai-section-title">
                {tx(T.rosterTitle)}
              </h2>
              <p className="ai-section-body">{tx(T.rosterBody)}</p>
            </div>
            <div className="ai-roster__grid">
              {ROSTER.map((identity) => (
                <RosterCard
                  key={identity.id}
                  identity={identity}
                  active={selectedIdentity === identity.id}
                  onSelect={() => setSelectedIdentity(identity.id)}
                  tx={tx}
                />
              ))}
              <CustomRosterCard tx={tx} />
            </div>
          </motion.section>

          {/* SHOWCASE TABS */}
          <motion.section className="ai-work" id="ai-work" aria-labelledby="ai-work-title" {...reveal}>
            <div className="ai-section-heading">
              <p className="ai-kicker">{tx(T.workKicker)}</p>
              <h2 id="ai-work-title" className="ai-section-title">
                {tx(T.workTitle)}
              </h2>
            </div>
            <p className="ai-work__note">{tx(T.workNote)}</p>
            <div className="ai-work__grid ai-work__grid--gallery">
              {SHOWCASE_ITEMS.map((item) => (
                <figure key={item.id} className="ai-work__item">
                  <SmartImage
                    src={`/ai/sets/item-${item.id}.jpg`}
                    alt={tx(item.caption)}
                    className="ai-work__img"
                    placeholderClassName="ai-placeholder--work"
                    label={tx(item.caption)}
                  />
                  <figcaption className="ai-work__item-caption">{tx(item.caption)}</figcaption>
                </figure>
              ))}
            </div>
          </motion.section>

          {/* MOTION */}
          {MOTION_CLIPS.length > 0 ? (
            <motion.section className="ai-motion" aria-labelledby="ai-motion-title" {...reveal}>
              <div className="ai-section-heading">
                <p className="ai-kicker">{tx(T.motionKicker)}</p>
                <h2 id="ai-motion-title" className="ai-section-title">
                  {tx(T.motionTitle)}
                </h2>
                <p className="ai-section-body">{tx(T.motionBody)}</p>
              </div>
              <MotionShowcase tx={tx} reducedMotion={prefersReducedMotion} />
            </motion.section>
          ) : null}

          {/* HOW IT WORKS */}
          <motion.section className="ai-how" id="ai-how" aria-labelledby="ai-how-title" {...reveal}>
            <div className="ai-section-heading">
              <p className="ai-kicker">{tx(T.howKicker)}</p>
              <h2 id="ai-how-title" className="ai-section-title">
                {tx(T.howTitle)}
              </h2>
            </div>
            <div className="ai-steps">
              {T.steps.map((step, index) => (
                <article key={index} className="ai-step">
                  <p className="ai-step__index">0{index + 1}</p>
                  <h3 className="ai-step__title">{tx(step.title)}</h3>
                  <p className="ai-step__body">{tx(step.body)}</p>
                </article>
              ))}
            </div>
          </motion.section>

          {/* CALCULATOR */}
          <motion.section className="ai-calc-section" aria-labelledby="ai-calc-title" {...reveal}>
            <div className="ai-section-heading">
              <p className="ai-kicker">{tx(T.calcKicker)}</p>
              <h2 id="ai-calc-title" className="ai-section-title">
                {tx(T.calcTitle)}
              </h2>
            </div>
            <CostCalculator tx={tx} />
          </motion.section>

          {/* PRICING */}
          <motion.section className="ai-pricing" id="ai-pricing" aria-labelledby="ai-pricing-title" {...reveal}>
            <div className="ai-section-heading">
              <p className="ai-kicker">{tx(T.pricingKicker)}</p>
              <h2 id="ai-pricing-title" className="ai-section-title">
                {tx(T.pricingTitle)}
              </h2>
            </div>
            <div className="ai-tiers">
              {TIERS.map((tier) => {
                const showFounding =
                  SCARCITY.foundingLeft > 0 &&
                  tier.price.founding != null &&
                  tier.price.regular != null &&
                  tier.price.founding < tier.price.regular;
                const displayPrice = showFounding ? tier.price.founding : tier.price.regular;
                return (
                  <article key={tier.id} className={`ai-tier ${tier.featured ? 'is-featured' : ''}`}>
                    <h3 className="ai-tier__name">{tx(tier.name)}</h3>
                    <div className="ai-tier__price">
                      {displayPrice === 0 ? (
                        <strong>{tx(T.free)}</strong>
                      ) : displayPrice != null ? (
                        <>
                          <strong>
                            €{displayPrice}
                            {tier.priceSuffix ? tx(tier.priceSuffix) : ''}
                          </strong>
                          {showFounding && tier.price.regular != null ? (
                            <span className="ai-tier__regular">
                              <s>€{tier.price.regular}{tier.priceSuffix ? tx(tier.priceSuffix) : ''}</s>
                            </span>
                          ) : null}
                          {tier.setup ? (
                            <span className="ai-tier__setup">
                              + €{tier.setup} {tx(T.setup)}
                            </span>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                    {showFounding ? <p className="ai-tier__founding-tag">{tx(T.founding)}</p> : null}
                    <p className="ai-tier__blurb">{tx(tier.blurb)}</p>
                    <ul className="ai-tier__list">
                      {tier.bullets.map((bullet) => (
                        <li key={bullet.en}>{tx(bullet)}</li>
                      ))}
                    </ul>
                    <div className="ai-tier__footer">
                      <p className="ai-tier__time">{tx(tier.time)}</p>
                      <a
                        className={`ai-button ${tier.featured || tier.id === 'test' ? 'ai-button--solid' : 'ai-button--ghost'}`}
                        href={tier.id === 'test' ? '#ai-test-shoot' : '#ai-book'}
                      >
                        {tx(tier.cta)}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="ai-addons">
              <h3 className="ai-addons__title">{tx(T.addonsTitle)}</h3>
              <ul className="ai-addons__list">
                {ADDONS.map((addon) => (
                  <li key={addon.label.en}>
                    <span>{tx(addon.label)}</span>
                    <strong>{tx(addon.price)}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <p className="ai-pricing__footnote">{tx(PRICING_FOOTNOTE)}</p>
          </motion.section>

          {/* GUARANTEE */}
          <motion.section className="ai-guarantee" aria-labelledby="ai-guarantee-title" {...reveal}>
            <p className="ai-kicker">{tx(T.guaranteeKicker)}</p>
            <h2 id="ai-guarantee-title" className="ai-section-title">
              {tx(T.guaranteeTitle)}
            </h2>
            <p className="ai-guarantee__body">{tx(T.guaranteeBody)}</p>
          </motion.section>

          {/* CASES */}
          <motion.section className="ai-cases" aria-labelledby="ai-cases-title" {...reveal}>
            <div className="ai-section-heading">
              <p className="ai-kicker">{tx(T.casesKicker)}</p>
              <h2 id="ai-cases-title" className="ai-section-title">
                {tx(T.casesTitle)}
              </h2>
            </div>
            <div className="ai-cases__grid">
              {CASES.map((entry) => (
                <article key={entry.sector.en} className="ai-case">
                  <p className="ai-case__sector">{tx(entry.sector)}</p>
                  <p className="ai-case__fact">{tx(entry.fact)}</p>
                </article>
              ))}
            </div>
          </motion.section>

          {/* FAQ */}
          <motion.section className="ai-faq" aria-labelledby="ai-faq-title" {...reveal}>
            <div className="ai-section-heading">
              <p className="ai-kicker">{tx(T.faqKicker)}</p>
              <h2 id="ai-faq-title" className="ai-section-title">
                {tx(T.faqTitle)}
              </h2>
            </div>
            <div className="ai-faq__list">
              {FAQ.map((item, index) => (
                <div key={item.q.en} className={`ai-faq__item ${openFaq === index ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="ai-faq__question"
                    aria-expanded={openFaq === index}
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    {tx(item.q)}
                    <span aria-hidden="true">{openFaq === index ? '−' : '+'}</span>
                  </button>
                  {openFaq === index ? <p className="ai-faq__answer">{tx(item.a)}</p> : null}
                </div>
              ))}
            </div>
          </motion.section>

          {/* BOOKING */}
          <BookingSection tx={tx} lang={lang} preferredIdentity={selected.name} />
        </main>

        <footer className="ai-footer">
          <div className="ai-footer__cta">
            <p className="ai-kicker">Maria Bordiuh AI</p>
            <p className="ai-footer__line">
              {tx(c('AI photoshoots — stills and motion for brands that need to sell.', 'KI-Fotoshootings — Stills und Motion für Marken, die verkaufen müssen.'))}
            </p>
          </div>
          <nav className="ai-footer__nav" aria-label="AI page footer">
            <PrefetchLink to="/">Home</PrefetchLink>
            <PrefetchLink to="/work">Work</PrefetchLink>
            <a href="mailto:projects@mariabordiuh.com">Say hi</a>
            <PrefetchLink to="/impressum">Impressum</PrefetchLink>
            <PrefetchLink to="/datenschutz">Datenschutz</PrefetchLink>
          </nav>
        </footer>
      </div>
    </>
  );
};
