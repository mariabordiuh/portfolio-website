import { ArrowUpRight, Mail } from 'lucide-react';
import { RevealOnScroll } from '../components/RevealOnScroll';

const collaborationNotes = [
  {
    label: 'Open for',
    value: 'Art direction, motion direction, AI visuals, and launch worlds that need a strong visual point of view.',
  },
  {
    label: 'Best with',
    value: 'Brands, agencies, and creative teams who want taste, systems thinking, and someone who can actually make the thing.',
  },
  {
    label: 'Response vibe',
    value: 'Usually back within a couple of days. Based in Hamburg, happy to work remotely.',
  },
];

export const ContactCTA = () => {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-28 md:px-12 md:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,158,187,0.12),transparent_26%),radial-gradient(circle_at_82%_68%,rgba(255,158,187,0.08),transparent_30%)]"
      />
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] xl:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-white/48">
                Contact // selective collaborations
              </p>
              <h2 className="mt-4 max-w-[13ch] font-display text-[clamp(1.9rem,3.6vw,3.45rem)] font-normal uppercase leading-[1.08] tracking-[0.02em] text-white">
                Open for sharp, visual projects<span className="text-brand-accent">.</span>
              </h2>
              <p className="mt-5 max-w-[42rem] text-[1rem] leading-relaxed text-white/66 md:text-[1.12rem]">
                If the brief needs art direction, motion, AI visuals, or a slightly nerdier
                production brain, I’m usually interested.
              </p>

              <div className="mt-10 grid gap-5 border-t border-white/8 pt-5 sm:grid-cols-3">
                {collaborationNotes.map((note) => (
                  <div key={note.label} className="space-y-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/44">
                      {note.label}
                    </p>
                    <p className="text-sm leading-relaxed text-white/62">{note.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="relative overflow-hidden rounded-[2.1rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,158,187,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_55%)]"
              />
              <div className="relative">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/48">
                      Start here
                    </p>
                    <p className="mt-4 max-w-[15ch] font-display text-[clamp(1.35rem,2.5vw,2rem)] font-normal uppercase leading-[1.12] tracking-[0.02em] text-white">
                      Tell me what you’re making.
                    </p>
                  </div>
                  <span className="mt-1 h-3 w-3 rounded-full bg-brand-accent shadow-[0_0_0_10px_rgba(var(--accent-rgb),0.12)]" />
                </div>

                <div className="mt-8 space-y-3 border-t border-white/8 pt-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">
                    Email
                  </p>
                  <a
                    href="mailto:mariabordiuh@gmail.com"
                    data-click-sound="true"
                    className="inline-flex items-center gap-3 text-sm text-white/78 transition-colors hover:text-white"
                  >
                    <Mail size={16} className="text-brand-accent" />
                    mariabordiuh@gmail.com
                  </a>
                </div>

                <div className="mt-8 flex flex-col gap-3 font-mono text-[10px] font-black uppercase tracking-[0.22em] sm:flex-row">
                  <a
                    href="mailto:mariabordiuh@gmail.com"
                    data-click-sound="true"
                    className="btn-gradient-shift px-6 py-4"
                  >
                    Email me
                    <ArrowUpRight size={14} />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/mariia-bordiuh/"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-click-sound="true"
                    className="btn-glass-shift px-6 py-4"
                  >
                    LinkedIn
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};
