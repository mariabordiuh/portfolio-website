import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

const DOSE_OPTIONS = [17, 18, 19, 20] as const;
const SWEET_TAMP_MIN = 46;
const SWEET_TAMP_MAX = 58;
const TARGET_TIME = 28;
const BEST_SCORE_KEY = 'portfolio-404-espresso-best-score';

type Step = 'dose' | 'tamp' | 'pull' | 'result';

type Verdict = {
  title: string;
  tag: string;
  detail: string;
  score: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const formatWeight = (value: number) => `${value.toFixed(1)}g`;
const formatSeconds = (value: number) => `${value.toFixed(1)}s`;

const evaluateShot = ({
  dose,
  tamp,
  shotYield,
  shotTime,
}: {
  dose: number;
  tamp: number;
  shotYield: number;
  shotTime: number;
}): Verdict => {
  const targetYield = dose * 2;
  const score = clamp(
    Math.round(
      100
        - Math.abs(dose - 18) * 8
        - Math.abs(tamp - 52) * 1.1
        - Math.abs(shotYield - targetYield) * 2.4
        - Math.abs(shotTime - TARGET_TIME) * 2.1,
    ),
    0,
    100,
  );

  if (score >= 92) {
    return {
      title: 'god shot',
      tag: 'dialed in',
      detail: 'Sweet, syrupy, and annoyingly balanced. You can act like that was intentional.',
      score,
    };
  }

  if (shotTime < 24 || shotYield > targetYield + 4) {
    return {
      title: 'too fast',
      tag: 'under-extracted',
      detail: 'Bright, sharp, and a little impatient. The grinder definitely deserves some blame.',
      score,
    };
  }

  if (shotTime > 34 || shotYield < targetYield - 4) {
    return {
      title: 'too tight',
      tag: 'overworked',
      detail: 'Dense and bitter. The puck fought back and mostly won.',
      score,
    };
  }

  if (score >= 76) {
    return {
      title: 'not bad',
      tag: 'pretty decent',
      detail: 'Clean enough to serve. Confident barista nod highly recommended.',
      score,
    };
  }

  return {
    title: 'try again',
    tag: 'almost there',
    detail: 'Not tragic, just not the one. Good thing this page is still on coffee break.',
    score,
  };
};

export const NotFound = () => {
  const [step, setStep] = useState<Step>('dose');
  const [selectedDose, setSelectedDose] = useState<number | null>(null);
  const [tampMeter, setTampMeter] = useState(18);
  const [tampLocked, setTampLocked] = useState<number | null>(null);
  const [shotRunning, setShotRunning] = useState(false);
  const [shotYield, setShotYield] = useState(0);
  const [shotTime, setShotTime] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [bestScore, setBestScore] = useState(0);

  const selectedDoseRef = useRef<number>(18);
  const tampLockedRef = useRef<number>(52);
  const shotYieldRef = useRef(0);
  const shotTimeRef = useRef(0);
  const tampDirectionRef = useRef(1);
  const tampFrameRef = useRef<number | null>(null);
  const shotFrameRef = useRef<number | null>(null);
  const tampLastTsRef = useRef<number | null>(null);
  const shotStartTsRef = useRef<number | null>(null);
  const shotProfileRef = useRef<{ baseRate: number; drag: number; wave: number } | null>(null);
  const finalizeShotRef = useRef<(elapsed: number, yieldAmount: number) => void>(() => undefined);

  const targetYield = (selectedDose ?? 18) * 2;
  const extractionProgress = clamp(shotYield / targetYield, 0, 1.18);

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
    if (selectedDose !== null) {
      selectedDoseRef.current = selectedDose;
    }
  }, [selectedDose]);

  useEffect(() => {
    if (tampLocked !== null) {
      tampLockedRef.current = tampLocked;
    }
  }, [tampLocked]);

  useEffect(() => {
    shotYieldRef.current = shotYield;
  }, [shotYield]);

  useEffect(() => {
    shotTimeRef.current = shotTime;
  }, [shotTime]);

  finalizeShotRef.current = (elapsed: number, yieldAmount: number) => {
    const nextVerdict = evaluateShot({
      dose: selectedDoseRef.current,
      tamp: tampLockedRef.current,
      shotYield: yieldAmount,
      shotTime: elapsed,
    });

    setShotRunning(false);
    setShotTime(elapsed);
    setShotYield(yieldAmount);
    setVerdict(nextVerdict);
    setStep('result');

    setBestScore((current) => {
      const nextBest = Math.max(current, nextVerdict.score);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(BEST_SCORE_KEY, String(nextBest));
      }
      return nextBest;
    });
  };

  useEffect(() => {
    if (step !== 'tamp' || tampLocked !== null) {
      return;
    }

    tampLastTsRef.current = null;
    tampDirectionRef.current = 1;

    const tick = (ts: number) => {
      const last = tampLastTsRef.current ?? ts;
      const dt = (ts - last) / 1000;
      tampLastTsRef.current = ts;

      setTampMeter((current) => {
        let next = current + tampDirectionRef.current * dt * 85;
        if (next >= 100) {
          next = 100;
          tampDirectionRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          tampDirectionRef.current = 1;
        }
        return next;
      });

      tampFrameRef.current = requestAnimationFrame(tick);
    };

    tampFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (tampFrameRef.current !== null) {
        cancelAnimationFrame(tampFrameRef.current);
      }
    };
  }, [step, tampLocked]);

  useEffect(() => {
    if (step !== 'pull' || !shotRunning || !shotProfileRef.current) {
      return;
    }

    const tick = (ts: number) => {
      if (shotStartTsRef.current === null) {
        shotStartTsRef.current = ts;
      }

      const elapsed = (ts - shotStartTsRef.current) / 1000;
      const profile = shotProfileRef.current;

      if (!profile) {
        return;
      }

      const slowTail = Math.max(0, elapsed - 18) * profile.drag;
      const wobble = Math.sin(elapsed * 2.8) * profile.wave;
      const nextYield = clamp(elapsed * profile.baseRate - slowTail + wobble, 0, 56);

      setShotTime(elapsed);
      setShotYield(nextYield);

      if (elapsed >= 42 || nextYield >= 55) {
        finalizeShotRef.current(elapsed, nextYield);
        return;
      }

      shotFrameRef.current = requestAnimationFrame(tick);
    };

    shotFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (shotFrameRef.current !== null) {
        cancelAnimationFrame(shotFrameRef.current);
      }
    };
  }, [step, shotRunning]);

  const resetShot = () => {
    if (tampFrameRef.current !== null) {
      cancelAnimationFrame(tampFrameRef.current);
    }

    if (shotFrameRef.current !== null) {
      cancelAnimationFrame(shotFrameRef.current);
    }

    shotStartTsRef.current = null;
    shotProfileRef.current = null;
    setStep('dose');
    setSelectedDose(null);
    setTampMeter(18);
    setTampLocked(null);
    setShotRunning(false);
    setShotYield(0);
    setShotTime(0);
    setVerdict(null);
  };

  const pickDose = (dose: number) => {
    selectedDoseRef.current = dose;
    shotStartTsRef.current = null;
    shotProfileRef.current = null;
    setSelectedDose(dose);
    setTampMeter(16 + Math.random() * 24);
    setTampLocked(null);
    setShotRunning(false);
    setShotYield(0);
    setShotTime(0);
    setVerdict(null);
    setStep('tamp');
  };

  const lockTamp = () => {
    const locked = tampMeter;
    tampLockedRef.current = locked;
    setTampLocked(locked);
    setShotYield(0);
    setShotTime(0);
    setShotRunning(false);
    setStep('pull');
  };

  const startShot = () => {
    if (selectedDose === null || tampLocked === null) {
      return;
    }

    const underTampBoost = tampLocked < SWEET_TAMP_MIN ? (SWEET_TAMP_MIN - tampLocked) * 0.012 : 0;
    const overTampDrag = tampLocked > SWEET_TAMP_MAX ? (tampLocked - SWEET_TAMP_MAX) * 0.0036 : 0.003;
    const baseRate = 1.18 + (selectedDose - 18) * 0.02 + underTampBoost;
    const wave = 0.06 + Math.abs(tampLocked - 52) * 0.0015;

    shotStartTsRef.current = null;
    shotProfileRef.current = { baseRate, drag: overTampDrag, wave };
    setShotYield(0);
    setShotTime(0);
    setShotRunning(true);
  };

  const stopShot = () => {
    finalizeShotRef.current(shotTimeRef.current, shotYieldRef.current);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (step === 'dose') {
        const index = Number(event.key) - 1;
        if (index >= 0 && index < DOSE_OPTIONS.length) {
          pickDose(DOSE_OPTIONS[index]);
        }
      }

      if (event.key === ' ' || event.key === 'Enter') {
        if (step === 'tamp') {
          event.preventDefault();
          lockTamp();
        } else if (step === 'pull') {
          event.preventDefault();
          if (shotRunning) {
            stopShot();
          } else {
            startShot();
          }
        } else if (step === 'result') {
          event.preventDefault();
          resetShot();
        }
      }

      if (event.key.toLowerCase() === 'r') {
        resetShot();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const stepItems = [
    { key: 'dose', label: 'Dose' },
    { key: 'tamp', label: 'Tamp' },
    { key: 'pull', label: 'Pull' },
  ] as const;

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-bg text-brand-ink">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,87,112,0.2),transparent_24%),radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.07),transparent_20%),radial-gradient(circle_at_72%_82%,rgba(126,79,52,0.26),transparent_26%)]" />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 text-[26vw] font-display text-white/[0.035] leading-none tracking-[-0.08em]"
      >
        404
      </motion.div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] items-center px-6 py-20 sm:px-10 lg:px-16">
        <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-end">
          <motion.section
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="relative z-10 flex max-w-[34rem] flex-col items-start"
          >
            <p className="mb-5 font-mono text-[10px] font-black uppercase tracking-[0.36em] text-brand-accent">
              404 / espresso calibration
            </p>

            <h1 className="font-sans text-left text-white normal-case tracking-[-0.05em]" style={{ fontSize: 'clamp(3.2rem, 7vw, 6.8rem)', lineHeight: 0.92 }}>
              This page wandered off for a coffee break.
            </h1>

            <p className="mt-6 max-w-[28rem] text-left text-base leading-7 text-white/66 sm:text-lg">
              Pull a decent espresso while you wait. Pick the dose, lock the tamp, then stop the shot before it turns dramatic.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/work"
                className="btn-gradient-shift px-7 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
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

            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-left font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">
              <span>1-4 picks the dose</span>
              <span>space controls the shot</span>
              <span>R resets the ritual</span>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.72, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-8"
          >
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/28 to-transparent" />
            <div className="absolute left-8 top-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,87,112,0.32),transparent_72%)] blur-3xl" />
            <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(123,86,58,0.28),transparent_72%)] blur-3xl" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.32em] text-white/38">
                    404 Recovery Station
                  </p>
                  <p className="mt-2 max-w-[24rem] text-sm leading-6 text-white/56">
                    Tiny espresso practice for accidental visitors. Aim for a clean double around {targetYield}g in about {TARGET_TIME}s.
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/34">Best pull</p>
                  <p className="mt-2 font-display text-3xl leading-none text-white">{bestScore || '--'}</p>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                {stepItems.map((item, index) => {
                  const activeIndex = stepItems.findIndex((entry) => entry.key === (step === 'result' ? 'pull' : step));
                  const isActive = step === item.key || (step === 'result' && item.key === 'pull');
                  const isComplete = index < activeIndex;

                  return (
                    <div key={item.key} className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-[10px] font-mono uppercase tracking-[0.18em] transition-colors ${
                        isActive
                          ? 'border-brand-accent bg-brand-accent/14 text-brand-accent'
                          : isComplete
                            ? 'border-white/24 text-white/72'
                            : 'border-white/10 text-white/32'
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`font-mono text-[10px] uppercase tracking-[0.22em] ${isActive ? 'text-white' : 'text-white/42'}`}>
                        {item.label}
                      </span>
                      {index < stepItems.length - 1 ? (
                        <span className="h-px w-8 bg-white/10 sm:w-10" aria-hidden="true" />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px]">
                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-[#090909] p-5 sm:p-6">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,87,112,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_45%)]" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-5">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">Machine display</p>
                        <p className="mt-1 text-sm text-white/58">Shot reads update live while you chase the sweet spot.</p>
                      </div>
                      <div className="flex gap-2" aria-hidden="true">
                        <span className="h-2.5 w-2.5 rounded-full bg-white/14" />
                        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-accent/80" />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/32">Dose</p>
                        <p className="mt-2 font-display text-3xl leading-none text-white">{selectedDose ? `${selectedDose}g` : '--'}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/32">Yield</p>
                        <p className="mt-2 font-display text-3xl leading-none text-white">{formatWeight(shotYield)}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/32">Time</p>
                        <p className="mt-2 font-display text-3xl leading-none text-white">{formatSeconds(shotTime)}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">Tamp pressure</p>
                        <p className="mt-2 text-base text-white/78">
                          {tampLocked !== null ? `${Math.round(tampLocked)}%` : `${Math.round(tampMeter)}%`}
                        </p>
                      </div>
                      <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">Target</p>
                        <p className="mt-2 text-base text-white/78">{targetYield}g / {TARGET_TIME}s</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,#111111,#090909)] p-5">
                  <motion.div
                    animate={{ y: [-2, -14, -2], opacity: [0.2, 0.42, 0.2] }}
                    transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                    className="absolute left-1/2 top-4 h-16 w-16 -translate-x-1/2 rounded-full bg-white/14 blur-3xl"
                  />
                  <motion.div
                    animate={{ y: [0, -18, 0], opacity: [0.1, 0.28, 0.1] }}
                    transition={{ duration: 5.1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut', delay: 0.5 }}
                    className="absolute left-[58%] top-10 h-14 w-14 -translate-x-1/2 rounded-full bg-white/12 blur-3xl"
                  />

                  <div className="relative flex h-full min-h-[18rem] flex-col items-center justify-between">
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <span className="h-2 w-20 rounded-full bg-white/14" />
                      <span className="h-2 w-16 rounded-full bg-white/9" />
                    </div>

                    <div className="relative mt-4 flex h-full w-full flex-1 items-end justify-center">
                      <div className="absolute top-0 h-7 w-24 rounded-full border border-white/12 bg-white/[0.04]" />
                      {shotRunning ? (
                        <motion.div
                          className="absolute top-7 w-1.5 rounded-full bg-[linear-gradient(180deg,rgba(255,215,170,0.95),rgba(116,59,27,0.96))] shadow-[0_0_22px_rgba(172,92,43,0.42)]"
                          animate={{ height: ['20%', '52%', '34%', '48%'] }}
                          transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                          style={{ transformOrigin: 'top center' }}
                        />
                      ) : null}

                      <div className="relative mb-3 h-28 w-28 overflow-hidden rounded-[1.35rem] border border-white/12 bg-white/[0.04]">
                        <div
                          className="absolute inset-x-3 bottom-3 rounded-[0.95rem] bg-[linear-gradient(180deg,rgba(212,133,78,0.96),rgba(85,43,22,0.98))] transition-[height] duration-150"
                          style={{ height: `${Math.max(8, extractionProgress * 80)}%` }}
                        />
                        <div className="absolute inset-x-0 top-0 h-6 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
                      </div>
                    </div>

                    <div className="mt-4 flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                      <span>cup fill</span>
                      <span>{Math.round(extractionProgress * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
                <AnimatePresence mode="wait">
                  {step === 'dose' ? (
                    <motion.div
                      key="dose"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">Step 1</p>
                      <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
                        <div className="max-w-[28rem]">
                          <h2 className="font-sans text-2xl normal-case tracking-[-0.04em] text-white sm:text-[2rem]">
                            Pick a dose and pretend you do this before sunrise every day.
                          </h2>
                          <p className="mt-3 text-sm leading-6 text-white/56">
                            18g is the safe choice. Anything else is either a flex or a future apology.
                          </p>
                        </div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">Shortcut: 1-4</p>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        {DOSE_OPTIONS.map((dose, index) => (
                          <button
                            key={dose}
                            type="button"
                            onClick={() => pickDose(dose)}
                            className="btn-glass-shift min-w-[5.4rem] px-5 py-4 font-mono text-xs font-black uppercase tracking-[0.2em] text-white"
                          >
                            <span>{index + 1}. {dose}g</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ) : null}

                  {step === 'tamp' ? (
                    <motion.div
                      key="tamp"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">Step 2</p>
                      <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
                        <div className="max-w-[28rem]">
                          <h2 className="font-sans text-2xl normal-case tracking-[-0.04em] text-white sm:text-[2rem]">
                            Stop the tamp in the sweet zone. Not feather-light, not rage-induced.
                          </h2>
                          <p className="mt-3 text-sm leading-6 text-white/56">
                            You want enough pressure to hold the puck together, not enough to start a family feud with the portafilter.
                          </p>
                        </div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">Space locks it</p>
                      </div>

                      <div className="mt-7">
                        <div className="relative h-4 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="absolute inset-y-0 rounded-full bg-brand-accent/26"
                            style={{
                              left: `${SWEET_TAMP_MIN}%`,
                              width: `${SWEET_TAMP_MAX - SWEET_TAMP_MIN}%`,
                            }}
                          />
                          <motion.div
                            className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-white/80 bg-[#111111] shadow-[0_0_24px_rgba(255,255,255,0.18)]"
                            animate={{ left: `${tampMeter}%` }}
                            transition={{ duration: 0.08, ease: 'linear' }}
                            style={{ transform: 'translate(-50%, -50%)' }}
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">
                          <span>too soft</span>
                          <span>sweet zone</span>
                          <span>too hard</span>
                        </div>
                      </div>

                      <div className="mt-7 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={lockTamp}
                          className="btn-gradient-shift px-6 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                        >
                          <span>Lock tamp</span>
                        </button>
                        <button
                          type="button"
                          onClick={resetShot}
                          className="btn-glass-shift px-6 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                        >
                          <span>Start over</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : null}

                  {step === 'pull' ? (
                    <motion.div
                      key="pull"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">Step 3</p>
                      <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
                        <div className="max-w-[28rem]">
                          <h2 className="font-sans text-2xl normal-case tracking-[-0.04em] text-white sm:text-[2rem]">
                            Start the shot, then stop it before it gets weird.
                          </h2>
                          <p className="mt-3 text-sm leading-6 text-white/56">
                            Aim for roughly {targetYield}g in about {TARGET_TIME}s. If it gushes, it will taste sour. If it crawls, it will punish you.
                          </p>
                        </div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">
                          {shotRunning ? 'Press space to stop' : 'Press space to start'}
                        </p>
                      </div>

                      <div className="mt-7 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={shotRunning ? stopShot : startShot}
                          className="btn-gradient-shift px-6 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                        >
                          <span>{shotRunning ? 'Stop shot' : 'Start shot'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTampLocked(null);
                            setShotRunning(false);
                            setShotYield(0);
                            setShotTime(0);
                            shotProfileRef.current = null;
                            shotStartTsRef.current = null;
                            setStep('tamp');
                          }}
                          className="btn-glass-shift px-6 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                        >
                          <span>Retamp</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : null}

                  {step === 'result' && verdict ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-accent">{verdict.tag}</p>
                      <div className="mt-3 flex flex-wrap items-start justify-between gap-6">
                        <div className="max-w-[28rem]">
                          <h2 className="font-sans text-3xl normal-case tracking-[-0.05em] text-white sm:text-[3rem]">
                            {verdict.title}
                          </h2>
                          <p className="mt-3 text-sm leading-6 text-white/56">
                            {verdict.detail}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">Score</p>
                          <p className="mt-2 font-display text-4xl leading-none text-brand-accent">{verdict.score}</p>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">Dose</p>
                          <p className="mt-2 text-base text-white/78">{selectedDose}g</p>
                        </div>
                        <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">Yield</p>
                          <p className="mt-2 text-base text-white/78">{formatWeight(shotYield)}</p>
                        </div>
                        <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">Time</p>
                          <p className="mt-2 text-base text-white/78">{formatSeconds(shotTime)}</p>
                        </div>
                      </div>

                      <div className="mt-7 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={resetShot}
                          className="btn-gradient-shift px-6 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                        >
                          <span>Pull another</span>
                        </button>
                        <Link
                          to="/work"
                          className="btn-glass-shift px-6 py-4 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                        >
                          <span>See selected work</span>
                        </Link>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};
