import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Play } from 'lucide-react';
import { type PortfolioItem, getPortfolioImageSrc, isArtDirectionItem } from '../utils/portfolio';
import { OptimizedImage } from './OptimizedImage';

const STILL_RATIO = { width: 4, height: 5 };
const CASE_RATIO = { width: 5, height: 4 };
const VIDEO_RATIO = { width: 16, height: 9 };

const getColumnCount = (width: number, maxColumns = 4) => {
  const clampColumns = (value: number) => Math.min(value, Math.max(1, maxColumns));

  if (width >= 1280) {
    return clampColumns(4);
  }

  if (width >= 1024) {
    return clampColumns(3);
  }

  if (width >= 768) {
    return clampColumns(2);
  }

  return 1;
};

const isVideoItem = (item: PortfolioItem) =>
  item.contentType === 'ai-video' ||
  item.contentType === 'motion-video' ||
  item.contentType === 'motion-embed' ||
  item.contentType === 'motion-gif';

const getDisplayRatio = (item: PortfolioItem) => {
  if (item.contentType === 'art-direction') {
    return CASE_RATIO;
  }

  if (isVideoItem(item)) {
    return VIDEO_RATIO;
  }

  return STILL_RATIO;
};

const getCardLabel = (item: PortfolioItem) => {
  switch (item.contentType) {
    case 'art-direction':
      return 'Case study';
    case 'ai-video':
      return 'AI film';
    case 'motion-video':
    case 'motion-embed':
    case 'motion-gif':
      return 'Motion';
    case 'ai-image':
      return 'AI still';
    case 'illustration':
      return 'Image';
    default:
      return item.pillar;
  }
};

const getCardSubline = (item: PortfolioItem) =>
  item.client || item.year || item.subCategory || item.pillar;

const getHoverLabel = (item: PortfolioItem) => {
  if (item.contentType === 'art-direction') {
    return 'Open case';
  }

  return isVideoItem(item) ? 'Play preview' : 'Open preview';
};

const estimateCardHeight = (ratio: { width: number; height: number }) => {
  const visualHeight = ratio.height / ratio.width;
  return visualHeight + 0.38;
};

type MasonryCardProps = {
  imageLoaded: boolean;
  imageRatio: { width: number; height: number };
  imageSizes: string;
  imageSrc: string;
  index: number;
  item: PortfolioItem;
  onImageLoad: (imageKey: string) => void;
  onPreview: (item: PortfolioItem) => void;
};

