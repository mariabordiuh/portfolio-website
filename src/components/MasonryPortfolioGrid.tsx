import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { type PortfolioItem, getPortfolioImageSrc, isArtDirectionItem } from '../utils/portfolio';

const FALLBACK_RATIO = { width: 4, height: 5 };
const FALLBACK_RATIOS = [
  { width: 4, height: 5 },
  { width: 1, height: 1 },
  { width: 5, height: 7 },
  { width: 3, height: 4 },
  { width: 4, height: 3 },
];

const getColumnCount = (width: number) => {
  if (width >= 1280) {
    return 4;
  }

  if (width >= 1024) {
    return 3;
  }

  if (width >= 768) {
    return 2;
  }

  return 1;
};

const getFallbackRatio = (item: PortfolioItem, index: number) =>
  item.contentType === 'ai-video' || item.contentType === 'motion-video' || item.contentType === 'motion-embed'
    ? { width: 16, height: 9 }
    : FALLBACK_RATIOS[index % FALLBACK_RATIOS.length];

const estimateCardHeight = (ratio: { width: number; height: number }) => {
  const visualHeight = ratio.height / ratio.width;
  return visualHeight + 0.42;
};

export const MasonryPortfolioGrid = ({
  items,
  onPreview,
}: {
  items: PortfolioItem[];
  onPreview: (item: PortfolioItem) => void;
}) => {
  const [columnCount, setColumnCount] = useState(() =>
    getColumnCount(typeof window === 'undefined' ? 1440 : window.innerWidth),
  );
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const ratioSourceKey = useMemo(
    () => items.map((item) => `${item.id}:${getPortfolioImageSrc(item)}`).join('|'),
    [items],
  );

  useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const activeImageKeys = new Set(items.map((item) => `${item.id}:${getPortfolioImageSrc(item)}`));
    setLoadedImages((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => activeImageKeys.has(key)),
      ),
    );
  }, [ratioSourceKey]);

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

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {columns.map((columnItems, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-6">
          {columnItems.map(({ item, index }, itemIndex) => {
            const ratio = getFallbackRatio(item, index);
            const imageSrc = getPortfolioImageSrc(item);
            const isArt = isArtDirectionItem(item) && item.routeId;
            const imageKey = `${item.id}:${imageSrc}`;
            const imageLoaded = !imageSrc || loadedImages[imageKey];
            const isPriorityImage = index < 4;

            const Wrapper = isArt ? Link : 'button';
            const extraProps = isArt ? { to: `/work/${item.routeId}` } : { type: 'button' as const, onClick: () => onPreview(item) };

            return (
              <Wrapper
                key={item.id}
                className="group block w-full text-left"
                {...(extraProps as any)}
              >
                <div className="relative overflow-hidden rounded-[1.8rem] border border-white/8 bg-white/[0.03]">
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
                  <div style={{ aspectRatio: `${ratio.width} / ${ratio.height}` }}>
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={item.title}
                        width={ratio.width}
                        height={ratio.height}
                        loading={isPriorityImage ? 'eager' : 'lazy'}
                        decoding="async"
                        fetchPriority={isPriorityImage ? 'high' : 'low'}
                        onLoad={(event) => {
                          setLoadedImages((current) =>
                            current[imageKey] ? current : { ...current, [imageKey]: true },
                          );
                        }}
                        className={`block h-full w-full object-cover text-transparent transition-[opacity,transform,filter] duration-700 group-hover:scale-[1.025] ${
                          imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
                        }`}
                        referrerPolicy="no-referrer"
                      />
                    ) : null}
                  </div>
                  <span className="absolute right-4 top-4 z-20 rounded-full border border-white/12 bg-black/45 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/75 opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100">
                    Open Preview
                  </span>
                </div>

                <div className="px-1 pb-1 pt-4">
                  <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.24em] text-brand-accent">
                    {item.pillar}
                  </p>
                  <h3 className="text-xl font-semibold tracking-tight text-white">{item.title}</h3>
                  {item.description ? (
                    <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-white/60">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </Wrapper>
            );
          })}
        </div>
      ))}
    </div>
  );
};
