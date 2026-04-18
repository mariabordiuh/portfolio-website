import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useMagnetic } from '../hooks/useMagnetic';

export const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setClickCount(0), 2000);
    return () => clearTimeout(timer);
  }, [clickCount]);

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount + 1 >= 5) {
      window.location.href = '/admin';
    }
  };

  const navLinks = [
    { name: 'Work', path: '/work' },
    { name: 'Lab', path: '/lab' },
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
        STUDIO<span className="text-brand-accent">.</span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex gap-8 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "text-[10px] uppercase tracking-[0.2em] font-medium transition-colors hover:text-brand-accent",
              location.pathname.startsWith(link.path) ? "text-brand-accent" : "text-brand-muted"
            )}
          >
            {link.name}
          </Link>
        ))}
        <Link 
          ref={useMagnetic() as React.RefObject<HTMLAnchorElement>}
          to="/about"
          className="px-5 py-2 border border-brand-accent/20 rounded-full text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-brand-accent hover:text-brand-bg transition-all"
        >
          Let's Build
        </Link>
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
            <Link 
              ref={useMagnetic() as React.RefObject<HTMLAnchorElement>}
              to="/about"
              onClick={() => setIsOpen(false)}
              className="mt-4 px-8 py-3 border border-brand-accent/20 rounded-full text-sm uppercase tracking-widest hover:bg-brand-accent hover:text-brand-bg transition-all"
            >
              Let's Build
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
