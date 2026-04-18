import { Linkedin, Mail } from 'lucide-react';
import { V60EasterEgg } from './V60EasterEgg';

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

export const Footer = () => (
  <footer className="px-6 py-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-end gap-12 relative overflow-hidden bg-brand-bg">
    <style>{V60_STYLES}</style>
    <div className="max-w-md">
      <h3 className="text-4xl font-bold tracking-tighter mb-6 leading-none">Let's build something amazing together.</h3>
      <p className="text-brand-muted mb-8 text-sm">Available for freelance projects and creative collaborations worldwide.</p>
      <div className="flex flex-col gap-12">
        <a 
          href="mailto:hello@studio.com" 
          className="text-xl font-medium border-b border-brand-accent pb-1 hover:text-brand-accent transition-colors w-fit"
        >
          hello@studio.com
        </a>
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-widest text-brand-muted font-mono">Socials</span>
          <div className="flex gap-6">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-accent transition-colors"
              aria-label="LinkedIn profile"
            >
              <Linkedin size={20} />
            </a>
            <a
              href="mailto:hello@studio.com"
              className="hover:text-brand-accent transition-colors"
              aria-label="Send an email"
            >
              <Mail size={20} />
            </a>
          </div>
        </div>

        {/* Hario V60 coffee illustration */}
        <div className="v60-unit flex items-center gap-3 text-brand-accent">
          <svg
            width="38"
            height="50"
            viewBox="0 0 40 54"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* V60 cone — top rim + left/right walls + flat base */}
            <path
              d="M 3 8 L 37 8 M 3 8 L 14 26 M 37 8 L 26 26 M 14 26 L 26 26"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            {/* Cup — rim + three walls */}
            <path
              d="M 6 32 L 34 32 M 8 32 L 8 52 L 32 52 L 32 32"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            {/* Cup handle */}
            <path
              d="M 32 37 Q 39 37 39 44 Q 39 51 32 51"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            {/* Falling drip — animates via .v60-drip keyframes */}
            <circle className="v60-drip" cx="20" cy="27" r="1.5" fill="currentColor" />
            {/* Rising liquid — scaleY from bottom via .v60-liquid keyframes */}
            <rect className="v60-liquid" x="9" y="43" width="22" height="8" fill="currentColor" />
          </svg>
          <span style={{ fontSize: '11px', letterSpacing: '0.2em', fontVariant: 'small-caps', color: 'var(--color-brand-muted)' }}>
            Coffee's ready. Let's work.
          </span>
        </div>

      </div>
    </div>
    
    <div className="flex flex-col items-end gap-6">
      <V60EasterEgg />
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-brand-muted font-mono">
        <span>© 2026 STUDIO</span>
        <span className="w-1 h-1 bg-brand-accent rounded-full" />
        <span>Built with Coffee</span>
      </div>
    </div>
  </footer>
);
