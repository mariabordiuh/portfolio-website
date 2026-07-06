import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Filter } from 'lucide-react';
import { Seo } from '../components/Seo';
import { useData } from '../context/DataContext';
import { PageTransition } from '../components/PageTransition';
import { ScrollScrambleText } from '../components/ScrollScrambleText';
import { MasonryPortfolioGrid } from '../components/MasonryPortfolioGrid';
import { PortfolioPreviewModal } from '../components/PortfolioPreviewModal';
import { ProjectSkeleton } from '../components/Skeleton';
import { UpdateMarquee } from '../components/UpdateMarquee';
import { type ProjectPillar } from '../types';
import { PUBLIC_SHELL_CLASS } from '../lib/layout';
import {
  type PortfolioItem,
  WORK_PILLARS,
  galleryToPortfolioItem,
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

const WORK_TITLE_LINES = ['Archive', 'of Works.'];

const normalizeSubcategory = (value?: string | null) =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[‐‑‒–—]/g, '-');

const itemHasCategory = (item: PortfolioItem, value: string) =>
  item.categories?.some((category) => normalizeSubcategory(category) === value) ?? false;

const getMotionSubtype = (item: PortfolioItem) => {
  const subCategory = normalizeSubcategory(item.subCategory);

  if (subCategory === 'cut-out' || itemHasCategory(item, 'cut-out')) {
    return 'cut-out';
  }

  if (subCategory === 'motion' || itemHasCategory(item, 'motion')) {
    return 'motion';
  }

  if (subCategory === 'traditional' || itemHasCategory(item, 'traditional')) {
    return 'traditional';
  }

  return '';
};

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

type FilterVariant = {
  active: string;
  inactive: string;
};

