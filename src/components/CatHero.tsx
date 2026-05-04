import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { PrefetchLink } from './PrefetchLink';

const headlineLines = [
  'Design roots,',
  'motion language,',
  'AI-driven worlds.',
];

export const CatHero = () => {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#06060a]">
      <div className="hero-mesh absolute inset-0" aria-hidden="true" />
      <div className="hero-grid-overlay absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -left-[16vw] top-[16vh] h-[42vw] w-[42vw] rounded-full bg-brand-accent/10 blur-[80px]"
        aria-hidden="true"
      />
      <div
        className="absolute right-[-14vw] top-[12vh] h-[32vw] w-[32vw] rounded-full bg-[#344868]/60 blur-[90px]"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-14vw] left-[34%] h-[28vw] w-[28vw] rounded-full bg-[#f9c0c2]/12 blur-[85px]"
        aria-hidden="true"
      />

      <div className="hero-ripple-ring hero-ripple-ring--pink left-[58%] top-[18%] h-[28rem] w-[28rem]" aria-hidden="true" />
      <div className="hero-ripple-ring hero-ripple-ring--soft left-[46%] top-[40%] h-[40rem] w-[40rem] [animation-delay:-4s]" aria-hidden="true" />
      <div className="hero-ripple-ring hero-ripple-ring--pink right-[-8rem] bottom-[-10rem] h-[32rem] w-[32rem] [animation-delay:-7s]" aria-hidden="true" />

      <div className="grain-overlay opacity-25" aria-hidden="true" />

      <div className="pointer-events-none absolute inset-y-0 left-[clamp(1.5rem,6vw,5rem)] hidden w-px bg-white/8 lg:block" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-[clamp(1.5rem,6vw,5rem)] top-[7.4rem] hidden h-px bg-white/8 lg:block" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1480px] flex-col justify-end px-6 pb-14 pt-28 md:px-12 md:pb-16 md:pt-32">
        <div className="max-w-[68rem]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.34em] text-white/52"
          >
            <span>Maria Bordiuh</span>
            <span className="hidden h-px w-10 bg-white/14 sm:block" />
            <span>Art Direction</span>
            <span className="hidden h-px w-10 bg-white/14 sm:block" />
            <span>Animation + Creative Tech</span>
          </motion.div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-5 font-mono text-[10px] uppercase tracking-[0.38em] text-brand-accent/84"
            >
              OMR / Editorial Premium / Live visual systems
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.12,
                  },
                },
              }}
              className="mb-6"
            >
              {headlineLines.map((line) => (
                <motion.h1
                  key={line}
                  variants={{
                    hidden: { opacity: 0, y: 26 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                  className="pb-[0.08em] font-display text-[clamp(3.1rem,7vw,7.7rem)] font-bold uppercase leading-[0.84] tracking-[-0.055em] text-white"
                >
                  {line === 'AI-driven worlds.' ? (
                    <>
                      AI-driven worlds<span className="text-brand-accent">.</span>
                    </>
                  ) : (
                    line
                  )}
                </motion.h1>
              ))}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[58rem] text-[clamp(1rem,0.82rem+0.55vw,1.24rem)] leading-relaxed text-white/72"
            >
              I come from design, animation, and art direction, and I use AI workflows and
              creative tech to turn references, moods, and complex ideas into visual systems that
              still feel precise, human, and memorable.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap"
            >
              <PrefetchLink
                to="/work"
                data-click-sound="true"
                className="btn-gradient-shift px-7 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
              >
                View Work
                <ArrowUpRight size={16} />
              </PrefetchLink>
              <PrefetchLink
                to="/lab"
                data-click-sound="true"
                className="btn-glass-shift px-7 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
              >
                Open Lab
                <ArrowUpRight size={16} />
              </PrefetchLink>
            </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 22 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.46, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="hidden border-l border-white/10 pl-6 lg:block"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/46">
                Current emphasis
              </p>
              <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-white/62">
                Campaign visuals, motion systems, generative image direction, and weird visual
                problems worth solving well.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.54, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 grid gap-6 border-t border-white/8 pt-6 sm:grid-cols-3"
          >
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-accent/84">Roots</p>
              <p className="max-w-[22rem] text-sm leading-relaxed text-white/62">
                Design, animation, and visual storytelling as the foundation, not an afterthought.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-accent/84">Approach</p>
              <p className="max-w-[22rem] text-sm leading-relaxed text-white/62">
                Art direction with enough technical curiosity to prototype, prompt, test, and ship.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-accent/84">Based in</p>
              <p className="max-w-[22rem] text-sm leading-relaxed text-white/62">
                Hamburg, working across brand worlds, motion, AI visuals, and creative technology.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
