import { motion, useReducedMotion } from 'motion/react';
import { Fragment, useEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Eye, Flame, Package, Play, Sparkles, Upload, UserPlus, X } from 'lucide-react';
import { JsonLd } from '../../components/JsonLd';
import { PrefetchLink } from '../../components/PrefetchLink';
import { Seo, SITE_URL } from '../../components/Seo';
import '../../styles/ai-page.css';
import {
  ANCHOR,
  BEFORE_AFTER,
  CASE_TILES,
  CUSTOM_IDENTITY,
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
  heroCaption: c('Hero campaign — Aiko for a beauty brand', 'Hero-Kampagne — Aiko für eine Beauty-Marke'),
  bentoTitle: c('Why it works.', 'Warum es funktioniert.'),
  compareTitle: c('Before → after. Drag it yourself.', 'Vorher → Nachher. Ziehen Sie selbst.'),
  compareSub: c('Three real examples — same photo, drag to compare.', 'Drei echte Beispiele — dasselbe Foto, zum Vergleichen ziehen.'),
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
  rosterTitle: c('Meet the roster.', 'Das Roster.'),
  rosterSub: c(
    'Same identity, every time — not a new face per shoot.',
    'Dieselbe Identität, jedes Mal — kein neues Gesicht pro Shooting.',
  ),
  rosterCustomCta: c('Build a custom identity', 'Eigene Identität anfragen'),
  stepsTitle: c('Three steps. No surprises.', 'Drei Schritte. Keine Überraschungen.'),
  steps: [
    { title: c('Send a photo', 'Foto schicken'), body: c('A phone photo is enough.', 'Ein Handyfoto reicht völlig.') },
    { title: c('Approve the direction', 'Richtung freigeben'), body: c('A preview before we produce.', 'Preview, bevor produziert wird.') },
    { title: c('Receive the campaign', 'Kampagne erhalten'), body: c('Done in days, not weeks.', 'Fertig in Tagen, nicht Wochen.') },
  ],
  pricingTitle: c('Which package fits you?', 'Welches Paket passt zu Ihnen?'),
  pricingScarcity: c('{n} of {t} founding rates left.', 'Noch {n} von {t} Founding-Preisen frei.'),
  // Shown instead of the counter while no spot is taken yet — "10 of 10 left"
  // would announce zero traction.
  pricingScarcityIntro: c(
    'Founding rates for the first {t} direct-booking brands — locked permanently.',
    'Founding-Preise für die ersten {t} Direktkunden — dauerhaft gesichert.',
  ),
  casesTitle: c('Work we can’t show — facts we can.', 'Arbeit, die wir nicht zeigen dürfen — Fakten schon.'),
  from: c('From', 'Ab'),
  later: c('Founding rate', 'Founding-Preis'),
  forStart: c('To get started.', 'Für den Anfang.'),
  faqTitle: c('The questions buyers actually ask.', 'Die Fragen, die wirklich gestellt werden.'),
  footerTagline: c('An art-director-led AI photo studio — Hamburg.', 'KI-Fotostudio, geführt von einer Art Directorin — Hamburg.'),
  demoTitle: c('See how a campaign is made.', 'So entsteht eine Kampagne.'),
  demoSub: c('60 seconds, no marketing talk.', '60 Sekunden, kein Marketing-Sprech.'),
};

const STEP_ICONS = [Upload, Eye, Package];

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

