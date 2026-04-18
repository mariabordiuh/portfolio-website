import { useRef, useEffect } from 'react';

export const VelocityMarquee = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const velocity = useRef(0);
  const baseSpeed = 1.5;
  const currentX = useRef(0);

  useEffect(() => {
    let lastScroll = window.scrollY;
    let animationId: number;
    
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      velocity.current = (currentScroll - lastScroll) * 0.15;
      lastScroll = currentScroll;
    };

    const animate = () => {
      // Lerp velocity back to 0
      velocity.current *= 0.95;
      
      // Update position
      currentX.current -= (baseSpeed + Math.abs(velocity.current));
      
      // Reset for infinite loop
      if (trackRef.current) {
        const trackWidth = trackRef.current.offsetWidth / 2;
        if (Math.abs(currentX.current) >= trackWidth) {
          currentX.current = 0;
        }
        trackRef.current.style.transform = `translate3d(${currentX.current}px, 0, 0)`;
      }
      
      animationId = requestAnimationFrame(animate);
    };

    window.addEventListener('scroll', handleScroll);
    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  const text = "CREATIVE DIRECTOR — AI ARTIST — DESIGN ENGINEER — ";

  return (
    <div className="velocity-marquee overflow-hidden w-full py-20 border-y border-white/5 select-none">
      <div 
        ref={trackRef}
        className="marquee-track flex whitespace-nowrap"
      >
        <span className="text-[15vw] font-bold uppercase tracking-tighter leading-none text-transparent stroke-text opacity-20">
          {text}{text}{text}{text}
        </span>
        <span className="text-[15vw] font-bold uppercase tracking-tighter leading-none text-transparent stroke-text opacity-20">
          {text}{text}{text}{text}
        </span>
      </div>
      <style>{`
        .stroke-text {
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
};
