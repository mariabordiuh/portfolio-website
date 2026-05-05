import { useEffect, useMemo } from 'react';
import { ArrowUpRight, ExternalLink, Mail } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { PrefetchLink } from '../components/PrefetchLink';
import { PageTransition } from '../components/PageTransition';
import { db } from '../firebase-firestore';

const OMR_VISIT_SESSION_KEY = 'omr-visit-tracked';

const STATEMENTS = [
  'Art direction with roots in design and animation.',
  'AI visuals and creative-tech workflows when they sharpen the idea.',
  'Selected work, process, and a human behind the screen.',
];

const QUICK_LINKS = [
  {
    label: 'See selected work',
    to: '/work',
    variant: 'primary' as const,
  },
  {
    label: 'Why work with me',
    to: '/about',
    variant: 'secondary' as const,
  },
  {
    label: 'Say hi',
    href: 'mailto:mariabordiuh@gmail.com',
    variant: 'tertiary' as const,
  },
] as const;

export const Omr = () => {
  const source = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'direct';
    }

    const params = new URLSearchParams(window.location.search);
    return params.get('src') || 'direct';
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const trackedSources = JSON.parse(window.sessionStorage.getItem(OMR_VISIT_SESSION_KEY) ?? '[]') as string[];
      if (trackedSources.includes(source)) {
        return;
      }

      trackedSources.push(source);
      window.sessionStorage.setItem(OMR_VISIT_SESSION_KEY, JSON.stringify(trackedSources));

      void addDoc(collection(db, 'omrVisits'), {
        source,
        path: window.location.pathname,
        referrer: document.referrer || '',
        userAgent: navigator.userAgent,
        locale: navigator.language,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        createdAt: new Date().toISOString(),
      }).catch((error) => {
        console.warn('Could not track OMR visit', error);
      });
    } catch (error) {
      console.warn('Could not store OMR visit session state', error);
    }
  }, [source]);

  return (
    <PageTransition>
      <section className="omr-page relative min-h-[100svh] overflow-hidden bg-[#06060a] text-white">
        <div className="omr-grid-scene absolute inset-0" aria-hidden="true" />
        <div className="omr-noise-overlay absolute inset-0 opacity-45" aria-hidden="true" />
        <div className="omr-glow omr-glow--left" aria-hidden="true" />
        <div className="omr-glow omr-glow--right" aria-hidden="true" />
        <div className="omr-scan-line" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col px-6 pb-14 pt-8 md:px-10 md:pb-18 md:pt-10 xl:px-14">
          <header className="flex items-center justify-between border-b border-white/10 pb-4">
            <PrefetchLink
              to="/"
              className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/72 transition-colors hover:text-brand-accent"
            >
              Maria Bordiuh
            </PrefetchLink>

            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/42">
              OMR landing page
            </span>
          </header>

          <div className="grid min-h-[calc(100svh-8rem)] flex-1 gap-14 py-10 xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-end xl:gap-16">
            <div className="flex max-w-[54rem] flex-col justify-end">
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.36em] text-white/58">
                OMR / quick intro
              </p>

              <h1 className="max-w-[11ch] font-display text-[clamp(3.15rem,9vw,8.75rem)] font-bold uppercase leading-[0.86] tracking-[-0.055em] text-white">
                Maria
                <br />
                Bordiuh<span className="text-brand-accent">.</span>
              </h1>

              <p className="mt-6 max-w-[38rem] text-[clamp(1rem,0.85rem+0.48vw,1.28rem)] leading-relaxed text-white/72">
                Art direction, motion, AI visuals, and creative tech for brand worlds that need
                both taste and systems.
              </p>

              <div className="mt-8 grid max-w-[45rem] gap-3 sm:grid-cols-3">
                {STATEMENTS.map((statement) => (
                  <p
                    key={statement}
                    className="border-t border-white/10 pt-3 font-mono text-[11px] leading-relaxed text-white/52"
                  >
                    {statement}
                  </p>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                {QUICK_LINKS.map((link) => {
                  const className =
                    link.variant === 'primary'
                      ? 'btn-gradient-shift px-7 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]'
                      : link.variant === 'secondary'
                        ? 'btn-glass-shift px-7 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]'
                        : 'inline-flex items-center justify-center gap-3 rounded-full border border-white/12 bg-transparent px-7 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white/76 transition-colors hover:border-brand-accent/50 hover:text-white';

                  if ('to' in link) {
                    return (
                      <PrefetchLink
                        key={link.label}
                        to={link.to}
                        data-click-sound="true"
                        className={className}
                      >
                        {link.label}
                        <ArrowUpRight size={16} />
                      </PrefetchLink>
                    );
                  }

                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      data-click-sound="true"
                      className={className}
                    >
                      {link.label}
                      <Mail size={15} />
                    </a>
                  );
                })}
              </div>
            </div>

            <aside className="flex xl:justify-end">
              <div className="omr-poster relative w-full max-w-[26rem] overflow-hidden rounded-[2rem] border border-white/12 bg-black/30 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0)_30%,rgba(255,87,112,0.08))]" />
                <div className="relative">
                  <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-brand-accent">
                    Meet Maria at OMR
                  </p>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="max-w-[12ch] text-[clamp(1.8rem,4vw,2.5rem)] font-semibold leading-[0.95] text-white normal-case">
                        Start here if we just met.
                      </h2>
                      <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-white/58">
                        The shortest route into selected case studies, visual systems, experiments,
                        and why I work the way I do.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-[1.35rem] border border-white/12 bg-white/[0.03] p-4">
                    <div className="grid gap-3">
                      <a
                        href="https://mariabordiuh.com/work"
                        className="group flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-brand-accent/45 hover:bg-white/[0.05]"
                      >
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
                            First stop
                          </p>
                          <p className="mt-1 text-sm text-white/84">Selected work</p>
                        </div>
                        <ExternalLink size={15} className="text-white/42 transition-colors group-hover:text-brand-accent" />
                      </a>

                      <a
                        href="https://mariabordiuh.com/about"
                        className="group flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-brand-accent/45 hover:bg-white/[0.05]"
                      >
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
                            Then
                          </p>
                          <p className="mt-1 text-sm text-white/84">Why work with me</p>
                        </div>
                        <ExternalLink size={15} className="text-white/42 transition-colors group-hover:text-brand-accent" />
                      </a>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/48">
                          Direct link
                        </p>
                        <p className="mt-1 text-sm text-white/82">mariabordiuh.com/omr</p>
                      </div>

                      <span className="inline-flex items-center rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/52">
                        Source: {source}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-2 text-[11px] text-white/48 sm:grid-cols-2">
                    <p className="border-t border-white/10 pt-3">
                      Design, animation, and art direction roots.
                    </p>
                    <p className="border-t border-white/10 pt-3">
                      AI tools and vibecoding where they genuinely help.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};
