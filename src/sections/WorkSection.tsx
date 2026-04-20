import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { BentoCard } from '../components/BentoCard';
import { RevealOnScroll } from '../components/RevealOnScroll';
import { ProjectSkeleton } from '../components/Skeleton';
import { Project } from '../types';
import { toPortfolioItem } from '../utils/portfolio';

interface WorkSectionProps {
  projects: Project[];
  loading: boolean;
}

export const WorkSection = ({ projects, loading }: WorkSectionProps) => {
  const featuredProjects = projects.filter((project) => project.pillar === 'Art Direction').slice(0, 6);

  return (
    <section className="py-60 px-0 md:px-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-20">
        <RevealOnScroll className="max-w-3xl">
          <h4 className="text-[10px] uppercase tracking-[0.4em] text-brand-muted mb-4 font-mono">Sequence // 01</h4>
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">Selected Works</h2>
        </RevealOnScroll>
        <RevealOnScroll delay={0.08}>
          <Link to="/work" className="group flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] border border-white/10 px-8 py-4 rounded-full hover:bg-white/5 transition-all font-mono">
          Index Catalog <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Link>
        </RevealOnScroll>
      </div>
      
      <RevealOnScroll delay={0.12}>
        <div id="bento-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden glass">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <ProjectSkeleton key={i} />)
        ) : featuredProjects.length ? (
          featuredProjects.map((project) => (
            <BentoCard key={project.id} item={toPortfolioItem(project)} onPreview={() => {}} />
          ))
        ) : (
          <div className="col-span-full py-24 text-center text-[10px] uppercase tracking-[0.3em] text-brand-muted font-mono">
            nothing here yet. come back with coffee.
          </div>
        )}
        </div>
      </RevealOnScroll>
    </section>
  );
};