const MasonryCard = memo(({
  imageLoaded,
  imageRatio,
  imageSizes,
  imageSrc,
  index,
  item,
  onImageLoad,
  onPreview,
}: MasonryCardProps) => {
  const isArt = isArtDirectionItem(item) && item.routeId;
  const isVideo = isVideoItem(item);
  const isPriorityImage = index < 4;
  const thumbnailScale = Math.max(1, (item.thumbnailZoom ?? 100) / 100);
  const thumbnailPosition = `${item.thumbnailPositionX ?? 50}% ${item.thumbnailPositionY ?? 50}%`;
  const previewFrames = useMemo(() => {
    const uniqueFrames = new Set<string>();
    const orderedFrames = [imageSrc, ...item.images]
      .filter(Boolean)
      .filter((frame) => {
        if (uniqueFrames.has(frame)) {
          return false;
        }

        uniqueFrames.add(frame);
        return true;
      });

    return orderedFrames.slice(0, 6);
  }, [imageSrc, item.images]);
  const shouldCycleFrames = !isVideo && previewFrames.length > 1;
  const [isHovered, setIsHovered] = useState(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const activeFrameSrc = previewFrames[activeFrameIndex] || imageSrc;
  const activeImageKey = `${item.id}:${activeFrameSrc}`;
  const Wrapper = isArt ? Link : 'button';
  const cursorMode = isVideo ? 'play' : 'card';
  const extraProps = isArt
    ? { to: `/work/${item.routeId}` }
    : { type: 'button' as const, onClick: () => onPreview(item) };

  useEffect(() => {
    if (!isHovered || !shouldCycleFrames) {
      setActiveFrameIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setActiveFrameIndex((current) => (current + 1) % previewFrames.length);
    }, 1500);

    return () => window.clearInterval(interval);
  }, [isHovered, previewFrames.length, shouldCycleFrames]);

  return (
    <Wrapper
      className="group block w-full text-left"
      data-click-sound="true"
      data-cursor={cursorMode}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onBlur={() => setIsHovered(false)}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: isVideo ? '420px' : '560px',
      }}
      {...(extraProps as any)}
    >
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b0e] shadow-[0_22px_56px_rgba(0,0,0,0.16)] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-white/16 group-hover:shadow-[0_28px_70px_rgba(0,0,0,0.28)]">
          <div
            className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden bg-white/[0.045] transition-opacity duration-700 ${
              imageLoaded ? 'opacity-0' : 'opacity-100'
            }`}
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,158,187,0.18),transparent_34%),radial-gradient(circle_at_78%_74%,rgba(185,122,37,0.16),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
            <div className="absolute inset-y-0 left-[-70%] w-[60%] skew-x-[-16deg] bg-gradient-to-r from-transparent via-white/18 to-transparent animate-[shimmer_1.35s_infinite]" />
          </div>

          <div className="absolute left-4 top-4 z-20">
            <span className="rounded-full border border-white/12 bg-black/45 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white/72 backdrop-blur-md">
              {getCardLabel(item)}
            </span>
          </div>

          <div
            className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-500 ${
              isVideo ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[radial-gradient(circle_at_bottom,rgba(255,87,112,0.16),transparent_58%)]" />
          </div>

          <div style={{ aspectRatio: `${imageRatio.width} / ${imageRatio.height}` }}>
            <div
              className={`h-full w-full transition-transform duration-[1300ms] ease-out ${
                isVideo ? 'group-hover:scale-[1.025]' : 'group-hover:scale-[1.035]'
              }`}
            >
              {activeFrameSrc ? (
                <OptimizedImage
                  src={activeFrameSrc}
                  alt={item.title}
                  width={imageRatio.width}
                  height={imageRatio.height}
                  sizes={imageSizes}
                  loading={isPriorityImage ? 'eager' : 'lazy'}
                  fetchPriority={isPriorityImage ? 'high' : 'auto'}
                  onImageLoad={() => onImageLoad(activeImageKey)}
                  className="block h-full w-full object-cover text-transparent transition-[opacity,filter,transform] duration-[1300ms] ease-out"
                  style={{
                    transform: `scale(${thumbnailScale})`,
                    transformOrigin: 'center center',
                    objectPosition: thumbnailPosition,
                  }}
                />
              ) : null}
            </div>
          </div>

          {shouldCycleFrames ? (
            <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {previewFrames.map((frame, frameIndex) => (
                <span
                  key={frame}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    frameIndex === activeFrameIndex ? 'w-6 bg-white/90' : 'w-1.5 bg-white/35'
                  }`}
                />
              ))}
            </div>
          ) : null}

          {isVideo ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/50 px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-white/84 backdrop-blur-md transition-all duration-400 group-hover:scale-[1.04] group-hover:border-brand-accent/40 group-hover:bg-black/58 group-hover:text-white">
                <Play size={12} className="fill-current" />
                Play preview
              </span>
            </div>
          ) : (
            <div className="pointer-events-none absolute right-4 top-4 z-20 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/45 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white/78 backdrop-blur-md">
                {getHoverLabel(item)}
                <ArrowUpRight size={12} />
              </span>
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-4 px-1">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
              {getCardLabel(item)}
            </p>
            <p className="mt-2 line-clamp-2 text-[clamp(1rem,0.94rem+0.32vw,1.28rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
              {item.title}
            </p>
            <p className="mt-2 truncate text-sm text-white/46">
              {getCardSubline(item)}
            </p>
          </div>
          <span className="shrink-0 pt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/34">
            {isVideo ? 'Moving image' : isArt ? 'Project' : 'Still'}
          </span>
        </div>
      </div>
    </Wrapper>
  );
});

MasonryCard.displayName = 'MasonryCard';

