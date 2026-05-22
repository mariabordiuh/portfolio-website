import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
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
const ARTICLE_IMAGE_TOKEN = '[INSERT IMAGE HERE — see image block below]';
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
] as const;

const parseLabDate = (value?: string) => {
  const timestamp = Date.parse(value ?? '');
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getLabThumbnail = (item: LabItem) =>
  item.thumbnail || item.image || item.heroImage || item.bodyImage?.url || '';

const getLabHeroImage = (item: LabItem) =>
  item.heroImage || item.thumbnail || item.image || item.bodyImage?.url || '';

const renderInlineMarkdown = (text: string) => {
  const parts = text.split(/(\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

const renderArticleBody = (item: LabItem) => {
  const body = item.bodyMarkdown?.trim();

  if (!body) {
    return null;
  }

  const blocks = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="max-w-[44rem] space-y-7">
      {blocks.map((block, index) => {
        if (block === ARTICLE_IMAGE_TOKEN) {
          if (!item.bodyImage?.url) {
            return null;
          }

          return (
            <div key={`article-image-${index}`} className="pt-3">
              <img
                src={item.bodyImage.url}
                alt={item.bodyImage.alt ?? ''}
                loading="lazy"
                decoding="async"
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>
          );
        }

        return (
          <p
            key={`article-paragraph-${index}`}
            className="text-[1.02rem] leading-[1.95] text-white/84 md:text-[1.08rem]"
          >
            {renderInlineMarkdown(block)}
          </p>
        );
      })}
    </div>
  );
};

export const Lab = () => {
  const { labItems, loading } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeItem, setActiveItem] = useState<LabItem | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const modalTitleId = useId();
  const modalDescriptionId = useId();
  const previewId = searchParams.get('preview');
  const sortOrder = searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest';
  const sortedLabItems = React.useMemo(
    () =>
      [...labItems].sort((a, b) =>
        sortOrder === 'oldest'
          ? parseLabDate(a.date) - parseLabDate(b.date)
          : parseLabDate(b.date) - parseLabDate(a.date),
      ),
    [labItems, sortOrder],
  );

  useEffect(() => {
    if (!previewId) {
      return;
    }

    const match = sortedLabItems.find((item) => item.id === previewId);
    if (match) {
      setActiveItem(match);
    }
  }, [previewId, sortedLabItems]);

  useEffect(() => {
    if (!activeItem) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.style.overflow = 'hidden';

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
      modalScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('preview');
        setSearchParams(nextParams, { replace: true });
        setActiveItem(null);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [activeItem, searchParams, setSearchParams]);

  const closeActiveItem = () => {
    setActiveItem(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('preview');
    setSearchParams(nextParams, { replace: true });
  };

  const openItem = (item: LabItem) => {
    setActiveItem(item);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('preview', item.id);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <PageTransition>
      <div className={`${SITE_SHELL_CLASS} pb-28 pt-36 md:pb-32 md:pt-40`}>
        <header className="mb-16 md:mb-20">
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
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <p className="max-w-xl text-lg text-brand-muted">Experiments, tests, learnings, and unfinished vibecodings.</p>
              <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 p-1">
                {SORT_OPTIONS.map((option) => {
                  const isActive = sortOrder === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        const nextParams = new URLSearchParams(searchParams);
                        if (option.value === 'newest') {
                          nextParams.delete('sort');
                        } else {
                          nextParams.set('sort', option.value);
                        }
                        setSearchParams(nextParams, { replace: true });
                      }}
                      className={`rounded-full px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                        isActive
                          ? 'bg-brand-accent text-black'
                          : 'text-brand-muted hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </RevealOnScroll>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          {loading ? (
            Array.from({ length: 9 }).map((_, i) => <LabSkeleton key={i} />)
          ) : !sortedLabItems.length ? (
            <div className="col-span-full py-24 text-center text-[10px] uppercase tracking-[0.3em] text-brand-muted font-mono">
              Full hard drive, empty page. Maria's mid-espresso and uploading. Come back soon :)
            </div>
          ) : (
            sortedLabItems.map((item, index) => {
              const thumbnail = getLabThumbnail(item);

              return (
                <RevealOnScroll key={item.id} delay={index * 0.05}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    data-cursor="card"
                    className="group relative flex h-full w-full cursor-pointer flex-col gap-4 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 text-left shadow-[0_18px_46px_rgba(0,0,0,0.16)] transition-all duration-500 hover:-translate-y-1 hover:border-white/16 hover:bg-white/[0.055] hover:shadow-[0_26px_58px_rgba(0,0,0,0.24)] md:gap-6 md:p-7"
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '420px' }}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,87,112,0.12),_transparent_58%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="flex items-start justify-between z-10">
                      <span className="rounded-full bg-brand-accent/20 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-accent">
                        {item.category ?? item.type}
                      </span>
                      <span className="font-mono text-[10px] text-brand-muted">{item.date}</span>
                    </div>
                    <div className="z-10 order-2 md:order-3">
                      <h3 className="mb-2.5 font-sans text-[clamp(1.35rem,1.08rem+0.8vw,2rem)] font-semibold normal-case leading-[1.02] tracking-[-0.04em] text-white transition-colors group-hover:text-brand-accent">
                        {item.title}
                      </h3>
                      <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-white/60 md:mb-5 md:text-[0.98rem]">
                        {item.excerpt ?? item.content}
                      </p>
                      <div className="hidden flex-wrap gap-2 md:flex">
                        {item.tools.map((tool) => (
                          <span key={tool} className="tool-pill">
                            {tool}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/8 pt-4">
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                          {item.bodyMarkdown ? 'Open article' : 'Open entry'}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/32">
                          {item.readingTime ?? 'Lab note'}
                        </span>
                      </div>
                    </div>
                    {thumbnail ? (
                      <div className="z-10 order-3 overflow-hidden rounded-[1.5rem] bg-black/20 md:order-2">
                        <div className="aspect-[5/3.8] md:aspect-[4/3]">
                          <img
                            src={thumbnail}
                            alt={item.title}
                            width={600}
                            height={400}
                            loading="lazy"
                            decoding="async"
                            sizes="(min-width: 768px) 46vw, 100vw"
                            className="h-full w-full object-cover opacity-84 transition-all duration-700 saturate-[0.88] group-hover:scale-[1.03] group-hover:opacity-100 group-hover:saturate-100"
                            style={{
                              transform: `scale(${Math.max(1, (item.thumbnailZoom ?? 100) / 100)})`,
                              transformOrigin: 'center center',
                              objectPosition: `${item.thumbnailPositionX ?? 50}% ${item.thumbnailPositionY ?? 50}%`,
                            }}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    ) : null}
                  </button>
                </RevealOnScroll>
              );
            })
          )}
        </div>

        {/* Lab Item Modal */}
        {activeItem ? createPortal(
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-6"
              onClick={closeActiveItem}
            >
              <button 
                type="button"
                ref={closeButtonRef}
                className="absolute top-8 right-8 z-10 text-white hover:text-brand-accent transition-colors"
                onClick={closeActiveItem}
                aria-label="Close lab post"
              >
                <X size={32} />
              </button>
              <motion.div
                ref={modalScrollRef}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative max-h-[90svh] w-full max-w-[68rem] overflow-y-auto overscroll-contain rounded-[2.5rem] border border-white/10 bg-[#0b0b0e]/96 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] md:p-10"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={modalTitleId}
                aria-describedby={activeItem.excerpt || activeItem.content ? modalDescriptionId : undefined}
              >
                {getLabHeroImage(activeItem) ? (
                  <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]">
                    <img
                      src={getLabHeroImage(activeItem)}
                      alt={activeItem.title}
                      className="aspect-[16/9] w-full object-cover"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : null}

                {/* Header */}
                <div className="mb-8 flex items-start justify-between">
                  <span className="px-3 py-1 rounded-full bg-brand-accent/20 text-brand-accent text-xs uppercase tracking-widest font-bold font-mono">
                    {activeItem.category ?? activeItem.type}
                  </span>
                  <span className="text-sm font-mono text-brand-muted">{activeItem.date}</span>
                </div>
                <h2
                  id={modalTitleId}
                  className="mb-3 font-sans text-[clamp(2.3rem,3vw,4.4rem)] font-semibold normal-case leading-[0.94] tracking-[-0.05em] text-white"
                >
                  {activeItem.title}
                </h2>
                <p id={modalDescriptionId} className="mb-8 max-w-3xl text-base leading-relaxed text-white/62 md:text-lg">
                  {activeItem.excerpt ?? activeItem.content}
                </p>

                {/* Case study meta row */}
                {(activeItem.timeline || activeItem.role || activeItem.readingTime || activeItem.author) && (
                  <div className="mb-10 grid gap-6 border-b border-white/10 pb-8 sm:grid-cols-2 lg:grid-cols-4">
                    {activeItem.readingTime && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-mono text-brand-accent mb-1">Reading time</p>
                        <p className="font-semibold text-sm">{activeItem.readingTime}</p>
                      </div>
                    )}
                    {activeItem.author && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-mono text-brand-accent mb-1">Author</p>
                        <p className="font-semibold text-sm">{activeItem.author}</p>
                      </div>
                    )}
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
                {activeItem.bodyMarkdown ? (
                  renderArticleBody(activeItem)
                ) : (activeItem.brief || activeItem.context || activeItem.problem || activeItem.insights || activeItem.solution || activeItem.outcome) ? (
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
                                <p className="whitespace-pre-line max-w-[44rem] text-white/80 text-base leading-[1.9]">{section.value}</p>
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
                    {getLabThumbnail(activeItem) &&
                    getLabThumbnail(activeItem) !== getLabHeroImage(activeItem) ? (
                      <div className="rounded-2xl overflow-hidden bg-white/5 aspect-square relative">
                        <div className="grain-overlay" />
                        <img src={getLabThumbnail(activeItem)} alt={activeItem.title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                      </div>
                    ) : null}
                  </div>
                )}

                {activeItem.code && (
                  <div className="mt-8 p-6 bg-black/40 rounded-2xl font-mono text-xs text-brand-accent overflow-x-auto border border-white/5 selection:bg-brand-accent selection:text-brand-bg">
                    <pre><code>{activeItem.code}</code></pre>
                  </div>
                )}
              </motion.div>
            </motion.div>,
            document.body,
          ) : null}
      </div>
    </PageTransition>
  );
};
