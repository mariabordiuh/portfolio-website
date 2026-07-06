import { useState } from 'react';
import { MOTION_CLIPS } from '../data';
import { type Copy } from '../i18n';

type MotionShowcaseProps = {
  tx: (copy: Copy) => string;
  reducedMotion: boolean;
};

const MotionClip = ({ id, caption, reducedMotion }: { id: string; caption: string; reducedMotion: boolean }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <figure className="ai-motion__item">
        <div aria-hidden="true" className="ai-placeholder ai-placeholder--motion">
          <span className="ai-placeholder__label">{caption}</span>
        </div>
        <figcaption className="ai-motion__caption">{caption}</figcaption>
      </figure>
    );
  }

  return (
    <figure className="ai-motion__item">
      <video
        className="ai-motion__video"
        src={`/ai/motion/loop-${id}.mp4`}
        poster={`/ai/motion/loop-${id}-poster.jpg`}
        muted
        loop
        playsInline
        autoPlay={!reducedMotion}
        controls={reducedMotion}
        preload="metadata"
        aria-label={caption}
        onError={() => setFailed(true)}
      />
      <figcaption className="ai-motion__caption">{caption}</figcaption>
    </figure>
  );
};

export const MotionShowcase = ({ tx, reducedMotion }: MotionShowcaseProps) => (
  <div className="ai-motion__grid">
    {MOTION_CLIPS.map((clip) => (
      <MotionClip key={clip.id} id={clip.id} caption={tx(clip.caption)} reducedMotion={reducedMotion} />
    ))}
  </div>
);
