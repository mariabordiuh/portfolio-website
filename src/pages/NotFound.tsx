import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const TARGET_TIME = 28;
const TARGET_YIELD = 36;
const MAX_TIME = 40;
const BEST_SCORE_KEY = 'portfolio-404-espresso-best-score';

type Phase = 'idle' | 'running' | 'result';

type ResultState = {
  title: string;
  detail: string;
  score: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const evaluateShot = (seconds: number, grams: number): ResultState => {
  const score = clamp(
    Math.round(100 - Math.abs(seconds - TARGET_TIME) * 4.8 - Math.abs(grams - TARGET_YIELD) * 2.4),
    0,
    100,
  );

  if (score >= 94) {
    return {
      title: 'God shot',
      detail: 'Sweet, balanced, and mildly smug. Exactly what the missing page would have wanted.',
      score,
    };
  }

  if (seconds < 25 || grams > 39) {
    return {
      title: 'Too fast',
      detail: 'It rushed out of there. Bright, sharp, and a little chaotic.',
      score,
    };
  }

  if (seconds > 31 || grams < 33) {
    return {
      title: 'Too long',
      detail: 'You really made that shot work for it. Dense, bitter, dramatic.',
      score,
    };
  }

  return {
    title: 'Pretty decent',
    detail: 'Not mythical, but honestly solid. You can serve that with confidence.',
    score,
  };
};

export const NotFound = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [grams, setGrams] = useState(0);
  const [result, setResult] = useState<ResultState | null>(null);
  const [bestScore, setBestScore] = useState(0);

  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const secondsRef = useRef(0);
  const gramsRef = useRef(0);
  const finalizeRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem(BEST_SCORE_KEY);
    if (!stored) {
      return;
    }

    const parsed = Number(stored);
    if (Number.isFinite(parsed)) {
      setBestScore(parsed);
    }
  }, []);

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    gramsRef.current = grams;
  }, [grams]);

  const stopShot = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const nextResult = evaluateShot(secondsRef.current, gramsRef.current);
    setPhase('result');
    setResult(nextResult);

    setBestScore((current) => {
      const nextBest = Math.max(current, nextResult.score);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(BEST_SCORE_KEY, String(nextBest));
      }
      return nextBest;
    });
  };

  finalizeRef.current = stopShot;

  useEffect(() => {
    if (phase !== 'running') {
      return;
    }

    const tick = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = clamp((timestamp - startTimeRef.current) / 1000, 0, MAX_TIME);
      const nextGrams = clamp(
        elapsed * 1.32 - Math.max(0, elapsed - 17) * 0.08 + Math.sin(elapsed * 3.1) * 0.12,
        0,
        50,
      );

      setSeconds(elapsed);
      setGrams(nextGrams);

      if (elapsed >= MAX_TIME) {
        finalizeRef.current();
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [phase]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Enter') {
        return;
      }

      event.preventDefault();

      if (phase === 'idle') {
        setResult(null);
        setSeconds(0);
        setGrams(0);
        startTimeRef.current = null;
        setPhase('running');
        return;
      }

      if (phase === 'running') {
        stopShot();
        return;
      }

      setResult(null);
      setSeconds(0);
      setGrams(0);
      startTimeRef.current = null;
      setPhase('idle');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase]);

  const progress = clamp(seconds / MAX_TIME, 0, 1);
  const fillProgress = clamp(grams / TARGET_YIELD, 0, 1.2);

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-bg text-brand-ink">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,87,112,0.18),transparent_28%),radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.06),transparent_18%),radial-gradient(circle_at_72%_80%,rgba(122,81,53,0.2),transparent_24%)]" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(180deg, transparent 0%, black 14%, black 86%, transparent 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 text-[28vw] font-display leading-none tracking-[-0.08em] text-white/[0.03]"
      >
        404
      </motion.div>

      <div className="relative mx-auto flex min-h-screen max-w-[1080px] flex-col justify-center px-6 py-20 text-center sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.34em] text-brand-accent">
            404 / coffee break
          </p>
          <h1
            className="mx-auto mt-5 max-w-[14ch] font-sans text-white normal-case tracking-[-0.05em]"
            style={{ fontSize: 'clamp(3.1rem, 7vw, 6.4rem)', lineHeight: 0.92 }}
          >
            This page wandered off for a coffee break.
          </h1>
          <p className="mx-auto mt-5 max-w-[30rem] text-base leading-7 text-white/64 sm:text-lg">
            Pull a decent espresso while you wait. Start the shot, then stop it as close as you can to 28 seconds and 36 grams.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.72, ease: 'easeOut' }}
          className="relative mx-auto mt-12 w-full max-w-[760px] overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-8"
        >
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/26 to-transparent" />
          <div className="absolute left-6 top-6 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,87,112,0.28),transparent_72%)] blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.24em] text-white/38">
              <span>Target: 28s / 36g</span>
              <span>Best: {bestScore || '--'}</span>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="flex flex-col items-center justify-center">
                <div className="relative flex h-[21rem] w-full max-w-[19rem] flex-col items-center justify-end">
                  <div className="absolute top-0 h-7 w-28 rounded-full border border-white/14 bg-white/[0.04]" />
                  {phase === 'running' ? (
                    <motion.div
                      className="absolute top-7 w-1.5 rounded-full bg-[linear-gradient(180deg,rgba(255,216,176,0.94),rgba(111,58,28,0.98))] shadow-[0_0_20px_rgba(183,96,45,0.4)]"
                      animate={{ height: ['22%', '48%', '34%', '50%'] }}
                      transition={{ duration: 0.75, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                      style={{ transformOrigin: 'top center' }}
                    />
                  ) : null}

                  <div className="relative mb-2 h-36 w-36 overflow-hidden rounded-[1.5rem] border border-white/12 bg-white/[0.04]">
                    <div
                      className="absolute inset-x-4 bottom-4 rounded-[1rem] bg-[linear-gradient(180deg,rgba(211,135,83,0.96),rgba(82,42,21,0.98))] transition-[height] duration-150"
                      style={{ height: `${Math.max(0, Math.min(fillProgress * 82, 84))}%` }}
                    />
                    <div className="absolute inset-x-0 top-0 h-8 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent)]" />
                  </div>

                  <div className="mt-5 w-full">
                    <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="absolute inset-y-0 rounded-full bg-brand-accent/28"
                        style={{ left: '64%', width: '8%' }}
                      />
                      <div
                        className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-white/80 bg-[#111111] shadow-[0_0_18px_rgba(255,255,255,0.14)] transition-[left] duration-100"
                        style={{ left: `${progress * 100}%`, transform: 'translate(-50%, -50%)' }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">
                      <span>0s</span>
                      <span>sweet spot</span>
                      <span>40s</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-left">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">Time</p>
                    <p className="mt-2 font-display text-4xl leading-none text-white">{seconds.toFixed(1)}s</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">Yield</p>
                    <p className="mt-2 font-display text-4xl leading-none text-white">{grams.toFixed(1)}g</p>
                  </div>
                </div>

                <div className="mt-6 min-h-[8rem] rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-5">
                  {phase === 'idle' ? (
                    <>
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">Ready</p>
                      <h2 className="mt-2 font-sans text-2xl normal-case tracking-[-0.04em] text-white">
                        Start the shot and stop it before it gets weird.
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-white/56">
                        That’s it. No dose charts. No tamp lecture. Just instincts and espresso.
                      </p>
                    </>
                  ) : null}

                  {phase === 'running' ? (
                    <>
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-accent">Running</p>
                      <h2 className="mt-2 font-sans text-2xl normal-case tracking-[-0.04em] text-white">
                        Okay, now stop it at the right moment.
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-white/56">
                        Around 28 seconds and 36 grams is the sweet one.
                      </p>
                    </>
                  ) : null}

                  {phase === 'result' && result ? (
                    <>
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-accent">
                        Score {result.score}
                      </p>
                      <h2 className="mt-2 font-sans text-2xl normal-case tracking-[-0.04em] text-white">
                        {result.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-white/56">
                        {result.detail}
                      </p>
                    </>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {phase !== 'running' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setResult(null);
                        setSeconds(0);
                        setGrams(0);
                        startTimeRef.current = null;
                        setPhase('running');
                      }}
                      className="btn-gradient-shift px-7 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                    >
                      <span>{phase === 'result' ? 'Pull another' : 'Start shot'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopShot}
                      className="btn-gradient-shift px-7 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                    >
                      <span>Stop shot</span>
                    </button>
                  )}

                  <Link
                    to="/work"
                    className="btn-glass-shift px-7 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                  >
                    <span>See selected work</span>
                  </Link>
                  <Link
                    to="/"
                    className="btn-glass-shift px-7 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                  >
                    <span>Go home</span>
                  </Link>
                </div>

                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/36">
                  Space also works.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
