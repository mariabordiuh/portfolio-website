import { Linkedin, Mail } from 'lucide-react';
import { V60EasterEgg } from './V60EasterEgg';

export const Footer = () => (
  <footer className="px-6 py-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-end gap-12 relative overflow-hidden bg-brand-bg">
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