// German currency convention puts the symbol after the number ("340 €"),
// English before ("€340") — a small tell that separates local from template.
const formatPrice = (value: number, lang: 'en' | 'de') =>
  lang === 'de' ? `${value} €` : `€${value}`;

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

  // Mobile browser chrome (address bar) should match the dark page instead of
  // the portfolio's near-black — restore the original on unmount.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const previous = meta.getAttribute('content');
    meta.setAttribute('content', '#0b1026');
    return () => {
      if (previous) meta.setAttribute('content', previous);
    };
  }, []);

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

  // Roster carousel — auto-flows slowly, pauses on hover, and stops for good
  // the moment a visitor drags or clicks an arrow (never fights a manual
  // scroll by resuming under them). The track renders the roster twice back
  // to back so the wrap-around loop is seamless.
  const rosterTrackRef = useRef<HTMLDivElement>(null);
  const rosterHoverRef = useRef(false);
  const rosterInteractedRef = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const track = rosterTrackRef.current;
    if (!track) return;
    let raf: number;
    const step = () => {
      if (!rosterHoverRef.current && !rosterInteractedRef.current) {
        const half = track.scrollWidth / 2;
        track.scrollLeft += 0.5;
        if (track.scrollLeft >= half) {
          track.scrollLeft -= half;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [prefersReducedMotion]);

  const scrollRoster = (direction: 1 | -1) => {
    rosterInteractedRef.current = true;
    rosterTrackRef.current?.scrollBy({ left: direction * 280, behavior: 'smooth' });
  };

  // Sedcard popup — click a roster card to see more shots of that identity.
  // pointerStartRef distinguishes a tap from a carousel drag: only opens if
  // the pointer barely moved between down and up.
  const [openIdentity, setOpenIdentity] = useState<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleCardPointerDown = (event: PointerEvent<HTMLElement>) => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  };
  const handleCardPointerUp = (event: PointerEvent<HTMLElement>, index: number) => {
    const start = pointerStartRef.current;
    if (start && Math.abs(event.clientX - start.x) < 8 && Math.abs(event.clientY - start.y) < 8) {
      setOpenIdentity(index);
    }
  };
  const navigateSedcard = (direction: 1 | -1) => {
    setOpenIdentity((current) => (current === null ? current : (current + direction + ROSTER.length) % ROSTER.length));
  };

  useEffect(() => {
    if (openIdentity === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenIdentity(null);
      if (event.key === 'ArrowLeft') navigateSedcard(-1);
      if (event.key === 'ArrowRight') navigateSedcard(1);
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIdentity]);

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
        <div className="ai-grain" aria-hidden="true" />
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
          {/* HERO — CSS-animated (not motion): the LCP content must be visible
              on load without depending on rAF/JS, and stay visible under
              reduced-motion. */}
          <section className="ai-hero">
            <div className="ai-hero__intro ai-rise">
              <p className="ai-kicker">{tx(T.kicker)}</p>
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
            </div>

            <div className="ai-hero__plate ai-rise--fade">
              <SmartImage
                src="/ai/hero.jpg"
                alt={tx(T.heroCaption)}
                className="ai-hero__plate-img"
                placeholderClassName="ai-ph--hero"
              />
              <span className="ai-hero__plate-chip">{tx(T.heroCaption)}</span>
            </div>
          </section>

          {/* BENTO */}
          <motion.section className="ai-section ai-section--glow" {...reveal}>
            <div className="ai-blob ai-blob--teal" aria-hidden="true" />
            <h2 className="ai-h2">{tx(T.bentoTitle)}</h2>
            <div className="ai-bento">
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
                <Sparkles size={22} strokeWidth={1.6} aria-hidden="true" />
                <p>
                  <strong>{tx(T.guarantee)}</strong> {tx(T.guaranteeBody)}
                </p>
              </div>
            </div>
          </motion.section>

          {/* COMPARE — 3 before/after examples. #1 has real photos; the rest
              show placeholders (same graceful-degradation pattern as
              everywhere else) until matching /ai/before-after/{id}-*.jpg
              files exist. */}
          <motion.section className="ai-section" {...reveal}>
            <h2 className="ai-h2">{tx(T.compareTitle)}</h2>
            <p className="ai-sub">{tx(T.compareSub)}</p>
            <div className="ai-compare">
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

          {/* NDA CASE TILES — anonymized facts standing in for the client
              names NDAs forbid. Hidden until Maria confirms the facts and
              fills CASE_TILES in data.ts. */}
          {CASE_TILES.length > 0 ? (
            <motion.section className="ai-section" {...reveal}>
              <h2 className="ai-h2">{tx(T.casesTitle)}</h2>
              <div className="ai-cases">
                {CASE_TILES.map((tile) => (
                  <article key={tile.sector.en} className="ai-case">
                    <p className="ai-case__sector">{tx(tile.sector)}</p>
                    <p className="ai-case__fact">{tx(tile.fact)}</p>
                    <p className="ai-case__detail">{tx(tile.detail)}</p>
                  </article>
                ))}
              </div>
            </motion.section>
          ) : null}

          {/* ROSTER — proves "consistent models" isn't just a claim: each card
              pairs the identity's portrait with 2 in-campaign shots of the
              same face. Output shots are optional (SmartImage placeholder
              fallback) so the section works today and fills in as Maria
              adds /ai/roster/{id}-output-1.jpg / -output-2.jpg.
              Deliberately name-only — no "best used for" copy per face; see
              the note on ROSTER in data.ts for why.
              Renders as an auto-flowing carousel: the sequence is duplicated
              back to back so the rAF-driven scroll (see rosterTrackRef effect
              above) can loop seamlessly; arrows + hover-pause + drag all work
              on the single underlying scroll container. */}
          <motion.section className="ai-section" {...reveal}>
            <h2 className="ai-h2">{tx(T.rosterTitle)}</h2>
            <p className="ai-sub">{tx(T.rosterSub)}</p>
            <div
              className="ai-carousel"
              onMouseEnter={() => {
                rosterHoverRef.current = true;
              }}
              onMouseLeave={() => {
                rosterHoverRef.current = false;
              }}
            >
              <button
                type="button"
                className="ai-carousel__arrow ai-carousel__arrow--prev"
                onClick={() => scrollRoster(-1)}
                aria-label={tx(c('Previous', 'Zurück'))}
              >
                <ChevronLeft size={18} />
              </button>
              <div
                className="ai-roster"
                ref={rosterTrackRef}
                onPointerDown={() => {
                  rosterInteractedRef.current = true;
                }}
                onWheel={() => {
                  rosterInteractedRef.current = true;
                }}
              >
                {[0, 1].map((loop) => (
                  <Fragment key={loop}>
                    {ROSTER.map((identity, index) => (
                      <div
                        key={`${identity.id}-${loop}`}
                        className="ai-roster__card ai-roster__card--clickable"
                        role="button"
                        tabIndex={0}
                        aria-label={tx(c(`See more of ${identity.name}`, `Mehr von ${identity.name} ansehen`))}
                        onPointerDown={handleCardPointerDown}
                        onPointerUp={(event) => handleCardPointerUp(event, index)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setOpenIdentity(index);
                          }
                        }}
                      >
                        <div className="ai-roster__portrait">
                          <SmartImage
                            src={`/ai/roster/${identity.id}-portrait.jpg`}
                            alt={identity.name}
                            className="ai-roster__portrait-img"
                            placeholderClassName="ai-ph--roster"
                          />
                          <span className="ai-roster__view" aria-hidden="true">
                            <Eye size={16} strokeWidth={1.8} />
                          </span>
                        </div>
                        <div className="ai-roster__proof" aria-hidden="true">
                          <SmartImage
                            src={`/ai/roster/${identity.id}-output-1.jpg`}
                            alt=""
                            className="ai-roster__proof-img"
                            placeholderClassName="ai-ph--rosterproof"
                          />
                          <SmartImage
                            src={`/ai/roster/${identity.id}-output-2.jpg`}
                            alt=""
                            className="ai-roster__proof-img"
                            placeholderClassName="ai-ph--rosterproof"
                          />
                        </div>
                        <div className="ai-roster__body">
                          <p className="ai-roster__name">{identity.name}</p>
                        </div>
                      </div>
                    ))}
                    <article key={`custom-${loop}`} className="ai-roster__card ai-roster__card--custom">
                      <span className="ai-roster__custom-icon" aria-hidden="true">
                        <UserPlus size={19} strokeWidth={1.7} />
                      </span>
                      <p className="ai-roster__name">{tx(CUSTOM_IDENTITY.name)}</p>
                      <p className="ai-roster__title">{tx(CUSTOM_IDENTITY.badge)}</p>
                      <p className="ai-roster__short">{tx(CUSTOM_IDENTITY.short)}</p>
                      <a className="ai-btn ai-btn--outline ai-btn--block" href="#ai-kontakt">
                        {tx(T.rosterCustomCta)}
                      </a>
                    </article>
                  </Fragment>
                ))}
              </div>
              <button
                type="button"
                className="ai-carousel__arrow ai-carousel__arrow--next"
                onClick={() => scrollRoster(1)}
                aria-label={tx(c('Next', 'Weiter'))}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.section>

          {/* SEDCARD POPUP — click a roster card to open. Named after the
              modeling-industry "Sedcard"/comp card: one cover shot + a few
              campaign shots of the same face on one sheet. Portrait + 3
              output shots in a 2x2 grid; missing ones show the same
              placeholder pattern as everywhere else on the page. */}
          {openIdentity !== null ? (
            // Backdrop dismiss-on-click; Escape is already handled by the
            // window keydown listener in the openIdentity effect above.
            <div
              className="ai-sedcard-overlay"
              role="presentation"
              onClick={() => setOpenIdentity(null)}
            >
              {/* onClick here only stops the backdrop-close click from bubbling — not a real control. */}
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
              <div
                className="ai-sedcard"
                role="dialog"
                aria-modal="true"
                aria-label={ROSTER[openIdentity].name}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="ai-sedcard__close"
                  onClick={() => setOpenIdentity(null)}
                  aria-label={tx(c('Close', 'Schließen'))}
                >
                  <X size={18} />
                </button>
                <button
                  type="button"
                  className="ai-sedcard__nav ai-sedcard__nav--prev"
                  onClick={() => navigateSedcard(-1)}
                  aria-label={tx(c('Previous', 'Zurück'))}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="ai-sedcard__nav ai-sedcard__nav--next"
                  onClick={() => navigateSedcard(1)}
                  aria-label={tx(c('Next', 'Weiter'))}
                >
                  <ChevronRight size={18} />
                </button>
                <div className="ai-sedcard__grid">
                  <SmartImage
                    src={`/ai/roster/${ROSTER[openIdentity].id}-portrait.jpg`}
                    alt={ROSTER[openIdentity].name}
                    className="ai-sedcard__img"
                    placeholderClassName="ai-ph--sedcard"
                    eager
                  />
                  {[1, 2, 3].map((n) => (
                    <SmartImage
                      key={n}
                      src={`/ai/roster/${ROSTER[openIdentity].id}-output-${n}.jpg`}
                      alt=""
                      className="ai-sedcard__img"
                      placeholderClassName="ai-ph--sedcard"
                      eager
                    />
                  ))}
                </div>
                <p className="ai-sedcard__name">{ROSTER[openIdentity].name}</p>
              </div>
            </div>
          ) : null}

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
          <motion.section className="ai-section ai-section--glow" id="ai-preise" {...reveal}>
            <div className="ai-blob ai-blob--lime" aria-hidden="true" />
            <h2 className="ai-h2">{tx(T.pricingTitle)}</h2>
            <div className="ai-anchor" aria-label={tx(ANCHOR.heading)}>
              <div className="ai-anchor__col">
                <p className="ai-anchor__label">{tx(ANCHOR.traditional.label)}</p>
                <ul>
                  {ANCHOR.traditional.rows.map((row) => (
                    <li key={row.en}>
                      <X size={13} strokeWidth={2.4} aria-hidden="true" />
                      {tx(row)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="ai-anchor__col ai-anchor__col--ai">
                <p className="ai-anchor__label">{tx(ANCHOR.ai.label)}</p>
                <ul>
                  {ANCHOR.ai.rows.map((row) => (
                    <li key={row.en}>
                      <Check size={13} strokeWidth={2.6} aria-hidden="true" />
                      {tx(row)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {SCARCITY.foundingLeft > 0 ? (
              <p className="ai-scarcity">
                <Flame size={13} strokeWidth={2.2} aria-hidden="true" />
                {SCARCITY.foundingLeft === SCARCITY.foundingTotal
                  ? fill(tx(T.pricingScarcityIntro), { t: SCARCITY.foundingTotal })
                  : fill(tx(T.pricingScarcity), { n: SCARCITY.foundingLeft, t: SCARCITY.foundingTotal })}
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
                        formatPrice(0, lang)
                      ) : (
                        <>
                          {tx(T.from)} {formatPrice(tier.price.founding ?? 0, lang)}
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
                          <s>{formatPrice(tier.price.regular, lang)}</s> — {tx(T.later)}
                        </>
                      ) : (
                        tx(T.later)
                      )}
                    </p>
                    <ul className="ai-tier__bullets">
                      {tier.bullets.map((bullet) => (
                        <li key={tx(bullet)}>
                          <Check size={14} strokeWidth={2.4} aria-hidden="true" />
                          {tx(bullet)}
                        </li>
                      ))}
                    </ul>
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
          <motion.section className="ai-section ai-section--glow" id="ai-faq" {...reveal}>
            <div className="ai-blob ai-blob--blue" aria-hidden="true" />
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
