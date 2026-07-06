import { useState, type FormEvent } from 'react';
import { CAL_LINK, CONTACT_EMAIL, ROSTER } from '../data';
import { c, type Copy, type Lang } from '../i18n';

type BookingSectionProps = {
  tx: (copy: Copy) => string;
  lang: Lang;
  preferredIdentity: string;
};

const COPY = {
  kicker: c('Book', 'Termin'),
  title: c('Talk to us — or skip the call entirely', 'Sprechen Sie mit uns — oder überspringen Sie den Call'),
  body: c(
    'Book a 15-minute call, or go straight to a free test shoot — send one product photo and judge the result before we ever talk.',
    'Buchen Sie einen 15-Minuten-Call — oder starten Sie direkt mit dem kostenlosen Test-Shooting: ein Produktfoto senden, Ergebnis beurteilen, bevor wir überhaupt sprechen.',
  ),
  calTitle: c('Book a 15-min call', '15-Minuten-Call buchen'),
  calFallback: c(
    'Calendar booking is being set up — email us and you’ll get a reply with available times.',
    'Die Kalenderbuchung wird gerade eingerichtet — schreiben Sie uns, Sie erhalten eine Antwort mit Terminvorschlägen.',
  ),
  emailCta: c('Email us instead', 'Lieber per E-Mail'),
  testTitle: c('Free test shoot', 'Kostenloses Test-Shooting'),
  testBody: c(
    '1 product → 2 finished images in 48h. Free. You keep the images.',
    '1 Produkt → 2 fertige Bilder in 48h. Kostenlos. Die Bilder gehören Ihnen.',
  ),
  name: c('Name', 'Name'),
  email: c('Work email', 'Geschäftliche E-Mail'),
  brand: c('Brand / shop URL', 'Marken- / Shop-URL'),
  product: c('Link to a product photo (or paste a product page URL)', 'Link zu einem Produktfoto (oder Produktseiten-URL)'),
  identity: c('Preferred model direction (optional)', 'Bevorzugte Model-Richtung (optional)'),
  send: c('Request the free test shoot', 'Kostenloses Test-Shooting anfragen'),
  privacy: c(
    'Your data is used only to produce and deliver the test shoot. No newsletter, no spam.',
    'Ihre Daten werden nur zur Erstellung und Lieferung des Test-Shootings verwendet. Kein Newsletter, kein Spam.',
  ),
};

export const BookingSection = ({ tx, lang, preferredIdentity }: BookingSectionProps) => {
  const [form, setForm] = useState({ name: '', email: '', brand: '', product: '', identity: preferredIdentity });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject =
      lang === 'de'
        ? `Kostenloses Test-Shooting — ${form.name || form.brand || 'Anfrage'}`
        : `Free test shoot — ${form.name || form.brand || 'request'}`;
    const body = [
      `Name: ${form.name || '-'}`,
      `Email: ${form.email || '-'}`,
      `Brand: ${form.brand || '-'}`,
      `Product photo / page: ${form.product || '-'}`,
      `Preferred direction: ${form.identity || '-'}`,
      `Language: ${lang}`,
    ].join('\n');
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <section className="ai-book" id="ai-book" aria-labelledby="ai-book-title">
      <div className="ai-book__header">
        <p className="ai-kicker">{tx(COPY.kicker)}</p>
        <h2 id="ai-book-title" className="ai-section-title">
          {tx(COPY.title)}
        </h2>
        <p className="ai-book__body">{tx(COPY.body)}</p>
      </div>

      <div className="ai-book__grid">
        <div className="ai-book__panel" id="ai-call">
          <h3 className="ai-book__panel-title">{tx(COPY.calTitle)}</h3>
          {CAL_LINK ? (
            <iframe
              className="ai-book__cal"
              src={`https://app.cal.com/${CAL_LINK}?embed=true&theme=dark&hide_landing_page_details=1`}
              title={tx(COPY.calTitle)}
              loading="lazy"
            />
          ) : (
            <div className="ai-book__cal-fallback">
              <p>{tx(COPY.calFallback)}</p>
              <a className="ai-button ai-button--ghost" href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(lang === 'de' ? 'Call-Anfrage — Maria Bordiuh AI' : 'Call request — Maria Bordiuh AI')}`}>
                {tx(COPY.emailCta)}
              </a>
            </div>
          )}
        </div>

        <div className="ai-book__panel ai-book__panel--test" id="ai-test-shoot">
          <h3 className="ai-book__panel-title">{tx(COPY.testTitle)}</h3>
          <p className="ai-book__panel-body">{tx(COPY.testBody)}</p>
          <form className="ai-form" onSubmit={handleSubmit}>
            <div className="ai-form__row">
              <label className="ai-form__field">
                <span>{tx(COPY.name)}</span>
                <input type="text" required value={form.name} onChange={(event) => update('name')(event.target.value)} />
              </label>
              <label className="ai-form__field">
                <span>{tx(COPY.email)}</span>
                <input type="email" required value={form.email} onChange={(event) => update('email')(event.target.value)} />
              </label>
            </div>
            <label className="ai-form__field">
              <span>{tx(COPY.brand)}</span>
              <input type="url" placeholder="https://" value={form.brand} onChange={(event) => update('brand')(event.target.value)} />
            </label>
            <label className="ai-form__field">
              <span>{tx(COPY.product)}</span>
              <input type="text" required value={form.product} onChange={(event) => update('product')(event.target.value)} />
            </label>
            <label className="ai-form__field">
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
            <button type="submit" className="ai-button ai-button--solid">
              {tx(COPY.send)}
            </button>
            <p className="ai-form__privacy">{tx(COPY.privacy)}</p>
          </form>
        </div>
      </div>
    </section>
  );
};
