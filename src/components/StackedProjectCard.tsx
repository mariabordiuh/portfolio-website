import { ArrowUpRight } from 'lucide-react';
import { Project } from '../types';
import { PrefetchLink } from './PrefetchLink';

interface StackedProjectCardProps {
  project: Project;
  index: number;
}

export const StackedProjectCard = ({ project, index }: StackedProjectCardProps) => {
  return (
    <div 
      className="project-card sticky bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 min-h-[70vh] flex flex-col md:flex-row gap-12 shadow-[-20px_-20px_50px_rgba(0,0,0,0.8)]"
      style={{ 
        top: `${10 + index * 2}vh`,
        zIndex: index + 1
      }}
    >
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-brand-accent mb-4 block font-mono">Project 0{index + 1}</span>
          <h3 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-6 leading-none">{project.title}</h3>
          <p className="text-xl text-brand-muted max-w-md leading-relaxed">{project.description}</p>
        </div>
        <PrefetchLink
          to={`/work/${project.id}`}
          className="group flex items-center gap-4 text-sm uppercase tracking-widest w-fit"
        >
          View Case Study 
          <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-brand-accent group-hover:text-brand-bg transition-all">
            <ArrowUpRight size={16} />
          </div>
        </PrefetchLink>
      </div>
      <div className="flex-1 aspect-video md:aspect-auto bg-white/5 rounded-2xl overflow-hidden relative">
        <div className="grain-overlay" />
        <img 
          src={project.thumbnail} 
          alt={project.title} 
          width={1200}
          height={800}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
