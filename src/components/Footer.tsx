import { Link, useLocation } from 'react-router-dom';
import { Linkedin, Mail } from 'lucide-react';

const V60_STYLES = `
  @keyframes v60-drip-fall {
    0%   { transform: translateY(0);    opacity: 1; }
    65%  {                              opacity: 1; }
    100% { transform: translateY(10px); opacity: 0; }
  }
  @keyframes v60-liquid-rise {
    0%   { transform: scaleY(0); opacity: 0;    }
    15%  {                       opacity: 0.45; }
    70%  { transform: scaleY(1); opacity: 0.45; }
    90%  { transform: scaleY(1); opacity: 0;    }
    100% { transform: scaleY(0); opacity: 0;    }
  }
  .v60-drip   { animation: v60-drip-fall   2s ease-in     infinite; }
  .v60-liquid { transform-origin: 50% 100%;
                animation: v60-liquid-rise 4s ease-in-out  infinite; }
  .v60-unit:hover .v60-drip { animation-duration: 1s; }
`;

const FOOTER_LINKS = [
  { name: 'home', path: '/' },
  { name: 'work', path: '/work' },
  { name: 'lab', path: '/lab' },
];

export const Footer = () => {
  const { pathname } = useLocation();
  const showCta = pathname === '/' || pathname === '/about';

  return (
    <footer className="bg-brand-bg border-t border-white/5">
      <style>{V60_STYLES}</style>

      {/* CTA — Home and About only */}
      {showCta && (
        <div className="px-6 pt-20 pb-14 max-w-lg">
          <h3 className="text-4xl font-bold tracking-tighter mb-4 leading-none">
            Let's build something amazing together.
          </h3>
          <p className="text-brand-muted mb-8 text-sm">
            Available for freelance projects and creative collaborations worldwide.
          </p>
          <a
            href="mailto:mariabordiuh@gmail.com"
            className="text-xl font-medium border-b border-brand-accent pb-1 hover:text-brand-accent transition-colors"
          >
            mariabordiuh@gmail.com
          </a>
        </div>
      )}

      {/* Nav links + Socials */}
      <div className={`px-6 py-8 flex flex-wrap items-center justify-between gap-6 border-t border-white/5 ${!showCta ? 'pt-16' : ''}`}>
        <nav className="flex flex-wrap items-center gap-6">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-[10px] uppercase tracking-[0.2em] text-brand-muted hover:text-white transition-colors font-mono"
            >
              {link.name}
            </Link>
          ))}
          <a
            href="mailto:mariabordiuh@gmail.com"
            className="text-[10px] uppercase tracking-[0.2em] text-brand-muted hover:text-white transition-colors font-mono"
          >
            say hi
          </a>
        </nav>
        <div className="flex items-center gap-5 text-brand-muted">
          <a
            href="https://linkedin.com/in/mariabordiuh"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-accent transition-colors"
            aria-label="LinkedIn profile"
          >
            <Linkedin size={18} />
          </a>
          <a
            href="mailto:mariabordiuh@gmail.com"
            className="hover:text-brand-accent transition-colors"
            aria-label="Send an email"
          >
            <Mail size={18} />
          </a>
        </div>
      </div>

      {/* V60 + microcopy */}
      <div className="px-6 py-6 v60-unit flex items-center gap-3 text-brand-accent border-t border-white/5">
        <svg
          width="38"
          height="50"
          viewBox="0 0 40 54"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path
            d="M 3 8 L 37 8 M 3 8 L 14 26 M 37 8 L 26 26 M 14 26 L 26 26"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M 6 32 L 34 32 M 8 32 L 8 52 L 32 52 L 32 32"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M 32 37 Q 39 37 39 44 Q 39 51 32 51"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle className="v60-drip" cx="20" cy="27" r="1.5" fill="currentColor" />
          <rect className="v60-liquid" x="9" y="43" width="22" height="8" fill="currentColor" />
        </svg>
        <span style={{ fontSize: '11px', letterSpacing: '0.2em', fontVariant: 'small-caps', color: 'var(--color-brand-muted)' }}>
          Coffee's ready. Let's work.
        </span>
      </div>

      {/* Copyright */}
      <div className="px-6 py-4 border-t border-white/5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-brand-muted font-mono">
          © 2026 Maria Bordiuh
        </span>
      </div>

      {/* Signature */}
      <div className="px-6 pt-14 pb-3 text-center">
        <p className="font-display italic text-[18px] text-brand-muted">
          measure twice, brew once.
        </p>
      </div>
      <div className="px-6 pb-12 text-center">
        <p className="text-[12px] text-white/30">
          brewed in Hamburg. powered by caffeine and one black cat.
        </p>
      </div>
    </footer>
  );
};
