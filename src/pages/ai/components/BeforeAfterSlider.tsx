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

  const updateFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateFromClientX(event.clientX);
  };

  // Window-level listeners (not setPointerCapture on the element) so a real
  // physical drag keeps tracking even if the cursor drifts outside this
  // narrow strip — a trackpad/mouse drag on a tall, narrow slider like this
  // one easily strays a few px past the edge, which silently ends the drag
  // if move/up are only bound to the element itself.
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (event: globalThis.PointerEvent) => updateFromClientX(event.clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
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
