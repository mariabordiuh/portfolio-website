import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Linkedin, Mail } from 'lucide-react';

const ASCII_COFFEE_STYLES = `
  .ascii-coffee-footer {
    --ascii-bg: #050505;
    --ascii-pink: #f39ac6;
    --ascii-steam: rgba(230, 230, 230, 0.58);
    --ascii-bean: #6B4226;
    --ascii-line: rgba(255, 255, 255, 0.05);
    background: var(--ascii-bg);
    border-top: 1px solid var(--ascii-line);
    overflow: hidden;
    padding: 36px 16px 54px;
  }

  .ascii-coffee-stage {
    position: relative;
    width: min(1600px, 100%);
    height: 380px;
    margin: 0 auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      "Liberation Mono", monospace;
  }

  .ascii-coffee-cluster {
    position: absolute;
    left: 50%;
    bottom: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: clamp(2rem, 4vw, 4.5rem);
    transform: translateX(calc(-50% - 5ch));
  }

  .ascii-brew {
    position: relative;
    flex: none;
  }

  .ascii-art,
  .ascii-steam,
  .ascii-pour {
    margin: 0;
    white-space: pre;
    line-height: 1;
    letter-spacing: 0;
    user-select: none;
  }

  .ascii-art {
    color: var(--ascii-pink);
    font-size: clamp(10px, 0.72vw + 5px, 16px);
    position: relative;
    z-index: 2;
  }

  .ascii-carafe {
    z-index: 2;
  }

  .ascii-carafe-core {
    position: relative;
    display: inline-block;
  }

  .ascii-pour-layer {
    position: absolute;
    left: 20.05ch;
    top: 8.65em;
    transform: translateX(-50%);
    width: 5ch;
    height: 7em;
    background: var(--ascii-bg);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    z-index: 3;
    pointer-events: none;
  }

  .ascii-pour {
    color: var(--ascii-bean);
    font-size: inherit;
    line-height: 1;
    min-width: 5ch;
    text-align: center;
    filter: drop-shadow(0 0 6px rgba(185, 122, 37, 0.18));
  }

  .ascii-coffee-bed {
    position: absolute;
    left: 50%;
    bottom: 0.62em;
    transform: translateX(calc(-50% + 0ch));
    color: var(--ascii-bean);
    font-size: inherit;
    line-height: 1;
    text-align: center;
    text-indent: -0.5ch;
    z-index: 3;
    pointer-events: none;
  }

  .ascii-cup {
    margin-bottom: 68px;
    z-index: 3;
  }

  .ascii-steam {
    position: absolute;
    left: 50%;
    bottom: calc(100% - 0.3em);
    transform: translateX(-50%);
    min-width: 11ch;
    text-align: center;
    color: var(--ascii-steam);
    font-size: clamp(10px, 0.72vw + 5px, 16px);
    pointer-events: none;
    z-index: 1;
    opacity: 0.92;
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.05));
    animation: asciiSteamDrift 3.8s ease-in-out infinite alternate;
  }

  .ascii-cup-right .ascii-steam {
    animation-duration: 4.2s;
    animation-delay: 0.4s;
  }

  @keyframes asciiSteamDrift {
    0% {
      transform: translateX(calc(-50% - 2px)) translateY(4px);
      opacity: 0.62;
    }
    50% {
      transform: translateX(calc(-50% + 2px)) translateY(-4px);
      opacity: 0.95;
    }
    100% {
      transform: translateX(calc(-50% - 3px)) translateY(-10px);
      opacity: 0.7;
    }
  }

  @media (max-width: 1200px) {
    .ascii-coffee-stage {
      height: 320px;
    }

    .ascii-coffee-cluster {
      gap: clamp(1.4rem, 3vw, 3rem);
    }

    .ascii-cup {
      transform: scale(0.9);
      transform-origin: center bottom;
    }

    .ascii-carafe {
      transform: scale(0.92);
      transform-origin: center bottom;
    }
  }

  @media (max-width: 860px) {
    .ascii-coffee-stage {
      height: 250px;
    }

    .ascii-cup {
      display: none;
    }

    .ascii-coffee-cluster {
      gap: 0;
    }

    .ascii-carafe {
      transform: scale(0.72);
      transform-origin: center bottom;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ascii-steam {
      animation: none !important;
    }
  }
`;

