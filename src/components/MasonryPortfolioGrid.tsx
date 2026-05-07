import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { type PortfolioItem, getPortfolioImageSrc, isArtDirectionItem } from '../utils/portfolio';
import { OptimizedImage } from './OptimizedImage';

const FALLBACK_RATIO = { width: 4, height: 5 };
const FALLBACK_RATIOS = [
  { width: 4, height: 5 },
  { width: 1, height: 1 },
  { width: 5, height: 7 },
  { width: 3, height: 4 },
  { width: 4, height: 3 },
];
const WIDE_CASE_RATIO = { width: 16, height: 9 };

const imageRatioCache = new Map<string, { width: number; height: number }>();

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

const getFallbackRatio = (item: PortfolioItem, index: number) =>
  item.contentType === 'art-direction'
    ? WIDE_CASE_RATIO
    : item.contentType === 'ai-video' || item.contentType === 'motion-video' || item.contentType === 'motion-embed'
    ? { width: 16, height: 9 }
    : FALLBACK_RATIOS[index % FALLBACK_RATIOS.length];

const getDisplayRatio = (
  item: PortfolioItem,
  index: number,
  measuredRatio?: { width: number; height: number },
) => {
  if (item.contentType === 'art-direction') {
    return WIDE_CASE_RATIO;
  }

  return measuredRatio ?? getFallbackRatio(item, index);
};

const estimateCardHeight = (ratio: { width: number; height: number }) => {
  const visualHeight = ratio.height / ratio.width;
  return visualHeight + 0.42;
};

type MasonryCardProps = {
  imageLoaded: boolean;
  imageRatio: { width: number; height: number };
  imageSrc: string;
  index: number;
  item: PortfolioItem;
  onImageLoad: (imageKey: string, size: { width: number; height: number }) => void;
  onPreview: (item: PortfolioItem) => void;
};

