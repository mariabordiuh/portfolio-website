import { useEffect } from 'react';
import { motion } from 'motion/react';

const upsertMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let meta = document.head.querySelector<HTMLMetaElement>(selector);

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }

  meta.content = content;
};

export const UnderConstruction = () => {
  useEffect(() => {
    const title = 'Maria Bordiuh — brewing soon.';
    const description = "Maria Bordiuh's new portfolio is currently under construction.";

    document.title = title;
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[name="robots"]', 'name', 'robots', 'noindex, nofollow');
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  }, []);

  return (
    <main className="relative flex min-h-[100svh] overflow-hidden bg-brand-bg px-6 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute left-[-14rem] top-[-16rem] h-[34rem] w-[34rem] rounded-full bg-brand-accent/18 blur-3xl" />
        <div className="absolute bottom-[-18rem] right-[-10rem] h-[32rem] w-[32rem] rounded-full bg-[#5b3826]/45 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      </div>

      <section className="relative mx-auto flex min-h-full w-full max-w-6xl flex-col justify-between">
        <header className="flex items-center justify-between gap-6 text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">
          <span>Maria Bordiuh</span>
          <span>Portfolio brewing</span>
        </header>

        <div className="grid flex-1 place-items-center py-16">
          <div className="max-w-4xl text-center">
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-5 font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-brand-accent"
            >
              Under construction
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-5xl font-display text-[clamp(2.6rem,9vw,8rem)] font-bold uppercase leading-[0.86] tracking-[-0.08em]"
            >
              New work is brewing.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-7 max-w-xl text-[clamp(0.95rem,0.75rem+0.7vw,1.2rem)] leading-relaxed text-white/68"
            >
              The portfolio is getting rebuilt with art direction, motion, and AI-led image systems. Come back soon, or say hi while the kettle is on.
            </motion.p>

            <motion.a
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              href="mailto:mariabordiuh@gmail.com"
              className="mt-9 inline-flex rounded-full border border-brand-accent/40 bg-brand-accent px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-brand-bg transition-transform duration-300 hover:-translate-y-0.5"
            >
              mariabordiuh@gmail.com
            </motion.a>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-6 text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
          <span>Hamburg</span>
          <span>2026</span>
        </footer>
      </section>
    </main>
  );
};
