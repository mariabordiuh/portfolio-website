import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Filter } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PageTransition } from '../components/PageTransition';
import { RevealText } from '../components/RevealText';
import { MasonryPortfolioGrid } from '../components/MasonryPortfolioGrid';
import { PortfolioPreviewModal } from '../components/PortfolioPreviewModal';
import { ProjectSkeleton } from '../components/Skeleton';
import { type ProjectPillar } from '../types';
import {
  type PortfolioItem,
  WORK_PILLARS,
  galleryToPortfolioItem,
  getPortfolioImageSrc,
  toPortfolioItem,
  videoToPortfolioItem,
} from '../utils/portfolio';

const SUB_CATEGORIES: Record<ProjectPillar, string[]> = {
  'AI Generated': ['Images', 'Videos'],
  'Illustration & Design': ['Illustration', 'Sketchbook'],
  'Animation & Motion': ['Traditional', 'Cut-Out', 'Motion'],
  'Art Direction': [],
};

const DEFAULT_SUBCATEGORY: Record<ProjectPillar, string | null> = {
  'AI Generated': 'Images',
  'Illustration & Design': 'Illustration',
  'Animation & Motion': 'Traditional',
  'Art Direction': null,
};

const INITIAL_VISIBLE_ITEMS = 4;
const VISIBLE_ITEMS_INCREMENT = 12;
const PRELOAD_BATCH_SIZE = 12;

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const shufflePortfolioItems = (items: PortfolioItem[], seed: string) =>
  [...items].sort((left, right) => {
    const leftValue = hashString(`${seed}:${left.id}`);
    const rightValue = hashString(`${seed}:${right.id}`);
    return leftValue - rightValue;
  });

const sortPriorityItems = (items: PortfolioItem[]) =>
  [...items].sort((left, right) => {
    const leftRank = left.workPriorityRank ?? Number.POSITIVE_INFINITY;
    const rightRank = right.workPriorityRank ?? Number.POSITIVE_INFINITY;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return 0;
  });