const WORK_FILTER_VARIANTS: FilterVariant[] = [
  {
    active: 'border-[rgba(var(--cta-rgb),0.7)] bg-[linear-gradient(118deg,rgba(255,201,220,0.95)_0%,rgba(247,153,124,0.93)_12%,rgba(231,71,26,0.97)_25%,rgba(246,138,109,0.94)_42%,rgba(255,188,211,0.93)_70%,rgba(255,210,222,0.92)_100%)] text-brand-bg shadow-[0_14px_30px_rgba(var(--cta-rgb),0.16)]',
    inactive:
      'border-[rgba(var(--cta-rgb),0.16)] bg-[linear-gradient(118deg,rgba(255,200,219,0.07)_0%,rgba(247,153,124,0.055)_12%,rgba(231,71,26,0.08)_24%,rgba(246,138,109,0.055)_42%,rgba(255,188,211,0.05)_70%,rgba(255,210,222,0.045)_100%)] text-white/68 hover:border-[rgba(var(--cta-rgb),0.28)] hover:bg-[linear-gradient(118deg,rgba(255,200,219,0.1)_0%,rgba(247,153,124,0.08)_12%,rgba(231,71,26,0.11)_24%,rgba(246,138,109,0.08)_42%,rgba(255,188,211,0.075)_70%,rgba(255,210,222,0.06)_100%)] hover:text-white',
  },
  {
    active: 'border-[rgba(var(--cta-rgb),0.7)] bg-[linear-gradient(142deg,rgba(255,216,229,0.94)_0%,rgba(255,206,224,0.92)_38%,rgba(250,190,171,0.9)_58%,rgba(237,110,64,0.95)_76%,rgba(231,71,26,0.98)_89%,rgba(247,159,141,0.92)_100%)] text-brand-bg shadow-[0_14px_30px_rgba(var(--cta-rgb),0.16)]',
    inactive:
      'border-[rgba(var(--cta-rgb),0.16)] bg-[linear-gradient(142deg,rgba(255,216,229,0.06)_0%,rgba(255,206,224,0.045)_38%,rgba(250,190,171,0.045)_58%,rgba(237,110,64,0.065)_76%,rgba(231,71,26,0.08)_89%,rgba(247,159,141,0.045)_100%)] text-white/68 hover:border-[rgba(var(--cta-rgb),0.28)] hover:bg-[linear-gradient(142deg,rgba(255,216,229,0.095)_0%,rgba(255,206,224,0.07)_38%,rgba(250,190,171,0.07)_58%,rgba(237,110,64,0.09)_76%,rgba(231,71,26,0.11)_89%,rgba(247,159,141,0.07)_100%)] hover:text-white',
  },
  {
    active: 'border-[rgba(var(--cta-rgb),0.7)] bg-[linear-gradient(106deg,rgba(255,194,216,0.94)_0%,rgba(255,183,209,0.92)_18%,rgba(249,171,146,0.92)_31%,rgba(231,71,26,0.98)_46%,rgba(248,154,129,0.95)_59%,rgba(255,196,217,0.92)_74%,rgba(255,203,222,0.92)_100%)] text-brand-bg shadow-[0_14px_30px_rgba(var(--cta-rgb),0.16)]',
    inactive:
      'border-[rgba(var(--cta-rgb),0.16)] bg-[linear-gradient(106deg,rgba(255,194,216,0.06)_0%,rgba(255,183,209,0.045)_18%,rgba(249,171,146,0.045)_31%,rgba(231,71,26,0.08)_46%,rgba(248,154,129,0.055)_59%,rgba(255,196,217,0.045)_74%,rgba(255,203,222,0.045)_100%)] text-white/68 hover:border-[rgba(var(--cta-rgb),0.28)] hover:bg-[linear-gradient(106deg,rgba(255,194,216,0.095)_0%,rgba(255,183,209,0.07)_18%,rgba(249,171,146,0.07)_31%,rgba(231,71,26,0.11)_46%,rgba(248,154,129,0.08)_59%,rgba(255,196,217,0.07)_74%,rgba(255,203,222,0.06)_100%)] hover:text-white',
  },
  {
    active: 'border-[rgba(var(--cta-rgb),0.7)] bg-[linear-gradient(150deg,rgba(255,219,230,0.96)_0%,rgba(255,210,226,0.94)_15%,rgba(250,185,164,0.93)_32%,rgba(226,72,32,0.98)_50%,rgba(248,170,149,0.95)_68%,rgba(255,207,223,0.94)_82%,rgba(255,210,224,0.94)_100%)] text-brand-bg shadow-[0_14px_30px_rgba(var(--cta-rgb),0.16)]',
    inactive:
      'border-[rgba(var(--cta-rgb),0.16)] bg-[linear-gradient(150deg,rgba(255,219,230,0.06)_0%,rgba(255,210,226,0.045)_15%,rgba(250,185,164,0.05)_32%,rgba(226,72,32,0.08)_50%,rgba(248,170,149,0.055)_68%,rgba(255,207,223,0.045)_82%,rgba(255,210,224,0.045)_100%)] text-white/68 hover:border-[rgba(var(--cta-rgb),0.28)] hover:bg-[linear-gradient(150deg,rgba(255,219,230,0.095)_0%,rgba(255,210,226,0.07)_15%,rgba(250,185,164,0.075)_32%,rgba(226,72,32,0.11)_50%,rgba(248,170,149,0.08)_68%,rgba(255,207,223,0.07)_82%,rgba(255,210,224,0.06)_100%)] hover:text-white',
  },
];

