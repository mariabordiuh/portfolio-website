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
    body: 'Freelancing as an AI Specialist and Art Director since August 2024, building AI-driven visuals, motion concepts, and production-ready workflows.',
  },
  {
    title: 'Motion foundation',
    body: 'My base is motion design and 2D animation: cut-out TV work in Toon Boom, explainers, social assets, and campaign motion.',
  },
  {
    title: 'Agency chapter',
    body: 'At weigertpirouzwolf in Hamburg, I was the only motion designer, translating campaign ideas into motion, social assets, and promotional materials.',
  },
  {
    title: 'Selected work',
    body: 'Selected projects include Novo Nordisk education films, Morshynska’s dinosaur label world, Silpo motion spots, and web experiments like Mirror Atelier and pink33.party.',
  },
  {
    title: 'Education',
    body: 'Diploma in VFX & 3D Animation from SAE Hamburg, plus a B.A. in Japanese Language and Literature from Taras Shevchenko National University of Kyiv.',
  },
  {
    title: 'Tools + tech',
    body: 'After Effects, Photoshop, Houdini, Midjourney, fal.ai tools, Codex, Claude Code, Firebase, and small custom UIs when the workflow needs them.',
  },
  {
    title: 'Languages',
    body: 'Ukrainian native, English fluent, German work-strong, with a Japanese studies background that still helps on international and cross-cultural briefs.',
  },
  {
    title: 'NDA reality',
    body: 'Some recent work is still under NDA, in progress, or simply better shown in conversation. The portfolio is selective by design.',
  },
  {
    title: 'Outside work',
    body: 'Hamburg since 2022, after living in Ukraine, the US, Poland, China, and Vietnam. Outside work: coffee, plants, balcony tomato plans, fixing found furniture, and Loki.',
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
      <section className="bg-brand-bg pb-20 pt-28 md:pb-24 md:pt-32 xl:pb-28 xl:pt-34">
        <div className={SITE_SHELL_CLASS}>
          <div className="grid gap-8 xl:min-h-[calc(100svh-10rem)] xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] xl:items-stretch">
            <div className="flex h-full flex-col gap-8 xl:justify-between">
              <div className="max-w-[40rem]">
                <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/52">
                  Why work with me
                </p>

                <h1 className="mt-4 max-w-[10ch] font-display text-[clamp(2.55rem,4.85vw,4.8rem)] font-bold uppercase leading-[0.88] tracking-[-0.05em] text-white">
                  Maria
                  <br />
                  Bordiuh<span className="text-brand-accent">.</span>
                </h1>

                <p className="mt-4 max-w-[33rem] text-[clamp(0.95rem,0.84rem+0.3vw,1.08rem)] leading-relaxed text-white/70">
                  I’m a Ukrainian Art Director based in Hamburg, with roots in design, animation,
                  and visual storytelling. My work sits between art direction, motion, AI image
                  systems, and creative technology, especially when a project needs both strong
                  visual judgment and a nerdier workflow brain.
                </p>
              </div>

              <div className="space-y-5 rounded-[1.55rem] border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm md:p-5">
                <div className="flex flex-wrap gap-3">
                  {CONTACT_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className="btn-glass-shift px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                    >
                      {link.label}
                      <ArrowUpRight size={15} />
                    </a>
                  ))}
                </div>

                <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {QUICK_FACTS.map((fact) => {
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
                      <div key={fact.label} className="border-t border-white/8 pt-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
                          {fact.label}
                        </p>
                        {fact.href ? (
                          <a
                            href={fact.href}
                            className="mt-1 block text-[0.9rem] leading-relaxed text-white/74 transition-colors hover:text-white"
                          >
                            {content}
                          </a>
                        ) : (
                          <p className="mt-1 text-[0.9rem] leading-relaxed text-white/74">
                            {content}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="min-h-0">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-brand-accent">
                    CV notes
                  </p>
                  <p className="mt-1 text-sm text-white/52">
                    A shorter, slightly more human version of the CV.
                  </p>
                </div>
              </div>
              <div className="grid min-h-0 items-stretch gap-3 md:grid-cols-2 xl:h-full xl:grid-cols-3">
                {CV_NOTES.map((note) => (
                  <article
                    key={note.title}
                    className="relative flex h-full min-h-[10rem] flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.025] p-4 backdrop-blur-sm md:p-[1.125rem]"
                  >
                    <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/45 to-transparent" />
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/46">
                      {note.title}
                    </p>
                    <p className="mt-2.5 text-[0.88rem] leading-[1.52] text-white/70 xl:text-[0.84rem]">
                      {note.body}
                    </p>
                    {note.title === 'Outside work' ? (
                      <div className="mt-auto pt-4">
                        <div className="rounded-[1rem] border border-white/10 bg-black/24 p-3">
                          <div className="flex items-center gap-3">
                            <motion.button
                              type="button"
                              onClick={() => setIsLokiOpen(true)}
                              whileHover={{ y: -2, scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-[0.95rem] border border-white/12 bg-white/[0.04] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_48px_rgba(0,0,0,0.25)]"
                            >
                              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,87,112,0.32),_transparent_62%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                              <motion.img
                                src={LOKI_IMAGE}
                                alt="Loki the cat sitting in a chair"
                                loading="lazy"
                                className="relative z-[1] h-full w-full object-cover"
                                animate={{ scale: [1, 1.03, 1] }}
                                transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
                              />
                              <span className="pointer-events-none absolute inset-x-2 bottom-1.5 z-[2] rounded-full border border-white/14 bg-black/52 px-2 py-1 text-[7px] font-mono uppercase tracking-[0.18em] text-white/70 backdrop-blur">
                                Open
                              </span>
                            </motion.button>
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-accent">
                                Bonus: Loki
                              </p>
                              <p className="mt-1 text-[0.82rem] leading-[1.5] text-white/64">
                                Found in China in 2018. He may very likely join the call.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
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
