import { type PortfolioItem } from '../utils/portfolio';

export const MasonryPortfolioGrid = ({
  items,
  onPreview,
}: {
  items: PortfolioItem[];
  onPreview: (item: PortfolioItem) => void;
}) => {
  return (
    <div className="columns-1 gap-6 md:columns-2 xl:columns-3">
      {items.map((item) => {
        return (
          <div key={item.id} className="mb-6 break-inside-avoid">
            <button
              type="button"
              onClick={() => onPreview(item)}
              className="group block w-full text-left"
            >
              <div className="relative overflow-hidden rounded-[1.8rem] border border-white/8 bg-white/[0.03]">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/28 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="min-h-[120px] w-full">
                  {item.thumbnail || item.heroImage ? (
                    <img
                      src={item.thumbnail || item.heroImage}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="block w-full text-transparent object-cover transition-transform duration-700 group-hover:scale-[1.025]"
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
            </button>
          </div>
        );
      })}
    </div>
  );
};
