import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Eye, Package, Play, ShieldCheck, Upload } from 'lucide-react';
import { JsonLd } from '../../components/JsonLd';
import { PrefetchLink } from '../../components/PrefetchLink';
import { Seo, SITE_URL } from '../../components/Seo';
import '../../styles/ai-page.css';
import {
  FAQ,
  FOOTNOTES,
  MODELS_CAPTION,
  ROSTER,
  SCARCITY,
  SHOWCASE_ITEMS,
  SIGNATURE_LINK,
  STATS,
  TIERS,
} from './data';
import { c, useLang } from './i18n';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { BookingSection } from './components/BookingSection';
import { CountUp } from './components/CountUp';
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

const revealTransition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

// Structural page copy. Content data lives in ./data.
const T = {
  navBeispiele: c('Examples', 'Beispiele'),
  navAblauf: c('How it works', 'Ablauf'),
  navPreise: c('Pricing', 'Preise'),
  navFaq: c('FAQ', 'FAQ'),
  navCta: c('Free test', 'Gratis-Test'),
  kicker: c('AI photo studio for products', 'KI-Fotostudio für Produkte'),
  heroTitle: c('Product photos that sell. No photo shoot.', 'Produktfotos, die verkaufen. Ohne Fotoshooting.'),
  heroSub: c(
    'Send a photo. Wait 48 hours. Get a campaign. It’s that simple now.',
    'Foto schicken. 48 Stunden warten. Kampagne erhalten. So einfach ist das jetzt.',
  ),
  ctaPrimary: c('Get a free test shoot', 'Gratis-Testshooting starten'),
  ctaCall: c('Book a 15-min call ›', '15-Min-Call buchen ›'),
  heroCaption: c('Hero campaign — Zuri for a workwear brand', 'Hero-Kampagne — Zuri für eine Workwear-Marke'),
  bentoTitle: c('Why it works.', 'Warum es funktioniert.'),
  baChip: c('Before → after. Drag it yourself.', 'Vorher → Nachher. Ziehen Sie selbst.'),
  baBefore: c('Your photo', 'Ihr Foto'),
  baAfter: c('Our delivery', 'Unsere Lieferung'),
  motionTile: c('Also in motion: loops for social and shop.', 'Auch in Bewegung: Motion-Loops für Social und Shop.'),
  guarantee: c('Fits-or-we-redo-it guarantee.', 'Passt-oder-nochmal-Garantie.'),
  guaranteeBody: c(
    'You approve a preview before final production — plus full commercial usage rights, in writing.',
    'Sie geben ein Preview frei, bevor final produziert wird — plus volle kommerzielle Nutzungsrechte, schriftlich.',
  ),
  galleryTitle: c('Anything can look premium.', 'Alles kann premium aussehen.'),
  gallerySub: c('Fashion is easy. The interesting part is everything else.', 'Fashion ist einfach. Interessant wird es bei allem anderen.'),
  stepsTitle: c('Three steps. No surprises.', 'Drei Schritte. Keine Überraschungen.'),
  steps: [
    { title: c('Send a photo', 'Foto schicken'), body: c('A phone photo is enough.', 'Ein Handyfoto reicht völlig.') },
    { title: c('Approve the direction', 'Richtung freigeben'), body: c('A preview before we produce.', 'Preview, bevor produziert wird.') },
    { title: c('Receive the campaign', 'Kampagne erhalten'), body: c('Done in days, not weeks.', 'Fertig in Tagen, nicht Wochen.') },
  ],
  pricingTitle: c('Which package fits you?', 'Welches Paket passt zu Ihnen?'),
  pricingScarcity: c('{n} of {t} founding rates left.', 'Noch {n} von {t} Founding-Preisen frei.'),
  from: c('From', 'Ab'),
  later: c('Founding rate', 'Founding-Preis'),
  free: c('€0', '€0'),
  forStart: c('To get started.', 'Für den Anfang.'),
  faqTitle: c('The questions buyers actually ask.', 'Die Fragen, die wirklich gestellt werden.'),
  footerTagline: c('An art-director-led AI photo studio — Hamburg.', 'KI-Fotostudio, geführt von einer Art Directorin — Hamburg.'),
  demoTitle: c('See how a campaign is made.', 'So entsteht eine Kampagne.'),
  demoSub: c('60 seconds, no marketing talk.', '60 Sekunden, kein Marketing-Sprech.'),
};

const STEP_ICONS = [Upload, Eye, Package];

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

