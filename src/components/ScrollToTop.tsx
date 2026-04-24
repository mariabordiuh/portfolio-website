import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLenis } from 'lenis/react';

const SCROLL_THRESHOLD = 600;
const FOOTER_BUFFER = 80;

export const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    const handleScroll = () => {
      const scrolledEnough = window.scrollY > SCROLL_THRESHOLD;
      const footer = document.querySelector('footer');
      const footerEncroaching = footer
        ? footer.getBoundingClientRect().top < window.innerHeight - FOOTER_BUFFER
        : false;
      setVisible(scrolledEnough && !footerEncroaching);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (location.hash) {
      return;
    }

    window.requestAnimationFrame(() => {
      lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      setVisible(false);
    });
  }, [lenis, location.hash, location.pathname]);

  const scrollUp = () => {
    if (lenis) {
      lenis.scrollTo(0);
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          key="scroll-top"
          type="button"
          onClick={scrollUp}
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          aria-label="Scroll to top"
          className="fixed bottom-8 right-8 z-[100] flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-brand-bg/80 text-white/70 shadow-2xl backdrop-blur-xl transition-colors hover:border-brand-accent/40 hover:text-brand-accent"
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
};
