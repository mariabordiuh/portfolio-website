import React from 'react';
import { useData } from '../context/DataContext';
import { PageTransition } from '../components/PageTransition';
import { HeroSection } from '../sections/HeroSection';
import { WorkSection } from '../sections/WorkSection';
import { VelocityMarquee } from '../sections/VelocityMarquee';
import { StackedProjectCard } from '../components/StackedProjectCard';

export const Home = () => {
  const { projects, loading } = useData();
  
  return (
    <PageTransition>
      <div className="bg-brand-bg min-h-screen">
        <HeroSection />
        
        <WorkSection projects={projects} loading={loading} />

        <VelocityMarquee />

        {/* Case Studies Stack */}
        <section id="work-stack" className="px-6 py-32 space-y-[20vh]">
          <div className="flex justify-between items-end mb-20 border-b border-white/5 pb-8">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-brand-muted font-mono leading-none">Perspective // 01 // Case Studies</h2>
          </div>
          
          <div className="relative">
            {loading ? (
              <div className="h-[70vh] w-full bg-white/5 animate-pulse rounded-3xl" />
            ) : (
              projects.slice(0, 4).map((project, index) => (
                <StackedProjectCard 
                  key={project.id} 
                  project={project} 
                  index={index} 
                />
              ))
            )}
          </div>
        </section>
      </div>
    </PageTransition>
  );
};
