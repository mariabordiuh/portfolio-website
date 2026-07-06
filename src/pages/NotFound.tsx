import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const BOARD_WIDTH = 8;
const BOARD_HEIGHT = 14;
const BEST_SCORE_KEY = 'portfolio-404-cup-stack-best';

type Cell = number | null;

type ActivePiece = {
  matrix: number[][];
  x: number;
  y: number;
  color: number;
};

type GameSnapshot = {
  board: Cell[][];
  piece: ActivePiece | null;
  score: number;
  lines: number;
  running: boolean;
  gameOver: boolean;
};

type PieceDefinition = {
  color: number;
  shape: number[][];
};

type AudioBundle = {
  context: AudioContext;
  gain: GainNode;
};

const PIECES: PieceDefinition[] = [
  { color: 1, shape: [[1, 1], [1, 1]] },
  { color: 2, shape: [[1, 1, 1, 1]] },
  { color: 3, shape: [[1, 1, 1], [0, 1, 0]] },
  { color: 4, shape: [[1, 1, 0], [0, 1, 1]] },
  { color: 5, shape: [[0, 1, 1], [1, 1, 0]] },
  { color: 6, shape: [[1, 0, 0], [1, 1, 1]] },
  { color: 7, shape: [[0, 0, 1], [1, 1, 1]] },
];

const CUP_COLORS: Record<number, { fill: string; border: string }> = {
  1: { fill: 'linear-gradient(180deg, #fff4ee, #e2b08b)', border: 'rgba(255,255,255,0.34)' },
  2: { fill: 'linear-gradient(180deg, #ffd7df, #ff6e84)', border: 'rgba(255,177,196,0.46)' },
  3: { fill: 'linear-gradient(180deg, #e8ddd3, #a97455)', border: 'rgba(255,226,204,0.28)' },
  4: { fill: 'linear-gradient(180deg, #f5e4d3, #d08754)', border: 'rgba(255,230,201,0.38)' },
  5: { fill: 'linear-gradient(180deg, #ffe7de, #f09d8d)', border: 'rgba(255,211,200,0.38)' },
  6: { fill: 'linear-gradient(180deg, #f4efea, #c4a28d)', border: 'rgba(255,255,255,0.3)' },
  7: { fill: 'linear-gradient(180deg, #ffe9ef, #ff8ba1)', border: 'rgba(255,192,206,0.38)' },
};

const emptyBoard = (): Cell[][] =>
  Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => null as Cell));

const cloneBoard = (board: Cell[][]) => board.map((row) => [...row]);

const rotateMatrix = (matrix: number[][]) =>
  matrix[0].map((_, columnIndex) => matrix.map((row) => row[columnIndex]).reverse());

const createPiece = (): ActivePiece => {
  const definition = PIECES[Math.floor(Math.random() * PIECES.length)];
  const matrix = definition.shape.map((row) => [...row]);

  return {
    matrix,
    x: Math.floor((BOARD_WIDTH - matrix[0].length) / 2),
    y: 0,
    color: definition.color,
  };
};

const collides = (board: Cell[][], piece: ActivePiece, x: number, y: number, matrix = piece.matrix) => {
  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < matrix[rowIndex].length; columnIndex += 1) {
      if (!matrix[rowIndex][columnIndex]) {
        continue;
      }

      const boardX = x + columnIndex;
      const boardY = y + rowIndex;

      if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
        return true;
      }

      if (boardY >= 0 && board[boardY][boardX] !== null) {
        return true;
      }
    }
  }

  return false;
};

const mergePiece = (board: Cell[][], piece: ActivePiece) => {
  const nextBoard = cloneBoard(board);

  piece.matrix.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (!value) {
        return;
      }

      const boardY = piece.y + rowIndex;
      const boardX = piece.x + columnIndex;

      if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
        nextBoard[boardY][boardX] = piece.color;
      }
    });
  });

  return nextBoard;
};

const clearRows = (board: Cell[][]) => {
  const remainingRows = board.filter((row) => row.some((cell) => cell === null));
  const cleared = BOARD_HEIGHT - remainingRows.length;

  while (remainingRows.length < BOARD_HEIGHT) {
    remainingRows.unshift(Array.from({ length: BOARD_WIDTH }, () => null as Cell));
  }

  return {
    board: remainingRows,
    cleared,
  };
};

