import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { PageTransition } from '../components/PageTransition';
import { RevealOnScroll } from '../components/RevealOnScroll';
import { RevealText } from '../components/RevealText';
import { Tag } from '../components/Tag';
import { LabSkeleton } from '../components/Skeleton';
import { LabItem, LabSection } from '../types';

const SITE_SHELL_CLASS = 'mx-auto max-w-7xl px-6 md:px-8 xl:px-12';

export const Lab = () => {
  const { labItems, loading } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeItem, setActiveItem] = useState<LabItem | null>(null);
  const previewId = searchParams.get('preview');

  useEffect(() => {
    if (!previewId) {
      return;
    }

    const match = labItems.find((item) => item.id === previewId);
    if (match) {
      setActiveItem(match);
    }
  }, [labItems, previewId]);

  return (
    <PageTransition>
      <div className={`${SITE_SHELL_CLASS} pb-32 pt-40`}>
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
          <RevealOnScroll delay={0.08}>
            <p className="max-w-xl text-lg text-brand-muted">Experiments, tests, learnings, and unfinished vibecodings.</p>
          </RevealOnScroll>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 9 }).map((_, i) => <LabSkeleton key={i} />)
          ) : !labItems.length ? (
            <div className="col-span-full py-24 text-center text-[10px] uppercase tracking-[0.3em] text-brand-muted font-mono">
              Full hard drive, empty page. Maria's mid-espresso and uploading. Come back soon :)
            </div>
          ) : (
            labItems.map((item, index) => (
              <RevealOnScroll key={item.id} delay={index * 0.05}>
                <button
                  type="button"
                  onClick={() => setActiveItem(item)}
                  className="group relative flex w-full cursor-pointer flex-col gap-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-left transition-colors hover:bg-white/10"
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
                </button>
              </RevealOnScroll>
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
                onClick={() => {
                  setActiveItem(null);
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.delete('preview');
                  setSearchParams(nextParams, { replace: true });
                }}
              >
                <X size={32} />
              </button>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto glass rounded-[3rem] p-8 md:p-12"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <span className="px-3 py-1 rounded-full bg-brand-accent/20 text-brand-accent text-xs uppercase tracking-widest font-bold font-mono">
                    {activeItem.type}
                  </span>
                  <span className="text-sm font-mono text-brand-muted">{activeItem.date}</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-3 leading-none">{activeItem.title}</h2>
                <p className="text-brand-muted text-base md:text-lg leading-relaxed mb-8 italic">{activeItem.content}</p>

                {/* Case study meta row */}
                {(activeItem.timeline || activeItem.role) && (
                  <div className="flex flex-wrap gap-6 mb-10 pb-8 border-b border-white/10">
                    {activeItem.timeline && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-mono text-brand-accent mb-1">Timeline</p>
                        <p className="font-semibold text-sm">{activeItem.timeline}</p>
                      </div>
                    )}
                    {activeItem.role && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-mono text-brand-accent mb-1">Role</p>
                        <p className="font-semibold text-sm">{activeItem.role}</p>
                      </div>
                    )}
                    {activeItem.tools.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-mono text-brand-accent mb-2">Tools</p>
                        <div className="flex flex-wrap gap-2">
                          {activeItem.tools.map(tool => (
                            <Tag key={tool} name={tool} onClick={() => { window.location.href = `/work?tool=${tool}`; }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Case study sections */}
                {(activeItem.brief || activeItem.context || activeItem.problem || activeItem.insights || activeItem.solution || activeItem.outcome) ? (
                  (() => {
                    const sectionImages = (key: LabSection) =>
                      (activeItem.labImages ?? []).filter(img => img.after === key);
                    const galleryImages = (activeItem.labImages ?? []).filter(img => !img.after);
                    const sections: { key: LabSection; label: string; value?: string }[] = [
                      { key: 'brief', label: 'The brief', value: activeItem.brief },
                      { key: 'context', label: 'Context', value: activeItem.context },
                      { key: 'problem', label: 'The problem', value: activeItem.problem },
                      { key: 'insights', label: 'Insights', value: activeItem.insights },
                      { key: 'solution', label: 'Solution', value: activeItem.solution },
                      { key: 'outcome', label: 'Outcome', value: activeItem.outcome },
                    ];
                    return (
                      <div className="space-y-10">
                        {sections.filter(s => s.value || sectionImages(s.key).length > 0).map(section => (
                          <div key={section.key}>
                            {section.value && (
                              <>
                                <h3 className="text-[10px] uppercase tracking-widest font-mono text-brand-accent mb-3">{section.label}</h3>
                                <p className="whitespace-pre-line text-white/80 text-base leading-relaxed">{section.value}</p>
                              </>
                            )}
                            {sectionImages(section.key).map((img, i) => (
                              <div key={img.url + i} className="mt-6 rounded-2xl overflow-hidden bg-white/5">
                                <img src={img.url} alt="" className="w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                              </div>
                            ))}
                          </div>
                        ))}
                        {galleryImages.length > 0 && (
                          <div className="pt-4 border-t border-white/10">
                            <p className="text-[10px] uppercase tracking-widest font-mono text-brand-accent mb-4">Gallery</p>
                            <div className="columns-2 gap-3 space-y-3">
                              {galleryImages.map((img, i) => (
                                <div key={img.url + i} className="break-inside-avoid rounded-xl overflow-hidden bg-white/5">
                                  <img src={img.url} alt="" className="w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  /* Simple note layout — no case study fields */
                  <div className="grid md:grid-cols-2 gap-12 items-start">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-8">
                        {activeItem.tools.map(tool => (
                          <Tag key={tool} name={tool} onClick={() => { window.location.href = `/work?tool=${tool}`; }} />
                        ))}
                      </div>
                    </div>
                    {activeItem.image && (
                      <div className="rounded-2xl overflow-hidden bg-white/5 aspect-square relative">
                        <div className="grain-overlay" />
                        <img src={activeItem.image} alt={activeItem.title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                )}

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
