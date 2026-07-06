import { motion, useReducedMotion } from 'motion/react';
import { type FormEvent, useState } from 'react';
import { JsonLd } from '../components/JsonLd';
import { PrefetchLink } from '../components/PrefetchLink';
import { Seo, SITE_URL } from '../components/Seo';
import '../styles/ai-page.css';

const AI_DESCRIPTION =
  'AI visual production for fashion and e-commerce brands. Campaign imagery, consistent model identities, product visuals and art-directed image systems by Maria Bordiuh AI.';

const AI_OG_IMAGE = '/og/ai.jpg';

const revealTransition = {
  duration: 0.68,
  ease: [0.22, 1, 0.36, 1] as const,
};

type TalentId = 'aiko' | 'fernando' | 'custom';
type ProductId = 'bag' | 'shoes' | 'jewelry' | 'outerwear';
type TierId = 'campaign' | 'ecomm' | 'identity';
type ProjectTypeId = 'campaign' | 'ecomm' | 'social' | 'editorial' | 'not-sure';
type ChannelId = 'prelaunch' | 'own-site' | 'stockists' | 'multichannel';

type PlaceholderFrameProps = {
  className?: string;
};

const PlaceholderFrame = ({ className = '' }: PlaceholderFrameProps) => (
  <div aria-hidden="true" className={`ai-placeholder ${className}`.trim()} />
);

const TALENTS: Record<
  TalentId,
  {
    name: string;
    badge: string;
    short: string;
    heroLine: string;
    rosterTitle: string;
    stats: Array<{ term: string; value: string }>;
  }
> = {
  aiko: {
    name: 'Aiko',
    badge: 'Editorial',
    short: 'Cool, precise, and built for sharper fashion language.',
    heroLine: 'Sharper editorial direction for fashion-led launches and image systems.',
    rosterTitle: 'High-fashion precision',
    stats: [
      { term: 'Use', value: 'Editorial / campaign' },
      { term: 'Energy', value: 'Cool / exact / graphic' },
      { term: 'Best for', value: 'Fashion / accessories / concept-led sets' },
      { term: 'Delivery', value: 'Reusable across campaigns' },
    ],
  },
  fernando: {
    name: 'Fernando',
    badge: 'Commercial',
    short: 'Realism-forward, versatile, and built for broad brand trust.',
    heroLine: 'Commercial realism for product stories that need polish, trust, and clarity.',
    rosterTitle: 'Premium commercial realism',
    stats: [
      { term: 'Use', value: 'E-commerce / lifestyle / campaign' },
      { term: 'Energy', value: 'Grounded / polished / approachable' },
      { term: 'Best for', value: 'Broader audience / conversion-led visuals' },
      { term: 'Delivery', value: 'Consistent across repeat shoots' },
    ],
  },
  custom: {
    name: 'Custom',
    badge: 'Bespoke',
    short: 'A model identity built around your product, audience, and visual direction.',
    heroLine: 'A face and image logic developed specifically for your product and audience.',
    rosterTitle: 'Built for your visual direction',
    stats: [
      { term: 'Use', value: 'Brand worlds / signature faces / long-term systems' },
      { term: 'Energy', value: 'Defined around your brief' },
      { term: 'Best for', value: 'Brands that need a reusable face' },
      { term: 'Delivery', value: 'Tailored identity development' },
    ],
  },
};

const PRODUCT_REFERENCES: Array<{
  id: ProductId;
  label: string;
  note: string;
}> = [
  { id: 'bag', label: 'Bag hero', note: 'Structured leather accessory focus' },
  { id: 'shoes', label: 'Shoes', note: 'Footwear-led styling and framing' },
  { id: 'jewelry', label: 'Jewelry', note: 'Detail-led luxury product story' },
  { id: 'outerwear', label: 'Outerwear', note: 'Silhouette and material emphasis' },
];

const HOW_IT_WORKS = [
  {
    index: '01',
    title: 'Choose a direction',
    body: 'Pick Aiko, Fernando, or a custom-built identity depending on the brand language you need.',
  },
  {
    index: '02',
    title: 'Send product + references',
    body: 'Send the product, flat-lays, or reference materials. Direction, styling, and image logic are built around that.',
  },
  {
    index: '03',
    title: 'Receive campaign-ready visuals',
    body: 'Hand-reviewed imagery arrives as a coherent set for campaign, e-commerce, launch, or social use.',
  },
] as const;