export const MasonryPortfolioGrid = ({
  items,
  onPreview,
  maxColumns = 4,
}: {
  items: PortfolioItem[];
  onPreview: (item: PortfolioItem) => void;
  maxColumns?: number;
}) => {
  const [columnCount, setColumnCount] = useState(() =>
    getColumnCount(typeof window === 'undefined' ? 1440 : window.innerWidth, maxColumns),
  );
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const ratioSourceKey = useMemo(
    () => items.map((item) => `${item.id}:${getPortfolioImageSrc(item)}`).join('|'),
    [items],
  );

  const useBalancedGrid = items.length <= Math.max(columnCount * 2, 6);
  const isForcedTwoColumnGrid = maxColumns === 2;
  const gridClassName =
    columnCount >= 4
      ? 'grid grid-cols-1 items-start gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : columnCount === 3
        ? 'grid grid-cols-1 items-start gap-8 md:grid-cols-2 lg:grid-cols-3'
        : columnCount === 2
          ? 'grid grid-cols-1 items-start gap-8 md:grid-cols-2'
          : 'grid grid-cols-1 items-start gap-8';
  const imageSizes =
    maxColumns === 2
      ? '(min-width: 1280px) 46vw, (min-width: 768px) 48vw, 100vw'
      : '(min-width: 1280px) 23vw, (min-width: 1024px) 31vw, (min-width: 768px) 48vw, 100vw';

  useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount(window.innerWidth, maxColumns));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [maxColumns]);

  useEffect(() => {
    const activeImageKeys = new Set(items.map((item) => `${item.id}:${getPortfolioImageSrc(item)}`));
    setLoadedImages((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => activeImageKeys.has(key)),
      ),
    );
  }, [ratioSourceKey]);

  const handleImageLoad = useCallback((imageKey: string) => {
    setLoadedImages((current) =>
      current[imageKey] ? current : { ...current, [imageKey]: true },
    );
  }, []);

  if (isForcedTwoColumnGrid) {
    return (
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        {items.map((item, index) => {
          const imageSrc = getPortfolioImageSrc(item);
          const imageKey = `${item.id}:${imageSrc}`;
          const ratio = getDisplayRatio(item);
          const imageLoaded = !imageSrc || loadedImages[imageKey];

          return (
            <MasonryCard
              key={item.id}
              imageLoaded={imageLoaded}
              imageRatio={ratio}
              imageSizes={imageSizes}
              imageSrc={imageSrc}
              index={index}
              item={item}
              onImageLoad={handleImageLoad}
              onPreview={onPreview}
            />
          );
        })}
      </div>
    );
  }

  const columns = useMemo(() => {
    const nextColumns = Array.from({ length: columnCount }, () => ({
      height: 0,
      items: [] as Array<{ item: PortfolioItem; index: number }>,
    }));

    for (const [index, item] of items.entries()) {
      const ratio = getDisplayRatio(item);
      const shortestColumn = nextColumns.reduce(
        (smallest, column, currentIndex) =>
          column.height < nextColumns[smallest].height ? currentIndex : smallest,
        0,
      );

      nextColumns[shortestColumn].items.push({ item, index });
      nextColumns[shortestColumn].height += estimateCardHeight(ratio);
    }

    return nextColumns.map((column) => column.items);
  }, [columnCount, items]);

  if (useBalancedGrid) {
    return (
      <div className={gridClassName}>
        {items.map((item, index) => {
          const imageSrc = getPortfolioImageSrc(item);
          const imageKey = `${item.id}:${imageSrc}`;
          const ratio = getDisplayRatio(item);
          const imageLoaded = !imageSrc || loadedImages[imageKey];

          return (
            <MasonryCard
              key={item.id}
              imageLoaded={imageLoaded}
              imageRatio={ratio}
              imageSizes={imageSizes}
              imageSrc={imageSrc}
              index={index}
              item={item}
              onImageLoad={handleImageLoad}
              onPreview={onPreview}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={gridClassName}>
      {columns.map((columnItems, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-8">
          {columnItems.map(({ item, index }) => {
            const imageSrc = getPortfolioImageSrc(item);
            const imageKey = `${item.id}:${imageSrc}`;
            const ratio = getDisplayRatio(item);
            const imageLoaded = !imageSrc || loadedImages[imageKey];

            return (
              <MasonryCard
                key={item.id}
                imageLoaded={imageLoaded}
                imageRatio={ratio}
                imageSizes={imageSizes}
                imageSrc={imageSrc}
                index={index}
                item={item}
                onImageLoad={handleImageLoad}
                onPreview={onPreview}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
