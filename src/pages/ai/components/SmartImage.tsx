import { useState } from 'react';

type SmartImageProps = {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  label?: string;
};

/**
 * Renders an image from /public; if the file doesn't exist yet, falls back to
 * the styled ai-placeholder frame so Maria can drop assets in by filename
 * without code changes (see public/ai/README.md).
 */
export const SmartImage = ({ src, alt, className = '', placeholderClassName = '', label }: SmartImageProps) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div aria-hidden="true" className={`ai-placeholder ${placeholderClassName}`.trim()}>
        {label ? <span className="ai-placeholder__label">{label}</span> : null}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
};
