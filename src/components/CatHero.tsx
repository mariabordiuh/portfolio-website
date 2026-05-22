import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { PrefetchLink } from './PrefetchLink';
import { NeatHeroGradient } from './NeatHeroGradient';

const headlineLines = [
  'Art direction,',
  'motion, and',
  'AI-led image systems.',
];

const supportNotes = [
  {
    label: 'Campaign visuals',
    value: 'Brand worlds, launch systems, and key art with a clear point of view.',
  },
  {
    label: 'Motion systems',
    value: 'Films, cut-outs, and moving layouts that translate cleanly across channels.',
  },
  {
    label: 'AI image direction',
    value: 'Generative workflows shaped by design judgment, not just tool novelty.',
  },
];

const mobileSupportLine = supportNotes.map((note) => note.label).join(' / ');

export const CatHero = () => {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#06060a]">
      <NeatHeroGradient />
      <div
        className="absolute inset-0 bg-[linear-gradient(130deg,rgba(6,6,10,0.74)_0%,rgba(6,6,10,0.42)_45%,rgba(6,6,10,0.72)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,10,0.26)_0%,rgba(6,6,10,0.08)_38%,rgba(6,6,10,0.58)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_52%_38%,rgba(6,6,10,0.08)_0%,rgba(6,6,10,0.18)_52%,rgba(6,6,10,0.4)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1380px] flex-col justify-end px-6 pb-10 pt-24 md:px-12 md:pb-16 md:pt-32">
        <div className="max-w-[72rem]">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 font-mono text-[10px] uppercase tracking-[0.34em] text-white/58 md:mb-6 md:tracking-[0.38em]"
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
            className="mb-5 md:mb-6"
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
                className="pb-[0.08em] font-display text-[clamp(2.65rem,9vw,7.3rem)] font-bold uppercase leading-[0.86] tracking-[-0.055em] text-white md:leading-[0.84]"
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
            className="max-w-[42rem] text-[clamp(0.98rem,0.86rem+0.42vw,1.22rem)] leading-relaxed text-white/72"
          >
            Visual worlds for brands, campaigns, and moving image projects, shaped through art
            direction, AI workflows, and motion design that still feels authored.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-col gap-3.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4"
          >
            <PrefetchLink
              to="/work"
              data-click-sound="true"
              className="btn-gradient-shift px-7 py-3.5 font-mono text-[10px] font-black uppercase tracking-[0.22em] sm:py-4"
            >
              See selected work
              <ArrowUpRight size={16} />
            </PrefetchLink>
            <PrefetchLink
              to="/about"
              data-click-sound="true"
              className="btn-glass-shift px-7 py-3.5 font-mono text-[10px] font-black uppercase tracking-[0.22em] sm:py-4"
            >
              Why work with me
              <ArrowUpRight size={16} />
            </PrefetchLink>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 border-t border-white/10 pt-4 sm:mt-12 sm:pt-5"
          >
            <div className="sm:hidden">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/44">
                Focus
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/62">
                {mobileSupportLine}
              </p>
            </div>

            <div className="hidden max-w-[62rem] gap-4 sm:grid sm:grid-cols-3">
              {supportNotes.map((note) => (
                <div key={note.label} className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/44">
                    {note.label}
                  </p>
                  <p className="max-w-sm text-sm leading-relaxed text-white/62">
                    {note.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