const WORK_SUB_FILTER_VARIANTS: FilterVariant[] = [
  {
    active: 'border-[rgba(var(--cta-rgb),0.52)] bg-[linear-gradient(118deg,rgba(255,200,219,0.28)_0%,rgba(247,153,124,0.16)_12%,rgba(231,71,26,0.26)_24%,rgba(246,138,109,0.17)_42%,rgba(255,188,211,0.16)_70%,rgba(255,210,222,0.13)_100%)] text-[rgba(250,238,229,0.94)] shadow-[0_0_18px_rgba(var(--cta-rgb),0.14)]',
    inactive:
      'border-[rgba(var(--cta-rgb),0.1)] bg-[linear-gradient(118deg,rgba(255,200,219,0.045)_0%,rgba(247,153,124,0.03)_12%,rgba(231,71,26,0.05)_24%,rgba(246,138,109,0.03)_42%,rgba(255,188,211,0.03)_70%,rgba(255,210,222,0.03)_100%)] text-white/56 hover:border-[rgba(var(--cta-rgb),0.18)] hover:bg-[linear-gradient(118deg,rgba(255,200,219,0.08)_0%,rgba(247,153,124,0.055)_12%,rgba(231,71,26,0.075)_24%,rgba(246,138,109,0.055)_42%,rgba(255,188,211,0.05)_70%,rgba(255,210,222,0.04)_100%)] hover:text-white/86',
  },
  {
    active: 'border-[rgba(var(--cta-rgb),0.52)] bg-[linear-gradient(140deg,rgba(255,216,229,0.24)_0%,rgba(255,206,224,0.16)_38%,rgba(250,190,171,0.14)_58%,rgba(237,110,64,0.22)_76%,rgba(231,71,26,0.28)_89%,rgba(247,159,141,0.15)_100%)] text-[rgba(250,238,229,0.94)] shadow-[0_0_18px_rgba(var(--cta-rgb),0.14)]',
    inactive:
      'border-[rgba(var(--cta-rgb),0.1)] bg-[linear-gradient(140deg,rgba(255,216,229,0.04)_0%,rgba(255,206,224,0.03)_38%,rgba(250,190,171,0.028)_58%,rgba(237,110,64,0.04)_76%,rgba(231,71,26,0.05)_89%,rgba(247,159,141,0.03)_100%)] text-white/56 hover:border-[rgba(var(--cta-rgb),0.18)] hover:bg-[linear-gradient(140deg,rgba(255,216,229,0.075)_0%,rgba(255,206,224,0.05)_38%,rgba(250,190,171,0.048)_58%,rgba(237,110,64,0.065)_76%,rgba(231,71,26,0.075)_89%,rgba(247,159,141,0.05)_100%)] hover:text-white/86',
  },
  {
    active: 'border-[rgba(var(--cta-rgb),0.52)] bg-[linear-gradient(106deg,rgba(255,194,216,0.24)_0%,rgba(255,183,209,0.16)_18%,rgba(249,171,146,0.14)_31%,rgba(231,71,26,0.28)_46%,rgba(248,154,129,0.16)_59%,rgba(255,196,217,0.14)_74%,rgba(255,203,222,0.14)_100%)] text-[rgba(250,238,229,0.94)] shadow-[0_0_18px_rgba(var(--cta-rgb),0.14)]',
    inactive:
      'border-[rgba(var(--cta-rgb),0.1)] bg-[linear-gradient(106deg,rgba(255,194,216,0.04)_0%,rgba(255,183,209,0.03)_18%,rgba(249,171,146,0.028)_31%,rgba(231,71,26,0.05)_46%,rgba(248,154,129,0.03)_59%,rgba(255,196,217,0.028)_74%,rgba(255,203,222,0.03)_100%)] text-white/56 hover:border-[rgba(var(--cta-rgb),0.18)] hover:bg-[linear-gradient(106deg,rgba(255,194,216,0.075)_0%,rgba(255,183,209,0.05)_18%,rgba(249,171,146,0.048)_31%,rgba(231,71,26,0.075)_46%,rgba(248,154,129,0.05)_59%,rgba(255,196,217,0.048)_74%,rgba(255,203,222,0.04)_100%)] hover:text-white/86',
  },
];

const getFilterVariantClasses = (label: string, active: boolean, variants: FilterVariant[]) => {
  const variant = variants[hashString(label) % variants.length];
  return active ? variant.active : variant.inactive;
};

const getWorkSeoCopy = ({
  activePillar,
  activeSubcategory,
  activeTool,
}: {
  activePillar: ProjectPillar | 'All';
  activeSubcategory: string | null;
  activeTool: string | null;
}) => {
  if (activeTool) {
    return {
      title: `${activeTool} Work — Maria Bordiuh`,
      description: `Selected portfolio work by Maria Bordiuh featuring ${activeTool}, spanning art direction, motion, illustration, and AI-forward visual output.`,
    };
  }

  if (activePillar !== 'All' && activeSubcategory) {
    return {
      title: `${activePillar} / ${activeSubcategory} — Maria Bordiuh`,
      description: `${activeSubcategory} work from Maria Bordiuh's ${activePillar.toLowerCase()} archive, including selected visual systems, motion, and campaign-driven output.`,
    };
  }

  if (activePillar !== 'All') {
    return {
      title: `${activePillar} Work — Maria Bordiuh`,
      description: `Selected ${activePillar.toLowerCase()} work by Maria Bordiuh, from campaign concepts and motion pieces to AI visuals and image systems.`,
    };
  }

  return {
    title: 'Work — Maria Bordiuh',
    description:
      'Selected work by Maria Bordiuh across art direction, motion, illustration, AI visuals, and campaign image systems.',
  };
};

