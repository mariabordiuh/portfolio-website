import React, { useEffect, useRef } from 'react';
import type { LenisOptions } from 'lenis';
import { ReactLenis, useLenis } from 'lenis/react';

const SMOOTH_SCROLL_OPTIONS: LenisOptions = {
  autoRaf: false,
  autoResize: false,
  duration: 1.15,
  easing: (t) => 1 - Math.pow(1 - t, 3),
  smoothWheel: true,
  syncTouch: false,
  touchMultiplier: 1,
  wheelMultiplier: 0.95,
  overscroll: true,
  anchors: true,
  allowNestedScroll: true,
  stopInertiaOnNavigate: true,
};

const SmoothScrollLifecycle = () => {
  const lenis = useLenis();
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lenis) {
      return;
    }

    const onFrame = (time: number) => {
      lenis.raf(time);
      frameRef.current = window.requestAnimationFrame(onFrame);
    };

    const handleResize = () => {
      lenis.resize();
    };

    frameRef.current = window.requestAnimationFrame(onFrame);
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            lenis.resize();
          })
        : null;

    resizeObserver?.observe(document.documentElement);
    resizeObserver?.observe(document.body);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      resizeObserver?.disconnect();
    };
  }, [lenis]);

  return null;
};

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export const SmoothScrollProvider = ({ children }: SmoothScrollProviderProps) => {
  return (
    <ReactLenis root options={SMOOTH_SCROLL_OPTIONS}>
      <SmoothScrollLifecycle />
      {children}
    </ReactLenis>
  );
};
