import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Shuffle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { MasonryPortfolioGrid } from '../components/MasonryPortfolioGrid';
import { RevealOnScroll } from '../components/RevealOnScroll';
import { ProjectSkeleton } from '../components/Skeleton';
import { PrefetchLink } from '../components/PrefetchLink';
import { buildSelectedPoolFromCollections } from '../utils/featured-items';

export const WorkSection = () => {
  const { projects, videos, galleryImages, loading } = useData();
  const navigate = useNavigate();
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const allFeatured = useMemo(
    () => buildSelectedPoolFromCollections(projects, videos, galleryImages),
    [galleryImages, projects, videos],
  );

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
    <section className="px-6 pb-24 pt-24 md:px-12 md:pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:mb-16 md:flex-row md:items-end md:gap-8">
          <RevealOnScroll className="max-w-3xl">
            <h4 className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.4em] text-brand-muted">Sequence // 01</h4>
            <h2 className="max-w-[10ch] font-display text-[clamp(1.55rem,3.2vw,2.85rem)] font-normal uppercase leading-[1.14] tracking-[0.02em] text-white">
              <span className="block">Selected</span>
              <span className="mt-2 block">Works</span>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.08}>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleShuffle}
                disabled={loading || allFeatured.length <= 4}
                data-click-sound="true"
                className="group btn-glass-shift px-6 py-4 font-mono text-[10px] font-black uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Shuffle selected works"
              >
                Roll Again <Shuffle size={16} className="transition-transform group-hover:rotate-90" />
              </button>
              <PrefetchLink
                to="/work"
                data-click-sound="true"
                className="group btn-gradient-shift px-8 py-4 font-mono text-[10px] font-black uppercase tracking-[0.2em]"
              >
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
            <div className="glass rounded-3xl border border-white/5 bg-white/5 py-24 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-brand-muted">
              Full hard drive, empty page. Maria's mid-espresso and uploading. Come back soon :)
            </div>
          )}
        </RevealOnScroll>
      </div>
    </section>
  );
};
