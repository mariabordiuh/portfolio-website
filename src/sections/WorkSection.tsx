import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Shuffle } from 'lucide-react';
import { useFeaturedItems } from '../hooks/useFeaturedItems';
import { MasonryPortfolioGrid } from '../components/MasonryPortfolioGrid';
import { RevealOnScroll } from '../components/RevealOnScroll';
import { ProjectSkeleton } from '../components/Skeleton';
import { PrefetchLink } from '../components/PrefetchLink';

export const WorkSection = () => {
  const { items: allFeatured, loading } = useFeaturedItems();
  const navigate = useNavigate();
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const featuredItems = useMemo(() => {
    const shuffled = [...allFeatured];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 4);
  }, [allFeatured, shuffleSeed]);

  const handlePreview = (item: { id: string }) => {
    navigate(`/work?highlight=${encodeURIComponent(item.id)}`);
  };

  const handleShuffle = useCallback(() => {
    setShuffleSeed((seed) => seed + 1);
  }, []);

  return (
    <section className="px-6 pt-52 pb-24 md:px-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-20">
        <RevealOnScroll className="max-w-3xl">
          <h4 className="text-[10px] uppercase tracking-[0.4em] text-brand-muted mb-4 font-mono">Sequence // 01</h4>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter italic leading-none">Selected Works</h2>
        </RevealOnScroll>
        <RevealOnScroll delay={0.08}>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleShuffle}
              disabled={loading || allFeatured.length <= 4}
              className="group flex items-center gap-3 rounded-full border border-white/10 px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Shuffle selected works"
            >
              Roll Again <Shuffle size={16} className="transition-transform group-hover:rotate-90" />
            </button>
            <PrefetchLink to="/work" className="group flex items-center gap-4 rounded-full border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-white/5">
              Index Catalog <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </PrefetchLink>
          </div>
        </RevealOnScroll>
      </div>
      
      <RevealOnScroll delay={0.12}>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <ProjectSkeleton key={i} />)}
          </div>
        ) : featuredItems.length > 0 ? (
          <MasonryPortfolioGrid items={featuredItems} onPreview={handlePreview} />
        ) : (
          <div className="py-24 text-center text-[10px] uppercase tracking-[0.3em] text-brand-muted font-mono bg-white/5 border border-white/5 rounded-3xl glass">
            Full hard drive, empty page. Maria's mid-espresso and uploading. Come back soon :)
          </div>
        )}
      </RevealOnScroll>
    </section>
  );
};
