import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { useData } from '../context/DataContext';
import { PageTransition } from '../components/PageTransition';
import { RevealOnScroll } from '../components/RevealOnScroll';
import { ScrollScrambleText } from '../components/ScrollScrambleText';
import { Tag } from '../components/Tag';
import { LabSkeleton } from '../components/Skeleton';
import { trapFocusWithin } from '../lib/focus-trap';
import { PUBLIC_PAGE_BOTTOM_GLOW_CLASS, PUBLIC_SHELL_CLASS } from '../lib/layout';
import { LabItem, LabSection } from '../types';

const ARTICLE_IMAGE_TOKEN = '[INSERT IMAGE HERE — see image block below]';
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
] as const;
const LAB_TITLE_LINES = ['The Lab'];

const SORT_BUTTON_VARIANTS = [
  {
    active:
      'border border-[rgba(var(--cta-rgb),0.72)] bg-[linear-gradient(118deg,rgba(255,201,220,0.96)_0%,rgba(247,153,124,0.94)_12%,rgba(231,71,26,0.97)_25%,rgba(246,138,109,0.94)_42%,rgba(255,188,211,0.92)_70%,rgba(255,210,222,0.92)_100%)] text-brand-bg shadow-[0_14px_30px_rgba(var(--cta-rgb),0.16)]',
    inactive:
      'bg-[linear-gradient(118deg,rgba(255,201,220,0.05)_0%,rgba(247,153,124,0.035)_12%,rgba(231,71,26,0.05)_25%,rgba(246,138,109,0.035)_42%,rgba(255,188,211,0.03)_70%,rgba(255,210,222,0.03)_100%)] text-white/68 hover:text-white',
  },
  {
    active:
      'border border-[rgba(var(--cta-rgb),0.72)] bg-[linear-gradient(142deg,rgba(255,216,229,0.95)_0%,rgba(255,206,224,0.93)_38%,rgba(250,190,171,0.91)_58%,rgba(237,110,64,0.96)_76%,rgba(231,71,26,0.98)_89%,rgba(247,159,141,0.92)_100%)] text-brand-bg shadow-[0_14px_30px_rgba(var(--cta-rgb),0.16)]',
    inactive:
      'bg-[linear-gradient(142deg,rgba(255,216,229,0.045)_0%,rgba(255,206,224,0.03)_38%,rgba(250,190,171,0.03)_58%,rgba(237,110,64,0.045)_76%,rgba(231,71,26,0.05)_89%,rgba(247,159,141,0.03)_100%)] text-white/68 hover:text-white',
  },
];

