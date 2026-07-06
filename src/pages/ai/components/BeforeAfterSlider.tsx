import { useCallback, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
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
  const frameRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromClientX(event.clientX);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateFromClientX(event.clientX);
  };

  const onPointerUp = () => {
    draggingRef.current = false;
  };

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
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
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
