import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  type PortfolioItem,
  isGifUrl,
  isVideoFileUrl,
  toEmbedUrl,
} from '../utils/portfolio';

const ModalImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    className={cn('block max-w-full', className)}
    referrerPolicy="no-referrer"
  />
);

export const PortfolioPreviewModal = ({
  item,
  onClose,
}: {
  item: PortfolioItem;
  onClose: () => void;
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const isAIItem = item.contentType === 'ai-image' || item.contentType === 'ai-video';

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    scrollAreaRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const galleryImages = item.images.length ? item.images : item.thumbnail ? [item.thumbnail] : [];
  const embedUrl = item.embedUrl || toEmbedUrl(item.mediaUrl);
  const mediaUrl = item.mediaUrl || item.thumbnail;

  const renderMedia = () => {
    if (item.contentType === 'motion-embed' && embedUrl) {
      return (
        <div className="mx-auto aspect-video max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
          <iframe
            src={embedUrl}
            title={item.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }

    if ((item.contentType === 'ai-video' || item.contentType === 'motion-video') && mediaUrl) {
      return (
        <div className="mx-auto aspect-video max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
          <video
            src={mediaUrl}
            controls
            playsInline
            preload="metadata"
            poster={item.thumbnail || undefined}
            className="h-full w-full object-contain"
          />
        </div>
      );
    }

    if ((item.contentType === 'motion-gif' || isGifUrl(mediaUrl)) && mediaUrl) {
      return (
        <div className="mx-auto flex max-w-[min(100%,920px)] justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-2 md:p-3">
          <ModalImage
            src={mediaUrl}
            alt={item.title}
            className="h-auto max-h-[74vh] w-auto max-w-full rounded-[1.35rem] object-contain"
          />
        </div>
      );
    }

    if (!galleryImages.length && mediaUrl && !isVideoFileUrl(mediaUrl)) {
      return (
        <div className="mx-auto flex max-w-[min(100%,920px)] justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-2 md:p-3">
          <ModalImage
            src={mediaUrl}
            alt={item.title}
            className="h-auto max-h-[74vh] w-auto max-w-full rounded-[1.35rem] object-contain"
          />
        </div>
      );
    }

    if (galleryImages.length === 1) {
      return (
        <div className="mx-auto flex max-w-[min(100%,920px)] justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-2 md:p-3">
          <ModalImage
            src={galleryImages[0]}
            alt={item.title}
            className="h-auto max-h-[74vh] w-auto max-w-full rounded-[1.35rem] object-contain"
          />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-5xl columns-1 gap-4 md:columns-2">
        {galleryImages.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="mb-4 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 p-2 [break-inside:avoid] md:p-3"
          >
            <ModalImage
              src={image}
              alt={`${item.title} ${index + 1}`}
              className="h-auto w-full rounded-[1.3rem] object-contain"
            />
          </div>
        ))}
      </div>
    );
  };

  const modal = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] overflow-hidden bg-black/90 p-4 backdrop-blur-2xl md:p-8"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[2.75rem] border border-white/10 bg-brand-bg shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={item.description ? descriptionId : undefined}
      >
        <header className="flex items-start justify-between gap-6 border-b border-white/5 px-6 py-6 md:px-8">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
                {item.pillar}
              </span>
              {item.year ? (
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/60">
                  {item.year}
                </span>
              ) : null}
            </div>
            <div>
              <h2 id={titleId} className="text-3xl font-black uppercase tracking-tight md:text-5xl">
                {item.title}
              </h2>
              {item.description ? (
                <p
                  id={descriptionId}
                  className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70 md:text-base"
                >
                  {item.description}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {item.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/65"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-white/20 hover:text-white"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </header>

        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-8 md:py-8">
          <div className="space-y-8">
            {renderMedia()}

            {!isAIItem && (item.categories.length || item.credits?.length) ? (
              <div className="grid gap-6 border-t border-white/5 pt-6 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
                    Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.categories.length ? (
                      item.categories.map((category) => (
                        <span
                          key={category}
                          className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/65"
                        >
                          {category}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-white/40">No categories added.</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
                    Credits
                  </p>
                  <div className="space-y-2">
                    {item.credits?.length ? (
                      item.credits.map((credit) => (
                        <p key={credit} className="text-sm text-white/65">
                          {credit}
                        </p>
                      ))
                    ) : (
                      <span className="text-sm text-white/40">No credits added.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modal, document.body);
};
