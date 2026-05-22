import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

type CursorMode = 'default' | 'link' | 'button' | 'card' | 'play';
type CursorTheme = 'brand' | 'light';

type CursorPresentation = {
  width: number;
  height: number;
  borderRadius: number;
  background: string;
  borderColor: string;
  boxShadow: string;
  label: string | null;
  labelColor: string;
  dotSize: number;
  dotColor: string;
  dotOpacity: number;
};

const CURSOR_ATTR_SELECTOR = '[data-cursor]';
const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, textarea, select, label';

const getCursorTheme = (pathname: string): CursorTheme =>
  pathname === '/' ? 'brand' : 'light';

const resolveCursorMode = (target: EventTarget | null): CursorMode => {
  if (!(target instanceof Element)) {
    return 'default';
  }

  const taggedTarget = target.closest<HTMLElement>(CURSOR_ATTR_SELECTOR);
  const taggedMode = taggedTarget?.dataset.cursor;
  if (
    taggedMode === 'play' ||
    taggedMode === 'card' ||
    taggedMode === 'button' ||
    taggedMode === 'link'
  ) {
    return taggedMode;
  }

  if (target.closest('video, iframe')) {
    return 'play';
  }

  if (target.closest('a')) {
    return 'link';
  }

  if (target.closest('button, [role="button"], input, textarea, select, label')) {
    return 'button';
  }

  return 'default';
};

const getCursorPresentation = (
  mode: CursorMode,
  theme: CursorTheme,
): CursorPresentation => {
  const palette =
    theme === 'brand'
      ? {
          border: 'rgba(255, 158, 187, 0.58)',
          fill: 'rgba(255, 158, 187, 0.12)',
          glow: '0 0 26px rgba(255, 158, 187, 0.2)',
          solid: 'rgba(255, 158, 187, 0.96)',
          text: '#030103',
          dot: 'rgba(255, 158, 187, 0.98)',
        }
      : {
          border: 'rgba(255, 255, 255, 0.58)',
          fill: 'rgba(255, 255, 255, 0.08)',
          glow: '0 0 24px rgba(255, 255, 255, 0.12)',
          solid: 'rgba(255, 255, 255, 0.94)',
          text: '#030103',
          dot: 'rgba(255, 255, 255, 0.94)',
        };

  switch (mode) {
    case 'link':
      return {
        width: 20,
        height: 20,
        borderRadius: 999,
        background: 'transparent',
        borderColor: palette.border,
        boxShadow: palette.glow,
        label: null,
        labelColor: palette.text,
        dotSize: 3,
        dotColor: palette.dot,
        dotOpacity: 1,
      };
    case 'button':
      return {
        width: 34,
        height: 18,
        borderRadius: 999,
        background: palette.fill,
        borderColor: palette.border,
        boxShadow: palette.glow,
        label: null,
        labelColor: palette.text,
        dotSize: 3,
        dotColor: palette.dot,
        dotOpacity: 0.88,
      };
    case 'card':
      return {
        width: 24,
        height: 24,
        borderRadius: 10,
        background: palette.fill,
        borderColor: palette.border,
        boxShadow: palette.glow,
        label: null,
        labelColor: palette.text,
        dotSize: 2.5,
        dotColor: palette.dot,
        dotOpacity: 0.84,
      };
    case 'play':
      return {
        width: 52,
        height: 24,
        borderRadius: 999,
        background: palette.solid,
        borderColor: 'transparent',
        boxShadow: theme === 'brand' ? '0 0 36px rgba(255, 158, 187, 0.32)' : '0 0 28px rgba(255, 255, 255, 0.18)',
        label: 'play',
        labelColor: palette.text,
        dotSize: 0,
        dotColor: palette.dot,
        dotOpacity: 0,
      };
    case 'default':
    default:
      return {
        width: 18,
        height: 18,
        borderRadius: 999,
        background: palette.fill,
        borderColor: palette.border,
        boxShadow: palette.glow,
        label: null,
        labelColor: palette.text,
        dotSize: theme === 'brand' ? 4 : 3.5,
        dotColor: palette.dot,
        dotOpacity: 1,
      };
  }
};