const FOOTER_LINKS = [
  { name: 'home', path: '/' },
  { name: 'work', path: '/work' },
  { name: 'lab', path: '/lab' },
];

const CUP_ART = String.raw`
           .---------------.
           |               |____
           |               |    \
           |               |     )
           |               |     )
           |               |     )
           |               |____/
           \               /
            \             /
             '-----------'
`.slice(1);

const CARAFE_ART = String.raw`
              .---------------.
             /  |||||||||||||  \
          .-+-------------------+-.
           \ \                 / / )
            \ \               / /  |
             \ \             / /   /
              \ \           / /  -'
               \ \_________/ /
               [_____________]
                /           \
              /               \
             (                 )-----.
              \               /      |
             /                 \     |
            (                   )    |
             \                 /     |
            /                   \   /
           /                     \ '
          /                       \
         /                         \
        (                           )
         \_________________________/
`.slice(1);

const COFFEE_BED_ART = String.raw`
        *******************
       *********************
      ***********************
      *************************
      *************************
`.slice(1);

const LEFT_STEAM_FRAMES = [
  String.raw`
     )
  (       )
      (
   (   )
      )
    (     )
   (   )
`.slice(1),
  String.raw`
   (   )
      )
  (        )
     (
      )
   (    )
  (     )
`.slice(1),
  String.raw`
      (
   (    )
       )
  (     )
     (
      )
   (   )
`.slice(1),
  String.raw`
   (   )
      (
  (       )
      )
    (  )
   (    )
      )
`.slice(1),
] as const;

const RIGHT_STEAM_FRAMES = [
  String.raw`
   (   )
      )
  (        )
     (
      )
   (    )
     (
`.slice(1),
  String.raw`
      )
   (    )
       (
  (     )
      )
    (   )
   (    )
`.slice(1),
  String.raw`
      (
   (     )
        )
   (   )
     (
       )
    (  )
`.slice(1),
  String.raw`
   (  )
      )
  (       )
     (
      )
   (    )
     (
`.slice(1),
] as const;

const POUR_FRAMES = [
  String.raw`
   .
   |
   |
   |
   |
   |
`.slice(1),
  String.raw`
   :
   |
   |
   |
   |
   |
`.slice(1),
  String.raw`
   .
   |
   |
   |
   !
   |
`.slice(1),
  String.raw`
   :
   |
   |
   !
   |
   |
   |
`.slice(1),
] as const;

