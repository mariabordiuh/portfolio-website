import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { type PortfolioItem, isArtDirectionItem } from '../utils/portfolio';

const FALLBACK_RATIO = { width: 4, height: 5 };

const imageRatioCache = new Map<string, { width: number; height: number }>();

const getColumnCount = (width: number) => {
  if (width >= 1280) {
    return 3;
  }

  if (width >= 768) {
    return 2;
  }

  return 1;
};

const getItemImageSrc = (item: PortfolioItem) => item.thumbnail || item.heroImage || item.images[0] || '';

const estimateCardHeight = (ratio: { width: number; height: number }) => {
  const visualHeight = ratio.height / ratio.width;
  return visualHeight + 0.42;
};

const loadImageRatio = (src: string) =>
  new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';

    const finalize = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
        return;
      }

      resolve(FALLBACK_RATIO);
    };

    image.onload = finalize;
    image.onerror = () => resolve(FALLBACK_RATIO);
    image.src = src;

    if (image.complete) {
      finalize();
    }
  });

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
  const [ratios, setRatios] = useState<Record<string, { width: number; height: number }>>({});
  const [isMeasuring, setIsMeasuring] = useState(true);

  const ratioSourceKey = useMemo(
    () => items.map((item) => `${item.id}:${getItemImageSrc(item)}`).join('|'),
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
    let cancelled = false;

    const loadRatios = async () => {
      setIsMeasuring(true);

      const nextRatios: Record<string, { width: number; height: number }> = {};

      await Promise.all(
        items.map(async (item) => {
          const src = getItemImageSrc(item);

          if (!src) {
            nextRatios[item.id] = FALLBACK_RATIO;
            return;
          }

          const cached = imageRatioCache.get(src);
          if (cached) {
            nextRatios[item.id] = cached;
            return;
          }

          const ratio = await loadImageRatio(src);
          imageRatioCache.set(src, ratio);
          nextRatios[item.id] = ratio;
        }),
      );

      if (cancelled) {
        return;
      }

      setRatios(nextRatios);
      setIsMeasuring(false);
    };

    void loadRatios();

    return () => {
      cancelled = true;
    };
  }, [ratioSourceKey]);

  const columns = useMemo(() => {
    const nextColumns = Array.from({ length: columnCount }, () => ({
      height: 0,
      items: [] as PortfolioItem[],
    }));

    for (const item of items) {
      const ratio = ratios[item.id] ?? FALLBACK_RATIO;
      const shortestColumn = nextColumns.reduce(
        (smallest, column, index) => (column.height < nextColumns[smallest].height ? index : smallest),
        0,
      );

      nextColumns[shortestColumn].items.push(item);
      nextColumns[shortestColumn].height += estimateCardHeight(ratio);
    }

    return nextColumns.map((column) => column.items);
  }, [columnCount, items, ratios]);

  if (isMeasuring) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: Math.max(columnCount * 2, 1) }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse overflow-hidden rounded-[1.8rem] border border-white/8 bg-white/[0.04]"
            style={{
              aspectRatio: index % 3 === 0 ? '4 / 5' : index % 3 === 1 ? '1 / 1' : '5 / 7',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
      {columns.map((columnItems, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-6">
          {columnItems.map((item) => {
            const ratio = ratios[item.id] ?? FALLBACK_RATIO;
            const imageSrc = getItemImageSrc(item);
            const isArt = isArtDirectionItem(item) && item.routeId;

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
                  <div style={{ aspectRatio: `${ratio.width} / ${ratio.height}` }}>
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={item.title}
                        width={ratio.width}
                        height={ratio.height}
                        loading="lazy"
                        decoding="async"
                        className="block h-full w-full object-cover text-transparent transition-transform duration-700 group-hover:scale-[1.025]"
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
