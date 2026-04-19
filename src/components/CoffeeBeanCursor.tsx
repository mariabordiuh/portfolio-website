import { useEffect, useRef } from 'react';

const NS = 'http://www.w3.org/2000/svg';

const createBeanSvg = (): SVGSVGElement => {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '12');
  svg.setAttribute('height', '12');
  svg.setAttribute('viewBox', '0 0 12 12');
  svg.setAttribute('fill', 'none');

  const ellipse = document.createElementNS(NS, 'ellipse');
  ellipse.setAttribute('cx', '6');
  ellipse.setAttribute('cy', '6.5');
  ellipse.setAttribute('rx', '4.5');
  ellipse.setAttribute('ry', '3');
  ellipse.setAttribute('fill', '#7c4a2d');
  ellipse.setAttribute('transform', 'rotate(-25 6 6.5)');
  svg.appendChild(ellipse);

  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', 'M4 4.5 Q6 6.5 7.5 8');
  path.setAttribute('stroke', '#3d200e');
  path.setAttribute('stroke-width', '0.9');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('fill', 'none');
  svg.appendChild(path);

  return svg;
};

export const CoffeeBeanCursor = () => {
  const lastDropTime = useRef(0);
  const lastDropPos = useRef({ x: 0, y: 0 });
  const nextDropDelay = useRef(3000);

  useEffect(() => {
    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isDesktop) return;

    const dropBean = (x: number, y: number) => {
      const el = document.createElement('div');
      el.style.cssText = `position:fixed;left:${x - 6}px;top:${y - 6}px;pointer-events:none;z-index:9999;transform-origin:center;`;
      el.appendChild(createBeanSvg());
      document.body.appendChild(el);

      el.animate(
        [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(1.1)' },
        ],
        { duration: 1200, easing: 'ease-out', fill: 'forwards' }
      ).onfinish = () => el.remove();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dx = e.clientX - lastDropPos.current.x;
      const dy = e.clientY - lastDropPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= 50 && now - lastDropTime.current >= nextDropDelay.current) {
        dropBean(e.clientX, e.clientY);
        lastDropTime.current = now;
        lastDropPos.current = { x: e.clientX, y: e.clientY };
        nextDropDelay.current = 3000 + Math.random() * 1000;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return null;
};
