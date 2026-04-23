import { useRef, useEffect, useState } from 'react';

export const CircleCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updateEnabled = () => setEnabled(query.matches);

    updateEnabled();
    query.addEventListener('change', updateEnabled);
    return () => query.removeEventListener('change', updateEnabled);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <div 
      ref={dotRef} 
      className="fixed top-0 left-0 w-1.5 h-1.5 bg-brand-accent rounded-full pointer-events-none z-[10000] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
    />
  );
};
