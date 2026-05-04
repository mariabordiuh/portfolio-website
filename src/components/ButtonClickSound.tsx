import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const playClick = (audioContext: AudioContext) => {
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(640, now);
  oscillator.frequency.exponentialRampToValueAtTime(280, now + 0.045);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.018, now + 0.008);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.07);
};

export const ButtonClickSound = () => {
  const location = useLocation();
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest('[data-click-sound="true"]')
        : null;

      if (!target) {
        return;
      }

      const AudioContextConstructor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextConstructor) {
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextConstructor();
      }

      const context = audioContextRef.current;
      if (context.state === 'suspended') {
        void context.resume().catch(() => undefined);
      }

      playClick(context);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [location.pathname]);

  return null;
};
