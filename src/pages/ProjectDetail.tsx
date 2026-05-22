import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PageTransition } from '../components/PageTransition';
import { isEmbeddableVideoUrl, isVideoFileUrl, normalizeProject, toEmbedUrl } from '../utils/portfolio';

const PAGE_SHELL_CLASS = 'mx-auto max-w-[1440px] px-5 sm:px-6 md:px-8 xl:px-12';
const ARTICLE_TEXT_CLASS = 'max-w-4xl';
const ARTICLE_MEDIA_CLASS = 'max-w-6xl';

const SectionHeader = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) => (
  <div className={ARTICLE_TEXT_CLASS}>
    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent md:tracking-[0.24em]">
      {eyebrow}
    </p>
    <h2 className="font-sans text-[clamp(1.9rem,1.45rem+1.4vw,3.35rem)] font-semibold normal-case leading-[0.96] tracking-[-0.045em] text-white">
      {title}
    </h2>
    {description ? (
      <p className="mt-4 max-w-none text-sm leading-relaxed text-white/63 sm:text-base md:max-w-2xl">
        {description}
      </p>
    ) : null}
  </div>
);

const MediaFrame = ({
  children,
  className = '',
  style = 'framed',
}: {
  children: ReactNode;
  className?: string;
  style?: 'framed' | 'bare';
}) => (
  style === 'bare' ? (
    <div className={`overflow-hidden rounded-[2.2rem] ${className}`}>{children}</div>
  ) : (
    <div className={`rounded-[2rem] border border-white/8 bg-white/[0.02] p-2.5 shadow-[0_16px_42px_rgba(0,0,0,0.16)] md:p-3 ${className}`}>
      {children}
    </div>
  )
);

