import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

type CountUpProps = {
  /** e.g. "900+" or "48h" — the leading integer animates, the rest stays. */
  value: string;
  durationMs?: number;
};

/**
 * Counts the numeric part of `value` up from zero once, when it scrolls into
 * view. Non-digit prefix/suffix (e.g. "+", "h") is preserved. Respects
 * prefers-reduced-motion (shows the final value immediately).
 */
const parse = (value: string) => {
  const match = value.match(/^(\D*)(\d+)(.*)$/);
  if (!match) return { prefix: '', target: null as number | null, suffix: value };
  return { prefix: match[1], target: Number(match[2]), suffix: match[3] };
};

export const CountUp = ({ value, durationMs = 1100 }: CountUpProps) => {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLSpanElement>(null);
  // Parse once — deps must be primitives so the effect doesn't churn (a fresh
  // match array every render was cancelling the animation mid-flight).
  const { prefix, target, suffix } = parse(value);
  const hasNumber = target !== null;
  const [display, setDisplay] = useState(hasNumber && !reduced ? 0 : target ?? 0);

  useEffect(() => {
    if (target === null || reduced) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(eased * target));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, reduced, durationMs]);

  return (
    <span ref={ref}>
      {prefix}
      {hasNumber ? display : ''}
      {suffix}
    </span>
  );
};