export const Work = () => {
  const { projects, videos, galleryImages, loading } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activePillar, setActivePillar] = useState<ProjectPillar | 'All'>('All');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<PortfolioItem | null>(null);
  const [sessionSeed] = useState(() => Math.random().toString(36).slice(2));

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
  const previewId = searchParams.get('preview');
  const pillarParam = searchParams.get('pillar');

  const filteredItems = useMemo(() => {
    const rawItems = workItems.filter((item) => {
      const matchesTool = !activeTool || item.tools.includes(activeTool);
      if (!matchesTool) return false;

      const isAiVideo = item.contentType === 'ai-video';
      const isSketchbook = item.subCategory?.toLowerCase() === 'sketchbook' || item.categories?.some(c => c.toLowerCase() === 'sketchbook');
      const motionSubtype = getMotionSubtype(item);
      const isTraditional = motionSubtype === 'traditional';
      const isCutOut = motionSubtype === 'cut-out';
      const isMotion = motionSubtype === 'motion';

      if (activePillar === 'All') {
        if (item.pillar === 'AI Generated') return !isAiVideo;
        if (item.pillar === 'Illustration & Design') return !isSketchbook;
        if (item.pillar === 'Animation & Motion') return isTraditional || !motionSubtype;
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
          return isTraditional || !motionSubtype;
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
    if (!previewId) {
      return;
    }

    const match = workItems.find((item) => item.id === previewId);
    if (match && !match.routeId) {
      setActivePreview(match);
    }
  }, [previewId, workItems]);

  const visibleItems = filteredItems;
  const isAnimationAndMotionView =
    pillarParam === 'Animation & Motion' || activePillar === 'Animation & Motion';
  const gridMaxColumns = isAnimationAndMotionView ? 2 : 4;
  const seoCopy = getWorkSeoCopy({ activePillar, activeSubcategory, activeTool });

  const handlePillarChange = (pillar: ProjectPillar | 'All') => {
    const nextParams = new URLSearchParams(searchParams);

    if (pillar === 'All') {
      nextParams.delete('pillar');
      setActiveSubcategory(null);
    } else {
      nextParams.set('pillar', pillar);
      setActiveSubcategory(DEFAULT_SUBCATEGORY[pillar]);
    }

    setActivePillar(pillar);
    setSearchParams(nextParams, { replace: true, preventScrollReset: true });
  };

  const handleClearTool = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('tool');
    setActiveTool(null);
    setSearchParams(nextParams, { replace: true, preventScrollReset: true });
  };

  return (
    <PageTransition>
      <div className={`${PUBLIC_SHELL_CLASS} pb-24 pt-28 sm:pb-28 sm:pt-32 md:pb-32 md:pt-36`}>
        <Seo
          title={seoCopy.title}
          description={seoCopy.description}
          canonicalPath="/work"
          image="/media/home-hero-cat-working-fallback.jpg"
          imageWidth={1920}
          imageHeight={960}
          imageAlt="Selected work by Maria Bordiuh"
        />
        <header className="mb-10 sm:mb-12">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="max-w-[54rem]">
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/52">
                Archive // selected output
              </p>
              <ScrollScrambleText
                as="h1"
                lines={WORK_TITLE_LINES}
                accentLastCharacter
                className="mt-3 max-w-[13ch] font-display text-[clamp(1.9rem,3.8vw,3.7rem)] font-normal uppercase leading-[1.08] tracking-[0.02em]"
              />
              <p className="mt-4 max-w-[42rem] text-[1.02rem] leading-[1.72] text-white/72 md:text-[1.08rem]">
                Campaign worlds, motion pieces, AI image systems, and experiments arranged to
                be scanned fast.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <AnimatePresence>
                {activeTool ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="flex items-center gap-3 rounded-full border border-[rgba(var(--cta-rgb),0.36)] bg-[linear-gradient(124deg,rgba(255,188,211,0.12)_0%,rgba(255,188,211,0.08)_24%,rgba(231,71,26,0.14)_56%,rgba(231,71,26,0.22)_100%)] py-2 pl-4 pr-2 shadow-[0_12px_28px_rgba(var(--cta-rgb),0.12)]"
                  >
                    <Filter size={12} className="text-brand-accent" />
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
                      {activeTool}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearTool}
                      data-click-sound="true"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(var(--cta-rgb),0.38)] bg-[linear-gradient(120deg,rgba(255,188,211,0.92)_0%,rgba(255,172,200,0.88)_18%,rgba(231,71,26,0.96)_19%,rgba(231,71,26,1)_72%,rgba(255,176,201,0.86)_100%)] text-brand-bg transition-all hover:scale-[1.04] hover:shadow-[0_12px_24px_rgba(var(--cta-rgb),0.18)]"
                    >
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-5 border-t border-white/6 pt-5 md:mt-9 md:gap-4">
            <div className="flex w-full flex-wrap items-center gap-2 md:-mx-1 md:-my-1 md:flex-nowrap md:gap-3 md:overflow-x-auto md:px-1 md:py-1 md:[&::-webkit-scrollbar]:hidden md:[-ms-overflow-style:none] md:[scrollbar-width:none]">
              <button
                type="button"
                onClick={() => handlePillarChange('All')}
                data-click-sound="true"
                className={`flex-shrink-0 rounded-full border px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] transition-all sm:px-5 ${getFilterVariantClasses('All', activePillar === 'All', WORK_FILTER_VARIANTS)}`}
              >
                All
              </button>

              {WORK_PILLARS.map((pillar) => {
                const isActive = activePillar === pillar;

                return (
                  <button
                    key={pillar}
                    type="button"
                    onClick={() => handlePillarChange(isActive ? 'All' : pillar)}
                    data-click-sound="true"
                    className={`flex-shrink-0 rounded-full border px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] transition-all sm:px-5 ${getFilterVariantClasses(pillar, isActive, WORK_FILTER_VARIANTS)}`}
                  >
                    {pillar}
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {activePillar !== 'All' && SUB_CATEGORIES[activePillar].length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-1"
              >
                  <div className="mt-3 flex w-full items-center gap-2 overflow-x-auto px-1 py-1 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:pb-3">
                  <div className="h-4 w-px bg-white/20 ml-2 mr-1 flex-shrink-0" />
                  {SUB_CATEGORIES[activePillar].map((sub) => {
                    const isActive = activeSubcategory === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setActiveSubcategory(sub)}
                        data-click-sound="true"
                        className={`flex-shrink-0 rounded-full border px-3.5 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] transition-all sm:px-4 ${getFilterVariantClasses(`${activePillar}-${sub}`, isActive, WORK_SUB_FILTER_VARIANTS)}`}
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
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-muted font-mono">
              Full hard drive, empty page. Maria&apos;s mid-espresso and uploading. Come back soon :)
            </p>
          </div>
        ) : (
          <div className="mt-8 transition-opacity duration-500 will-change-transform">
            <MasonryPortfolioGrid
              items={visibleItems}
              onPreview={setActivePreview}
              maxColumns={gridMaxColumns}
              captionMode="art-direction-only"
            />
          </div>
        )}

        <div className="mt-14 sm:mt-16">
          <UpdateMarquee />
        </div>
      </div>

      <AnimatePresence>
        {activePreview ? (
          <PortfolioPreviewModal
            item={activePreview}
            onClose={() => {
              setActivePreview(null);
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('preview');
              setSearchParams(nextParams, { replace: true });
            }}
          />
        ) : null}
      </AnimatePresence>
    </PageTransition>
  );
};