const parseLabDate = (value?: string) => {
  const timestamp = Date.parse(value ?? '');
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getLabThumbnail = (item: LabItem) =>
  item.thumbnail || item.image || item.heroImage || item.bodyImage?.url || '';

const getLabHeroImage = (item: LabItem) =>
  item.heroImage || item.thumbnail || item.image || item.bodyImage?.url || '';

const getLabImageAlt = (item: LabItem, label?: string, index?: number) => {
  if (label) {
    return `${item.title} — ${label}`;
  }

  if (typeof index === 'number') {
    return `${item.title} — image ${index + 1}`;
  }

  return item.title;
};

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
                alt={item.bodyImage.alt ?? `${item.title} — article image`}
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
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState<LabItem | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const modalDialogRef = useRef<HTMLDivElement | null>(null);
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
  const entryCountLabel =
    sortedLabItems.length === 1 ? '1 note in circulation' : `${sortedLabItems.length} notes in circulation`;

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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('preview');
        setSearchParams(nextParams, { replace: true });
        setActiveItem(null);
        return;
      }

      trapFocusWithin(event, modalDialogRef.current);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
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
      <div className="relative overflow-hidden bg-brand-bg">
        <Seo
          title="Lab — Maria Bordiuh"
          description="Experiments, motion tests, visual systems, and unfinished creative-tech notes from Maria Bordiuh."
          canonicalPath="/lab"
          image="/lab/pinterest-most-used-tool.png"
          imageWidth={2880}
          imageHeight={1800}
          imageAlt="Maria Bordiuh lab preview"
        />
        <div aria-hidden="true" className={PUBLIC_PAGE_BOTTOM_GLOW_CLASS} />
        <div className={`${PUBLIC_SHELL_CLASS} relative pb-28 pt-36 md:pb-32 md:pt-40`}>
          <header className="mb-16 md:mb-20">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-brand-accent/80">
              Notes // tests // unfinished things
            </p>
            <ScrollScrambleText
              as="h1"
              lines={LAB_TITLE_LINES}
              className="mb-6 text-fluid-xl font-display font-normal uppercase leading-[1.05] tracking-[0.02em] text-white"
            />
            <RevealOnScroll delay={0.08}>
              <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
                <div className="max-w-[42rem] space-y-4">
                  <p className="text-[1.04rem] leading-[1.74] text-white/74 md:text-[1.12rem]">
                    Experiments, motion tests, visual systems, and half-finished ideas worth
                    keeping. Less case-study polish, more process and proof of life.
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/48">
                    {entryCountLabel}
                  </p>
                </div>
                <div className="inline-flex w-fit rounded-full border border-[rgba(var(--cta-rgb),0.18)] bg-[linear-gradient(126deg,rgba(255,196,217,0.09)_0%,rgba(255,186,210,0.07)_20%,rgba(248,145,121,0.07)_54%,rgba(231,71,26,0.11)_100%)] p-1 shadow-[0_12px_28px_rgba(var(--cta-rgb),0.08)]">
                  {SORT_OPTIONS.map((option) => {
                    const isActive = sortOrder === option.value;
                    const variant = SORT_BUTTON_VARIANTS[option.value === 'newest' ? 0 : 1];

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
                        className={`rounded-full px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] transition-all ${isActive ? variant.active : variant.inactive}`}
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
              <div className="col-span-full py-24 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-brand-muted">
                Full hard drive, empty page. Maria&apos;s mid-espresso and uploading. Come back
                soon :)
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
                      className="group relative flex h-full w-full cursor-pointer flex-col gap-5 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(165deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 text-left shadow-[0_18px_46px_rgba(0,0,0,0.16)] transition-all duration-500 hover:-translate-y-1 hover:border-white/16 hover:bg-[linear-gradient(165deg,rgba(255,255,255,0.06),rgba(255,255,255,0.024))] hover:shadow-[0_26px_58px_rgba(0,0,0,0.24)] md:gap-6 md:p-7"
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '420px' }}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,158,187,0.12),_transparent_58%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <div className="pointer-events-none absolute left-5 right-5 top-5 h-px bg-[linear-gradient(90deg,rgba(255,158,187,0.85),rgba(255,255,255,0.18),transparent)] md:left-7 md:right-7 md:top-7" />
                      <div className="flex items-start justify-between gap-4 pt-4 md:pt-5">
                        <div className="space-y-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-brand-accent">
                            {item.category ?? item.type}
                          </span>
                          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/42">
                            {item.readingTime ?? 'Lab note'}
                          </p>
                        </div>
                        <span className="pt-0.5 font-mono text-[10px] text-brand-muted">{item.date}</span>
                      </div>

                      <div className="z-10">
                        <h3 className="mb-3 max-w-[18ch] font-sans text-[clamp(1.38rem,1.08rem+0.8vw,2rem)] font-semibold normal-case leading-[0.98] tracking-[-0.04em] text-white transition-colors group-hover:text-brand-accent">
                          {item.title}
                        </h3>
                        <p className="line-clamp-4 max-w-[42rem] text-[0.98rem] leading-[1.68] text-white/72 md:text-[1rem]">
                          {item.excerpt ?? item.content}
                        </p>
                      </div>

                      {thumbnail ? (
                        <div className="z-10 overflow-hidden rounded-[1.5rem] bg-black/20">
                          <div className="aspect-[5/3.5] md:aspect-[4/2.9]">
                            <img
                              src={thumbnail}
                              alt={item.title}
                              width={600}
                              height={400}
                              loading="lazy"
                              decoding="async"
                              sizes="(min-width: 768px) 46vw, 100vw"
                              className="h-full w-full object-cover opacity-88 transition-all duration-700 saturate-[0.9] group-hover:scale-[1.03] group-hover:opacity-100 group-hover:saturate-100"
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

                      <div className="mt-auto flex items-center justify-end gap-4 border-t border-white/8 pt-4">
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-accent/70">
                          {item.bodyMarkdown ? 'Open article →' : 'Open note →'}
                        </span>
                      </div>
                    </button>
                  </RevealOnScroll>
                );
              })
            )}
          </div>
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
                className="absolute top-8 right-8 z-10 text-white transition-colors hover:text-brand-accent focus-visible:text-brand-accent"
                onClick={closeActiveItem}
                aria-label="Close lab post"
              >
                <X size={32} />
              </button>
              <motion.div
                ref={(node) => {
                  modalScrollRef.current = node;
                  modalDialogRef.current = node;
                }}
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
                      width={1600}
                      height={900}
                      className="aspect-[16/9] w-full object-cover"
                      loading="eager"
                      decoding="async"
                      sizes="(min-width: 1024px) 68rem, 100vw"
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
                <p id={modalDescriptionId} className="mb-8 max-w-3xl text-[1.05rem] leading-[1.76] text-white/72 md:text-[1.12rem]">
                  {activeItem.excerpt ?? activeItem.content}
                </p>

                {/* Case study meta row */}
                {(activeItem.timeline || activeItem.role || activeItem.readingTime || activeItem.author) && (
                  <div className="mb-10 grid gap-6 border-b border-white/10 pb-8 sm:grid-cols-2 lg:grid-cols-4">
                    {activeItem.readingTime && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-mono text-brand-accent mb-1">Reading time</p>
                        <p className="text-base font-semibold">{activeItem.readingTime}</p>
                      </div>
                    )}
                    {activeItem.author && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-mono text-brand-accent mb-1">Author</p>
                        <p className="text-base font-semibold">{activeItem.author}</p>
                      </div>
                    )}
                    {activeItem.timeline && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-mono text-brand-accent mb-1">Timeline</p>
                        <p className="text-base font-semibold">{activeItem.timeline}</p>
                      </div>
                    )}
                    {activeItem.role && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-mono text-brand-accent mb-1">Role</p>
                        <p className="text-base font-semibold">{activeItem.role}</p>
                      </div>
                    )}
                    {activeItem.tools.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-mono text-brand-accent mb-2">Tools</p>
                        <div className="flex flex-wrap gap-2">
                          {activeItem.tools.map(tool => (
                            <Tag key={tool} name={tool} onClick={() => { navigate(`/work?tool=${encodeURIComponent(tool)}`); }} />
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
                                <img src={img.url} alt={getLabImageAlt(activeItem, section.label, i)} className="w-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
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
                                  <img src={img.url} alt={getLabImageAlt(activeItem, 'Gallery', i)} className="w-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
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
                          <Tag key={tool} name={tool} onClick={() => { navigate(`/work?tool=${encodeURIComponent(tool)}`); }} />
                        ))}
                      </div>
                    </div>
                    {getLabThumbnail(activeItem) &&
                    getLabThumbnail(activeItem) !== getLabHeroImage(activeItem) ? (
                      <div className="rounded-2xl overflow-hidden bg-white/5 aspect-square relative">
                        <div className="grain-overlay" />
                        <img src={getLabThumbnail(activeItem)} alt={activeItem.title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
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
