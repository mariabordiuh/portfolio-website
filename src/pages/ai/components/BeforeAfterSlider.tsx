import { useCallback, useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { SmartImage } from './SmartImage';

type BeforeAfterSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  label: string;
  beforeTag: string;
  afterTag: string;
};

export const BeforeAfterSlider = ({ beforeSrc, afterSrc, label, beforeTag, afterTag }: BeforeAfterSliderProps) => {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const latestClientXRef = useRef(0);

  const updateFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Belt-and-suspenders alongside draggable={false} on the <img>s: without
    // this, pressing down directly on a photo (not just the thin handle) can
    // let the browser's native "drag this image out" gesture take over mid
    // -press, which silently stops pointermove from firing for the rest of
    // the interaction — looks exactly like "click works, drag doesn't".
    event.preventDefault();
    setIsDragging(true);
    updateFromClientX(event.clientX);
  };

  // Window-level listeners (not setPointerCapture on the element) so a real
  // physical drag keeps tracking even if the cursor drifts outside this
  // narrow strip — a trackpad/mouse drag on a tall, narrow slider like this
  // one easily strays a few px past the edge, which silently ends the drag
  // if move/up are only bound to the element itself.
  // rAF-coalesced: a fast mouse can fire pointermove 100+/sec, each forcing a
  // clip-path repaint on a full-size photo — updating state straight from
  // the raw event stream drops frames and feels choppy. Collapsing to one
  // update per animation frame matches the display's actual refresh rate.
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (event: globalThis.PointerEvent) => {
      latestClientXRef.current = event.clientX;
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        updateFromClientX(latestClientXRef.current);
      });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isDragging, updateFromClientX]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') setPosition((current) => Math.max(0, current - 5));
    if (event.key === 'ArrowRight') setPosition((current) => Math.min(100, current + 5));
  };

  return (
    <figure className="ai-ba">
      <div
        ref={frameRef}
        className="ai-ba__frame"
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
      >
        <div className="ai-ba__layer">
          <SmartImage src={afterSrc} alt={`${label} — ${afterTag}`} className="ai-ba__img" placeholderClassName="ai-placeholder--ba" />
          <span className="ai-ba__tag ai-ba__tag--after">{afterTag}</span>
        </div>
        <div
          className="ai-ba__layer ai-ba__layer--before"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <SmartImage src={beforeSrc} alt={`${label} — ${beforeTag}`} className="ai-ba__img" placeholderClassName="ai-placeholder--ba" />
          <span className="ai-ba__tag ai-ba__tag--before">{beforeTag}</span>
        </div>
        <div className="ai-ba__handle" style={{ left: `${position}%` }} aria-hidden="true">
          <span className="ai-ba__handle-grip">↔</span>
        </div>
      </div>
      <figcaption className="ai-ba__caption">{label}</figcaption>
    </figure>
  );
};
