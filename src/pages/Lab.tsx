import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PageTransition } from '../components/PageTransition';
import { RevealText } from '../components/RevealText';
import { Tag } from '../components/Tag';
import { LabSkeleton } from '../components/Skeleton';
import { LabItem } from '../types';

export const Lab = () => {
  const { labItems, loading } = useData();
  const [activeItem, setActiveItem] = useState<LabItem | null>(null);

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
                  staggerChildren: 0.15
                }
              }
            }}
            className="text-fluid-xl font-black tracking-tighter uppercase mb-6 leading-none"
          >
            <RevealText>The Lab</RevealText>
          </motion.h1>
          <p className="text-brand-muted max-w-xl text-lg">Experiments, tests, learnings, and unfinished vibecodings.</p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 9 }).map((_, i) => <LabSkeleton key={i} />)
          ) : (
            labItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setActiveItem(item)}
                className="p-8 bg-white/5 rounded-3xl border border-white/10 flex flex-col gap-6 hover:bg-white/10 transition-colors cursor-pointer group relative overflow-hidden"
              >
                <div className="flex justify-between items-start z-10">
                  <span className="px-3 py-1 rounded-full bg-brand-accent/20 text-brand-accent text-[10px] uppercase tracking-widest font-bold font-mono">
                    {item.type}
                  </span>
                  <span className="text-[10px] font-mono text-brand-muted">{item.date}</span>
                </div>
                {item.image && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-black/20 z-10">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      width={600}
                      height={400}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 grayscale hover:grayscale-0" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                )}
                <div className="z-10">
                  <h3 className="text-xl font-bold mb-3 group-hover:text-brand-accent transition-colors leading-tight">{item.title}</h3>
                  <p className="text-brand-muted text-sm leading-relaxed mb-4 line-clamp-3 italic">{item.content}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tools.map(tool => (
                      <Tag 
                        key={tool} 
                        name={tool} 
                        onClick={(e) => {
                          e?.stopPropagation();
                          window.location.href = `/work?tool=${tool}`;
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Lab Item Modal */}
        <AnimatePresence>
          {activeItem && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6"
            >
              <button 
                className="absolute top-8 right-8 text-white hover:text-brand-accent transition-colors"
                onClick={() => setActiveItem(null)}
              >
                <X size={32} />
              </button>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-4xl glass rounded-[3rem] overflow-hidden p-8 md:p-12 relative"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-8">
                  <span className="px-3 py-1 rounded-full bg-brand-accent/20 text-brand-accent text-xs uppercase tracking-widest font-bold font-mono">
                    {activeItem.type}
                  </span>
                  <span className="text-sm font-mono text-brand-muted">{activeItem.date}</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-6 leading-none">{activeItem.title}</h2>
                <div className="grid md:grid-cols-2 gap-12 items-start">
                  <div>
                    <p className="text-brand-muted text-lg leading-relaxed mb-8 italic">{activeItem.content}</p>
                    <div className="flex flex-wrap gap-2 mb-8">
                      {activeItem.tools.map(tool => (
                        <Tag 
                          key={tool} 
                          name={tool} 
                          onClick={() => {
                            window.location.href = `/work?tool=${tool}`;
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  {activeItem.image && (
                    <div className="rounded-2xl overflow-hidden bg-white/5 aspect-square relative">
                      <div className="grain-overlay" />
                      <img 
                        src={activeItem.image} 
                        alt={activeItem.title} 
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                  )}
                </div>
                {activeItem.code && (
                  <div className="mt-8 p-6 bg-black/40 rounded-2xl font-mono text-xs text-brand-accent overflow-x-auto border border-white/5 selection:bg-brand-accent selection:text-brand-bg">
                    <pre><code>{activeItem.code}</code></pre>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};