const MasonryCard = memo(({
  imageLoaded,
  imageRatio,
  imageSrc,
  index,
  item,
  onImageLoad,
  onPreview,
}: MasonryCardProps) => {
  const isArt = isArtDirectionItem(item) && item.routeId;
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
  const [isHovered, setIsHovered] = useState(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const activeFrameSrc = previewFrames[activeFrameIndex] || imageSrc;
  const activeImageKey = `${item.id}:${activeFrameSrc}`;
  const Wrapper = isArt ? Link : 'button';
  const extraProps = isArt ? { to: `/work/${item.routeId}` } : { type: 'button' as const, onClick: () => onPreview(item) };

  useEffect(() => {
    if (!isHovered || previewFrames.length < 2) {
      setActiveFrameIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setActiveFrameIndex((current) => (current + 1) % previewFrames.length);
    }, 1350);

    return () => window.clearInterval(interval);
  }, [isHovered, previewFrames]);

  return (
    <Wrapper
      className="group block w-full text-left"
      data-click-sound="true"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onBlur={() => setIsHovered(false)}
      {...(extraProps as any)}
    >
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-[1.8rem] border border-white/8 bg-white/[0.03] transition-transform duration-500 group-hover:scale-[1.01]">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/28 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div
            className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden bg-white/[0.045] transition-opacity duration-700 ${
              imageLoaded ? 'opacity-0' : 'opacity-100'
            }`}
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,158,187,0.2),transparent_34%),radial-gradient(circle_at_72%_72%,rgba(185,122,37,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
            <div className="absolute inset-y-0 left-[-70%] w-[60%] skew-x-[-16deg] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.35s_infinite]" />
            <div className="absolute bottom-5 left-5 h-2 w-24 rounded-full bg-white/8" />
            <div className="absolute bottom-9 left-5 h-2 w-14 rounded-full bg-white/5" />
          </div>
          <div style={{ aspectRatio: `${imageRatio.width} / ${imageRatio.height}` }}>
            {activeFrameSrc ? (
              <OptimizedImage
                src={activeFrameSrc}
                alt={item.title}
                width={imageRatio.width}
                height={imageRatio.height}
                loading={isPriorityImage ? 'eager' : 'lazy'}
                fetchPriority={isPriorityImage ? 'high' : 'auto'}
                onImageLoad={(size) => onImageLoad(activeImageKey, size)}
                className="block h-full w-full object-cover text-transparent transition-transform duration-[1400ms] ease-out"
                style={{
                  transform: `scale(${thumbnailScale})`,
                  transformOrigin: 'center center',
                  objectPosition: thumbnailPosition,
                }}
              />
            ) : null}
          </div>
          {previewFrames.length > 1 ? (
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
          <span className="absolute right-4 top-4 z-20 rounded-full border border-white/12 bg-black/45 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/75 opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100">
            Open Preview
          </span>
        </div>
        {isArt ? (
          <div className="px-1">
            <p className="text-base font-black uppercase tracking-tight text-white sm:text-lg md:text-2xl">
              {item.title}
            </p>
          </div>
        ) : null}
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
  const [measuredRatios, setMeasuredRatios] = useState<Record<string, { width: number; height: number }>>({});

  const ratioSourceKey = useMemo(
    () => items.map((item) => `${item.id}:${getPortfolioImageSrc(item)}`).join('|'),
    [items],
  );

  const useBalancedGrid = items.length <= Math.max(columnCount * 2, 6);

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
    setMeasuredRatios((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => activeImageKeys.has(key)),
      ),
    );
  }, [ratioSourceKey]);

  const handleImageLoad = useCallback((imageKey: string, size: { width: number; height: number }) => {
    imageRatioCache.set(imageKey, size);
    setLoadedImages((current) =>
      current[imageKey] ? current : { ...current, [imageKey]: true },
    );
    setMeasuredRatios((current) => {
      const existing = current[imageKey];
      if (existing?.width === size.width && existing.height === size.height) {
        return current;
      }

      return { ...current, [imageKey]: size };
    });
  }, []);

  const columns = useMemo(() => {
    const nextColumns = Array.from({ length: columnCount }, () => ({
      height: 0,
      items: [] as Array<{ item: PortfolioItem; index: number }>,
    }));

    for (const [index, item] of items.entries()) {
      const ratio = getFallbackRatio(item, index);
      const shortestColumn = nextColumns.reduce(
        (smallest, column, index) => (column.height < nextColumns[smallest].height ? index : smallest),
        0,
      );

      nextColumns[shortestColumn].items.push({ item, index });
      nextColumns[shortestColumn].height += estimateCardHeight(ratio);
    }

    return nextColumns.map((column) => column.items);
  }, [columnCount, items]);

  if (useBalancedGrid) {
    const balancedGridClass =
      columnCount >= 4
        ? 'grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        : columnCount === 3
          ? 'grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3'
          : columnCount === 2
            ? 'grid grid-cols-1 items-start gap-6 md:grid-cols-2'
            : 'grid grid-cols-1 items-start gap-6';

    return (
      <div className={balancedGridClass}>
        {items.map((item, index) => {
          const imageSrc = getPortfolioImageSrc(item);
          const imageKey = `${item.id}:${imageSrc}`;
          const ratio = getDisplayRatio(
            item,
            index,
            measuredRatios[imageKey] ?? imageRatioCache.get(imageKey),
          );
          const imageLoaded = !imageSrc || loadedImages[imageKey];

          return (
            <MasonryCard
              key={item.id}
              imageLoaded={imageLoaded}
              imageRatio={ratio}
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
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {columns.map((columnItems, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-6">
          {columnItems.map(({ item, index }, itemIndex) => {
            const imageSrc = getPortfolioImageSrc(item);
            const imageKey = `${item.id}:${imageSrc}`;
            const ratio = getDisplayRatio(
              item,
              index,
              measuredRatios[imageKey] ?? imageRatioCache.get(imageKey),
            );
            const imageLoaded = !imageSrc || loadedImages[imageKey];

            return (
              <MasonryCard
                key={item.id}
                imageLoaded={imageLoaded}
                imageRatio={ratio}
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
