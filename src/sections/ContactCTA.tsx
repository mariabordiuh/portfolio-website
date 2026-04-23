import { ArrowUpRight } from 'lucide-react';
import { RevealOnScroll } from '../components/RevealOnScroll';

export const ContactCTA = () => {
  return (
    <section className="px-6 md:px-12 py-40">
      <div className="max-w-5xl mx-auto">
        <RevealOnScroll>
          <p className="text-[10px] uppercase tracking-[0.4em] text-brand-muted mb-8 font-mono">
            Got a project?
          </p>
          <h2
            className="text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tighter leading-[0.9]"
          >
            Let's make<br />
            something<span className="text-brand-accent">.</span>
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <div className="mt-14 flex flex-col sm:flex-row items-stretch sm:items-center gap-5">
            <a
              href="mailto:mariabordiuh@gmail.com"
              className="group inline-flex items-center gap-4 rounded-full bg-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-brand-accent font-mono"
            >
              Email me
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <a
              href="https://www.linkedin.com/in/mariia-bordiuh/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-4 rounded-full border border-white/10 px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white hover:text-black font-mono"
            >
              LinkedIn
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};
