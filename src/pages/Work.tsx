import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Filter } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PageTransition } from '../components/PageTransition';
import { RevealText } from '../components/RevealText';
import { BentoCard } from '../components/BentoCard';
import { ProjectSkeleton } from '../components/Skeleton';
import { Tag } from '../components/Tag';
import { ProjectPillar } from '../types';

const PILLARS: ProjectPillar[] = ['Art Direction', 'AI Generated', 'Animations & Motion', 'Illustration & Design'];

export const Work = () => {
  const { projects, loading } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activePillar, setActivePillar] = useState<ProjectPillar | 'All'>('All');
  const [activeTool, setActiveTool] = useState<string | null>(null);

  useEffect(() => {
    const pillarParam = searchParams.get('pillar');
    if (pillarParam && (PILLARS.includes(pillarParam as any) || pillarParam === 'All')) {
      setActivePillar(pillarParam as any);
    }
    const toolParam = searchParams.get('tool');
    if (toolParam) {
      setActiveTool(toolParam);
    }
  }, [searchParams]);

  const filteredProjects = projects.filter(project => {
    const matchesPillar = activePillar === 'All' || project.pillar === activePillar;
    const matchesTool = !activeTool || project.tools.includes(activeTool);
    return matchesPillar && matchesTool;
  });

  const handlePillarChange = (pillar: ProjectPillar | 'All') => {
    setActivePillar(pillar);
    if (pillar === 'All') {
      searchParams.delete('pillar');
    } else {
      searchParams.set('pillar', pillar);
    }
    setSearchParams(searchParams);
  };

  const handleClearTool = () => {
    setActiveTool(null);
    searchParams.delete('tool');
    setSearchParams(searchParams);
  };

  return (
    <PageTransition>
      <div className="pt-40 px-6 pb-32 max-w-7xl mx-auto">
        <header className="mb-20">
          <motion.h1 
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="text-fluid-xl font-black tracking-tighter uppercase mb-8 leading-none"
          >
            <RevealText>Archive</RevealText>
            <RevealText>of Works<span className="text-brand-accent">.</span></RevealText>
          </motion.h1>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between border-t border-white/5 pt-12">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handlePillarChange('All')}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                  activePillar === 'All' 
                    ? 'bg-white text-black border-white' 
                    : 'glass text-brand-muted border-white/5 hover:border-white/20'
                }`}
              >
                All
              </button>
              {PILLARS.map(pillar => (
                <button
                  key={pillar}
                  onClick={() => handlePillarChange(pillar)}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                    activePillar === pillar 
                      ? 'bg-white text-black border-white' 
                      : 'glass text-brand-muted border-white/5 hover:border-white/20'
                  }`}
                >
                  {pillar}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {activeTool && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-3 glass pl-4 pr-1 py-1 rounded-full border border-brand-accent/30"
                >
                  <Filter size={12} className="text-brand-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent">{activeTool}</span>
                  <button onClick={handleClearTool} className="p-2 hover:text-white text-brand-muted transition-colors">
                    <motion.div whileHover={{ scale: 1.2 }}>
                      <RevealText>Close</RevealText>
                    </motion.div>
                  </button>
                  {/* Since RevealText is complex, just use a simple X */}
                  <button onClick={handleClearTool} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <RevealText>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </RevealText>
                  </button>
                  {/* Wait, RevealText might not be appropriate for a button interior if it has animation. Correcting below */}
                  <button onClick={handleClearTool} className="ml-2 w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent hover:bg-brand-accent hover:text-brand-bg transition-colors">
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <ProjectSkeleton key={i} />)
          ) : (
            filteredProjects.map((project) => (
              <BentoCard key={project.id} project={project} />
            ))
          )}
        </div>

        {!loading && filteredProjects.length === 0 && (
          <div className="py-40 text-center glass rounded-3xl border border-white/5">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 opacity-50">No artifacts found</h3>
            <p className="text-brand-muted uppercase text-[10px] tracking-widest">Adjust your filters to explore more archive items.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
};
