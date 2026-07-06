import React from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Code2,
  Film,
  Globe2,
  Heart,
  Linkedin,
  Mail,
  MapPin,
  Minus,
  Plus,
  Sparkles,
  Star,
  X,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Seo } from '../components/Seo';
import { GENERAL_EMAIL, GENERAL_MAILTO } from '../lib/contact';
import { PUBLIC_PAGE_BOTTOM_GLOW_CLASS } from '../lib/layout';
const LOKI_IMAGE = '/media/about-loki.jpg';
const ABOUT_SHELL_CLASS = 'mx-auto w-full max-w-[89rem] px-6 md:px-8 xl:px-10 2xl:px-12';

type ContactLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  variant: 'outline' | 'solid';
  gradientVariant: 'ember' | 'sherbet' | 'sunset' | 'petal';
  external?: boolean;
};

type FactItem = {
  label: string;
  value: string;
  icon: LucideIcon;
  href?: string;
};

type NoteItem = {
  id: string;
  index: string;
  title: string;
  body: string;
  icon: LucideIcon;
};

const CONTACT_LINKS: ContactLink[] = [
  {
    label: 'Email',
    href: GENERAL_MAILTO,
    icon: Mail,
    variant: 'outline',
    gradientVariant: 'petal',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/mariia-bordiuh/',
    icon: Linkedin,
    variant: 'solid',
    gradientVariant: 'ember',
    external: true,
  },
];

const DETAIL_RAIL: FactItem[] = [
  {
    label: 'From / based in',
    value: 'Ukraine / Hamburg',
    icon: MapPin,
  },
  {
    label: 'Email',
    value: GENERAL_EMAIL,
    icon: Mail,
    href: GENERAL_MAILTO,
  },
  {
    label: 'Working style',
    value: 'Direct, technically fluent, quality-first',
    icon: Sparkles,
  },
  {
    label: 'Education',
    value: 'B.A. in Japanese Language and Literature, 2014.\nVFX & 3D Animation diploma, SAE Hamburg, 2026.',
    icon: BookOpen,
  },
  {
    label: 'Languages',
    value: 'Ukrainian, English, German, Japanese B.A. survivor, learning Arabic :)',
    icon: Globe2,
  },
];

const NOTES: NoteItem[] = [
  {
    id: 'approach',
    index: '01',
    title: 'Approach',
    body: 'Taste-led, technically fluent, and fast to read a brief. Clear direction, high standards, and no interest in work that looks AI-made just because it is.',
    icon: Sparkles,
  },
  {
    id: 'range',
    index: '02',
    title: 'Range',
    body: 'Art direction, AI image systems, motion, visual development, and the technical glue between concept and final output. Big-picture and hands-on both live here.',
    icon: Star,
  },
  {
    id: 'motion-foundation',
    index: '03',
    title: 'Motion foundation',
    body: 'Built on motion design and 2D animation: explainers, social assets, cut-out TV, and campaign motion with timing, rhythm, and structure.',
    icon: Film,
  },
  {
    id: 'career-chapter',
    index: '04',
    title: 'Career chapter',
    body: 'Freelance AI Specialist / Art Director since 2024, after being the only motion designer at weigertpirouzwolf in Hamburg.',
    icon: Briefcase,
  },
  {
    id: 'tools-tech',
    index: '05',
    title: 'Tools + tech',
    body: 'After Effects, Photoshop, Houdini, Nanobanana Pro, ComfyUI, Kling, Runway, Midjourney, fal.ai, Codex, Claude Code, Firebase, and whatever else the project needs to make the impossible feel doable.',
    icon: Code2,
  },
];

const AboutKicker = ({ children }: { children: React.ReactNode }) => (
  <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/46">{children}</p>
);

const ContactButton = ({ link }: { link: ContactLink }) => {
  const Icon = link.icon;
  const baseClassName =
    'group relative inline-flex min-h-[2.85rem] items-center justify-center gap-2.5 overflow-hidden rounded-[0.95rem] border px-3.5 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-brand-bg shadow-[0_18px_36px_rgba(var(--cta-rgb),0.18)] transition-all duration-300 before:pointer-events-none before:absolute before:inset-[1px] before:rounded-[0.87rem] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.08)_34%,rgba(255,255,255,0)_68%)] before:opacity-85';
  const variantClassName = link.variant === 'solid' ? 'btn-gradient-shift' : 'btn-glass-shift';

  return (
    <a
      href={link.href}
      target={link.external ? '_blank' : undefined}
      rel={link.external ? 'noopener noreferrer' : undefined}
      data-click-sound="true"
      data-cta-variant={link.gradientVariant}
      className={`${baseClassName} ${variantClassName} hover:-translate-y-0.5`}
    >
      <Icon size={14} className="shrink-0" />
      <span>{link.label}</span>
      <ArrowUpRight
        size={14}
        className="shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </a>
  );
};