const getDropInterval = (lines: number) => Math.max(170, 720 - lines * 18);

const getAudioContextConstructor = () =>
  window.AudioContext ||
  (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

const playTone = (
  context: AudioContext,
  destination: AudioNode,
  frequency: number,
  {
    duration = 0.18,
    gain = 0.014,
    type = 'triangle',
    when = context.currentTime,
  }: {
    duration?: number;
    gain?: number;
    type?: OscillatorType;
    when?: number;
  } = {},
) => {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, when);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(50, frequency * 0.92), when + duration);

  gainNode.gain.setValueAtTime(0.0001, when);
  gainNode.gain.exponentialRampToValueAtTime(gain, when + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, when + duration);

  oscillator.connect(gainNode);
  gainNode.connect(destination);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.02);
};

const syncSnapshot = (
  setSnapshot: React.Dispatch<React.SetStateAction<GameSnapshot>>,
  state: GameSnapshot & { lastDrop: number },
) => {
  setSnapshot({
    board: cloneBoard(state.board),
    piece: state.piece
      ? {
          ...state.piece,
          matrix: state.piece.matrix.map((row) => [...row]),
        }
      : null,
    score: state.score,
    lines: state.lines,
    running: state.running,
    gameOver: state.gameOver,
  });
};

export const NotFound = () => {
  const [snapshot, setSnapshot] = useState<GameSnapshot>({
    board: emptyBoard(),
    piece: null,
    score: 0,
    lines: 0,
    running: false,
    gameOver: false,
  });
  const [bestScore, setBestScore] = useState(0);
  const [musicEnabled, setMusicEnabled] = useState(true);

  const gameRef = useRef<GameSnapshot & { lastDrop: number }>({
    board: emptyBoard(),
    piece: null,
    score: 0,
    lines: 0,
    running: false,
    gameOver: false,
    lastDrop: 0,
  });
  const frameRef = useRef<number | null>(null);
  const audioRef = useRef<AudioBundle | null>(null);
  const musicTimerRef = useRef<number | null>(null);
  const musicStepRef = useRef(0);

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

  const ensureAudio = async () => {
    if (typeof window === 'undefined') {
      return null;
    }

    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) {
      return null;
    }

    if (!audioRef.current) {
      const context = new AudioContextConstructor();
      const gain = context.createGain();
      gain.gain.value = 0.11;
      gain.connect(context.destination);
      audioRef.current = { context, gain };
    }

    if (audioRef.current.context.state === 'suspended') {
      await audioRef.current.context.resume().catch(() => undefined);
    }

    return audioRef.current;
  };

  const stopMusic = () => {
    if (musicTimerRef.current !== null) {
      window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }
  };

  const startMusic = async () => {
    if (!musicEnabled || musicTimerRef.current !== null) {
      return;
    }

    const audio = await ensureAudio();
    if (!audio) {
      return;
    }

    const lead = [261.63, 329.63, 392, 329.63, 293.66, 246.94, 293.66, 329.63];
    const bass = [130.81, 164.81, 196, 164.81, 146.83, 123.47, 146.83, 164.81];

    musicStepRef.current = 0;
    musicTimerRef.current = window.setInterval(() => {
      const step = musicStepRef.current % lead.length;
      const now = audio.context.currentTime;

      playTone(audio.context, audio.gain, lead[step], {
        duration: 0.2,
        gain: 0.012,
        type: 'triangle',
        when: now,
      });

      if (step % 2 === 0) {
        playTone(audio.context, audio.gain, bass[step], {
          duration: 0.26,
          gain: 0.008,
          type: 'sine',
          when: now,
        });
      }

      musicStepRef.current += 1;
    }, 320);
  };

  const playClearSound = async () => {
    const audio = await ensureAudio();
    if (!audio) {
      return;
    }

    const now = audio.context.currentTime;
    playTone(audio.context, audio.gain, 392, { duration: 0.12, gain: 0.014, when: now });
    playTone(audio.context, audio.gain, 523.25, { duration: 0.16, gain: 0.013, when: now + 0.05 });
  };

  const playGameOverSound = async () => {
    const audio = await ensureAudio();
    if (!audio) {
      return;
    }

    const now = audio.context.currentTime;
    playTone(audio.context, audio.gain, 246.94, { duration: 0.18, gain: 0.016, type: 'sawtooth', when: now });
    playTone(audio.context, audio.gain, 174.61, { duration: 0.22, gain: 0.013, type: 'triangle', when: now + 0.12 });
  };

  useEffect(() => {
    if (!snapshot.running) {
      stopMusic();
    }
  }, [snapshot.running]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      stopMusic();
      void audioRef.current?.context.close().catch(() => undefined);
    };
  }, []);

  const endGame = async () => {
    gameRef.current.running = false;
    gameRef.current.gameOver = true;
    syncSnapshot(setSnapshot, gameRef.current);
    await playGameOverSound();
  };

  const spawnPiece = async () => {
    const nextPiece = createPiece();

    if (collides(gameRef.current.board, nextPiece, nextPiece.x, nextPiece.y)) {
      await endGame();
      return false;
    }

    gameRef.current.piece = nextPiece;
    return true;
  };

  const stepGame = async () => {
    const { piece } = gameRef.current;

    if (!piece) {
      const spawned = await spawnPiece();
      if (!spawned) {
        return;
      }
      syncSnapshot(setSnapshot, gameRef.current);
      return;
    }

    if (!collides(gameRef.current.board, piece, piece.x, piece.y + 1)) {
      piece.y += 1;
      syncSnapshot(setSnapshot, gameRef.current);
      return;
    }

    gameRef.current.board = mergePiece(gameRef.current.board, piece);
    const { board, cleared } = clearRows(gameRef.current.board);
    gameRef.current.board = board;
    gameRef.current.piece = null;

    if (cleared > 0) {
      gameRef.current.lines += cleared;
      gameRef.current.score += [0, 120, 300, 520, 760][cleared] ?? cleared * 200;

      setBestScore((current) => {
        const nextBest = Math.max(current, gameRef.current.score);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(BEST_SCORE_KEY, String(nextBest));
        }
        return nextBest;
      });

      void playClearSound();
    }

    const spawned = await spawnPiece();
    if (!spawned) {
      return;
    }

    syncSnapshot(setSnapshot, gameRef.current);
  };

  const loop = async (timestamp: number) => {
    if (!gameRef.current.running) {
      return;
    }

    if (timestamp - gameRef.current.lastDrop >= getDropInterval(gameRef.current.lines)) {
      gameRef.current.lastDrop = timestamp;
      await stepGame();
    }

    frameRef.current = requestAnimationFrame((nextTimestamp) => {
      void loop(nextTimestamp);
    });
  };

  const startGame = async () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    gameRef.current = {
      board: emptyBoard(),
      piece: createPiece(),
      score: 0,
      lines: 0,
      running: true,
      gameOver: false,
      lastDrop: performance.now(),
    };

    syncSnapshot(setSnapshot, gameRef.current);
    await startMusic();
    frameRef.current = requestAnimationFrame((timestamp) => {
      void loop(timestamp);
    });
  };

  const movePiece = (direction: -1 | 1) => {
    const { piece, board, running } = gameRef.current;
    if (!running || !piece) {
      return;
    }

    if (!collides(board, piece, piece.x + direction, piece.y)) {
      piece.x += direction;
      syncSnapshot(setSnapshot, gameRef.current);
    }
  };

  const rotatePiece = () => {
    const { piece, board, running } = gameRef.current;
    if (!running || !piece) {
      return;
    }

    const rotated = rotateMatrix(piece.matrix);
    const kicks = [0, -1, 1, -2, 2];

    for (const kick of kicks) {
      if (!collides(board, piece, piece.x + kick, piece.y, rotated)) {
        piece.matrix = rotated;
        piece.x += kick;
        syncSnapshot(setSnapshot, gameRef.current);
        return;
      }
    }
  };

  const dropPiece = async () => {
    if (!gameRef.current.running) {
      return;
    }

    gameRef.current.lastDrop = performance.now();
    await stepGame();
  };

  const toggleMusic = async () => {
    setMusicEnabled((current) => !current);

    if (musicEnabled) {
      stopMusic();
      return;
    }

    if (gameRef.current.running) {
      await startMusic();
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Enter' || event.key === ' ') && !snapshot.running) {
        event.preventDefault();
        void startGame();
        return;
      }

      if (!snapshot.running) {
        if (event.key.toLowerCase() === 'm') {
          event.preventDefault();
          void toggleMusic();
        }
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        movePiece(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        movePiece(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        rotatePiece();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        void dropPiece();
      } else if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        void toggleMusic();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [snapshot.running, musicEnabled]);

  const displayBoard = useMemo(() => {
    const board = cloneBoard(snapshot.board);

    if (!snapshot.piece) {
      return board;
    }

    snapshot.piece.matrix.forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        if (!value) {
          return;
        }

        const boardY = snapshot.piece!.y + rowIndex;
        const boardX = snapshot.piece!.x + columnIndex;

        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          board[boardY][boardX] = snapshot.piece!.color;
        }
      });
    });

    return board;
  }, [snapshot.board, snapshot.piece]);

  const controlButtons = [
    { label: '←', action: () => movePiece(-1), helper: 'Left' },
    { label: '↻', action: () => rotatePiece(), helper: 'Rotate' },
    { label: '→', action: () => movePiece(1), helper: 'Right' },
    { label: '↓', action: () => void dropPiece(), helper: 'Drop' },
  ];

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-brand-bg text-brand-ink">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,158,187,0.18),transparent_28%),radial-gradient(circle_at_80%_22%,rgba(255,255,255,0.06),transparent_18%),radial-gradient(circle_at_72%_82%,rgba(255,214,224,0.14),transparent_24%)]" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'linear-gradient(180deg, transparent 0%, black 16%, black 84%, transparent 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 text-[18vw] font-display leading-none tracking-[-0.04em]"
        style={{ color: 'rgba(255, 158, 187, 0.11)' }}
      >
        404
      </motion.div>

      <div className="relative mx-auto flex h-full max-w-[1180px] items-center px-4 py-3 sm:px-6 sm:py-4 lg:px-10 lg:py-5">
        <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,0.94fr)] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="order-2 text-left lg:order-1"
          >
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.34em] text-brand-accent">
              404 / coffee break
            </p>
            <h1
              className="mt-3 max-w-[11.5ch] font-sans text-white normal-case tracking-[-0.01em]"
              style={{ fontSize: 'clamp(2.35rem, 4.9vw, 4.8rem)', lineHeight: 0.92, wordSpacing: '0.07em' }}
            >
              This page wandered off for a coffee break.
            </h1>
            <p className="mt-3 max-w-[22rem] text-[0.98rem] leading-[1.7] text-white/72 sm:text-base">
              Stack the takeaway cups while you wait.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                to="/work"
                data-cta-variant="ember"
                className="btn-gradient-shift px-6 py-3.5 font-mono text-[10px] font-black uppercase tracking-[0.2em]"
              >
                <span>See selected work</span>
              </Link>
              <Link
                to="/"
                data-cta-variant="petal"
                className="btn-glass-shift px-6 py-3.5 font-mono text-[10px] font-black uppercase tracking-[0.2em]"
              >
                <span>Go home</span>
              </Link>
            </div>

            <div className="mt-5 rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">
                {snapshot.running ? 'Controls' : 'How it works'}
              </p>
              <h2
                className="mt-2 font-sans text-[1.35rem] normal-case tracking-[-0.01em] text-white sm:text-[1.5rem]"
                style={{ wordSpacing: '0.04em' }}
              >
                {snapshot.running ? 'Keep the shelf tidy.' : 'Stack cups. Clear rows. Do not embarrass the cafe.'}
              </h2>
              <p className="mt-2.5 max-w-[26rem] text-[0.98rem] leading-[1.68] text-white/68">
                Full rows disappear. The stack gets faster as you go. It is basically coffee Tetris, which is already a much better 404 situation.
              </p>
            </div>

            <div className="mt-3 hidden flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/38 sm:flex">
              <span><span className="text-white/76">← →</span> move</span>
              <span><span className="text-white/76">↑</span> rotate</span>
              <span><span className="text-white/76">↓</span> drop</span>
              <span><span className="text-white/76">Enter</span> start</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/34">
              <Link to="/impressum" className="transition-colors hover:text-white">Impressum</Link>
              <Link to="/datenschutz" className="transition-colors hover:text-white">Datenschutz</Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.72, ease: 'easeOut' }}
            className="order-1 lg:order-2"
          >
            <div className="relative ml-auto w-full max-w-[500px] overflow-hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-4 shadow-[0_32px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-5">
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/26 to-transparent" />
              <div className="absolute left-6 top-6 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,158,187,0.28),transparent_72%)] blur-3xl" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-4 text-left">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/38">
                    <span>Score {snapshot.score}</span>
                    <span>Rows {snapshot.lines}</span>
                    <span>Best {bestScore}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleMusic()}
                    data-click-sound="true"
                    data-cta-variant="sherbet"
                    className="btn-glass-shift px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                  >
                    <span>{musicEnabled ? 'Music on' : 'Music off'}</span>
                  </button>
                </div>

                <div className="mt-4 flex flex-col items-center">
                  <div className="relative w-full max-w-[20.5rem] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0c0c0c] p-2.5">
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%),radial-gradient(circle_at_50%_0%,rgba(255,158,187,0.08),transparent_30%)]" />
                    <div className="relative grid gap-1" style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, minmax(0, 1fr))` }}>
                      {displayBoard.flatMap((row, rowIndex) =>
                        row.map((cell, columnIndex) => {
                          const palette = cell ? CUP_COLORS[cell] : null;

                          return (
                            <div
                              key={`${rowIndex}-${columnIndex}`}
                              className="relative aspect-square overflow-hidden rounded-[0.6rem] border"
                              style={{
                                borderColor: cell ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                                background: cell ? 'rgba(255,255,255,0.018)' : 'rgba(255,255,255,0.025)',
                                boxShadow: cell ? '0 10px 20px rgba(0,0,0,0.18)' : 'none',
                              }}
                            >
                              {cell ? (
                                <>
                                  <div className="absolute inset-x-[8%] top-[12%] h-[11%] rounded-full border border-white/10 bg-white/28" />
                                  <div
                                    className="absolute left-[17%] right-[17%] top-[20%] bottom-[10%]"
                                    style={{
                                      background: palette?.fill,
                                      clipPath: 'polygon(10% 0%, 90% 0%, 76% 100%, 24% 100%)',
                                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
                                    }}
                                  />
                                  <div className="absolute inset-x-[30%] top-[38%] h-[18%] rounded-[40%] bg-black/10" />
                                  <div className="absolute inset-x-[25%] bottom-[20%] h-[9%] rounded-full bg-white/10" />
                                </>
                              ) : null}
                            </div>
                          );
                        }),
                      )}
                    </div>

                    {!snapshot.running ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/78 px-6 text-center backdrop-blur-sm">
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-accent">
                          {snapshot.gameOver ? 'Shelf collapsed' : 'Ready?'}
                        </p>
                        <h2
                          className="mt-2.5 max-w-[14ch] font-sans text-[1.75rem] normal-case tracking-[-0.01em] text-white sm:text-[2.2rem]"
                          style={{ wordSpacing: '0.06em' }}
                        >
                          {snapshot.gameOver ? 'Try another stack.' : 'Build the neatest coffee tower you can.'}
                        </h2>
                        <p className="mt-2.5 max-w-[20rem] text-[0.98rem] leading-[1.68] text-white/68">
                          {snapshot.gameOver
                            ? 'Turns out cups are bad at staying up forever.'
                            : 'Classic left, right, rotate, drop. Much cuter when it is coffee.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => void startGame()}
                          data-click-sound="true"
                          data-cta-variant="sunset"
                          className="btn-gradient-shift mt-5 px-6 py-3.5 font-mono text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                          <span>{snapshot.gameOver ? 'Stack again' : 'Start stacking'}</span>
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 grid w-full max-w-[20.5rem] grid-cols-4 gap-1.5 sm:hidden">
                    {controlButtons.map((button) => (
                      <button
                        key={button.helper}
                        type="button"
                        onClick={button.action}
                        data-click-sound="true"
                        data-cta-variant={button.label === 'A' ? 'ember' : button.label === 'B' ? 'petal' : 'sherbet'}
                        className="btn-glass-shift aspect-square px-0 py-0 font-mono text-lg font-black"
                      >
                        <span>{button.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