const FooterAsciiCoffee = () => {
  const [leftSteam, setLeftSteam] = useState(LEFT_STEAM_FRAMES[0]);
  const [rightSteam, setRightSteam] = useState(RIGHT_STEAM_FRAMES[0]);
  const [pour, setPour] = useState(POUR_FRAMES[0]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLeftSteam(LEFT_STEAM_FRAMES[0]);
      setRightSteam(RIGHT_STEAM_FRAMES[0]);
      setPour(POUR_FRAMES[0]);
      return;
    }

    let leftIndex = 0;
    let rightIndex = 0;
    let pourIndex = 0;

    let leftTimer = 0;
    let rightTimer = 0;
    let pourTimer = 0;

    const tickLeft = () => {
      setLeftSteam(LEFT_STEAM_FRAMES[leftIndex]);
      leftIndex = (leftIndex + 1) % LEFT_STEAM_FRAMES.length;
      leftTimer = window.setTimeout(tickLeft, 220 + Math.floor(Math.random() * 120));
    };

    const tickRight = () => {
      setRightSteam(RIGHT_STEAM_FRAMES[rightIndex]);
      rightIndex = (rightIndex + 1) % RIGHT_STEAM_FRAMES.length;
      rightTimer = window.setTimeout(tickRight, 250 + Math.floor(Math.random() * 140));
    };

    const tickPour = () => {
      setPour(POUR_FRAMES[pourIndex]);
      pourIndex = (pourIndex + 1) % POUR_FRAMES.length;
      pourTimer = window.setTimeout(tickPour, 140 + Math.floor(Math.random() * 60));
    };

    tickLeft();
    tickRight();
    tickPour();

    return () => {
      window.clearTimeout(leftTimer);
      window.clearTimeout(rightTimer);
      window.clearTimeout(pourTimer);
    };
  }, []);

  return (
    <div className="ascii-coffee-footer" aria-hidden="true">
      <div className="ascii-coffee-stage">
        <div className="ascii-coffee-cluster">
          <div className="ascii-brew ascii-cup ascii-cup-left">
            <pre className="ascii-steam">{leftSteam}</pre>
            <pre className="ascii-art">{CUP_ART}</pre>
          </div>

          <div className="ascii-brew ascii-carafe">
            <div className="ascii-carafe-core">
              <pre className="ascii-art">{CARAFE_ART}</pre>
              <pre className="ascii-coffee-bed">{COFFEE_BED_ART}</pre>
              <div className="ascii-pour-layer">
                <pre className="ascii-pour">{pour}</pre>
              </div>
            </div>
          </div>

          <div className="ascii-brew ascii-cup ascii-cup-right">
            <pre className="ascii-steam">{rightSteam}</pre>
            <pre className="ascii-art">{CUP_ART}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Footer = () => {
  const { pathname } = useLocation();
  const showCta = pathname === '/' || pathname === '/about';

  return (
    <footer className="bg-brand-bg border-t border-white/5">
      <style>{ASCII_COFFEE_STYLES}</style>

      {showCta && (
        <div className="max-w-lg px-6 pb-14 pt-20">
          <h3 className="mb-4 text-4xl font-bold leading-none tracking-tighter">
            Let's build something amazing together.
          </h3>
          <p className="mb-8 text-sm text-brand-muted">
            Available for freelance projects and creative collaborations worldwide.
          </p>
          <a
            href="mailto:mariabordiuh@gmail.com"
            className="border-b border-brand-accent pb-1 text-xl font-medium transition-colors hover:text-brand-accent"
          >
            mariabordiuh@gmail.com
          </a>
        </div>
      )}

      <div
        className={`flex flex-wrap items-center justify-between gap-6 border-t border-white/5 px-6 py-8 ${
          !showCta ? 'pt-16' : ''
        }`}
      >
        <nav className="flex flex-wrap items-center gap-6">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-muted transition-colors hover:text-white"
            >
              {link.name}
            </Link>
          ))}
          <a
            href="mailto:mariabordiuh@gmail.com"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-muted transition-colors hover:text-white"
          >
            say hi
          </a>
        </nav>

        <div className="flex items-center gap-5 text-brand-muted">
          <a
            href="https://linkedin.com/in/mariabordiuh"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-brand-accent"
            aria-label="LinkedIn profile"
          >
            <Linkedin size={18} />
          </a>
          <a
            href="mailto:mariabordiuh@gmail.com"
            className="transition-colors hover:text-brand-accent"
            aria-label="Send an email"
          >
            <Mail size={18} />
          </a>
        </div>
      </div>

      <FooterAsciiCoffee />

      <div className="border-t border-white/5 px-6 py-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-muted">
          © 2026 Maria Bordiuh
        </span>
      </div>

      <div className="px-6 pb-3 pt-14 text-center">
        <p className="font-display text-[18px] italic text-brand-muted">measure twice, brew once.</p>
      </div>
      <div className="px-6 pb-12 text-center">
        <p className="text-[12px] text-white/30">brewed in Hamburg. powered by caffeine and one black cat.</p>
      </div>
    </footer>
  );
};
