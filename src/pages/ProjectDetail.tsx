import { useRef, useState, useMemo, useEffect, Fragment } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PageTransition } from '../components/PageTransition';
import { isVideoFileUrl, normalizeProject } from '../utils/portfolio';

const DetailImage = ({ src, alt }: { src: string; alt: string }) => (
  <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
    {isVideoFileUrl(src) ? (
      <video src={src} controls playsInline className="aspect-[4/5] w-full object-cover" />
    ) : (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="aspect-[4/5] w-full object-cover"
        referrerPolicy="no-referrer"
      />
    )}
  </div>
);

const GallerySection = ({
  eyebrow,
  title,
  images,
}: {
  eyebrow: string;
  title: string;
  images: string[];
}) => {
  if (!images.length) {
    return null;
  }

  return (
    <section className="space-y-8">
      <div className="max-w-2xl">
        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-black uppercase tracking-tight md:text-5xl">{title}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {images.map((image, index) => (
          <DetailImage key={`${image}-${index}`} src={image} alt={`${title} ${index + 1}`} />
        ))}
      </div>
    </section>
  );
};

const SlotMachineGrid = ({
  images,
  gridSize,
  fps,
}: {
  images: string[];
  gridSize: number;
  fps: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const totalCells = gridSize * gridSize;

  // Distribute images across cells, wrapping if fewer images than cells
  const cellImages = useMemo<string[][]>(() => {
    if (!images.length) return Array.from({ length: totalCells }, () => []);
    const perCell = Math.max(1, Math.floor(images.length / totalCells));
    return Array.from({ length: totalCells }, (_, i) => {
      const start = (i * perCell) % images.length;
      return images.slice(start, start + perCell);
    });
  }, [images, totalCells]);

  const [frameIndices, setFrameIndices] = useState<number[]>(() =>
    Array(totalCells).fill(0)
  );

  // Pause cycling when scrolled out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Per-cell intervals with random desync offset (max 300ms)
  useEffect(() => {
    if (!isVisible) return;
    const frameMs = 1000 / fps;
    const allTimers: ReturnType<typeof setTimeout>[] = [];
    const allIntervals: ReturnType<typeof setInterval>[] = [];

    for (let i = 0; i < totalCells; i++) {
      const cellIdx = i;
      const delay = Math.random() * 300;
      const timer = setTimeout(() => {
        const iv = setInterval(() => {
          setFrameIndices((prev) => {
            const cellLen = cellImages[cellIdx]?.length ?? 0;
            if (cellLen <= 1) return prev;
            const next = [...prev];
            next[cellIdx] = (next[cellIdx] + 1) % cellLen;
            return next;
          });
        }, frameMs);
        allIntervals.push(iv);
      }, delay);
      allTimers.push(timer);
    }

    return () => {
      allTimers.forEach(clearTimeout);
      allIntervals.forEach(clearInterval);
    };
  }, [isVisible, fps, totalCells, cellImages]);

  return (
    <div
      ref={containerRef}
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
    >
      {Array.from({ length: totalCells }, (_, i) => {
        const imgs = cellImages[i] ?? [];
        const src = imgs[frameIndices[i] ?? 0];
        return (
          <div key={i} className="aspect-square overflow-hidden bg-white/5">
            {src ? (
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
        );
      })}
    </div>
  );
};

const CASE_STUDY_LINKS = [
  { label: 'overview', href: '#overview' },
  { label: 'context', href: '#context' },
  { label: 'process', href: '#process' },
  { label: 'outcome', href: '#outcome' },
];

const CaseStudyNav = () => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFloating(!entry.isIntersecting),
      { rootMargin: '-80px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const renderLinks = () => (
    <>
      {CASE_STUDY_LINKS.map((item, i) => (
        <Fragment key={item.href}>
          {i > 0 && <span className="w-1 h-1 rounded-full bg-white/20 flex-none" aria-hidden />}
          <a
            href={item.href}
            className="text-[10px] uppercase tracking-[0.2em] font-medium text-brand-muted hover:text-white transition-colors"
          >
            {item.label}
          </a>
        </Fragment>
      ))}
      <span className="w-1 h-1 rounded-full bg-white/20 flex-none" aria-hidden />
      <button
        onClick={scrollToTop}
        className="text-[10px] uppercase tracking-[0.2em] font-medium text-brand-muted hover:text-white transition-colors"
      >
        back to top
      </button>
    </>
  );

  return (
    <>
      <div ref={sentinelRef} />
      <nav
        className={`hidden md:flex items-center gap-4 py-5 border-b border-white/5 px-6 md:px-8 transition-opacity duration-200 ${
          floating ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {renderLinks()}
      </nav>
      {floating && (
        <nav className="hidden md:flex fixed top-6 left-1/2 -translate-x-1/2 z-40 items-center gap-4 px-6 py-3 rounded-full border border-white/10 bg-black/70 backdrop-blur-xl shadow-xl">
          {renderLinks()}
        </nav>
      )}
    </>
  );
};

export const ProjectDetail = () => {
  const { id } = useParams();
  const { projects, loading } = useData();
  const project = projects.find((entry) => entry.id === id);

  if (loading) {
    return (
      <div className="pt-40 px-6 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">
        brewing...
      </div>
    );
  }

  if (!project) {
    return <div className="pt-40 px-6 text-center">Project not found.</div>;
  }

  const normalized = normalizeProject(project);

  if (normalized.pillar !== 'Art Direction') {
    return (
      <PageTransition>
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-32 text-center">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
            Preview-only entry
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight md:text-6xl">
            This piece opens from the work grid.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65">
            AI Generated, Illustration & Design, and Animation & Motion items live as modal previews on
            the archive page instead of full case-study routes.
          </p>
          <Link
            to="/work"
            className="mt-10 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10"
          >
            Return to work
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </PageTransition>
    );
  }

  const meta = [normalized.client, normalized.year, normalized.role].filter(Boolean);
  const categories = normalized.categories ?? [];
  const tools = normalized.tools ?? [];
  const credits = normalized.credits ?? [];
  const heroImage = normalized.heroImage || normalized.thumbnail;
  const moodboardImages = normalized.moodboardImages ?? [];
  const sketchImages = normalized.sketchImages ?? [];
  const explorationType = normalized.explorationType ?? 'masonry';
  const slotGridSize = normalized.slotMachineGridSize ?? 4;
  const slotFps = normalized.slotMachineFps ?? 12;
  const explorationImages =
    normalized.explorationImages?.length
      ? normalized.explorationImages
      : normalized.explorationVideos ?? [];
  const outcomeImages =
    normalized.outcomeImages?.length ? normalized.outcomeImages : normalized.outcomeVisuals ?? [];
  const outcomeCopy = normalized.outcomeCopy || normalized.outcomeResultCopy || normalized.result;

  return (
    <PageTransition>
      <article className="bg-brand-bg text-white">
        <section id="overview" className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0">
            {heroImage ? (
              <img
                src={heroImage}
                alt={normalized.title}
                className="h-full w-full object-cover opacity-45"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.22),transparent_35%),linear-gradient(180deg,rgba(0,0,0,0.16),rgba(0,0,0,0.84))]" />
          </div>

          <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-end px-6 pb-16 pt-40 md:px-8 md:pb-24">
            <Link
              to="/work"
              className="mb-10 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              Archive
              <ArrowUpRight size={12} />
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="max-w-4xl"
            >
              <p className="mb-6 text-[10px] font-black uppercase tracking-[0.28em] text-brand-accent">
                Art Direction
              </p>
              <h1 className="text-fluid-xl font-black uppercase leading-[0.92] tracking-tighter">
                {normalized.title}
              </h1>
              {normalized.description ? (
                <p className="mt-8 max-w-3xl text-lg leading-relaxed text-white/75 md:text-xl">
                  {normalized.description}
                </p>
              ) : null}
            </motion.div>

            <div className="mt-12 flex flex-wrap gap-3">
              {meta.map((entry) => (
                <span
                  key={entry}
                  className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/70 backdrop-blur"
                >
                  {entry}
                </span>
              ))}
              {categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/70 backdrop-blur"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </section>

        <CaseStudyNav />

        <div className="mx-auto max-w-7xl space-y-24 px-6 py-20 md:px-8 md:py-24">
          <div id="context" className="scroll-mt-24" />
          <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-10 rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-8 md:p-10">
              {normalized.creativeTension ? (
                <div>
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
                    Creative tension
                  </p>
                  <p className="text-lg leading-relaxed text-white/80">{normalized.creativeTension}</p>
                </div>
              ) : null}

              {normalized.globalContext ? (
                <div>
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
                    Global context
                  </p>
                  <p className="text-base leading-relaxed text-white/70">{normalized.globalContext}</p>
                </div>
              ) : null}

              {normalized.approach ? (
                <div>
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
                    Approach
                  </p>
                  <p className="text-base leading-relaxed text-white/70">{normalized.approach}</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-8 rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-8 md:p-10">
              <div>
                <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
                  Tools
                </p>
                <div className="flex flex-wrap gap-2">
                  {tools.length ? (
                    tools.map((tool) => (
                      <span
                        key={tool}
                        className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/70"
                      >
                        {tool}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-white/40">No tools added.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
                  Credits
                </p>
                <div className="space-y-2">
                  {credits.length ? (
                    credits.map((credit) => (
                      <p key={credit} className="text-sm text-white/65">
                        {credit}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-white/40">No credits added.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div id="process" className="scroll-mt-24" />
          <GallerySection eyebrow="Moodboard" title="Initial visual territory" images={moodboardImages} />
          {sketchImages.length > 0 ? (
            <GallerySection eyebrow="Sketches" title="Early hand-drawn exploration" images={sketchImages} />
          ) : null}
          {explorationImages.length > 0 ? (
            explorationType === 'slot-machine' ? (
              <section className="space-y-8">
                <div className="max-w-2xl">
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
                    Exploration
                  </p>
                  <h2 className="text-3xl font-black uppercase tracking-tight md:text-5xl">
                    Search and refinement
                  </h2>
                </div>
                <SlotMachineGrid images={explorationImages} gridSize={slotGridSize} fps={slotFps} />
              </section>
            ) : (
              <GallerySection eyebrow="Exploration" title="Search and refinement" images={explorationImages} />
            )
          ) : null}
          <div id="outcome" className="scroll-mt-24" />
          <GallerySection eyebrow="Outcome" title="Final visuals" images={outcomeImages} />

          {outcomeCopy ? (
            <section className="rounded-[2.75rem] border border-brand-accent/20 bg-brand-accent/10 px-8 py-12 md:px-12">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
                Outcome
              </p>
              <p className="max-w-4xl text-2xl font-semibold leading-tight text-white md:text-4xl">
                {outcomeCopy}
              </p>
            </section>
          ) : null}

          <section className="border-t border-white/10 pt-10">
            <Link
              to="/work"
              className="inline-flex items-center gap-3 text-sm font-semibold text-white/70 transition-colors hover:text-white"
            >
              Return to the archive
              <ArrowUpRight size={16} />
            </Link>
          </section>
        </div>
      </article>
    </PageTransition>
  );
};
