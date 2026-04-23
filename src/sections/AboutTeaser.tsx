import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { RevealOnScroll } from '../components/RevealOnScroll';

export const AboutTeaser = () => {
  return (
    <section className="px-6 md:px-12 py-40">
      <div className="max-w-5xl mx-auto">
        <RevealOnScroll>
          <h4 className="text-[10px] uppercase tracking-[0.4em] text-brand-muted mb-6 font-mono">
            Sequence // 03
          </h4>
        </RevealOnScroll>

        <RevealOnScroll delay={0.06}>
          <p
            className="text-3xl md:text-5xl lg:text-6xl font-medium leading-[1.15] tracking-tight text-white/90"
          >
            I'm an art director blending an advertising background with a love for
            AI, motion, and visual craft. Currently based in Hamburg, vibecoding
            and building creative systems<span className="text-brand-accent">.</span>
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.12}>
          <div className="mt-12 flex flex-wrap items-center gap-5">
            <Link
              to="/about"
              className="group inline-flex items-center gap-3 rounded-full border border-white/10 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white hover:text-black font-mono"
            >
              More about me
              <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <a
              href="mailto:mariabordiuh@gmail.com"
              className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-brand-accent font-mono"
            >
              Say hi
              <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};