const FactCard = ({ fact, compact = false }: { fact: FactItem; compact?: boolean }) => {
  const Icon = fact.icon;
  const Wrapper = fact.href ? 'a' : 'div';

  return (
    <Wrapper
      {...(fact.href ? { href: fact.href } : {})}
      className={`rounded-[1.08rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] ${
        compact ? 'px-3 py-2.5' : 'px-3 py-3'
      } transition-colors duration-300 ${fact.href ? 'hover:border-white/16 hover:text-white' : ''}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-brand-accent">
          <Icon size={14} />
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-white/45">
          {fact.label}
        </span>
      </div>
      <p
        className={`mt-2 whitespace-pre-line text-white/75 ${compact ? 'text-[0.88rem] leading-[1.54]' : 'text-[0.94rem] leading-[1.56]'}`}
      >
        {fact.value}
      </p>
    </Wrapper>
  );
};

const DesktopNoteAccordionItem = ({
  note,
  isOpen,
  onToggle,
}: {
  note: NoteItem;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <article className="relative overflow-hidden rounded-[1.35rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,158,187,0.08),transparent_50%)] opacity-70" />
      <button
        type="button"
        onClick={onToggle}
        data-click-sound="true"
        aria-expanded={isOpen}
        className="relative flex w-full items-start gap-4 px-3.25 py-3.25 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-accent/85">
              {note.index}
            </span>
            <span className="text-white/62 transition-colors duration-300 hover:text-white">
              {isOpen ? <Minus size={16} /> : <Plus size={16} />}
            </span>
          </div>
          <h2 className="mt-3 text-[0.97rem] font-medium leading-tight text-white">{note.title}</h2>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="relative px-3.25 pb-3.25">
              <p className="text-[0.92rem] leading-[1.62] text-white/72">{note.body}</p>
              <span className="mt-3 block font-mono text-[11px] text-brand-accent/8">*</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
);

const DetailRailCard = ({ fact, minimal = false }: { fact: FactItem; minimal?: boolean }) => {
  const Icon = fact.icon;
  const Wrapper = fact.href ? 'a' : 'div';

  return (
    <Wrapper
      {...(fact.href ? { href: fact.href } : {})}
      className={
        minimal
          ? `block px-0 py-3 ${fact.href ? 'transition-colors duration-300 hover:text-white' : ''}`
          : `rounded-[1.1rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.012))] px-3 py-3 ${
              fact.href ? 'transition-colors duration-300 hover:border-white/16' : ''
            }`
      }
    >
      <div className="flex items-center gap-2.5 text-brand-accent">
        <Icon size={14} />
        <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-white/48">
          {fact.label}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-line text-[0.93rem] leading-[1.56] text-white/80">
        {fact.value}
      </p>
    </Wrapper>
  );
};

const MobileNoteAccordionItem = ({
  note,
  isOpen,
  onToggle,
}: {
  note: NoteItem;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const Icon = note.icon;

  return (
    <article className="overflow-hidden rounded-[1.05rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]">
      <button
        type="button"
        onClick={onToggle}
        data-click-sound="true"
        aria-expanded={isOpen}
        className="flex w-full items-start gap-3 px-3.25 py-3.25 text-left"
      >
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-brand-accent">
          <Icon size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/42">
              {note.index}
            </span>
            <span className="text-white/62">{isOpen ? <Minus size={15} /> : <Plus size={15} />}</span>
          </div>
          <h2 className="mt-2 text-[0.93rem] font-medium leading-tight text-white">{note.title}</h2>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-3.25 pb-3.25 pl-[3.55rem] text-[0.9rem] leading-[1.6] text-white/72">
              {note.body}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
};

const LokiTeaserCard = ({ onOpen, mobile = false }: { onOpen: () => void; mobile?: boolean }) => (
  <button
    type="button"
    onClick={onOpen}
    data-click-sound="true"
    className={`group relative overflow-hidden rounded-[1.26rem] border border-[rgba(255,158,187,0.28)] bg-[linear-gradient(135deg,rgba(255,158,187,0.08),rgba(255,255,255,0.015))] text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(255,158,187,0.45)] ${
      mobile ? 'w-full p-2.75' : 'p-2.75'
    }`}
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,158,187,0.16),transparent_55%)] opacity-80" />
    <div className={`relative flex ${mobile ? 'items-center gap-3' : 'items-center gap-3.25'}`}>
      <div className={`overflow-hidden rounded-[0.9rem] border border-white/10 bg-black/30 ${mobile ? 'h-[4.45rem] w-[4.45rem]' : 'h-[5.25rem] w-[5.25rem]'}`}>
        <img
          src={LOKI_IMAGE}
          alt="Loki the cat sitting in a chair"
          width={320}
          height={320}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-[46%_40%]"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-brand-accent">
          <Heart size={12} />
          <span className="font-mono text-[9px] uppercase tracking-[0.26em]">Bonus: Loki</span>
        </div>
        <p className="mt-1.5 text-[0.89rem] leading-[1.56] text-white/78">
          Found in China in 2018. Very likely to cameo on calls.
        </p>
        <span className="mt-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/64 transition-colors duration-300 group-hover:text-white">
          Meet Loki
          <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  </button>
);

export const About = () => {
  const [isLokiOpen, setIsLokiOpen] = React.useState(false);
  const [expandedNoteId, setExpandedNoteId] = React.useState(NOTES[0]?.id ?? null);
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
    <>
      <Seo
        title="About Maria Bordiuh — Creative Director, Art Director & Motion Designer"
        description="About Maria Bordiuh: a Hamburg-based creative director, art director, motion designer, and AI-forward visual creative with sharp taste, technical fluency, and a quality-first approach."
        canonicalPath="/about"
        image="/media/home-hero-cat-laptop.jpg"
        imageWidth={1920}
        imageHeight={960}
        imageAlt="About Maria Bordiuh"
      />
      <motion.section
        initial={{ opacity: 0.35, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden bg-brand-bg pb-[4.4rem] pt-[6.2rem] md:pb-[5.05rem] md:pt-[7.05rem] xl:pb-[4.45rem] xl:pt-[6.25rem]"
      >
        <div aria-hidden="true" className={PUBLIC_PAGE_BOTTOM_GLOW_CLASS} />
        <div className={ABOUT_SHELL_CLASS}>
          <div className="grid gap-8 xl:grid-cols-[minmax(18.75rem,26.5rem)_minmax(2rem,4rem)_minmax(40rem,1fr)] xl:gap-8 2xl:gap-9">
            <div className="relative">
              <AboutKicker>/ About</AboutKicker>

              <h1
                aria-label="Maria Bordiuh."
                className="mt-4 max-w-[7.1ch] font-display text-[clamp(2.38rem,3.88vw,3.98rem)] font-normal uppercase leading-[0.95] tracking-[0.02em] text-brand-ink"
              >
                <span className="block">Maria</span>
                <span className="mt-[0.06em] block whitespace-nowrap">
                  <span className="inline-flex items-end gap-0">
                    <span>Bordiuh</span>
                    <span
                      aria-hidden="true"
                      className="-ml-[0.05em] mb-[0.14em] inline-block h-[0.16em] w-[0.16em] bg-brand-cta shadow-[0_0_18px_rgba(var(--cta-rgb),0.46)]"
                    />
                  </span>
                </span>
              </h1>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {CONTACT_LINKS.map((link) => (
                  <ContactButton key={link.label} link={link} />
                ))}
              </div>

              <div className="mt-6 h-px bg-gradient-to-r from-white/12 via-white/7 to-transparent" />

              <div className="mt-4.5 divide-y divide-white/8 border-y border-white/8">
                {DETAIL_RAIL.map((fact) => (
                  <DetailRailCard key={fact.label} fact={fact} minimal />
                ))}
              </div>
            </div>

            <div className="min-w-0 xl:col-start-3">
              <div className="flex items-center gap-3">
                <AboutKicker>{'// Notes'}</AboutKicker>
                <div className="h-px flex-1 bg-gradient-to-r from-brand-accent/30 to-transparent" />
              </div>

              <div className="mt-3.5 hidden md:block">
                <div className="space-y-2.25">
                {NOTES.map((note) => (
                  <DesktopNoteAccordionItem
                    key={note.id}
                    note={note}
                    isOpen={expandedNoteId === note.id}
                    onToggle={() =>
                      setExpandedNoteId((current) => (current === note.id ? null : note.id))
                    }
                  />
                ))}
                </div>
                <div className="mt-2.25">
                  <LokiTeaserCard onOpen={() => setIsLokiOpen(true)} />
                </div>
              </div>

              <div className="mt-3.5 space-y-2.25 md:hidden">
                {NOTES.map((note) => (
                  <MobileNoteAccordionItem
                    key={note.id}
                    note={note}
                    isOpen={expandedNoteId === note.id}
                    onToggle={() =>
                      setExpandedNoteId((current) => (current === note.id ? null : note.id))
                    }
                  />
                ))}
                <LokiTeaserCard onOpen={() => setIsLokiOpen(true)} mobile />
              </div>
            </div>

          </div>
        </div>
      </motion.section>

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
                          width={1200}
                          height={1200}
                          decoding="async"
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
    </>
  );
};
