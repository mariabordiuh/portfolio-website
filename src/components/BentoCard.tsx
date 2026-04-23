import { type MouseEvent, useRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  type PortfolioItem,
  isArtDirectionItem,
  isVideoFileUrl,
} from '../utils/portfolio';

interface BentoCardProps {
  item: PortfolioItem;
  onPreview: (item: PortfolioItem) => void;
}

const CardMedia = ({ item }: { item: PortfolioItem }) => {
  const previewVideo = item.mediaUrl && isVideoFileUrl(item.mediaUrl);

  if (previewVideo && !item.thumbnail) {
    return (
      <video
        src={item.mediaUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover opacity-85 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
      />
    );
  }

  return (
    <img
      src={item.thumbnail || item.heroImage}
      alt={item.title}
      width={800}
      height={1000}
      loading="lazy"
      decoding="async"
      className="w-full h-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100 grayscale group-hover:grayscale-0"
      referrerPolicy="no-referrer"
    />
  );
};

const CardContent = ({ item }: { item: PortfolioItem }) => (
  <>
    <div className="bento-card-content absolute inset-[1px] rounded-[15px] bg-brand-bg z-10 overflow-hidden">
      <div className="grain-overlay" />
      <CardMedia item={item} />
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-8">
        <span className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-brand-accent">
          {item.pillar}
        </span>
        <h3 className="text-2xl font-bold tracking-tight">{item.title}</h3>
        {item.description ? (
          <p className="mt-3 line-clamp-3 text-sm text-white/65">{item.description}</p>
        ) : null}
      </div>
      {!isArtDirectionItem(item) ? (
        <span className="absolute right-6 top-6 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/70 backdrop-blur">
          Open Preview
        </span>
      ) : null}
    </div>
    <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10 transition-colors group-hover:border-white/20" />
  </>
);

export const BentoCard = ({ item, onPreview }: BentoCardProps) => {
  const cardRef = useRef<HTMLElement | null>(null);

  const handleMouseMove = (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (!cardRef.current) {
      return;
    }

    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const sharedClassName = cn(
    'bento-card group relative aspect-[4/5] overflow-hidden rounded-2xl bg-white/5 text-left',
    'transition-transform duration-300 hover:-translate-y-1',
  );

  if (isArtDirectionItem(item) && item.routeId) {
    return (
      <Link
        to={`/work/${item.routeId}`}
        ref={(node) => {
          cardRef.current = node;
        }}
        onMouseMove={handleMouseMove}
        className={sharedClassName}
      >
        <CardContent item={item} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      ref={(node) => {
        cardRef.current = node;
      }}
      onMouseMove={handleMouseMove}
      onClick={() => onPreview(item)}
      className={sharedClassName}
    >
      <CardContent item={item} />
    </button>
  );
};
