import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useFeaturedItems } from '../hooks/useFeaturedItems';
import { MasonryPortfolioGrid } from '../components/MasonryPortfolioGrid';
import { RevealOnScroll } from '../components/RevealOnScroll';
import { ProjectSkeleton } from '../components/Skeleton';

export const WorkSection = () => {
  const { items: allFeatured, loading } = useFeaturedItems();
  const navigate = useNavigate();

  const featuredItems = useMemo(() => {
    const shuffled = [...allFeatured];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 3);
  }, [allFeatured]);

  const handlePreview = (item: { id: string }) => {
    navigate(`/work?highlight=${encodeURIComponent(item.id)}`);
  };

  return (
    <section className="py-60 px-0 md:px-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-20">
        <RevealOnScroll className="max-w-3xl">
          <h4 className="text-[10px] uppercase tracking-[0.4em] text-brand-muted mb-4 font-mono">Sequence // 01</h4>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter italic leading-none">Selected Works</h2>
        </RevealOnScroll>
        <RevealOnScroll delay={0.08}>
          <Link to="/work" className="group flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] border border-white/10 px-8 py-4 rounded-full hover:bg-white/5 transition-all font-mono">
          Index Catalog <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Link>
        </RevealOnScroll>
      </div>
      
      <RevealOnScroll delay={0.12}>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <ProjectSkeleton key={i} />)}
          </div>
        ) : featuredItems.length > 0 ? (
          <MasonryPortfolioGrid items={featuredItems} onPreview={handlePreview} />
        ) : (
          <div className="py-24 text-center text-[10px] uppercase tracking-[0.3em] text-brand-muted font-mono bg-white/5 border border-white/5 rounded-3xl glass">
            nothing here yet. come back with coffee.
          </div>
        )}
      </RevealOnScroll>
    </section>
  );
};
