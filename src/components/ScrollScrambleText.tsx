import React from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '../lib/utils';

const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&+?';
const SCRAMBLE_FRAME_MS = 28;
const CHAR_STAGGER_MS = 20;
const LINE_STAGGER_MS = 140;
const SCRAMBLE_WINDOW_MS = 150;
const PINK_FLASH_MS = 70;
const ORANGE_FLASH_MS = 70;
const CREAM_SETTLE_MS = 130;
const SCRAMBLE_PINK = '#FF9EBB';
const SCRAMBLE_ORANGE = '#d83a18';
const SCRAMBLE_CREAM = '#ede2d4';

type AnimatedChar = {
  id: string;
  finalChar: string;
  startMs: number;
  scrambleEndMs: number;
  pinkEndMs: number;
  orangeEndMs: number;
  completeMs: number;
  finalColor: string;
};

type AnimatedLine = {
  id: string;
  chars: AnimatedChar[];
};

type ScrollScrambleTextProps = {
  as?: 'h1' | 'h2' | 'p' | 'span' | 'div';
  lines: string[];
  className?: string;
  lineClassName?: string;
  accentLastCharacter?: boolean;
  rootMargin?: string;
  threshold?: number;
  startDelayMs?: number;
};

const findAccentTarget = (lines: string[]) => {
  for (let lineIndex = lines.length - 1; lineIndex >= 0; lineIndex -= 1) {
    const chars = Array.from(lines[lineIndex]);
    for (let charIndex = chars.length - 1; charIndex >= 0; charIndex -= 1) {
      if (chars[charIndex].trim()) {
        return `${lineIndex}-${charIndex}`;
      }
    }
  }

  return null;
};

const buildTimeline = (lines: string[], accentLastCharacter: boolean) => {
  const accentTarget = accentLastCharacter ? findAccentTarget(lines) : null;
  let globalCharIndex = 0;

  const timeline = lines.map<AnimatedLine>((line, lineIndex) => {
    const chars = Array.from(line).map((finalChar, charIndex) => {
      const startMs = lineIndex * LINE_STAGGER_MS + globalCharIndex * CHAR_STAGGER_MS;
      const scrambleEndMs = startMs + SCRAMBLE_WINDOW_MS;
      const pinkEndMs = scrambleEndMs + PINK_FLASH_MS;
      const orangeEndMs = pinkEndMs + ORANGE_FLASH_MS;
      const completeMs = orangeEndMs + CREAM_SETTLE_MS;
      const finalColor =
        accentTarget === `${lineIndex}-${charIndex}` ? SCRAMBLE_ORANGE : SCRAMBLE_CREAM;

      globalCharIndex += 1;

      return {
        id: `${lineIndex}-${charIndex}-${finalChar}`,
        finalChar,
        startMs,
        scrambleEndMs,
        pinkEndMs,
        orangeEndMs,
        completeMs,
        finalColor,
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

const resolveAnimatedCharFrame = (char: AnimatedChar, elapsedMs: number, hasStarted: boolean) => {
  const safeChar = char.finalChar === ' ' ? '\u00A0' : char.finalChar;

  if (!hasStarted || elapsedMs < char.startMs) {
    return {
      text: safeChar,
      color: char.finalColor,
      opacity: 0,
      transform: 'translate3d(0,0.3em,0)',
      textShadow: 'none',
    };
  }

  if (elapsedMs < char.scrambleEndMs) {
    const frame = Math.floor((elapsedMs - char.startMs) / SCRAMBLE_FRAME_MS);
    const color = frame % 2 === 0 ? SCRAMBLE_PINK : SCRAMBLE_ORANGE;

    if (char.finalChar === ' ') {
      return {
        text: safeChar,
        color,
        opacity: 1,
        transform: 'translate3d(0,0,0)',
        textShadow: 'none',
      };
    }

    return {
      text: SCRAMBLE_GLYPHS[(frame * 11 + char.id.length * 7) % SCRAMBLE_GLYPHS.length],
      color,
      opacity: 1,
      transform: 'translate3d(0,0,0)',
      textShadow: `0 0 12px ${color}28`,
    };
  }

  if (elapsedMs < char.pinkEndMs) {
    return {
      text: safeChar,
      color: SCRAMBLE_PINK,
      opacity: 1,
      transform: 'translate3d(0,0,0)',
      textShadow: `0 0 12px ${SCRAMBLE_PINK}24`,
    };
  }

  if (elapsedMs < char.orangeEndMs) {
    return {
      text: safeChar,
      color: SCRAMBLE_ORANGE,
      opacity: 1,
      transform: 'translate3d(0,0,0)',
      textShadow: `0 0 12px ${SCRAMBLE_ORANGE}18`,
    };
  }

  return {
    text: safeChar,
    color: char.finalColor,
    opacity: 1,
    transform: 'translate3d(0,0,0)',
    textShadow: 'none',
  };
};

export const ScrollScrambleText = ({
  as = 'div',
  lines,
  className,
  lineClassName,
  accentLastCharacter = false,
  rootMargin = '0px 0px -10% 0px',
  threshold = 0.45,
  startDelayMs = 0,
}: ScrollScrambleTextProps) => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLElement | null>(null);
  const [{ timeline, totalDuration }] = React.useState(() =>
    buildTimeline(lines, accentLastCharacter),
  );
  const [hasStarted, setHasStarted] = React.useState(prefersReducedMotion);
  const [elapsedMs, setElapsedMs] = React.useState(prefersReducedMotion ? totalDuration : 0);

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setHasStarted(true);
      setElapsedMs(totalDuration);
      return;
    }

    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [prefersReducedMotion, rootMargin, threshold, totalDuration]);

  React.useEffect(() => {
    if (prefersReducedMotion || !hasStarted) {
      return;
    }

    let animationFrame = 0;
    const startTime = performance.now() + startDelayMs;

    const tick = (now: number) => {
      const nextElapsed = Math.max(0, now - startTime);
      setElapsedMs(nextElapsed);

      if (nextElapsed < totalDuration + 120) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [hasStarted, prefersReducedMotion, startDelayMs, totalDuration]);

  return React.createElement(
    as,
    {
      ref: containerRef,
      'aria-label': lines.join(' '),
      className,
    },
    timeline.map((line, lineIndex) =>
      React.createElement(
        'span',
        {
          key: line.id,
          'aria-hidden': 'true',
          className: cn('block', lineIndex < timeline.length - 1 && 'pb-[0.18em]', lineClassName),
        },
        line.chars.map((char) => {
          const frame = resolveAnimatedCharFrame(char, elapsedMs, hasStarted);

          return React.createElement(
            'span',
            {
              key: char.id,
              className: 'inline-block align-top will-change-transform',
              style: {
                color: frame.color,
                opacity: frame.opacity,
                transform: frame.transform,
                textShadow: frame.textShadow,
              },
            },
            frame.text,
          );
        }),
      ),
    ),
  );
};