export const CircleCursor = () => {
  const location = useLocation();
  const dotRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [cursorMode, setCursorMode] = useState<CursorMode>('default');
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const shellPositionRef = useRef({ x: 0, y: 0 });
  const shellSizeRef = useRef({ width: 18, height: 18 });
  const dotSizeRef = useRef(4);
  const rippleIdRef = useRef(0);
  const cursorTheme = useMemo(() => getCursorTheme(location.pathname), [location.pathname]);
  const cursorPresentation = useMemo(
    () => getCursorPresentation(cursorMode, cursorTheme),
    [cursorMode, cursorTheme],
  );

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updateEnabled = () => setEnabled(query.matches);

    updateEnabled();
    query.addEventListener('change', updateEnabled);
    return () => query.removeEventListener('change', updateEnabled);
  }, []);

  useEffect(() => {
    shellSizeRef.current = {
      width: cursorPresentation.width,
      height: cursorPresentation.height,
    };
    dotSizeRef.current = cursorPresentation.dotSize;
  }, [cursorPresentation.dotSize, cursorPresentation.height, cursorPresentation.width]);

  useEffect(() => {
    setCursorMode('default');
  }, [location.pathname]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let animationFrame = 0;

    const animate = () => {
      shellPositionRef.current.x += (mouseRef.current.x - shellPositionRef.current.x) * 0.18;
      shellPositionRef.current.y += (mouseRef.current.y - shellPositionRef.current.y) * 0.18;

      if (dotRef.current) {
        const dotOffset = dotSizeRef.current / 2;
        dotRef.current.style.transform = `translate3d(${mouseRef.current.x - dotOffset}px, ${mouseRef.current.y - dotOffset}px, 0)`;
      }

      if (shellRef.current) {
        shellRef.current.style.transform = `translate3d(${shellPositionRef.current.x - shellSizeRef.current.width / 2}px, ${shellPositionRef.current.y - shellSizeRef.current.height / 2}px, 0)`;
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = { x: event.clientX, y: event.clientY };
      setVisible(true);
    };

    const handlePointerDown = (event: PointerEvent) => {
      rippleIdRef.current += 1;
      const nextRipple = { id: rippleIdRef.current, x: event.clientX, y: event.clientY };
      setRipples((current) => [...current.slice(-2), nextRipple]);
      window.setTimeout(() => {
        setRipples((current) => current.filter((ripple) => ripple.id !== nextRipple.id));
      }, 720);
    };

    const updateMode = (event: Event) => {
      setCursorMode(resolveCursorMode(event.target));
    };

    const handleMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget) {
        setVisible(false);
        setCursorMode('default');
      }
    };

    const handleBlur = () => {
      setVisible(false);
      setCursorMode('default');
    };

    animationFrame = window.requestAnimationFrame(animate);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('mouseover', updateMode, true);
    document.addEventListener('focusin', updateMode, true);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('mouseover', updateMode, true);
      document.removeEventListener('focusin', updateMode, true);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <div
        ref={shellRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9998] flex items-center justify-center border backdrop-blur-md transition-[width,height,border-radius,background-color,border-color,box-shadow,opacity] duration-300 ease-out"
        style={{
          width: `${cursorPresentation.width}px`,
          height: `${cursorPresentation.height}px`,
          borderRadius: `${cursorPresentation.borderRadius}px`,
          background: cursorPresentation.background,
          borderColor: cursorPresentation.borderColor,
          boxShadow: cursorPresentation.boxShadow,
          opacity: visible ? 1 : 0,
        }}
      >
        {cursorPresentation.label ? (
          <span
            className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-[8px] font-black uppercase tracking-[0.26em]"
            style={{ color: cursorPresentation.labelColor }}
          >
            <span className="text-[7px] tracking-normal">▶</span>
            {cursorPresentation.label}
          </span>
        ) : null}
      </div>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full transition-[width,height,background-color,opacity] duration-200 ease-out"
        style={{
          width: `${cursorPresentation.dotSize}px`,
          height: `${cursorPresentation.dotSize}px`,
          background: cursorPresentation.dotColor,
          opacity: visible ? cursorPresentation.dotOpacity : 0,
        }}
      />
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="cursor-click-ripple pointer-events-none fixed z-[9997] h-8 w-8 rounded-full border"
          style={{
            left: ripple.x - 16,
            top: ripple.y - 16,
            borderColor:
              cursorTheme === 'brand'
                ? 'rgba(255, 158, 187, 0.46)'
                : 'rgba(255, 255, 255, 0.38)',
          }}
        />
      ))}
    </>
  );
};
