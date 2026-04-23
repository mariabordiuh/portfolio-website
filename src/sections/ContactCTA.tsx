import { ArrowUpRight, Mail } from 'lucide-react';
import { RevealOnScroll } from '../components/RevealOnScroll';

export const ContactCTA = () => {
  return (
    <section className="px-6 py-32 md:px-12 md:py-44">
      <RevealOnScroll>
        <div className="mx-auto max-w-6xl">
          <div className="hidden min-h-[34rem] grid-cols-[minmax(0,1fr)_19rem] items-center gap-16 md:grid">
            <div className="relative">
              <div className="absolute -left-8 top-10 h-28 w-28 rounded-full border border-brand-accent/25 opacity-50" />
              <div className="absolute left-[52%] top-4 h-20 w-20 rounded-full border border-white/10 opacity-60" />
              <div className="absolute bottom-2 left-20 h-24 w-24 rounded-full bg-brand-accent/10 blur-2xl" />

              <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.4em] text-brand-muted">
                Studio note
              </p>
              <h2 className="relative max-w-4xl text-6xl font-black uppercase leading-[0.88] tracking-tighter lg:text-8xl">
                Available for
                <br />
                selected projects<span className="text-brand-accent">.</span>
              </h2>
              <p className="relative mt-10 max-w-xl text-base leading-relaxed text-white/62">
                I collaborate with brands, agencies, and creative teams on art direction,
                generative image systems, motion, and visual production.
              </p>

              <div className="relative mt-12 flex items-center gap-8 font-mono text-[10px] font-black uppercase tracking-[0.22em]">
                <a
                  href="mailto:mariabordiuh@gmail.com"
                  className="group inline-flex items-center gap-3 text-white transition-colors hover:text-brand-accent"
                >
                  Email me
                  <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/mariia-bordiuh/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 text-brand-muted transition-colors hover:text-white"
                >
                  LinkedIn
                  <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </div>

            <aside className="relative rotate-2 rounded-[1.4rem] border border-white/10 bg-[#f3eadf] p-7 text-[#100d0b] shadow-[0_22px_80px_rgba(0,0,0,0.4)]">
              <span className="absolute -top-5 left-1/2 h-10 w-24 -translate-x-1/2 rotate-[-4deg] rounded-sm bg-brand-accent/70 shadow-[0_10px_30px_rgba(0,0,0,0.25)]" />
              <div className="mb-10 flex items-start justify-between gap-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/45">
                    Art Director
                  </p>
                  <p className="mt-4 font-mono text-2xl font-bold uppercase leading-none tracking-[-0.05em]">
                    Maria Bordiuh
                  </p>
                </div>
                <span className="h-3 w-3 rounded-full bg-brand-accent shadow-[0_0_0_8px_rgba(243,154,198,0.18)]" />
              </div>

              <p className="border-y border-black/15 py-7 font-mono text-[10px] uppercase leading-loose tracking-[0.18em] text-black/55">
                Art direction / AI image systems / motion / visual production
              </p>

              <a
                href="mailto:mariabordiuh@gmail.com"
                className="mt-8 inline-flex items-center gap-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#100d0b] transition-colors hover:text-brand-accent"
              >
                <Mail size={14} />
                mariabordiuh@gmail.com
              </a>
            </aside>
          </div>

          <div className="md:hidden">
            <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.4em] text-brand-muted">
              Studio note
            </p>
            <h2 className="text-4xl font-black uppercase leading-[0.9] tracking-tighter">
              Available for
              <br />
              selected projects<span className="text-brand-accent">.</span>
            </h2>
            <p className="mt-8 text-sm leading-relaxed text-white/62">
              I collaborate with brands, agencies, and creative teams on art direction,
              generative image systems, motion, and visual production.
            </p>

            <div className="mt-10 flex flex-col gap-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]">
              <a
                href="mailto:mariabordiuh@gmail.com"
                className="inline-flex items-center justify-between rounded-full bg-white px-7 py-4 text-black"
              >
                Email me
                <ArrowUpRight size={14} />
              </a>
              <a
                href="https://www.linkedin.com/in/mariia-bordiuh/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between rounded-full border border-white/10 px-7 py-4 text-white"
              >
                LinkedIn
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
};
