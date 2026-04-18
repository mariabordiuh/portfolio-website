import { startTransition, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Filter } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PageTransition } from '../components/PageTransition';
import { RevealText } from '../components/RevealText';
import { BentoCard } from '../components/BentoCard';
import { PortfolioPreviewModal } from '../components/PortfolioPreviewModal';
import { ProjectSkeleton } from '../components/Skeleton';
import { type ProjectPillar } from '../types';
import {
  type PortfolioItem,
  WORK_PILLARS,
  galleryToPortfolioItem,
  toPortfolioItem,
  videoToPortfolioItem,
} from '../utils/portfolio';

const PILLAR_COPY: Record<ProjectPillar, string> = {
  'AI Generated': 'Single-frame or single-video explorations built to land fast and clearly.',
  'Art Direction': 'Full case studies with context, tension, process, and final outcomes.',
  'Illustration & Design': 'Still image sets and crafted visual systems that stand on their own.',
  'Animation & Motion': 'Embedded or uploaded motion pieces, from loops to short-form studies.',
};

export const Work = () => {
  const { projects, videos, galleryImages, loading } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activePillar, setActivePillar] = useState<ProjectPillar | 'All'>('All');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    const pillarParam = searchParams.get('pillar');
    if (pillarParam && (WORK_PILLARS.includes(pillarParam as ProjectPillar) || pillarParam === 'All')) {
      setActivePillar(pillarParam as ProjectPillar | 'All');
    } else {
      setActivePillar('All');
    }

    setActiveTool(searchParams.get('tool'));
  }, [searchParams]);

  const workItems = [
    ...projects.map(toPortfolioItem),
    ...videos.map(videoToPortfolioItem),
    ...galleryImages.map(galleryToPortfolioItem),
  ];

  const filteredItems = workItems.filter((item) => {
    const matchesPillar = activePillar === 'All' || item.pillar === activePillar;
    const matchesTool = !activeTool || item.tools.includes(activeTool);
    return matchesPillar && matchesTool;
  });

  const handlePillarChange = (pillar: ProjectPillar | 'All') => {
    const nextParams = new URLSearchParams(searchParams);

    if (pillar === 'All') {
      nextParams.delete('pillar');
    } else {
      nextParams.set('pillar', pillar);
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
        <header className="mb-20">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            className="mb-8 text-fluid-xl font-black uppercase leading-none tracking-tighter"
          >
            <RevealText>Archive</RevealText>
            <RevealText>
              of Works<span className="text-brand-accent">.</span>
            </RevealText>
          </motion.h1>

          <div className="grid gap-4 border-t border-white/5 pt-12 md:grid-cols-2 xl:grid-cols-4">
            {WORK_PILLARS.map((pillar) => {
              const isActive = activePillar === pillar;
              const itemCount = workItems.filter((item) => item.pillar === pillar).length;

              return (
                <button
                  key={pillar}
                  type="button"
                  onClick={() => handlePillarChange(isActive ? 'All' : pillar)}
                  className={`rounded-[2rem] border p-6 text-left transition-all ${
                    isActive
                      ? 'border-brand-accent bg-brand-accent/10 shadow-[0_20px_60px_rgba(var(--accent-rgb),0.12)]'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <p className="mb-6 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
                    <span>{pillar}</span>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-white/60">
                      {itemCount}
                    </span>
                  </p>
                  <p className="max-w-xs text-sm leading-relaxed text-white/70">{PILLAR_COPY[pillar]}</p>
                  <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/50">
                    <span>{isActive ? 'Showing this pillar' : 'Filter this pillar'}</span>
                    <ArrowRight size={12} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handlePillarChange('All')}
                className={`rounded-full border px-5 py-2 text-[10px] font-black uppercase tracking-[0.24em] transition-all ${
                  activePillar === 'All'
                    ? 'border-white bg-white text-black'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                }`}
              >
                All pillars
              </button>
              {activePillar !== 'All' ? (
                <span className="rounded-full border border-brand-accent/20 bg-brand-accent/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
                  {activePillar}
                </span>
              ) : null}
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
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <ProjectSkeleton key={index} />)
            : filteredItems.map((item) => (
                <BentoCard key={item.id} item={item} onPreview={setActivePreview} />
              ))}
        </div>

        {!loading && filteredItems.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] py-32 text-center">
            <h3 className="mb-4 text-2xl font-black uppercase tracking-tighter opacity-60">
              No work matches this filter
            </h3>
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">
              Try a different pillar or clear the active tool filter.
            </p>
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {activePreview ? (
          <PortfolioPreviewModal item={activePreview} onClose={() => setActivePreview(null)} />
        ) : null}
      </AnimatePresence>
    </PageTransition>
  );
};
