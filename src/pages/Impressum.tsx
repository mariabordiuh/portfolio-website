import { LegalPageShell } from '../components/LegalPageShell';
import { Seo } from '../components/Seo';
import { GENERAL_EMAIL, GENERAL_MAILTO } from '../lib/contact';

const IMPRESSUM_ROWS = [
  ['Name', 'Mariia Bordiuh'],
  ['Anschrift', 'Bei der Hammer Kirche 5, 20535 Hamburg, Deutschland'],
  ['Telefon', '+49 162 2057749'],
  ['E-Mail', GENERAL_EMAIL],
] as const;

export const Impressum = () => (
  <>
    <Seo
      title="Impressum — Maria Bordiuh"
      description="Impressum gemaess Paragraph 5 DDG for mariabordiuh.com, with the legally required provider information for Maria Bordiuh."
      canonicalPath="/impressum"
      image="/media/home-hero-cat-laptop.jpg"
      imageWidth={1920}
      imageHeight={960}
      imageAlt="Impressum for Maria Bordiuh"
    />
    <LegalPageShell
      eyebrow="Legal"
      title="Impressum"
      intro="Angaben gemäß § 5 DDG für mariabordiuh.com. Diese Seite enthält die gesetzlich erforderlichen Anbieterinformationen für mein Portfolio."
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/48">
            Angaben gemäß § 5 DDG
          </p>

          <dl className="mt-6 space-y-5">
            {IMPRESSUM_ROWS.map(([label, value]) => (
              <div key={label}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/38">
                  {label}
                </dt>
                <dd className="mt-1 text-[0.98rem] leading-[1.68] text-white/84">
                  {label === 'Telefon' ? (
                    <a href="tel:+491622057749" className="transition-colors hover:text-white">
                      {value}
                    </a>
                  ) : label === 'E-Mail' ? (
                    <a
                      href={GENERAL_MAILTO}
                      className="transition-colors hover:text-white"
                    >
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </article>

        <aside className="space-y-4">
          <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.02] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-brand-accent">
              Verbraucherstreitbeilegung
            </p>
            <p className="mt-3 text-[0.98rem] leading-[1.68] text-white/74">
              Ich bin weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.02] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-brand-accent">
              Kurz gesagt
            </p>
            <p className="mt-3 text-[0.98rem] leading-[1.68] text-white/74">
              Diese Seite ist mein berufliches Portfolio, daher braucht sie ein echtes Impressum und
              keine generischen Platzhalter.
            </p>
          </div>
        </aside>
      </div>
    </LegalPageShell>
  </>
);
