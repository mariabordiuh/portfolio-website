import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const GAME_W = 600;
const GAME_H = 400;
const DRIP_R = 8;
const CUP_W = 80;
const CUP_H = 20;
const CUP_Y = GAME_H - 32;
const CUP_SPEED = 6;
const DRIP_SPEED = 200; // px/sec
const MAX_MISSES = 3;

type Drip = { id: number; x: number; y: number };
type Keys = Record<string, boolean>;

const useGame = () => {
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [running, setRunning] = useState(false);

  const stateRef = useRef({
    drips: [] as Drip[],
    cupX: GAME_W / 2 - CUP_W / 2,
    score: 0,
    misses: 0,
    nextDripId: 0,
    nextDripMs: 0,
    lastTs: 0,
    keys: {} as Keys,
    mouse: null as number | null,
  });
  const rafRef = useRef<number>(0);
  const nextDropInterval = useRef(800);

  const reset = () => {
    const s = stateRef.current;
    s.drips = [];
    s.cupX = GAME_W / 2 - CUP_W / 2;
    s.score = 0;
    s.misses = 0;
    s.nextDripId = 0;
    s.nextDripMs = 0;
    s.lastTs = 0;
    setScore(0);
    setMisses(0);
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;

    const s = stateRef.current;

    const tick = (ts: number) => {
      const dt = s.lastTs ? (ts - s.lastTs) / 1000 : 0;
      s.lastTs = ts;

      // Move cup
      if (s.mouse !== null) {
        s.cupX = Math.max(0, Math.min(GAME_W - CUP_W, s.mouse - CUP_W / 2));
      } else {
        if (s.keys['ArrowLeft'] || s.keys['a']) s.cupX = Math.max(0, s.cupX - CUP_SPEED);
        if (s.keys['ArrowRight'] || s.keys['d']) s.cupX = Math.min(GAME_W - CUP_W, s.cupX + CUP_SPEED);
      }

      // Spawn drips
      if (ts >= s.nextDripMs) {
        s.drips.push({ id: s.nextDripId++, x: DRIP_R + Math.random() * (GAME_W - DRIP_R * 2), y: -DRIP_R });
        const interval = 800 + Math.random() * 700;
        nextDropInterval.current = interval;
        s.nextDripMs = ts + interval;
      }

      // Move drips
      s.drips = s.drips.map(d => ({ ...d, y: d.y + DRIP_SPEED * dt }));

      // Check catches & misses
      const caught: number[] = [];
      const missed: number[] = [];
      for (const d of s.drips) {
        if (d.y + DRIP_R >= CUP_Y && d.y - DRIP_R <= CUP_Y + CUP_H) {
          if (d.x >= s.cupX - DRIP_R && d.x <= s.cupX + CUP_W + DRIP_R) {
            caught.push(d.id);
          }
        } else if (d.y > GAME_H + DRIP_R) {
          missed.push(d.id);
        }
      }

      s.drips = s.drips.filter(d => !caught.includes(d.id) && !missed.includes(d.id));

      if (caught.length) {
        s.score += caught.length;
        setScore(s.score);
      }

      if (missed.length) {
        s.misses += missed.length;
        setMisses(s.misses);
        if (s.misses >= MAX_MISSES) {
          setHighScore(prev => Math.max(prev, s.score));
          setRunning(false);
          cancelAnimationFrame(rafRef.current);
          return;
        }
      }

      setDrips([...s.drips]);
      setCupX(s.cupX);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const [drips, setDrips] = useState<Drip[]>([]);
  const [cupX, setCupX] = useState(GAME_W / 2 - CUP_W / 2);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { stateRef.current.keys[e.key] = e.type === 'keydown'; };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    stateRef.current.mouse = e.clientX - rect.left;
  };
  const handleMouseLeave = () => { stateRef.current.mouse = null; };

  return { score, misses, highScore, running, drips, cupX, reset, handleMouseMove, handleMouseLeave };
};

export const NotFound = () => {
  const { score, misses, highScore, running, drips, cupX, reset, handleMouseMove, handleMouseLeave } = useGame();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg px-6 text-center gap-8">

      {/* 404 */}
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="font-display font-black text-brand-accent leading-none select-none"
        style={{ fontSize: 'clamp(80px, 14vw, 140px)' }}
        aria-label="404"
      >
        404
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-brand-muted text-base"
      >
        this page started procrastinating.
      </motion.p>

      {/* Game */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="w-full max-w-[600px]"
      >
        {/* Score row */}
        <div className="flex justify-between items-center mb-3 px-1">
          <span className="font-display italic text-brand-accent text-2xl">{score}</span>
          <div className="flex gap-1">
            {Array.from({ length: MAX_MISSES }).map((_, i) => (
              <span key={i} className={`text-[10px] ${i < misses ? 'text-brand-accent' : 'text-white/20'}`}>●</span>
            ))}
          </div>
          {highScore > 0 && (
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-mono">best {highScore}</span>
          )}
        </div>

        {/* Game canvas */}
        <div
          className="relative border border-white/10 bg-white/[0.02] overflow-hidden rounded-2xl"
          style={{ width: '100%', aspectRatio: `${GAME_W}/${GAME_H}`, maxWidth: GAME_W }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Drips */}
          {running && drips.map(d => (
            <div
              key={d.id}
              className="absolute rounded-full bg-brand-accent"
              style={{
                width: DRIP_R * 2,
                height: DRIP_R * 2,
                left: `${(d.x / GAME_W) * 100}%`,
                top: `${(d.y / GAME_H) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}

          {/* Cup */}
          {running && (
            <div
              className="absolute bg-white/80 rounded-sm"
              style={{
                width: `${(CUP_W / GAME_W) * 100}%`,
                height: CUP_H,
                left: `${(cupX / GAME_W) * 100}%`,
                top: `${(CUP_Y / GAME_H) * 100}%`,
              }}
            />
          )}

          {/* Start / Game over overlay */}
          {!running && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              {score > 0 ? (
                <>
                  <p className="font-display italic text-brand-accent text-4xl">{score} caught</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">3 drips hit the floor</p>
                </>
              ) : (
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">
                  catch the drips · mouse or ← →
                </p>
              )}
              <button
                onClick={reset}
                className="mt-2 px-6 py-3 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-full hover:bg-brand-accent transition-all"
              >
                {score > 0 ? 'try again' : 'start'}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Back home */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
        <Link
          to="/"
          className="text-[10px] uppercase tracking-[0.2em] text-brand-muted hover:text-white transition-colors font-mono"
        >
          ← back home
        </Link>
      </motion.div>

      {/* Silent cat */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        className="absolute bottom-6 right-6 text-white"
        style={{ opacity: 0.2 }}
        aria-hidden="true"
      >
        <path d="M12 5C8.5 5 6 7.5 6 11v5c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-5c0-3.5-2.5-6-6-6z"/>
        <path d="M8 5 L6 1 L10 4"/>
        <path d="M16 5 L18 1 L14 4"/>
        <circle cx="10" cy="11" r="0.8" fill="currentColor"/>
        <circle cx="14" cy="11" r="0.8" fill="currentColor"/>
        <path d="M11.5 13 L12 13.5 L12.5 13"/>
      </svg>
    </div>
  );
};
