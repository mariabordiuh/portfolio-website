import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Mail, MapPin, X, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PageTransition } from '../components/PageTransition';

const SITE_SHELL_CLASS = 'mx-auto max-w-7xl px-6 md:px-8 xl:px-12';
const LOKI_IMAGE = '/media/about-loki.jpg';

const CONTACT_LINKS = [
  {
    label: 'Email',
    href: 'mailto:mariabordiuh@gmail.com',
    external: false,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/mariia-bordiuh/',
    external: true,
  },
] as const;

type QuickFact = {
  label: string;
  value: string;
  icon?: LucideIcon;
  href?: string;
};

const QUICK_FACTS: QuickFact[] = [
  {
    label: 'Role',
    value: 'Art direction, AI visuals, motion, concept development, creative tech',
  },
  {
    label: 'Based in',
    value: 'Hamburg',
    icon: MapPin,
  },
  {
    label: 'Best fit',
    value: 'Brand worlds, campaign visuals, generative image systems, motion-led storytelling',
  },
  {
    label: 'Current chapter',
    value: 'Freelance AI Specialist / Art Director since 2024',
  },
  {
    label: 'Contact',
    value: 'mariabordiuh@gmail.com',
    icon: Mail,
    href: 'mailto:mariabordiuh@gmail.com',
  },
];

const CV_NOTES = [
  {
    title: 'Now',
    body: 'Freelance AI Specialist / Art Director since 2024. AI visuals, motion concepts, and production workflows.',
  },
  {
    title: 'Motion foundation',
    body: 'Motion design + 2D animation: cut-out TV, explainers, social assets, and campaign motion.',
  },
  {
    title: 'Agency chapter',
    body: 'Only motion designer at weigertpirouzwolf in Hamburg, shaping campaign ideas into motion and social assets.',
  },
  {
    title: 'Selected work',
    body: 'Novo Nordisk, Morshynska, Silpo, Mirror Atelier, and pink33.party.',
  },
  {
    title: 'Education',
    body: 'SAE Hamburg diploma in VFX & 3D Animation, after a B.A. in Japanese Language and Literature.',
  },
  {
    title: 'Tools + tech',
    body: 'After Effects, Photoshop, Houdini, Midjourney, fal.ai, Codex, Claude Code, Firebase, and custom UIs.',
  },
  {
    title: 'Languages',
    body: 'Ukrainian native, English fluent, German work-strong, with a useful Japanese studies background.',
  },
  {
    title: 'NDA reality',
    body: 'Some recent work is under NDA or better explained in conversation.',
  },
  {
    title: 'Outside work',
    body: 'Hamburg since 2022. Lived across Ukraine, the US, Poland, China, and Vietnam.',
  },
] as const;

