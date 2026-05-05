import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { PrefetchLink } from './PrefetchLink';

const headlineLines = [
  'Art direction,',
  'motion, and',
  'AI-led image systems.',
];

const capabilityChips = [
  'Campaign visuals',
  'Motion systems',
  'AI image direction',
  'Brand worlds',
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

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1380px] flex-col justify-end px-6 pb-14 pt-32 md:px-12 md:pb-20 md:pt-36">
        <div className="grid items-end gap-12 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="max-w-[62rem]">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 font-mono text-[10px] uppercase tracking-[0.38em] text-white/58"
            >
              Maria Bordiuh // Hamburg
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
                  className="pb-[0.08em] font-display text-[clamp(3rem,7vw,7.4rem)] font-bold uppercase leading-[0.86] tracking-[-0.05em] text-white"
                >
                  {line === 'AI-led image systems.' ? (
                    <>
                      AI-led image systems<span className="text-brand-accent">.</span>
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
              className="max-w-[52rem] text-[clamp(1rem,0.82rem+0.55vw,1.28rem)] leading-relaxed text-white/72"
            >
              I shape visual worlds for brands, campaigns, and moving image projects, blending
              art direction, AI workflows, and motion design into systems that still feel human.
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
                See selected work
                <ArrowUpRight size={16} />
              </PrefetchLink>
              <PrefetchLink
                to="/about"
                data-click-sound="true"
                className="btn-glass-shift px-7 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
              >
                Why work with me
                <ArrowUpRight size={16} />
              </PrefetchLink>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-wrap gap-2.5"
            >
              {capabilityChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/62 backdrop-blur-sm"
                >
                  {chip}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 28, y: 18 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.5, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="hidden xl:block"
          >
            <div className="frosted-panel-scene p-6">
              <div className="frosted-blob frosted-blob--1" />
              <div className="frosted-blob frosted-blob--2" />
              <div className="frosted-blob frosted-blob--3" />

              <div className="frosted-panel-element p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/54">
                  Current focus
                </p>
                <h3 className="mt-5 text-xl font-bold uppercase leading-tight text-white">
                  Moving brands with mood, motion, and systems.
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-white/58">
                  Campaign visuals, generative image direction, and motion languages that can
                  actually ship.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['Available', 'Remote', 'Selected projects'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/62"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
};
