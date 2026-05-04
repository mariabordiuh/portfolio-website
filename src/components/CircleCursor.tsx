import { useEffect, useRef, useState } from 'react';

export const CircleCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const ringPositionRef = useRef({ x: 0, y: 0 });
  const targetScaleRef = useRef(1);
  const currentScaleRef = useRef(1);
  const rippleIdRef = useRef(0);

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

    let animationFrame = 0;

    const animate = () => {
      ringPositionRef.current.x += (mouseRef.current.x - ringPositionRef.current.x) * 0.16;
      ringPositionRef.current.y += (mouseRef.current.y - ringPositionRef.current.y) * 0.16;
      currentScaleRef.current += (targetScaleRef.current - currentScaleRef.current) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseRef.current.x}px, ${mouseRef.current.y}px, 0)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPositionRef.current.x}px, ${ringPositionRef.current.y}px, 0) scale(${currentScaleRef.current})`;
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerDown = (event: PointerEvent) => {
      rippleIdRef.current += 1;
      const nextRipple = { id: rippleIdRef.current, x: event.clientX, y: event.clientY };
      setRipples((current) => [...current.slice(-2), nextRipple]);
      window.setTimeout(() => {
        setRipples((current) => current.filter((ripple) => ripple.id !== nextRipple.id));
      }, 720);
    };

    const updateScale = (event: Event) => {
      const interactiveTarget = event.target instanceof Element
        ? event.target.closest('a, button, [role="button"], input, textarea, select, label')
        : null;

      targetScaleRef.current = interactiveTarget ? 1.75 : 1;
    };

    animationFrame = window.requestAnimationFrame(animate);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('mouseover', updateScale, true);
    document.addEventListener('focusin', updateScale, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('mouseover', updateScale, true);
      document.removeEventListener('focusin', updateScale, true);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-accent/30 bg-brand-accent/6 backdrop-blur-sm mix-blend-screen"
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent mix-blend-difference"
      />
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="cursor-click-ripple pointer-events-none fixed z-[9997] h-12 w-12 rounded-full border border-brand-accent/40"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
    </>
  );
};