export const About = () => {
  const [isLokiOpen, setIsLokiOpen] = React.useState(false);
  const lokiDialogRef = React.useRef<HTMLDivElement | null>(null);
  const lokiCloseButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (!isLokiOpen) {
      if (previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
        previouslyFocusedRef.current = null;
      }
      return;
    }

    const previousOverflow = document.body.style.overflow;
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';

    window.requestAnimationFrame(() => {
      lokiCloseButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLokiOpen(false);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = lokiDialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );

      if (!focusable?.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isLokiOpen]);

  return (
    <PageTransition>
      <section className="bg-brand-bg pb-20 pt-28 md:pb-24 md:pt-32 xl:pb-20 xl:pt-28">
        <div className={SITE_SHELL_CLASS}>
          <div className="grid gap-8 xl:grid-cols-[minmax(20rem,0.72fr)_minmax(0,1.28fr)] xl:items-start">
            <div className="flex h-full flex-col gap-6 xl:pr-6">
              <div className="max-w-[32rem]">
                <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/52">
                  Why work with me
                </p>

                <h1 className="mt-3 max-w-[10ch] font-display text-[clamp(2.7rem,4.8vw,4.85rem)] font-bold uppercase leading-[0.88] tracking-[-0.05em] text-white">
                  Maria
                  <br />
                  Bordiuh<span className="text-brand-accent">.</span>
                </h1>

                <p className="mt-4 max-w-[30rem] text-[clamp(0.98rem,0.86rem+0.18vw,1.08rem)] leading-[1.62] text-white/66">
                  I’m a Ukrainian Art Director in Hamburg working across art direction, motion, AI
                  image systems, and creative tech. Best when a project needs both strong visual
                  judgment and a nerdier workflow brain.
                </p>
              </div>

              <div className="space-y-4 border-t border-white/8 pt-5">
                <div className="flex flex-wrap gap-3">
                  {CONTACT_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className="btn-glass-shift px-4 py-2.25 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                    >
                      {link.label}
                      <ArrowUpRight size={15} />
                    </a>
                  ))}
                </div>

                <p className="max-w-[30rem] text-[0.92rem] leading-relaxed text-white/46">
                  Hamburg. Art direction, motion, AI visuals, and creative tech.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {QUICK_FACTS.map((fact, index) => {
                  const Icon = fact.icon;
                  const content = Icon ? (
                    <span className="inline-flex items-start gap-2">
                      <Icon size={14} className="mt-[0.1rem] shrink-0 text-brand-accent" />
                      <span>{fact.value}</span>
                    </span>
                  ) : (
                    fact.value
                  );

                  return (
                    <div
                      key={fact.label}
                      className={`rounded-[1rem] border border-white/8 bg-white/[0.02] px-4 py-3 ${
                        index === QUICK_FACTS.length - 1 ? 'sm:col-span-2' : ''
                      }`}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
                        {fact.label}
                      </p>
                      {fact.href ? (
                        <a
                          href={fact.href}
                          className="mt-1 block text-[0.84rem] leading-relaxed text-white/74 transition-colors hover:text-white"
                        >
                          {content}
                        </a>
                      ) : (
                        <p className="mt-1 text-[0.84rem] leading-relaxed text-white/74">
                          {content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0">
              <div className="mb-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-brand-accent">
                  CV notes
                </p>
              </div>
              <div className="grid min-h-0 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
                {CV_NOTES.map((note) => (
                  <article
                    key={note.title}
                    className="relative flex h-full min-h-[7.8rem] flex-col overflow-hidden rounded-[1.1rem] border border-white/10 bg-white/[0.025] p-3.5 backdrop-blur-sm md:p-4"
                  >
                    <div className="pointer-events-none absolute inset-x-3.5 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/45 to-transparent" />
                    <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/46">
                      {note.title}
                    </p>
                    {note.title === 'Outside work' ? (
                      <>
                        <p className="mt-2 text-[0.8rem] leading-[1.34] text-white/68 xl:text-[0.79rem]">
                          {note.body}
                        </p>
                        <div className="mt-auto pt-2.5">
                          <motion.button
                            type="button"
                            onClick={() => setIsLokiOpen(true)}
                            whileHover={{ y: -2, scale: 1.01 }}
                            whileTap={{ scale: 0.985 }}
                            className="group relative flex w-full items-center gap-3 rounded-[1rem] border border-white/10 bg-black/24 p-2 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_14px_28px_rgba(0,0,0,0.18)]"
                          >
                            <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(135deg,rgba(255,158,187,0.08),transparent_52%)] opacity-80" />
                            <div className="relative h-16 w-[4.5rem] shrink-0 overflow-hidden rounded-[0.95rem] border border-white/12 bg-black/35 p-1">
                              <span className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_top,_rgba(255,158,187,0.18),_transparent_60%)] transition-opacity duration-500 group-hover:opacity-100" />
                              <img
                                src={LOKI_IMAGE}
                                alt="Loki the cat sitting in a chair"
                                loading="lazy"
                                className="relative z-[2] h-full w-full rounded-[0.8rem] object-cover object-[46%_40%]"
                              />
                            </div>
                            <div className="relative min-w-0">
                              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-brand-accent">
                                Bonus: Loki
                              </p>
                              <p className="mt-0.5 text-[0.66rem] leading-[1.24] text-white/68">
                                Found in China in 2018. Very likely to cameo on calls.
                              </p>
                            </div>
                          </motion.button>
                        </div>
                      </>
                    ) : (
                      <p className="mt-2 text-[0.82rem] leading-[1.38] text-white/68 xl:text-[0.81rem]">
                        {note.body}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {isLokiOpen ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Loki photo viewer"
                  className="fixed inset-0 z-[120] bg-black/92 p-5 backdrop-blur-2xl"
                  onClick={() => setIsLokiOpen(false)}
                >
                  <div className="flex h-full items-center justify-center">
                    <motion.div
                      ref={lokiDialogRef}
                      initial={{ opacity: 0, scale: 0.94, y: 18 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 10 }}
                      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                      className="relative max-w-[min(90vw,42rem)]"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        ref={lokiCloseButtonRef}
                        type="button"
                        aria-label="Close Loki photo"
                        onClick={() => setIsLokiOpen(false)}
                        className="absolute right-3 top-3 z-[2] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/52 text-white/78 backdrop-blur transition-colors hover:text-white"
                      >
                        <X size={18} />
                      </button>

                      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-[0_25px_120px_rgba(0,0,0,0.55)]">
                        <img
                          src={LOKI_IMAGE}
                          alt="Loki the cat sitting in a chair"
                          className="block max-h-[78vh] w-full object-contain"
                        />
                      </div>

                      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-white/46">
                        Loki // definitely part of the team
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </PageTransition>
  );
};
