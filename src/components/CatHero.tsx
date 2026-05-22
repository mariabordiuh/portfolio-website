import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { PrefetchLink } from './PrefetchLink';
import { NeatHeroGradient } from './NeatHeroGradient';

const headlineLines = [
  'Art direction,',
  'motion, and',
  'AI-led image',
  'systems.',
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
const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&+?';
const SCRAMBLE_FRAME_MS = 34;
const CHAR_STAGGER_MS = 26;
const LINE_STAGGER_MS = 180;
const SCRAMBLE_WINDOW_MS = 190;
const PINK_FLASH_MS = 90;
const ORANGE_FLASH_MS = 90;
const CREAM_SETTLE_MS = 150;
const HERO_PINK = '#FF9EBB';
const HERO_ORANGE = '#d83a18';
const HERO_CREAM = '#ede2d4';

type AnimatedChar = {
  id: string;
  finalChar: string;
  startMs: number;
  scrambleEndMs: number;
  pinkEndMs: number;
  orangeEndMs: number;
  completeMs: number;
};

type AnimatedLine = {
  id: string;
  chars: AnimatedChar[];
};

const buildHeadlineTimeline = (lines: string[]) => {
  let globalCharIndex = 0;

  const timeline = lines.map<AnimatedLine>((line, lineIndex) => {
    const chars = Array.from(line).map((finalChar, charIndex) => {
      const startMs = lineIndex * LINE_STAGGER_MS + globalCharIndex * CHAR_STAGGER_MS;
      const scrambleEndMs = startMs + SCRAMBLE_WINDOW_MS;
      const pinkEndMs = scrambleEndMs + PINK_FLASH_MS;
      const orangeEndMs = pinkEndMs + ORANGE_FLASH_MS;
      const completeMs = orangeEndMs + CREAM_SETTLE_MS;
      globalCharIndex += 1;

      return {
        id: `${lineIndex}-${charIndex}-${finalChar}`,
        finalChar,
        startMs,
        scrambleEndMs,
        pinkEndMs,
        orangeEndMs,
        completeMs,
      };
    });

    return {
      id: `${lineIndex}-${line}`,
      chars,
    };
  });

  const totalDuration = timeline.reduce(
    (maxDuration, line) =>
      Math.max(maxDuration, ...line.chars.map((char) => char.completeMs)),
    0,
  );

  return { timeline, totalDuration };
};

const heroHeadlineTimeline = buildHeadlineTimeline(headlineLines);

const resolveAnimatedCharFrame = (char: AnimatedChar, elapsedMs: number) => {
  const safeChar = char.finalChar === ' ' ? '\u00A0' : char.finalChar;

  if (char.finalChar === ' ') {
    return {
      text: safeChar,
      color: HERO_CREAM,
      opacity: elapsedMs >= char.startMs ? 1 : 0,
      transform: elapsedMs >= char.startMs ? 'translate3d(0,0,0)' : 'translate3d(0,0.42em,0)',
      textShadow: 'none',
    };
  }

  if (elapsedMs < char.startMs) {
    return {
      text: safeChar,
      color: HERO_CREAM,
      opacity: 0,
      transform: 'translate3d(0,0.42em,0)',
      textShadow: 'none',
    };
  }

  if (elapsedMs < char.scrambleEndMs) {
    const frame = Math.floor((elapsedMs - char.startMs) / SCRAMBLE_FRAME_MS);
    const text = SCRAMBLE_GLYPHS[(frame * 11 + char.id.length * 7) % SCRAMBLE_GLYPHS.length];
    const color = frame % 2 === 0 ? HERO_PINK : HERO_ORANGE;

    return {
      text,
      color,
      opacity: 1,
      transform: 'translate3d(0,0,0)',
      textShadow: `0 0 18px ${color}2a`,
    };
  }

  if (elapsedMs < char.pinkEndMs) {
    return {
      text: safeChar,
      color: HERO_PINK,
      opacity: 1,
      transform: 'translate3d(0,0,0)',
      textShadow: `0 0 18px ${HERO_PINK}28`,
    };
  }

  if (elapsedMs < char.orangeEndMs) {
    return {
      text: safeChar,
      color: HERO_ORANGE,
      opacity: 1,
      transform: 'translate3d(0,0,0)',
      textShadow: `0 0 18px ${HERO_ORANGE}20`,
    };
  }

  return {
    text: safeChar,
    color: HERO_CREAM,
    opacity: 1,
    transform: 'translate3d(0,0,0)',
    textShadow: 'none',
  };
};

export const CatHero = () => {
  const prefersReducedMotion = useReducedMotion();
  const [elapsedMs, setElapsedMs] = useState(
    prefersReducedMotion ? heroHeadlineTimeline.totalDuration : 0,
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setElapsedMs(heroHeadlineTimeline.totalDuration);
      return;
    }

    let animationFrame = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const nextElapsed = now - startTime;
      setElapsedMs(nextElapsed);

      if (nextElapsed < heroHeadlineTimeline.totalDuration + 140) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [prefersReducedMotion]);

  const supportingDelay = prefersReducedMotion
    ? 0.08
    : heroHeadlineTimeline.totalDuration / 1000 + 0.08;

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#030103]">
      <NeatHeroGradient />
      <div
        className="absolute inset-0 bg-[linear-gradient(112deg,rgba(3,1,3,0.86)_0%,rgba(3,1,3,0.54)_42%,rgba(3,1,3,0.72)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_68%_24%,rgba(255,158,187,0.16),transparent_24%),radial-gradient(circle_at_76%_74%,rgba(255,158,187,0.1),transparent_30%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,1,3,0.16)_0%,rgba(3,1,3,0.03)_36%,rgba(3,1,3,0.54)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1380px] flex-col justify-end px-6 pb-10 pt-24 md:px-12 md:pb-16 md:pt-32">
        <div className="max-w-[74rem]">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: supportingDelay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 font-mono text-[10px] uppercase tracking-[0.34em] text-brand-accent/82 md:mb-6 md:tracking-[0.38em]"
          >
            Maria Bordiuh // Hamburg
          </motion.p>

          <h1
            aria-label={headlineLines.join(' ')}
            className="mb-6 max-w-[18ch] font-display text-[clamp(1.14rem,3.8vw,3.34rem)] font-normal uppercase leading-[1.16] tracking-[-0.028em] text-brand-ink md:mb-7 md:max-w-none"
          >
            {heroHeadlineTimeline.timeline.map((line) => (
              <span key={line.id} aria-hidden="true" className="block pb-[0.18em] last:pb-0">
                {line.chars.map((char) => {
                  const frame = resolveAnimatedCharFrame(char, elapsedMs);

                  return (
                    <span
                      key={char.id}
                      className="inline-block align-top will-change-transform"
                      style={{
                        color: frame.color,
                        opacity: frame.opacity,
                        transform: frame.transform,
                        textShadow: frame.textShadow,
                      }}
                    >
                      {frame.text}
                    </span>
                  );
                })}
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: supportingDelay + 0.06, duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[38rem] text-[clamp(0.98rem,0.86rem+0.42vw,1.18rem)] leading-relaxed text-[rgba(237,226,212,0.76)]"
          >
            Visual worlds for brands, campaigns, and moving image projects, shaped through art
            direction, AI workflows, and motion design that still feels authored.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: supportingDelay + 0.14, duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
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
            transition={{ delay: supportingDelay + 0.22, duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 border-t border-white/10 pt-4 sm:mt-12 sm:pt-5"
          >
            <div className="sm:hidden">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-accent/62">
                Focus
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[rgba(237,226,212,0.62)]">
                {mobileSupportLine}
              </p>
            </div>

            <div className="hidden max-w-[62rem] gap-4 sm:grid sm:grid-cols-3">
              {supportNotes.map((note) => (
                <div key={note.label} className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-accent/62">
                    {note.label}
                  </p>
                  <p className="max-w-sm text-sm leading-relaxed text-[rgba(237,226,212,0.62)]">
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