export const AiLanding = () => {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { lang, setLang, tx } = useLang();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [motionFailed, setMotionFailed] = useState(false);
  // The Ohneis-style demo/sales video. The whole section stays hidden until
  // /ai/demo.mp4 exists — no empty slot for visitors, appears when dropped in.
  const [demoFailed, setDemoFailed] = useState(false);
  const motionVideoRef = useRef<HTMLVideoElement>(null);
  const demoVideoRef = useRef<HTMLVideoElement>(null);

  // Media error events can fire before React's onError listener attaches
  // (missing files come back as 200/text-html via the SPA rewrite, failing
  // fast) — so also poll the elements' error state directly after mount.
  useEffect(() => {
    const bind = (el: HTMLVideoElement | null, fail: () => void) => {
      if (!el) return () => {};
      if (el.error) {
        fail();
        return () => {};
      }
      el.addEventListener('error', fail);
      return () => el.removeEventListener('error', fail);
    };
    const unbindMotion = bind(motionVideoRef.current, () => setMotionFailed(true));
    const unbindDemo = bind(demoVideoRef.current, () => setDemoFailed(true));
    return () => {
      unbindMotion();
      unbindDemo();
    };
  }, []);

  const reveal = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.15 },
        transition: revealTransition,
      };

  // Cards on the page: test / starter / campaign. Signature is a link, not a card.
  const cardTiers = TIERS.filter((tier) => tier.id !== 'signature');
  const faces = ROSTER.slice(0, 3);

  const aiStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Maria Bordiuh AI',
    url: `${SITE_URL}/ai`,
    description: tx(AI_DESCRIPTION),
    provider: { '@type': 'Person', name: 'Maria Bordiuh', url: SITE_URL },
    areaServed: ['Germany', 'Europe', 'Remote'],
    serviceType: ['AI photoshoots', 'AI visual production', 'Campaign imagery', 'Product visuals', 'Custom model identities', 'AI motion design'],
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
        {/* NAV */}
        <header className="ai-nav">
          <div className="ai-nav__inner">
            <PrefetchLink className="ai-nav__brand" to="/" aria-label="Back to Maria Bordiuh home">
              Maria Bordiuh AI
            </PrefetchLink>
            <nav className="ai-nav__links" aria-label="AI page sections">
              <a href="#ai-beispiele">{tx(T.navBeispiele)}</a>
              <a href="#ai-ablauf">{tx(T.navAblauf)}</a>
              <a href="#ai-preise">{tx(T.navPreise)}</a>
              <a href="#ai-faq">{tx(T.navFaq)}</a>
            </nav>
            <div className="ai-nav__right">
              <div className="ai-nav__lang" role="group" aria-label="Language">
                <button type="button" className={lang === 'de' ? 'is-active' : ''} onClick={() => setLang('de')}>
                  DE
                </button>
                <button type="button" className={lang === 'en' ? 'is-active' : ''} onClick={() => setLang('en')}>
                  EN
                </button>
              </div>
              <a className="ai-btn ai-btn--solid ai-btn--sm" href="#ai-test-shoot">
                {tx(T.navCta)}
              </a>
            </div>
          </div>
        </header>

        <main className="ai-page__main">
          {/* HERO */}
          <section className="ai-hero">
            <motion.div
              className="ai-hero__intro"
              {...(prefersReducedMotion
                ? {}
                : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } })}
            >
              <p className="ai-kicker-serif">{tx(T.kicker)}</p>
              <h1 className="ai-hero__title">{tx(T.heroTitle)}</h1>
              <p className="ai-hero__sub">{tx(T.heroSub)}</p>
              <div className="ai-hero__actions">
                <a className="ai-btn ai-btn--solid" href="#ai-test-shoot">
                  {tx(T.ctaPrimary)}
                </a>
                <a className="ai-hero__textlink" href="#ai-call">
                  {tx(T.ctaCall)}
                </a>
              </div>
            </motion.div>

            <motion.div className="ai-hero__plate" {...reveal}>
              <SmartImage
                src="/ai/hero.jpg"
                alt={tx(T.heroCaption)}
                className="ai-hero__plate-img"
                placeholderClassName="ai-ph--hero"
              />
              <span className="ai-hero__plate-chip">{tx(T.heroCaption)}</span>
            </motion.div>
          </section>

          {/* BENTO */}
          <motion.section className="ai-section" {...reveal}>
            <h2 className="ai-h2">{tx(T.bentoTitle)}</h2>
            <div className="ai-bento">
              <div className="ai-bento__ba">
                <BeforeAfterSlider
                  beforeSrc="/ai/before-after/1-before.jpg"
                  afterSrc="/ai/before-after/1-after.jpg"
                  label={tx(T.baChip)}
                  beforeTag={tx(T.baBefore)}
                  afterTag={tx(T.baAfter)}
                />
              </div>

              <div className="ai-bento__tile ai-bento__tile--dark">
                <p className="ai-bento__num">
                  <CountUp value={STATS.speed.value} />
                </p>
                <p className="ai-bento__label">
                  {tx(STATS.speed.label)}
                  <sup>{STATS.speed.note}</sup>
                </p>
              </div>

              <div className="ai-bento__tile">
                <p className="ai-bento__num">
                  <CountUp value={STATS.volume.value} />
                </p>
                <p className="ai-bento__label">
                  {tx(STATS.volume.label)}
                  <sup>{STATS.volume.note}</sup>
                </p>
              </div>

              <div className="ai-bento__tile">
                <div className="ai-facepile" aria-hidden="true">
                  {faces.map((identity) => (
                    <span key={identity.id} className="ai-facepile__face">
                      <SmartImage
                        src={`/ai/roster/${identity.id}-portrait.jpg`}
                        alt=""
                        className="ai-facepile__img"
                        placeholderClassName="ai-ph--facefill"
                      />
                    </span>
                  ))}
                  <span className="ai-facepile__more">+</span>
                </div>
                <p className="ai-bento__label">{tx(MODELS_CAPTION)}</p>
              </div>

              <div className="ai-bento__tile ai-bento__tile--motion">
                {motionFailed ? (
                  <span className="ai-ph ai-ph--motion" aria-hidden="true">
                    <Play size={22} />
                  </span>
                ) : (
                  <video
                    ref={motionVideoRef}
                    className="ai-bento__video"
                    src="/ai/motion/loop-1.mp4"
                    poster="/ai/motion/loop-1-poster.jpg"
                    muted
                    loop
                    playsInline
                    autoPlay={!prefersReducedMotion}
                    preload="metadata"
                    aria-label={tx(T.motionTile)}
                    onError={() => setMotionFailed(true)}
                  />
                )}
                <p className="ai-bento__label">{tx(T.motionTile)}</p>
              </div>

              <div className="ai-bento__bar">
                <ShieldCheck size={22} strokeWidth={1.6} aria-hidden="true" />
                <p>
                  <strong>{tx(T.guarantee)}</strong> {tx(T.guaranteeBody)}
                </p>
              </div>
            </div>
          </motion.section>

          {/* GALLERY */}
          <motion.section className="ai-section" id="ai-beispiele" {...reveal}>
            <h2 className="ai-h2">{tx(T.galleryTitle)}</h2>
            <p className="ai-sub">{tx(T.gallerySub)}</p>
            <div className="ai-gallery">
              {SHOWCASE_ITEMS.map((item) => (
                <figure key={item.id} className="ai-gallery__item">
                  <SmartImage
                    src={`/ai/sets/item-${item.id}.jpg`}
                    alt={tx(item.caption)}
                    className="ai-gallery__img"
                    placeholderClassName="ai-ph--gallery"
                  />
                  <figcaption>{tx(item.caption)}</figcaption>
                </figure>
              ))}
            </div>
          </motion.section>

          {/* DEMO VIDEO (Ohneis-style; hidden until /ai/demo.mp4 exists) */}
          {!demoFailed ? (
            <motion.section className="ai-section ai-demo" {...reveal}>
              <h2 className="ai-h2">{tx(T.demoTitle)}</h2>
              <p className="ai-sub">{tx(T.demoSub)}</p>
              <div className="ai-demo__frame">
                <video
                  ref={demoVideoRef}
                  className="ai-demo__video"
                  src="/ai/demo.mp4"
                  poster="/ai/demo-poster.jpg"
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={tx(T.demoTitle)}
                  onError={() => setDemoFailed(true)}
                >
                  <track kind="captions" src="/ai/demo-captions.vtt" srcLang="de" label="Deutsch" default />
                </video>
              </div>
            </motion.section>
          ) : null}

          {/* STEPS */}
          <motion.section className="ai-section" id="ai-ablauf" {...reveal}>
            <h2 className="ai-h2">{tx(T.stepsTitle)}</h2>
            <div className="ai-steps">
              {T.steps.map((step, index) => {
                const Icon = STEP_ICONS[index];
                return (
                  <article key={index} className="ai-step">
                    <span className="ai-step__badge" aria-hidden="true">
                      <Icon size={19} strokeWidth={1.7} />
                    </span>
                    <h3 className="ai-step__title">{tx(step.title)}</h3>
                    <p className="ai-step__body">{tx(step.body)}</p>
                  </article>
                );
              })}
            </div>
          </motion.section>

          {/* PRICING */}
          <motion.section className="ai-section" id="ai-preise" {...reveal}>
            <h2 className="ai-h2">{tx(T.pricingTitle)}</h2>
            {SCARCITY.foundingLeft > 0 ? (
              <p className="ai-sub">
                {fill(tx(T.pricingScarcity), { n: SCARCITY.foundingLeft, t: SCARCITY.foundingTotal })}
              </p>
            ) : null}
            <div className="ai-tiers">
              {cardTiers.map((tier) => {
                const isFree = tier.price.founding === 0;
                const showFounding =
                  SCARCITY.foundingLeft > 0 &&
                  tier.price.founding != null &&
                  tier.price.regular != null &&
                  tier.price.founding < tier.price.regular;
                return (
                  <article key={tier.id} className={`ai-tier ${tier.featured ? 'is-featured' : ''}`}>
                    {tier.featured ? <span className="ai-tier__badge">{tx(c('Popular', 'Beliebt'))}</span> : null}
                    <p className="ai-tier__name">{tx(tier.name)}</p>
                    <p className="ai-tier__price">
                      {isFree ? (
                        tx(T.free)
                      ) : (
                        <>
                          {tx(T.from)} €{tier.price.founding}
                          {tier.priceSuffix ? tx(tier.priceSuffix) : ''}
                          <sup>3</sup>
                        </>
                      )}
                    </p>
                    <p className="ai-tier__meta">
                      {isFree ? (
                        tx(T.forStart)
                      ) : showFounding && tier.price.regular != null ? (
                        <>
                          <s>€{tier.price.regular}</s> — {tx(T.later)}
                        </>
                      ) : (
                        tx(T.later)
                      )}
                    </p>
                    <p className="ai-tier__blurb">{tx(tier.blurb)}</p>
                    <a
                      className={`ai-btn ai-btn--block ${tier.featured ? 'ai-btn--invert' : 'ai-btn--outline'}`}
                      href={tier.id === 'test' ? '#ai-test-shoot' : '#ai-kontakt'}
                    >
                      {tx(tier.cta)}
                    </a>
                  </article>
                );
              })}
            </div>
            <a className="ai-signature-link" href="#ai-kontakt">
              {tx(SIGNATURE_LINK)}
            </a>
          </motion.section>

          {/* FAQ */}
          <motion.section className="ai-section" id="ai-faq" {...reveal}>
            <h2 className="ai-h2">{tx(T.faqTitle)}</h2>
            <div className="ai-faq">
              {FAQ.map((item, index) => {
                const open = openFaq === index;
                return (
                  <div key={item.q.en} className={`ai-faq__item ${open ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="ai-faq__q"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : index)}
                    >
                      {tx(item.q)}
                      <span className="ai-faq__sign" aria-hidden="true">
                        {open ? '−' : '+'}
                      </span>
                    </button>
                    {open ? <p className="ai-faq__a">{tx(item.a)}</p> : null}
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* CONTACT (dark panel) */}
          <BookingSection tx={tx} lang={lang} preferredIdentity="" />

          {/* FOOTNOTES + legal */}
          <footer className="ai-footer">
            <div className="ai-footnotes">
              {FOOTNOTES.map((note) => (
                <p key={note.en}>{tx(note)}</p>
              ))}
            </div>
            <div className="ai-footer__bar">
              <span>© {new Date().getFullYear()} Maria Bordiuh — {tx(T.footerTagline)}</span>
              <nav className="ai-footer__links" aria-label="Legal">
                <PrefetchLink to="/">
                  Portfolio <ArrowUpRight size={13} />
                </PrefetchLink>
                <PrefetchLink to="/impressum">Impressum</PrefetchLink>
                <PrefetchLink to="/datenschutz">Datenschutz</PrefetchLink>
              </nav>
            </div>
          </footer>
        </main>

        {/* MOBILE STICKY CTA */}
        <a className="ai-sticky-cta" href="#ai-test-shoot">
          {tx(T.ctaPrimary)}
        </a>
      </div>
    </>
  );
};
