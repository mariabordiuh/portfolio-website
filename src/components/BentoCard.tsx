import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types';

interface BentoCardProps {
  project: Project;
}

export const BentoCard = ({ project }: BentoCardProps) => {
  const cardRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <Link 
      to={`/work/${project.id}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="bento-card relative aspect-[4/5] bg-white/5 rounded-2xl overflow-hidden group cursor-pointer"
    >
      <div className="bento-card-content absolute inset-[1px] bg-brand-bg rounded-[15px] z-10 overflow-hidden">
        <div className="grain-overlay" />
        <img 
          src={project.thumbnail} 
          alt={project.title} 
          width={800}
          height={1000}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105 grayscale hover:grayscale-0"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/80 to-transparent z-20">
          <span className="text-[10px] uppercase tracking-widest text-brand-accent mb-2 block font-mono">{project.pillar}</span>
          <h3 className="text-2xl font-bold tracking-tight">{project.title}</h3>
        </div>
      </div>
    </Link>
  );
};
