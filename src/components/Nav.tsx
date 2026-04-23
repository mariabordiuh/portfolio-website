import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { PrefetchLink } from './PrefetchLink';

const MariaLogo = () => (
  <svg
    width="800"
    height="250"
    viewBox="0 0 800 250"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-auto text-white md:h-9"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M41 216.27V86.78H61.24V67H90.45V86.78H110.92V126.11H122.19V86.78H142.66V67H172.1V86.78H192.11V216.27H163.13V98.51H151.63V137.61H131.16V196.72H101.95V137.61H81.48V98.51H70.21V216.27H41Z" fill="currentColor" />
    <path d="M379.486 216.27V126.11H399.726V106.33H469.646V126.11H490.116V157.16H460.676V137.61H408.696V216.27H379.486Z" fill="currentColor" />
    <path d="M518.07 216.27V106.33H547.28V216.27H518.07ZM518.07 98.51V67H547.28V98.51H518.07Z" fill="currentColor" />
    <path d="M591.094 216.27V196.72H570.854V126.11H591.094V106.33H661.013V126.11H681.484V184.99H701.954V216.27H672.514V196.72H661.013V216.27H591.094ZM600.064 184.99H652.044V137.61H600.064V184.99Z" fill="currentColor" />
    <line y1="-7" x2="98" y2="-7" transform="matrix(1 0 -0.000563673 1 225 216)" stroke="var(--accent-color)" strokeWidth="14" />
    <line y1="-7" x2="128" y2="-7" transform="matrix(1 0 -0.000872029 1 211 202)" stroke="var(--accent-color)" strokeWidth="14" />
    <line y1="-7" x2="42" y2="-7" transform="matrix(0 1 -1 0.000563673 225 132)" stroke="var(--accent-color)" strokeWidth="14" />
    <path d="M316 131.996V173.996" stroke="var(--accent-color)" strokeWidth="14" />
    <line y1="-7" x2="14" y2="-7" transform="matrix(0 1 -1 0.000563673 239 174)" stroke="var(--accent-color)" strokeWidth="14" />
    <line y1="-7" x2="14" y2="-7" transform="matrix(0 1 -1 0.000563673 295 174)" stroke="var(--accent-color)" strokeWidth="14" />
    <line y1="-7" x2="42" y2="-7" transform="matrix(0 1 -1 0.000973429 337 118)" stroke="var(--accent-color)" strokeWidth="14" />
    <line y1="-7" x2="14" y2="-7" transform="matrix(0 1 -1 0.000973429 274 90)" stroke="var(--accent-color)" strokeWidth="14" />
    <line y1="-7" x2="14" y2="-7" transform="matrix(0 1 -1 0.000973429 260 76)" stroke="var(--accent-color)" strokeWidth="14" />
    <line y1="-7" x2="14" y2="-7" transform="matrix(0 1 -1 0.000973429 274 62)" stroke="var(--accent-color)" strokeWidth="14" />
    <line y1="-7" x2="14" y2="-7" transform="matrix(0 1 -1 0.000973429 288 48)" stroke="var(--accent-color)" strokeWidth="14" />
    <line y1="-7" x2="14" y2="-7" transform="matrix(0 1 -1 0.000973429 288 34)" stroke="var(--accent-color)" strokeWidth="14" />
    <line y1="-7" x2="14" y2="-7" transform="matrix(-1 0 0.000973429 -1 337 118)" stroke="var(--accent-color)" strokeWidth="14" />
    <line y1="-7" x2="14" y2="-7" transform="matrix(-1 0 0.000563673 -1 337 146)" stroke="var(--accent-color)" strokeWidth="14" />
    <line y1="-7" x2="98" y2="-7" transform="matrix(1 0 -0.000563673 1 225 132)" stroke="var(--accent-color)" strokeWidth="14" />
    <path d="M737.5 201.993V215.993" stroke="var(--accent-color)" strokeWidth="14" />
  </svg>
);

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

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleLogoClick = (e: React.MouseEvent) => {
    const isAdminEasterEggClick = clickCountRef.current + 1 >= 5;

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    clickCountRef.current += 1;
    resetTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 3000);

    if (isAdminEasterEggClick) {
      e.preventDefault();
      e.stopPropagation();
      clickCountRef.current = 0;
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      navigate('/admin', { replace: false });
    }
  };

  const navLinks = [
    { name: 'home', path: '/' },
    { name: 'work', path: '/work' },
    { name: 'lab', path: '/lab' },
    { name: 'about', path: '/about' },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 w-full z-50 px-6 md:px-12 xl:px-20 flex justify-between items-center transition-all duration-500",
      "bg-black/40 backdrop-blur-xl border-b border-white/5",
      scrolled ? "py-4" : "py-6"
    )}>

      <PrefetchLink
        to="/" 
        onClick={handleLogoClick}
        className="block hover:opacity-70 transition-opacity"
        aria-label="Maria Bordiuh home"
      >
        <MariaLogo />
      </PrefetchLink>

      {/* Desktop Nav */}
      <div className="hidden md:flex gap-8 items-center">
        {navLinks.map((link) => (
          <PrefetchLink
            key={link.path}
            to={link.path}
            aria-current={
              location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
                ? 'page'
                : undefined
            }
            className={cn(
              "text-[10px] uppercase tracking-[0.2em] font-medium transition-colors hover:text-brand-accent",
              location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
                ? "text-brand-accent"
                : "text-white drop-shadow-md"
            )}
          >
            {link.name}
          </PrefetchLink>
        ))}
      </div>

      {/* Mobile Toggle */}
      <button 
        className="md:hidden text-white" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
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
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            className="fixed inset-0 bg-brand-bg flex flex-col items-center justify-center gap-8 z-40"
          >
            <button 
              className="absolute top-8 right-6 text-white" 
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X size={32} />
            </button>
            
            {navLinks.map((link) => (
              <PrefetchLink
                key={link.path}
                to={link.path}
                aria-current={
                  location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
                    ? 'page'
                    : undefined
                }
                className="text-4xl font-bold tracking-tighter hover:text-brand-accent transition-colors"
              >
                {link.name}
              </PrefetchLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