export const Work = () => {
  const { projects, videos, galleryImages, loading } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activePillar, setActivePillar] = useState<ProjectPillar | 'All'>('All');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<PortfolioItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ITEMS);
  const [sessionSeed] = useState(() => Math.random().toString(36).slice(2));
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const pillarParam = searchParams.get('pillar');
    if (pillarParam && (WORK_PILLARS.includes(pillarParam as ProjectPillar) || pillarParam === 'All')) {
      setActivePillar(pillarParam as ProjectPillar | 'All');
      if (pillarParam !== 'All' && !activeSubcategory) {
        setActiveSubcategory(DEFAULT_SUBCATEGORY[pillarParam as ProjectPillar]);
      }
    } else {
      setActivePillar('All');
    }
    setActiveTool(searchParams.get('tool'));
  }, [searchParams]);

  const workItems = useMemo(() => [
    ...projects.map(toPortfolioItem),
    ...videos.map(videoToPortfolioItem),
    ...galleryImages.map(galleryToPortfolioItem),
  ], [projects, videos, galleryImages]);

  const highlightId = searchParams.get('highlight');

  const filteredItems = useMemo(() => {
    const rawItems = workItems.filter((item) => {
      const matchesTool = !activeTool || item.tools.includes(activeTool);
      if (!matchesTool) return false;

      const isAiVideo = item.contentType === 'ai-video';
      const isSketchbook = item.subCategory?.toLowerCase() === 'sketchbook' || item.categories?.some(c => c.toLowerCase() === 'sketchbook');
      const isCutOut = item.subCategory?.toLowerCase() === 'cut-out' || item.categories?.some(c => c.toLowerCase() === 'cut-out');
      const isMotion = item.subCategory?.toLowerCase() === 'motion' || item.categories?.some(c => c.toLowerCase() === 'motion');

      if (activePillar === 'All') {
        if (item.pillar === 'AI Generated') return !isAiVideo;
        if (item.pillar === 'Illustration & Design') return !isSketchbook;
        if (item.pillar === 'Animation & Motion') return !isCutOut && !isMotion;
        if (item.pillar === 'Art Direction') return false;
        return true;
      }

      if (item.pillar !== activePillar) return false;

      if (activeSubcategory) {
        if (activePillar === 'AI Generated') return activeSubcategory === 'Videos' ? isAiVideo : !isAiVideo;
        if (activePillar === 'Illustration & Design') return activeSubcategory === 'Sketchbook' ? isSketchbook : !isSketchbook;
        if (activePillar === 'Animation & Motion') {
          if (activeSubcategory === 'Cut-Out') return isCutOut;
          if (activeSubcategory === 'Motion') return isMotion;
          return !isCutOut && !isMotion;
        }
      }

      return true;
    });

    const priorityItems = sortPriorityItems(rawItems.filter((item) => item.workPriorityRank));
    const priorityIds = new Set(priorityItems.map((item) => item.id));
    const shuffled = [
      ...priorityItems,
      ...shufflePortfolioItems(rawItems.filter((item) => !priorityIds.has(item.id)), `work-${sessionSeed}`),
    ];

    // If arriving from homepage Selected Works, pin the highlighted item to position 0
    if (highlightId) {
      const idx = shuffled.findIndex((item) => item.id === highlightId);
      if (idx > 0) {
        const [highlighted] = shuffled.splice(idx, 1);
        shuffled.unshift(highlighted);
      }
    }

    return shuffled;
  }, [workItems, activePillar, activeSubcategory, activeTool, sessionSeed, highlightId]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ITEMS);
  }, [activePillar, activeSubcategory, activeTool, filteredItems.length, highlightId]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount],
  );

  const hasMoreItems = visibleCount < filteredItems.length;

  useEffect(() => {
    const preloadLinks: HTMLLinkElement[] = [];

    for (const item of filteredItems.slice(0, Math.max(visibleCount, 4))) {
      const imageSrc = getPortfolioImageSrc(item);
      if (!imageSrc) {
        continue;
      }

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imageSrc;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
      preloadLinks.push(link);
    }

    return () => {
      preloadLinks.forEach((link) => link.remove());
    };
  }, [filteredItems, visibleCount]);

  useEffect(() => {
    const nextBatch = filteredItems.slice(visibleCount, visibleCount + PRELOAD_BATCH_SIZE);
    const preloadLinks: HTMLLinkElement[] = [];

    const preloadNextBatch = () => {
      for (const item of nextBatch) {
        const imageSrc = getPortfolioImageSrc(item);
        if (!imageSrc) {
          continue;
        }

        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'image';
        link.href = imageSrc;
        document.head.appendChild(link);
        preloadLinks.push(link);
      }
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preloadNextBatch, { timeout: 1200 });
      return () => {
        window.cancelIdleCallback(idleId);
        preloadLinks.forEach((link) => link.remove());
      };
    }

    const timeoutId = setTimeout(preloadNextBatch, 250);
    return () => {
      clearTimeout(timeoutId);
      preloadLinks.forEach((link) => link.remove());
    };
  }, [filteredItems, visibleCount]);

  useEffect(() => {
    if (!hasMoreItems || !loadMoreRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((current) => Math.min(current + VISIBLE_ITEMS_INCREMENT, filteredItems.length));
        }
      },
      { rootMargin: '900px 0px' },
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [filteredItems.length, hasMoreItems, visibleCount]);

  const handlePillarChange = (pillar: ProjectPillar | 'All') => {
    const nextParams = new URLSearchParams(searchParams);

    if (pillar === 'All') {
      nextParams.delete('pillar');
      setActiveSubcategory(null);
    } else {
      nextParams.set('pillar', pillar);
      setActiveSubcategory(DEFAULT_SUBCATEGORY[pillar]);
    }

    startTransition(() => {
      setActivePillar(pillar);
      setSearchParams(nextParams);
    });
  };

  const handleClearTool = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('tool');
    setActiveTool(null);
    setSearchParams(nextParams);
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-6 pb-32 pt-40">
        <header className="mb-14">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
            }}
            className="mb-8 text-fluid-xl font-black uppercase leading-none tracking-tighter"
          >
            <RevealText>Archive</RevealText>
            <RevealText>
              of Works<span className="text-brand-accent">.</span>
            </RevealText>
          </motion.h1>

          <div className="mt-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-t border-white/5 pt-8">
            <div className="flex w-full items-center gap-3 overflow-x-auto pb-4 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button
                type="button"
                onClick={() => handlePillarChange('All')}
                className={`flex-shrink-0 rounded-full border px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  activePillar === 'All'
                    ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                    : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/90'
                }`}
              >
                All Works
              </button>

              {WORK_PILLARS.map((pillar) => {
                const isActive = activePillar === pillar;

                return (
                  <button
                    key={pillar}
                    type="button"
                    onClick={() => handlePillarChange(isActive ? 'All' : pillar)}
                    className={`flex-shrink-0 rounded-full border px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                      isActive
                        ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                        : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/90'
                    }`}
                  >
                    {pillar}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {activeTool ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="flex items-center gap-3 rounded-full border border-brand-accent/30 bg-brand-accent/10 pl-4 pr-2 py-2"
                >
                  <Filter size={12} className="text-brand-accent" />
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
                    {activeTool}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearTool}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent transition-colors hover:bg-brand-accent hover:text-brand-bg"
                  >
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {activePillar !== 'All' && SUB_CATEGORIES[activePillar].length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 flex w-full items-center gap-2 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="h-4 w-px bg-white/20 ml-2 mr-1 flex-shrink-0" />
                  {SUB_CATEGORIES[activePillar].map((sub) => {
                    const isActive = activeSubcategory === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setActiveSubcategory(sub)}
                        className={`flex-shrink-0 rounded-full border px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                          isActive
                            ? 'border-brand-accent/50 bg-brand-accent/20 text-brand-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]'
                            : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/80'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProjectSkeleton key={index} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] py-32 text-center">
            <h3 className="mb-4 text-2xl font-black uppercase tracking-tighter opacity-60">
              No work matches this filter
            </h3>
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">
              Try a different pillar or clear the active tool filter.
            </p>
          </div>
        ) : (
          <div className="mt-8 transition-opacity duration-500 will-change-transform">
            <MasonryPortfolioGrid items={visibleItems} onPreview={setActivePreview} />

            {hasMoreItems ? (
              <div ref={loadMoreRef} className="mt-14 flex flex-col items-center gap-5" aria-live="polite">
                <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="relative overflow-hidden rounded-[1.8rem] border border-white/8 bg-white/[0.035]"
                      style={{ aspectRatio: index === 1 ? '1 / 1' : '4 / 5' }}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,158,187,0.14),transparent_34%),radial-gradient(circle_at_72%_72%,rgba(185,122,37,0.12),transparent_30%)]" />
                      <div className="absolute inset-y-0 left-[-70%] w-[60%] skew-x-[-16deg] bg-gradient-to-r from-transparent via-white/16 to-transparent animate-[shimmer_1.35s_infinite]" />
                    </div>
                  ))}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">
                  brewing more work...
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activePreview ? (
          <PortfolioPreviewModal item={activePreview} onClose={() => setActivePreview(null)} />
        ) : null}
      </AnimatePresence>
    </PageTransition>
  );
};
