import { LegalPageShell } from '../components/LegalPageShell';

const IMPRESSUM_ROWS = [
  ['Name', 'Mariia Bordiuh'],
  ['Anschrift', 'Bei der Hammer Kirche 5, 20535 Hamburg, Deutschland'],
  ['Telefon', '+49 162 2057749'],
  ['E-Mail', 'mariabordiuh@gmail.com'],
] as const;

export const Impressum = () => (
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
              <dd className="mt-1 text-sm leading-relaxed text-white/82">
                {label === 'Telefon' ? (
                  <a href="tel:+491622057749" className="transition-colors hover:text-white">
                    {value}
                  </a>
                ) : label === 'E-Mail' ? (
                  <a
                    href="mailto:mariabordiuh@gmail.com"
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
          <p className="mt-3 text-sm leading-relaxed text-white/68">
            Ich bin weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </div>

        <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.02] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-brand-accent">
            Kurz gesagt
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/68">
            Diese Seite ist mein berufliches Portfolio, daher braucht sie ein echtes Impressum und
            keine generischen Platzhalter.
          </p>
        </div>
      </aside>
    </div>
  </LegalPageShell>
);
