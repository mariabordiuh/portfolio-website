import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

export const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const clickCountRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    clickCountRef.current += 1;

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 3000);

    if (clickCountRef.current >= 5) {
      e.preventDefault();
      clickCountRef.current = 0;
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      navigate('/admin');
    }
  };

  const navLinks = [
    { name: 'home', path: '/' },
    { name: 'work', path: '/work' },
    { name: 'lab', path: '/lab' },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center transition-all duration-500",
      scrolled ? "bg-black/60 backdrop-blur-xl py-4 border-b border-white/5" : "bg-transparent py-8"
    )}>
      <Link 
        to="/" 
        onClick={handleLogoClick}
        className="text-2xl font-bold tracking-tighter hover:opacity-70 transition-opacity"
      >
        Maria<span className="text-brand-accent">.</span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex gap-8 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "text-[10px] uppercase tracking-[0.2em] font-medium transition-colors hover:text-brand-accent",
              location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
                ? "text-brand-accent"
                : "text-brand-muted"
            )}
          >
            {link.name}
          </Link>
        ))}
        <a
          href="mailto:mariabordiuh@gmail.com"
          className="text-[10px] uppercase tracking-[0.2em] font-medium text-brand-muted transition-colors hover:text-brand-accent"
        >
          say hi
        </a>
      </div>

      {/* Mobile Toggle */}
      <button 
        className="md:hidden text-white" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-brand-bg flex flex-col items-center justify-center gap-8 z-40"
          >
            <button 
              className="absolute top-8 right-6 text-white" 
              onClick={() => setIsOpen(false)}
            >
              <X size={32} />
            </button>
            
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="text-4xl font-bold tracking-tighter hover:text-brand-accent transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <a
              href="mailto:mariabordiuh@gmail.com"
              onClick={() => setIsOpen(false)}
              className="text-4xl font-bold tracking-tighter hover:text-brand-accent transition-colors"
            >
              say hi
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