const DetailImage = ({
  src,
  alt,
  mediaClassName,
  videoPresentation = 'default',
  flush = false,
}: {
  src: string;
  alt: string;
  mediaClassName?: string;
  videoPresentation?: 'default' | 'ambient';
  flush?: boolean;
}) => {
  const wrapperClassName = flush
    ? 'overflow-hidden bg-black/20'
    : 'overflow-hidden rounded-[1.55rem] border border-white/8 bg-black/20';

  if (isEmbeddableVideoUrl(src)) {
    return (
      <div className={wrapperClassName}>
        <iframe
          src={toEmbedUrl(src)}
          title={alt}
          className={mediaClassName ?? 'aspect-video w-full'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  if (isVideoFileUrl(src)) {
    return (
      <div className={wrapperClassName}>
        <video
          src={src}
          controls={videoPresentation === 'default'}
          autoPlay={videoPresentation === 'ambient'}
          muted={videoPresentation === 'ambient'}
          loop={videoPresentation === 'ambient'}
          playsInline
          preload="metadata"
          className={mediaClassName ?? 'aspect-video w-full object-cover'}
        />
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={mediaClassName ?? 'aspect-[16/10] w-full object-cover'}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

const TextSection = ({
  id,
  eyebrow,
  title,
  body,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  body: string;
}) => {
  const showEyebrow = eyebrow.trim().toLowerCase() !== title.trim().toLowerCase();

  return (
    <section id={id} className="scroll-mt-28">
      <div className={ARTICLE_TEXT_CLASS}>
        {showEyebrow ? (
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent md:tracking-[0.24em]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-sans text-[clamp(1.9rem,1.45rem+1.4vw,3.35rem)] font-semibold normal-case leading-[0.96] tracking-[-0.045em] text-white">
          {title}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/74 sm:text-base md:text-[1.02rem]">
          {body}
        </p>
      </div>
    </section>
  );
};

const GallerySection = ({
  id,
  eyebrow,
  title,
  description,
  images,
  columns = 2,
  mediaClassName,
  compact = false,
  frameClassName,
  videoPresentation = 'default',
  flushMedia = false,
  frameStyle = 'framed',
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  images: string[];
  columns?: 1 | 2 | 3 | 5;
  mediaClassName?: string;
  compact?: boolean;
  frameClassName?: string;
  videoPresentation?: 'default' | 'ambient';
  flushMedia?: boolean;
  frameStyle?: 'framed' | 'bare';
}) => {
  if (!images.length) {
    return null;
  }

  const gridClass =
    columns === 5
      ? 'grid gap-4 md:grid-cols-5'
      : columns === 3
        ? 'grid gap-4 md:grid-cols-3'
        : columns === 1
          ? 'grid gap-4'
          : 'grid gap-4 md:grid-cols-2';

  return (
    <section id={id} className="scroll-mt-28 space-y-6">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      <div className={ARTICLE_MEDIA_CLASS}>
        <div className={gridClass}>
          {images.map((image, index) => (
            <MediaFrame
              key={`${image}-${index}`}
              style={frameStyle}
              className={[compact ? 'max-w-3xl' : '', frameClassName ?? ''].filter(Boolean).join(' ')}
            >
              <DetailImage
                src={image}
                alt={`${title} ${index + 1}`}
                mediaClassName={mediaClassName}
                videoPresentation={videoPresentation}
                flush={flushMedia}
              />
            </MediaFrame>
          ))}
        </div>
      </div>
    </section>
  );
};

const JourneySection = ({
  id,
  title,
  description,
  groups,
}: {
  id?: string;
  title: string;
  description?: string;
  groups: Array<{ label: string; images: string[] }>;
}) => {
  const populatedGroups = groups.filter((group) => group.images.length > 0);

  if (!populatedGroups.length) {
    return null;
  }

  return (
    <section id={id} className="scroll-mt-28 space-y-6">
      <SectionHeader eyebrow="Development" title={title} description={description} />
      <div className={`${ARTICLE_MEDIA_CLASS} space-y-8`}>
        {populatedGroups.map((group) => (
          <div key={group.label} className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
              {group.label}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {group.images.map((image, index) => (
                <MediaFrame key={`${group.label}-${image}-${index}`}>
                  <DetailImage
                    src={image}
                    alt={`${group.label} ${index + 1}`}
                    mediaClassName="aspect-[16/10] w-full object-cover"
                  />
                </MediaFrame>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const ColorSystemSection = ({
  id,
  colors,
  description,
}: {
  id?: string;
  colors: Array<{ hex: string; emotion: string }>;
  description?: string;
}) => {
  if (!colors.length) {
    return null;
  }

  return (
    <section id={id} className="scroll-mt-28 space-y-6">
      <SectionHeader eyebrow="Color" title="Color system" description={description} />
      <div className={ARTICLE_MEDIA_CLASS}>
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {colors.map((color) => (
            <div key={`${color.hex}-${color.emotion}`} className="flex flex-col items-center text-center">
              <div
                className="h-32 w-32 rounded-full border border-white/10 md:h-36 md:w-36"
                style={{ backgroundColor: color.hex }}
                aria-hidden="true"
              />
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                {color.emotion}
              </p>
              <p className="mt-2 font-mono text-sm uppercase tracking-[0.12em] text-white/78">
                {color.hex}
              </p>
            </div>
          ))}
        </div>
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

  const cellImages = useMemo<string[][]>(() => {
    if (!images.length) return Array.from({ length: totalCells }, () => []);
    const perCell = Math.max(1, Math.floor(images.length / totalCells));
    return Array.from({ length: totalCells }, (_, i) => {
      const start = (i * perCell) % images.length;
      return images.slice(start, start + perCell);
    });
  }, [images, totalCells]);

  const [frameIndices, setFrameIndices] = useState<number[]>(() => Array(totalCells).fill(0));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const frameMs = 1000 / fps;
    const allTimers: ReturnType<typeof setTimeout>[] = [];
    const allIntervals: ReturnType<typeof setInterval>[] = [];

    for (let i = 0; i < totalCells; i += 1) {
      const cellIdx = i;
      const delay = Math.random() * 300;
      const timer = setTimeout(() => {
        const interval = setInterval(() => {
          setFrameIndices((prev) => {
            const cellLen = cellImages[cellIdx]?.length ?? 0;
            if (cellLen <= 1) return prev;
            const next = [...prev];
            next[cellIdx] = (next[cellIdx] + 1) % cellLen;
            return next;
          });
        }, frameMs);
        allIntervals.push(interval);
      }, delay);
      allTimers.push(timer);
    }

    return () => {
      allTimers.forEach(clearTimeout);
      allIntervals.forEach(clearInterval);
    };
  }, [cellImages, fps, isVisible, totalCells]);

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
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-full w-full" />
            )}
          </div>
        );
      })}
    </div>
  );
};

const SideRail = ({
  links,
}: {
  links: Array<{ label: string; href: string }>;
}) => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <aside className="pr-6">
      <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.02] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
        <Link
          to="/work"
          className="block text-[10px] uppercase tracking-[0.24em] text-white/38 transition-colors hover:text-white"
        >
          ← Archive
        </Link>

        <div className="mt-8 border-t border-white/8 pt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-accent">
            Case chapters
          </p>
          <nav className="mt-4 space-y-3">
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block text-[11px] uppercase tracking-[0.18em] text-white/46 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <button
          onClick={scrollToTop}
          className="mt-8 block text-[10px] uppercase tracking-[0.24em] text-white/36 transition-colors hover:text-white"
        >
          ↑ Back to top
        </button>
      </div>
    </aside>
  );
};

const MetaBlock = ({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) => {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent md:tracking-[0.24em]">
        {label}
      </p>
      <div className="space-y-2 text-sm leading-relaxed text-white/74">{value}</div>
    </div>
  );
};

export const ProjectDetail = () => {
  const { id } = useParams();
  const { projects, loading } = useData();
  const project = projects.find((entry) => entry.id === id);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [id]);

  if (loading) {
    return (
      <div className="px-6 pt-40 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">
        brewing...
      </div>
    );
  }

  if (!project) {
    return <div className="px-6 pt-40 text-center">Project not found.</div>;
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

  const heroImage = normalized.heroImage || normalized.thumbnail;
  const heroScale = Math.max(1, (normalized.heroZoom ?? 100) / 100);
  const heroPosition = `${normalized.heroPositionX ?? 50}% ${normalized.heroPositionY ?? 50}%`;
  const tools = normalized.tools ?? [];
  const credits = normalized.credits ?? [];
  const moodboardImages = normalized.moodboardImages ?? [];
  const sketchImages = normalized.sketchImages ?? [];
  const childhoodImages = normalized.childhoodImages ?? [];
  const universityImages = normalized.universityImages ?? [];
  const workImages = normalized.workImages ?? [];
  const explorationType = normalized.explorationType ?? 'masonry';
  const slotGridSize = normalized.slotMachineGridSize ?? 4;
  const slotFps = normalized.slotMachineFps ?? 12;
  const animaticVideoUrls =
    normalized.animaticVideoUrls?.length
      ? normalized.animaticVideoUrls
      : normalized.animaticVideoUrl
        ? [normalized.animaticVideoUrl]
        : [];
  const animaticCaption = normalized.animaticCaption;
  const inferredAnimaticSection =
    Boolean(animaticCaption?.toLowerCase().includes('animatic')) || normalized.title === 'NovoSeven';
  const processVideoTitle =
    normalized.processVideoTitle || (inferredAnimaticSection ? 'Animatics' : 'Generated videos');
  const processVideoEyebrow =
    normalized.processVideoEyebrow || (inferredAnimaticSection ? 'Discovery' : 'Motion');
  const explorationImages =
    normalized.explorationImages?.length
      ? normalized.explorationImages
      : normalized.explorationVideos ?? [];
  const hybridizationImages = normalized.hybridizationImages ?? [];
  const hybridizationCaption = normalized.hybridizationCaption;
  const colorSystem = normalized.colorSystem ?? [];
  const outcomeImages =
    normalized.outcomeImages?.length ? normalized.outcomeImages : normalized.outcomeVisuals ?? [];
  const outcomeCopy =
    normalized.outcome || normalized.outcomeCopy || normalized.outcomeResultCopy || normalized.result;

  const metaEntries = [
    { label: 'Timeline', value: normalized.timelineText },
    { label: 'Role', value: normalized.role },
    { label: 'Client', value: normalized.client },
    {
      label: 'Tools',
      value: tools.length ? (
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <span key={tool} className="tool-pill">
              {tool}
            </span>
          ))}
        </div>
      ) : null,
    },
    {
      label: 'Credits',
      value: credits.length ? credits.map((credit) => <p key={credit}>{credit}</p>) : null,
      fullWidth: true,
    },
  ].filter((entry) => Boolean(entry.value));

  const hasMeta = metaEntries.length > 0;

  const hasProcessContent =
    childhoodImages.length > 0 ||
    moodboardImages.length > 0 ||
    sketchImages.length > 0 ||
    animaticVideoUrls.length > 0 ||
    explorationImages.length > 0 ||
    universityImages.length > 0 ||
    hybridizationImages.length > 0 ||
    colorSystem.length > 0 ||
    workImages.length > 0;

  const hasOutcomeContent = Boolean(outcomeCopy || outcomeImages.length > 0);

  const sections = [
    normalized.brief
      ? { id: 'brief', label: 'Brief', eyebrow: 'Overview', title: 'The brief', body: normalized.brief }
      : null,
    normalized.context || normalized.globalContext
      ? {
          id: 'context',
          label: 'Context',
          eyebrow: 'Context',
          title: 'Context',
          body: normalized.context || normalized.globalContext || '',
        }
      : null,
    normalized.problem || normalized.creativeTension
      ? {
          id: 'challenge',
          label: 'Challenge',
          eyebrow: 'Challenge',
          title: 'The problem',
          body: normalized.problem || normalized.creativeTension || '',
        }
      : null,
    normalized.insights
      ? { id: 'insights', label: 'Insights', eyebrow: 'Insights', title: 'Insights', body: normalized.insights }
      : null,
    normalized.solution || normalized.approach
      ? {
          id: 'solution',
          label: 'Solution',
          eyebrow: 'Solution',
          title: 'Solution',
          body: normalized.solution || normalized.approach || '',
        }
      : null,
    outcomeCopy
      ? { id: 'outcome-copy', label: 'Outcome', eyebrow: 'Outcome', title: 'Outcome', body: outcomeCopy }
      : null,
  ].filter(Boolean) as Array<{ id: string; label: string; eyebrow: string; title: string; body: string }>;

  const hasContextContent = sections.slice(0, 4).length > 0;

  const caseStudyLinks = [
    { label: 'Overview', href: '#overview' },
    ...sections.slice(0, 5).map((section) => ({ label: section.label, href: `#${section.id}` })),
    ...(hasProcessContent ? [{ label: 'Process', href: '#process' }] : []),
    ...(moodboardImages.length ? [{ label: 'Moodboard', href: '#moodboard' }] : []),
    ...(sketchImages.length ? [{ label: 'Sketches', href: '#sketches' }] : []),
    ...(animaticVideoUrls.length ? [{ label: processVideoTitle, href: '#motion' }] : []),
    ...(explorationImages.length ? [{ label: 'Exploration', href: '#exploration' }] : []),
    ...(hybridizationImages.length ? [{ label: 'Refinement', href: '#refinement' }] : []),
    ...(colorSystem.length ? [{ label: 'Color', href: '#color-system' }] : []),
    ...(hasOutcomeContent ? [{ label: 'Final visuals', href: '#final-visuals' }] : []),
  ];

  return (
    <PageTransition>
      <article className="relative overflow-x-hidden bg-brand-bg text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_14%,rgba(255,158,187,0.08),transparent_18%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.035),transparent_24%)]"
        />
        <div className={`${PAGE_SHELL_CLASS} grid gap-8 md:grid-cols-[148px_minmax(0,1fr)] md:gap-12`}>
          <div className="hidden self-start pt-28 md:sticky md:top-28 md:block md:pt-0">
            <SideRail links={caseStudyLinks} />
          </div>

          <div>
            <section id="overview" className="border-b border-white/5">
              <div className="pb-14 pt-24 sm:pb-16 sm:pt-28 md:pb-20 md:pt-32">
                <Link
                  to="/work"
                  className="mb-10 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white md:hidden"
                >
                  Archive
                  <ArrowUpRight size={12} />
                </Link>

                {heroImage ? (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="rounded-[2.3rem] border border-white/8 bg-white/[0.03] p-3 shadow-[0_20px_58px_rgba(0,0,0,0.2)] md:p-4"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden rounded-[1.85rem] border border-white/8 bg-black/20">
                      <img
                        src={heroImage}
                        alt={normalized.title}
                        className="h-full w-full object-cover object-center"
                        style={{
                          transform: `scale(${heroScale})`,
                          transformOrigin: 'center center',
                          objectPosition: heroPosition,
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </motion.div>
                ) : null}

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.08, ease: 'easeOut' }}
                  className="mt-10 space-y-8"
                >
                  <div className="max-w-5xl">
                    <h1 className="font-sans text-[clamp(2.8rem,5vw,6rem)] font-semibold normal-case leading-[0.92] tracking-[-0.06em] text-white">
                      {normalized.title}
                    </h1>
                    {normalized.description ? (
                      <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/68 sm:text-lg md:mt-6 md:text-[1.18rem]">
                        {normalized.description}
                      </p>
                    ) : null}
                  </div>

                  {hasMeta ? (
                    <div className="grid grid-cols-1 gap-6 rounded-[2rem] border border-white/8 bg-white/[0.02] px-6 py-6 sm:grid-cols-2 md:px-7 md:py-7 lg:grid-cols-4">
                      {metaEntries.map((entry) => (
                        <div
                          key={entry.label}
                          className={entry.fullWidth ? 'sm:col-span-2 lg:col-span-2' : undefined}
                        >
                          <MetaBlock label={entry.label} value={entry.value} />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {caseStudyLinks.length > 1 ? (
                    <div className="-mx-5 overflow-x-auto pb-1 md:hidden">
                      <div className="flex gap-2 px-5">
                        {caseStudyLinks.map((item) => (
                          <a
                            key={item.href}
                            href={item.href}
                            className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/56 transition-colors hover:text-white"
                          >
                            {item.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              </div>
            </section>

            <div className="space-y-16 py-14 sm:space-y-20 md:space-y-24 md:py-20">
              {sections[0] ? <TextSection {...sections[0]} /> : null}
              {sections[1] ? <TextSection {...sections[1]} /> : null}
              <JourneySection
                id="process"
                title="Character development"
                description="Key stills used to shape Lena's story arc from early aspiration through study and into the reality of work."
                groups={[
                  { label: 'Childhood', images: childhoodImages },
                  { label: 'University', images: universityImages },
                  { label: 'Work', images: workImages },
                ]}
              />

              <GallerySection
                id="moodboard"
                eyebrow="Moodboard"
                title="Initial visual territory"
                images={moodboardImages}
                columns={1}
                mediaClassName="aspect-square w-full object-cover"
                frameClassName="md:max-w-[72rem]"
                videoPresentation="ambient"
                flushMedia
                frameStyle="bare"
              />

              <GallerySection
                id="sketches"
                eyebrow="Sketches"
                title="Character development"
                images={sketchImages}
                columns={3}
                mediaClassName="aspect-square w-full object-cover"
              />

              {animaticVideoUrls.length ? (
                <GallerySection
                  id="motion"
                  eyebrow={processVideoEyebrow}
                  title={processVideoTitle}
                  description={
                    animaticCaption ||
                    (inferredAnimaticSection
                      ? 'Early animatics used to test pacing, clarity, and structure before the visual language was pushed into broader exploration.'
                      : 'AI-generated motion studies used to bring the still-image world into a more emotional narrative sequence.')
                  }
                  images={animaticVideoUrls}
                  columns={animaticVideoUrls.length === 1 ? 1 : 2}
                  mediaClassName="aspect-video w-full"
                  frameStyle="bare"
                />
              ) : null}

              {explorationImages.length > 0 ? (
                explorationType === 'slot-machine' ? (
                  <section id="exploration" className="scroll-mt-28 space-y-6">
                    <SectionHeader
                      eyebrow="Exploration"
                      title="Search and refinement"
                    />
                    <div className={ARTICLE_MEDIA_CLASS}>
                      <MediaFrame>
                        <SlotMachineGrid images={explorationImages} gridSize={slotGridSize} fps={slotFps} />
                      </MediaFrame>
                    </div>
                  </section>
                ) : (
                  <GallerySection
                    id="exploration"
                    eyebrow="Exploration"
                    title="Midjourney exploration"
                    description={
                      normalized.explorationCaption ||
                      'Early Midjourney passes used to pressure-test the visual language before the final system locked in.'
                    }
                    images={explorationImages}
                    columns={5}
                    mediaClassName="h-auto w-full object-contain"
                  />
                )
              ) : null}

              {sections[2] ? <TextSection {...sections[2]} /> : null}
              {sections[3] ? <TextSection {...sections[3]} /> : null}

              {hybridizationImages.length ? (
                <GallerySection
                  id="refinement"
                  eyebrow="Development"
                  title="Illustrator refinement"
                  description={
                    hybridizationCaption ||
                    'Illustrator-led development used to translate the strongest Midjourney directions into a cleaner, more usable film system.'
                  }
                  images={hybridizationImages}
                  columns={1}
                  compact
                  mediaClassName="h-auto w-full object-contain"
                  frameStyle="bare"
                />
              ) : null}

              <ColorSystemSection
                id="color-system"
                colors={colorSystem}
                description={
                  colorSystem.length
                    ? 'After the first approved illustration direction felt too gloomy, I reopened the palette and pushed it toward lighter sky blues, softer pinks, and a warmer coral accent so the films could feel clearer and more humane.'
                    : undefined
                }
              />

              {sections[4] ? <TextSection {...sections[4]} /> : null}

              <div id="outcome" className="scroll-mt-28" />
              {sections[5] ? <TextSection {...sections[5]} /> : null}
              <GallerySection
                id="final-visuals"
                eyebrow="Outcome"
                title="Final visuals"
                images={outcomeImages}
                columns={outcomeImages.length <= 1 ? 1 : 2}
                mediaClassName="aspect-video w-full object-cover"
                frameStyle={outcomeImages.length <= 2 ? 'bare' : 'framed'}
              />

              <section className="border-t border-white/10 pt-8">
                <Link
                  to="/work"
                  className="inline-flex items-center gap-3 text-sm font-semibold text-white/70 transition-colors hover:text-white"
                >
                  Return to the archive
                  <ArrowUpRight size={16} />
                </Link>
              </section>
            </div>
          </div>
        </div>
      </article>
    </PageTransition>
  );
};