const COMPARISON_ROWS = [
  { label: 'Studio day', traditional: 'Booking-dependent', maria: 'Not required' },
  { label: 'Model booking', traditional: 'New availability each shoot', maria: 'Direction-led continuity' },
  { label: 'Reshoot overhead', traditional: 'High', maria: 'Reduced' },
  { label: 'Turnaround', traditional: 'Longer production chain', maria: 'Fast inquiry-led delivery' },
  { label: 'Consistency', traditional: 'Harder to maintain across sets', maria: 'Systematic visual control' },
] as const;

const SERVICE_TIERS: Record<
  TierId,
  {
    name: string;
    blurb: string;
    bullets: string[];
    cta: string;
  }
> = {
  campaign: {
    name: 'Campaign set',
    blurb:
      'For launches, seasonal drops, and brand campaigns that need a focused set of hero imagery without a physical set.',
    bullets: [
      'Campaign-ready art direction',
      'Focused image set with visual consistency',
      'Built around product, styling, and mood',
      'Inquiry-led scope and timing',
    ],
    cta: 'Inquire for campaign set',
  },
  ecomm: {
    name: 'E-commerce system',
    blurb:
      'For brands that need repeatable product storytelling, clean visual logic, and a faster route to usable image systems.',
    bullets: [
      'Product-first composition language',
      'Designed for repeatable merchandising use',
      'Consistent face, light, and frame logic',
      'Built to support launches and replenishment',
    ],
    cta: 'Inquire for e-commerce system',
  },
  identity: {
    name: 'Custom model identity',
    blurb:
      'For brands that want a reusable visual character that can return across launches, campaigns, and product stories.',
    bullets: [
      'A face designed around your audience',
      'Reusable identity across multiple sets',
      'Coherent styling and world-building logic',
      'Best suited to long-term brand systems',
    ],
    cta: 'Inquire for custom identity',
  },
};

const EXAMPLE_WORK = [
  { title: 'Editorial — with Aiko', detail: 'Sharper fashion direction' },
  { title: 'Commercial — with Fernando', detail: 'Premium realism for product trust' },
  { title: 'Campaign — with Aiko', detail: 'Launch imagery without a set' },
  { title: 'Custom identity — bespoke', detail: 'Built around your audience' },
] as const;

const PROJECT_TYPES: Array<{ id: ProjectTypeId; label: string }> = [
  { id: 'campaign', label: 'Campaign' },
  { id: 'ecomm', label: 'E-commerce' },
  { id: 'social', label: 'Social' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'not-sure', label: 'Not sure' },
];

const CHANNELS: Array<{ id: ChannelId; label: string }> = [
  { id: 'prelaunch', label: 'Pre-launch / building' },
  { id: 'own-site', label: 'Own site' },
  { id: 'stockists', label: 'Site + stockists' },
  { id: 'multichannel', label: 'Multi-channel' },
];

const getProductOutputLabel = (productId: ProductId) => {
  switch (productId) {
    case 'bag':
      return 'Structured accessory story';
    case 'shoes':
      return 'Footwear-led image system';
    case 'jewelry':
      return 'Luxury detail campaign set';
    case 'outerwear':
      return 'Silhouette-led outerwear direction';
    default:
      return 'Product-led campaign direction';
  }
};

