import { useState, type FormEvent } from 'react';
import { CALENDLY_LINK, CAL_LINK, CONTACT_EMAIL, ROSTER, SIGNOFF, WHATSAPP_NUMBER } from '../data';
import { c, type Copy, type Lang } from '../i18n';

type BookingSectionProps = {
  tx: (copy: Copy) => string;
  lang: Lang;
  preferredIdentity: string;
};

const COPY = {
  title: c('Send us a photo.', 'Schicken Sie uns ein Foto.'),
  sub: c('We’ll show you what it becomes. Free.', 'Wir zeigen Ihnen, was daraus wird. Kostenlos.'),
  whatsapp: c('WhatsApp', 'WhatsApp'),
  waPrefill: c(
    'Hi Maria! I’d like a free test shoot.',
    'Hallo Maria! Ich interessiere mich für ein Gratis-Testshooting.',
  ),
  callTitle: c('Book a 15-min call', '15-Minuten-Call buchen'),
  callOpenNewTab: c('Open in a new tab ↗', 'In neuem Tab öffnen ↗'),
  callFallback: c(
    'Calendar booking is being set up — email us and you’ll get times back.',
    'Die Kalenderbuchung wird eingerichtet — schreiben Sie uns, Sie erhalten Terminvorschläge.',
  ),
  emailCta: c('Email us', 'Per E-Mail'),
  formTitle: c('Free test shoot', 'Gratis-Testshooting'),
  formSub: c('1 product → 1 finished image in 48h.', '1 Produkt → 1 fertiges Bild in 48h.'),
  name: c('Name', 'Name'),
  email: c('Work email', 'Geschäftliche E-Mail'),
  product: c('Link to a product photo (or product page)', 'Link zu einem Produktfoto (oder Produktseite)'),
  identity: c('Preferred model (optional)', 'Bevorzugtes Model (optional)'),
  send: c('Request the free test shoot', 'Gratis-Testshooting anfragen'),
  privacy: c(
    'Used only to produce and deliver your test shoot. No newsletter, no spam.',
    'Nur zur Erstellung und Lieferung Ihres Test-Shootings. Kein Newsletter, kein Spam.',
  ),
};

export const BookingSection = ({ tx, lang, preferredIdentity }: BookingSectionProps) => {
  const [form, setForm] = useState({ name: '', email: '', product: '', identity: preferredIdentity });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject =
      lang === 'de'
        ? `Gratis-Testshooting — ${form.name || 'Anfrage'}`
        : `Free test shoot — ${form.name || 'request'}`;
    const body = [
      `Name: ${form.name || '-'}`,
      `Email: ${form.email || '-'}`,
      `Product photo / page: ${form.product || '-'}`,
      `Preferred model: ${form.identity || '-'}`,
      `Language: ${lang}`,
    ].join('\n');
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const waHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(tx(COPY.waPrefill))}`
    : '';

  // Calendly is preferred (real link on file); Cal.com is a legacy fallback;
  // email is the last resort if neither scheduling tool is configured.
  const schedulingUrl = CALENDLY_LINK || (CAL_LINK ? `https://app.cal.com/${CAL_LINK}` : '');
  const embedSrc = CALENDLY_LINK
    ? `${CALENDLY_LINK}?hide_gdpr_banner=1&background_color=101a3e&text_color=eef1f8&primary_color=d6de5c`
    : CAL_LINK
      ? `https://app.cal.com/${CAL_LINK}?embed=true&theme=dark`
      : '';
  const emailCallHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(lang === 'de' ? 'Call-Anfrage — Maria Bordiuh AI' : 'Call request — Maria Bordiuh AI')}`;

  return (
    <section className="ai-contact" id="ai-kontakt" aria-labelledby="ai-contact-title">
      <div className="ai-contact__panel">
        <div className="ai-contact__head">
          <h2 id="ai-contact-title" className="ai-contact__title">
            {tx(COPY.title)}
          </h2>
          <p className="ai-contact__sub">{tx(COPY.sub)}</p>
        </div>

        <div className="ai-contact__actions">
          <a className="ai-btn ai-btn--invert" href="#ai-test-shoot">
            {tx(COPY.formTitle)}
          </a>
          {waHref ? (
            <a className="ai-btn ai-btn--outline-light" href={waHref} target="_blank" rel="noopener noreferrer">
              {tx(COPY.whatsapp)}
            </a>
          ) : null}
          <a className="ai-btn ai-btn--outline-light" href="#ai-call">
            {tx(COPY.callTitle)}
          </a>
        </div>

        <div className="ai-contact__panels">
          <div className="ai-contact__panel ai-contact__panel--cal" id="ai-call">
            <div className="ai-contact__form-head">
              <h3 className="ai-contact__form-title">{tx(COPY.callTitle)}</h3>
              {schedulingUrl ? (
                <p className="ai-contact__form-sub">
                  <a href={schedulingUrl} target="_blank" rel="noopener noreferrer" className="ai-contact__cal-open">
                    {tx(COPY.callOpenNewTab)}
                  </a>
                </p>
              ) : null}
            </div>
            {embedSrc ? (
              <iframe
                className="ai-contact__cal-frame"
                src={embedSrc}
                title={tx(COPY.callTitle)}
                loading="lazy"
              />
            ) : (
              <p className="ai-contact__form-sub">{tx(COPY.callFallback)}</p>
            )}
          </div>

          <form className="ai-contact__form ai-contact__panel" id="ai-test-shoot" onSubmit={handleSubmit}>
            <div className="ai-contact__form-head">
              <h3 className="ai-contact__form-title">{tx(COPY.formTitle)}</h3>
              <p className="ai-contact__form-sub">{tx(COPY.formSub)}</p>
            </div>
            <div className="ai-field-row">
              <label className="ai-field">
                <span>{tx(COPY.name)}</span>
                <input type="text" required value={form.name} onChange={(event) => update('name')(event.target.value)} />
              </label>
              <label className="ai-field">
                <span>{tx(COPY.email)}</span>
                <input type="email" required value={form.email} onChange={(event) => update('email')(event.target.value)} />
              </label>
            </div>
            <label className="ai-field">
              <span>{tx(COPY.product)}</span>
              <input type="text" required placeholder="https://" value={form.product} onChange={(event) => update('product')(event.target.value)} />
            </label>
            <label className="ai-field">
              <span>{tx(COPY.identity)}</span>
              <select value={form.identity} onChange={(event) => update('identity')(event.target.value)}>
                <option value="">—</option>
                {ROSTER.map((identity) => (
                  <option key={identity.id} value={identity.name}>
                    {identity.name}
                  </option>
                ))}
                <option value="Custom">Custom</option>
              </select>
            </label>
            <button type="submit" className="ai-btn ai-btn--invert ai-btn--block">
              {tx(COPY.send)}
            </button>
            <p className="ai-contact__privacy">{tx(COPY.privacy)}</p>
            {!schedulingUrl ? (
              <p className="ai-contact__privacy">
                <a className="ai-contact__cal-open" href={emailCallHref}>
                  {tx(COPY.emailCta)}
                </a>
              </p>
            ) : null}
          </form>
        </div>

        <div className="ai-contact__signoff">
          <p className="ai-contact__signoff-text">
            <strong>{tx(SIGNOFF.intro)}</strong> {tx(SIGNOFF.line)}
          </p>
        </div>
      </div>
    </section>
  );
};
