import { memo, useState, type ImgHTMLAttributes } from 'react';
import { cn } from '../lib/utils';

type OptimizedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'src'> & {
  src: string;
  webpSrc?: string;
  fallbackSrc?: string;
  onImageLoad?: (size: { width: number; height: number }) => void;
};

export const OptimizedImage = memo(({
  alt,
  className,
  fallbackSrc,
  loading = 'lazy',
  onImageLoad,
  src,
  webpSrc,
  ...props
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const image = (
    <img
      src={fallbackSrc ?? src}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={(event) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        setLoaded(true);
        if (naturalWidth && naturalHeight) {
          onImageLoad?.({ width: naturalWidth, height: naturalHeight });
        }
      }}
      className={cn(
        'transition-[opacity,filter,transform] duration-700',
        loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm',
        className,
      )}
      {...props}
    />
  );

  if (!webpSrc) {
    return image;
  }

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      {image}
    </picture>
  );
});

OptimizedImage.displayName = 'OptimizedImage';