export const AiLanding = () => {
  const prefersReducedMotion = useReducedMotion();
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [selectedTalent, setSelectedTalent] = useState<TalentId>('aiko');
  const [selectedProduct, setSelectedProduct] = useState<ProductId>('bag');
  const [activeTier, setActiveTier] = useState<TierId>('campaign');
  const [inquiry, setInquiry] = useState({
    email: '',
    name: '',
    direction: 'Aiko',
    projectType: 'Campaign',
    channel: 'Own site',
    brandUrl: '',
    brief: '',
  });

  const reveal = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.18 },
        transition: revealTransition,
      };

  const heroReveal = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.76, ease: [0.22, 1, 0.36, 1] as const },
      };

  const activeTalent = TALENTS[selectedTalent];
  const activeTierData = SERVICE_TIERS[activeTier];
  const activeProduct = PRODUCT_REFERENCES.find((product) => product.id === selectedProduct);
  const talentIds = Object.keys(TALENTS) as TalentId[];

  const aiStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Maria Bordiuh AI',
    url: `${SITE_URL}/ai`,
    description: AI_DESCRIPTION,
    provider: {
      '@type': 'Person',
      name: 'Maria Bordiuh',
      url: SITE_URL,
    },
    areaServed: ['Germany', 'Europe', 'Remote'],
    serviceType: [
      'AI visual production',
      'Campaign imagery',
      'Product visuals',
      'Creative AI workflows',
      'Custom model identities',
    ],
  };

  const handleInquirySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = inquiry.name
      ? `AI inquiry — ${inquiry.name}`
      : 'AI inquiry';

    const body = [
      `Email: ${inquiry.email || '-'}`,
      `Name: ${inquiry.name || '-'}`,
      `Direction / face: ${inquiry.direction || '-'}`,
      `Project type: ${inquiry.projectType || '-'}`,
      `Selling context: ${inquiry.channel || '-'}`,
      `Brand URL: ${inquiry.brandUrl || '-'}`,
      '',
      'Brief:',
      inquiry.brief || '-',
    ].join('\n');

    window.location.href = `mailto:projects@mariabordiuh.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const cycleTalent = () => {
    const currentIndex = talentIds.indexOf(selectedTalent);
    const nextTalent = talentIds[(currentIndex + 1) % talentIds.length];
    setSelectedTalent(nextTalent);
    setInquiry((current) => ({
      ...current,
      direction: TALENTS[nextTalent].name,
    }));
  };

  return (
    <>
      <Seo
        title="AI Campaign Visuals for Fashion & E-commerce | Maria Bordiuh AI"
        description={AI_DESCRIPTION}
        canonicalPath="/ai"
        image={AI_OG_IMAGE}
        imageWidth={1200}
        imageHeight={630}
        imageAlt="Maria Bordiuh AI campaign visuals preview"
      />
      <JsonLd id="ai-structured-data" data={aiStructuredData} />
      <div className="ai-page">
        {announcementVisible ? (
          <div className="ai-announcement">
            <div className="ai-announcement__inner">
              <p className="ai-announcement__copy">
                AI visual production for fashion and e-commerce brands. No studio day required.
              </p>
              <div className="ai-announcement__actions">
                <a className="ai-announcement__link" href="#ai-inquiry">
                  Start the inquiry
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
            <button type="button" className="ai-nav__menu">
              Menu
            </button>
            <nav className="ai-nav__links" aria-label="AI page sections">
              <a href="#ai-how">How it works</a>
              <a href="#ai-roster">Roster</a>
              <a href="#ai-pricing">Services</a>
              <a href="#ai-book">Book</a>
            </nav>
          </div>
        </header>

        <main className="ai-page__main">
          <section className="ai-hero" id="ai-showcase" aria-labelledby="ai-hero-title">
            <motion.div className="ai-hero__intro" {...heroReveal}>
              <p className="ai-kicker">AI visual production studio</p>
              <h1 id="ai-hero-title" className="ai-hero__title">
                Campaign imagery without a set
              </h1>
              <p className="ai-hero__body">
                Art-directed AI visuals for fashion and e-commerce brands. Any product, any model
                direction, any campaign world.
              </p>
              <div className="ai-hero__actions">
                <a className="ai-button ai-button--solid" href="#ai-inquiry">
                  Inquire
                </a>
                <a className="ai-button ai-button--ghost" href="#ai-work">
                  View work
                </a>
              </div>
            </motion.div>

            <motion.div className="ai-showcase" {...heroReveal}>
              <aside className="ai-showcase__column">
                <div className="ai-showcase__heading">
                  <p className="ai-kicker">You send this</p>
                  <p className="ai-showcase__lede">
                    Select a product reference to shape the output direction.
                  </p>
                </div>
                <div className="ai-product-picker" aria-label="Product references">
                  {PRODUCT_REFERENCES.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className={`ai-product-picker__item ${selectedProduct === product.id ? 'is-active' : ''}`}
                      onClick={() => setSelectedProduct(product.id)}
                    >
                      <PlaceholderFrame className="ai-placeholder--product-tile" />
                      <span className="ai-product-picker__label">{product.label}</span>
                      <span className="ai-product-picker__note">{product.note}</span>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="ai-showcase__focus">
                <div className="ai-showcase__toolbar">
                  <label className="ai-showcase__control">
                    <span className="ai-showcase__control-label">Mode</span>
                    <select className="ai-showcase__select" value={activeTier} onChange={(event) => setActiveTier(event.target.value as TierId)}>
                      <option value="campaign">Campaign</option>
                      <option value="ecomm">E-commerce</option>
                      <option value="identity">Identity</option>
                    </select>
                  </label>
                </div>
                <div className="ai-talent-switcher" role="tablist" aria-label="Model directions">
                  {talentIds.map((talentId) => (
                    <button
                      key={talentId}
                      id={`ai-talent-tab-${talentId}`}
                      type="button"
                      role="tab"
                      aria-selected={selectedTalent === talentId}
                      aria-controls={`ai-talent-panel-${talentId}`}
                      className={`ai-talent-switcher__button ${selectedTalent === talentId ? 'is-active' : ''}`}
                      onClick={() => {
                        setSelectedTalent(talentId);
                        setInquiry((current) => ({
                          ...current,
                          direction: TALENTS[talentId].name,
                        }));
                      }}
                    >
                      {TALENTS[talentId].name}
                    </button>
                  ))}
                </div>

                <div
                  id={`ai-talent-panel-${selectedTalent}`}
                  role="tabpanel"
                  aria-labelledby={`ai-talent-tab-${selectedTalent}`}
                  className="ai-showcase__portrait-card"
                >
                  <div className="ai-showcase__portrait-top">
                    <p className="ai-showcase__lens-note">Tap to activate direction mode</p>
                    <button type="button" className="ai-showcase__next" aria-label="Lock in next direction" onClick={cycleTalent}>
                      ›
                    </button>
                  </div>
                  <PlaceholderFrame className="ai-placeholder--hero-portrait" />
                  <div className="ai-showcase__portrait-meta">
                    <div>
                      <p className="ai-showcase__badge">{activeTalent.badge}</p>
                      <h2 className="ai-showcase__name">{activeTalent.name}</h2>
                    </div>
                    <p className="ai-showcase__summary">{activeTalent.short}</p>
                  </div>
                </div>
              </div>

              <aside className="ai-showcase__column">
                <div className="ai-showcase__heading">
                  <p className="ai-kicker">We deliver this</p>
                  <p className="ai-showcase__lede">
                    A campaign-ready output direction built around the selected face and product.
                  </p>
                </div>
                <div className="ai-output-card">
                  <PlaceholderFrame className="ai-placeholder--hero-output" />
                  <div className="ai-output-card__copy">
                    <p className="ai-output-card__title">{getProductOutputLabel(selectedProduct)}</p>
                    <p className="ai-output-card__meta">
                      {activeTalent.name} + {activeProduct?.label}
                    </p>
                    <p className="ai-output-card__body">{activeTalent.heroLine}</p>
                    <p className="ai-output-card__hint">Preview output direction</p>
                  </div>
                </div>
              </aside>
            </motion.div>
          </section>

          <motion.section className="ai-how" id="ai-how" aria-labelledby="ai-how-title" {...reveal}>
            <div className="ai-section-heading">
              <p className="ai-kicker">How it works</p>
              <h2 id="ai-how-title" className="ai-section-title">
                From brief to image system
              </h2>
            </div>
            <div className="ai-steps">
              {HOW_IT_WORKS.map((step) => (
                <article key={step.index} className="ai-step">
                  <p className="ai-step__index">{step.index}</p>
                  <h3 className="ai-step__title">{step.title}</h3>
                  <p className="ai-step__body">{step.body}</p>
                </article>
              ))}
            </div>
          </motion.section>

          <motion.section className="ai-compare" aria-labelledby="ai-compare-title" {...reveal}>
            <div className="ai-section-heading">
              <p className="ai-kicker">Comparison</p>
              <h2 id="ai-compare-title" className="ai-section-title">
                What a traditional process asks of you
              </h2>
            </div>
            <div className="ai-compare__table-wrap">
              <table className="ai-compare__table">
                <thead>
                  <tr>
                    <th scope="col" />
                    <th scope="col">Traditional</th>
                    <th scope="col">Maria Bordiuh AI</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <td>{row.traditional}</td>
                      <td>{row.maria}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          <motion.section className="ai-roster" id="ai-roster" aria-labelledby="ai-roster-title" {...reveal}>
            <div className="ai-section-heading">
              <p className="ai-kicker">Roster</p>
              <h2 id="ai-roster-title" className="ai-section-title">
                Three model directions, one coherent system
              </h2>
            </div>
            <div className="ai-roster__grid">
              {(Object.keys(TALENTS) as TalentId[]).map((talentId) => {
                const talent = TALENTS[talentId];
                const isActive = selectedTalent === talentId;

                return (
                  <article key={talentId} className={`ai-roster-card ${isActive ? 'is-active' : ''}`}>
                    <div className="ai-roster-card__media">
                      <PlaceholderFrame className="ai-placeholder--roster" />
                    </div>
                    <div className="ai-roster-card__header">
                      <div>
                        <p className="ai-roster-card__detail-tag">Details</p>
                        <p className="ai-roster-card__eyebrow">{talent.badge}</p>
                        <h3 className="ai-roster-card__title">{talent.name}</h3>
                      </div>
                      <p className="ai-roster-card__subtitle">{talent.rosterTitle}</p>
                    </div>
                    <dl className="ai-roster-card__specs">
                      {talent.stats.map((stat) => (
                        <div key={stat.term} className="ai-roster-card__spec">
                          <dt>{stat.term}</dt>
                          <dd>{stat.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <button
                      type="button"
                      className="ai-roster-card__action"
                      onClick={() => {
                        setSelectedTalent(talentId);
                        setInquiry((current) => ({
                          ...current,
                          direction: talent.name,
                        }));
                      }}
                    >
                      {isActive ? 'Live in showcase' : 'Preview direction'}
                    </button>
                  </article>
                );
              })}
            </div>
            <a className="ai-roster__link" href="#ai-book">
              View full directions →
            </a>
          </motion.section>

          <motion.section className="ai-pricing" id="ai-pricing" aria-labelledby="ai-pricing-title" {...reveal}>
            <div className="ai-section-heading">
              <p className="ai-kicker">Services</p>
              <h2 id="ai-pricing-title" className="ai-section-title">
                Three ways to use it
              </h2>
            </div>
            <div className="ai-pricing__shell">
              <div className="ai-pricing__tabs" role="tablist" aria-label="Service tiers">
                {(Object.keys(SERVICE_TIERS) as TierId[]).map((tierId) => (
                  <button
                    key={tierId}
                    id={`ai-tier-tab-${tierId}`}
                    type="button"
                    role="tab"
                    aria-selected={activeTier === tierId}
                    aria-controls={`ai-tier-panel-${tierId}`}
                    className={`ai-pricing__tab ${activeTier === tierId ? 'is-active' : ''}`}
                    onClick={() => setActiveTier(tierId)}
                  >
                    {SERVICE_TIERS[tierId].name}
                  </button>
                ))}
              </div>
              <div
                id={`ai-tier-panel-${activeTier}`}
                role="tabpanel"
                aria-labelledby={`ai-tier-tab-${activeTier}`}
                className="ai-pricing__panel"
              >
                <div className="ai-pricing__panel-copy">
                  <h3 className="ai-pricing__panel-title">{activeTierData.name}</h3>
                  <p className="ai-pricing__panel-body">{activeTierData.blurb}</p>
                </div>
                <ul className="ai-pricing__list">
                  {activeTierData.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <p className="ai-pricing__from">From inquiry</p>
                <a className="ai-button ai-button--ghost" href="#ai-inquiry">
                  {activeTierData.cta}
                </a>
              </div>
            </div>
          </motion.section>

          <motion.section className="ai-work" id="ai-work" aria-labelledby="ai-work-title" {...reveal}>
            <div className="ai-section-heading">
              <p className="ai-kicker">Example work</p>
              <h2 id="ai-work-title" className="ai-section-title">
                Output directions for a brand-ready page
              </h2>
            </div>
            <div className="ai-work__grid">
              {EXAMPLE_WORK.map((example) => (
                <article key={example.title} className="ai-work-card">
                  <PlaceholderFrame className="ai-placeholder--work" />
                  <div className="ai-work-card__copy">
                    <h3 className="ai-work-card__title">{example.title}</h3>
                    <p className="ai-work-card__detail">{example.detail}</p>
                    <p className="ai-work-card__link">View example</p>
                  </div>
                </article>
              ))}
            </div>
          </motion.section>

          <motion.section className="ai-bottom-cta" aria-labelledby="ai-bottom-cta-title" {...reveal}>
            <div className="ai-bottom-cta__inner">
              <p className="ai-kicker">Ready for the next set?</p>
              <h2 id="ai-bottom-cta-title" className="ai-section-title">
                Start with the brief
              </h2>
              <a className="ai-button ai-button--solid" href="#ai-inquiry">
                Go to inquiry
              </a>
            </div>
          </motion.section>

          <motion.section className="ai-book" id="ai-book" aria-labelledby="ai-book-title" {...reveal}>
            <div className="ai-book__header">
              <p className="ai-kicker">Book</p>
              <h2 id="ai-book-title" className="ai-section-title">
                Join the inquiry list
              </h2>
              <p className="ai-book__body">
                Send the product, references, timing, and direction. The first reply starts with
                what you actually need.
              </p>
            </div>

            <form className="ai-form" id="ai-inquiry" onSubmit={handleInquirySubmit}>
              <div className="ai-form__row">
                <label className="ai-form__field" htmlFor="ai-email">
                  <span className="ai-form__label">Email</span>
                  <input
                    id="ai-email"
                    className="ai-form__input"
                    name="email"
                    type="email"
                    placeholder="you@brand.com"
                    autoComplete="email"
                    value={inquiry.email}
                    onChange={(event) =>
                      setInquiry((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </label>
                <label className="ai-form__field" htmlFor="ai-name">
                  <span className="ai-form__label">Your name</span>
                  <input
                    id="ai-name"
                    className="ai-form__input"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={inquiry.name}
                    onChange={(event) =>
                      setInquiry((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="ai-form__group">
                <p className="ai-form__label">Which direction are you interested in?</p>
                <div className="ai-chip-group" role="list">
                  {(Object.keys(TALENTS) as TalentId[]).map((talentId) => (
                    <button
                      key={talentId}
                      type="button"
                      className={`ai-chip ${inquiry.direction === TALENTS[talentId].name ? 'is-active' : ''}`}
                      onClick={() =>
                        setInquiry((current) => ({
                          ...current,
                          direction: TALENTS[talentId].name,
                        }))
                      }
                    >
                      {TALENTS[talentId].name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ai-form__group">
                <p className="ai-form__label">What do you need?</p>
                <div className="ai-chip-group" role="list">
                  {PROJECT_TYPES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`ai-chip ${inquiry.projectType === option.label ? 'is-active' : ''}`}
                      onClick={() =>
                        setInquiry((current) => ({
                          ...current,
                          projectType: option.label,
                        }))
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ai-form__group">
                <p className="ai-form__label">Where are you selling?</p>
                <div className="ai-chip-group" role="list">
                  {CHANNELS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`ai-chip ${inquiry.channel === option.label ? 'is-active' : ''}`}
                      onClick={() =>
                        setInquiry((current) => ({
                          ...current,
                          channel: option.label,
                        }))
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="ai-form__field" htmlFor="ai-brand-url">
                <span className="ai-form__label">Where can we see your brand?</span>
                <input
                  id="ai-brand-url"
                  className="ai-form__input"
                  name="brandUrl"
                  type="url"
                  placeholder="Website or Instagram"
                  value={inquiry.brandUrl}
                  onChange={(event) =>
                    setInquiry((current) => ({ ...current, brandUrl: event.target.value }))
                  }
                />
              </label>

              <label className="ai-form__field" htmlFor="ai-brief">
                <span className="ai-form__label">Brief</span>
                <textarea
                  id="ai-brief"
                  className="ai-form__textarea"
                  name="brief"
                  rows={6}
                  value={inquiry.brief}
                  onChange={(event) =>
                    setInquiry((current) => ({ ...current, brief: event.target.value }))
                  }
                />
              </label>

              <button className="ai-button ai-button--solid ai-form__submit" type="submit">
                Send inquiry
              </button>
            </form>
          </motion.section>
        </main>

        <footer className="ai-footer">
          <div className="ai-footer__cta">
            <p className="ai-kicker">Maria Bordiuh AI</p>
            <p className="ai-footer__line">Campaign visuals for fashion and e-commerce brands.</p>
          </div>
          <nav className="ai-footer__nav" aria-label="AI page footer">
            <PrefetchLink to="/">Home</PrefetchLink>
            <PrefetchLink to="/work">Work</PrefetchLink>
            <PrefetchLink to="/ai">AI</PrefetchLink>
            <a href="mailto:projects@mariabordiuh.com">Say hi</a>
            <PrefetchLink to="/impressum">Impressum</PrefetchLink>
            <PrefetchLink to="/datenschutz">Datenschutz</PrefetchLink>
          </nav>
        </footer>
      </div>
    </>
  );
};
