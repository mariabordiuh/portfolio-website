import { useEffect, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { useData } from '../context/DataContext';

export const CatHero = () => {
  const { homeHero, homeHeroReady } = useData();
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const headline = "Visuals, motion & systems.";
  const words = headline.split(" ");
  const desktopVideoSrc = homeHero.desktopVideo || homeHero.mobileVideo || '';
  const mobileVideoSrc = homeHero.mobileVideo || homeHero.desktopVideo || '';
  const desktopImageSrc = homeHero.desktopImage || homeHero.posterImage || homeHero.mobileImage || '';
  const mobileImageSrc = homeHero.mobileImage || homeHero.posterImage || desktopImageSrc;
  const posterImageSrc = homeHero.posterImage || mobileImageSrc || desktopImageSrc;
  const heroImageSrc = desktopImageSrc || mobileImageSrc || posterImageSrc;
  const hasHeroVideo =
    homeHeroReady && homeHero.mode === 'video' && Boolean(desktopVideoSrc || mobileVideoSrc) && !videoFailed;
  const hasHeroImage = homeHeroReady && (!hasHeroVideo || videoFailed) && Boolean(heroImageSrc || posterImageSrc);

  useEffect(() => {
    setMediaLoaded(false);
    setVideoFailed(false);
  }, [desktopImageSrc, desktopVideoSrc, homeHero.mode, mobileImageSrc, mobileVideoSrc, posterImageSrc]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const wordVariants: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

  const mediaPositionClass = 'object-[62%_50%] sm:object-[64%_50%] md:object-[60%_50%]';

  return (
    <section className="relative min-h-[100svh] w-full bg-[#0a0a0a] overflow-hidden">
      
      {/* Background Full-Screen Dynamic Media */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {homeHeroReady && posterImageSrc ? (
          <div
            className={`absolute inset-0 z-0 overflow-hidden ${homeHero.flipPosterHorizontal ? '-scale-x-100' : ''}`}
            aria-hidden="true"
          >
            <picture className="block h-full w-full">
              <source media="(max-width: 767px)" srcSet={mobileImageSrc} />
              <img
                src={desktopImageSrc || posterImageSrc}
                alt=""
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className={`block h-full w-full object-cover ${mediaPositionClass} opacity-100 transition-opacity duration-[1200ms] ${mediaLoaded && hasHeroVideo ? 'opacity-0' : 'opacity-100'}`}
              />
            </picture>
          </div>
        ) : null}
        {hasHeroVideo ? (
          <div className="relative h-full w-full">
            <motion.video
              initial={{ opacity: 0 }}
              animate={{ opacity: mediaLoaded ? 1 : 0 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              src={mobileVideoSrc}
              poster={mobileImageSrc || posterImageSrc}
              className={`relative z-10 h-full w-full bg-black object-cover ${mediaPositionClass} md:hidden ${homeHero.flipHorizontal ? '-scale-x-100' : ''}`}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onCanPlay={() => setMediaLoaded(true)}
              onPlaying={() => setMediaLoaded(true)}
              onError={() => setVideoFailed(true)}
              aria-hidden="true"
            />
            <motion.video
              initial={{ opacity: 0 }}
              animate={{ opacity: mediaLoaded ? 1 : 0 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              src={desktopVideoSrc}
              poster={desktopImageSrc || posterImageSrc}
              className={`relative z-10 hidden h-full w-full bg-black object-cover ${mediaPositionClass} md:block ${homeHero.flipHorizontal ? '-scale-x-100' : ''}`}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onCanPlay={() => setMediaLoaded(true)}
              onPlaying={() => setMediaLoaded(true)}
              onError={() => setVideoFailed(true)}
              aria-hidden="true"
            />
          </div>
        ) : hasHeroImage ? (
          <motion.picture
            initial={{ opacity: 0 }}
            animate={{ opacity: mediaLoaded ? 1 : 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="block h-full w-full"
          >
            <source media="(max-width: 767px)" srcSet={mobileImageSrc} />
            <img
              src={desktopImageSrc}
              alt="Hero Media"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className={`block h-full w-full object-cover ${mediaPositionClass} ${homeHero.flipHorizontal ? '-scale-x-100' : ''}`}
              onLoad={() => setMediaLoaded(true)}
            />
          </motion.picture>
        ) : null}
        
        {/* Gradients optimized to shadow only the text area (Bottom + Left) leaving the rest completely exposed */}
        <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-[90%] md:w-[60%] bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Foreground Typography */}
      <div className="relative z-10 w-full min-h-[100svh] flex items-end px-6 pb-20 pt-32 md:px-12 md:pb-32 max-w-[1380px] mx-auto">
        <div className="flex flex-col justify-end max-w-3xl">
          <motion.h1
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-white font-mono font-bold tracking-tight text-5xl md:text-7xl leading-[1.1] mb-8 flex flex-wrap gap-x-4 gap-y-2"
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                variants={wordVariants}
                className={word === "&" ? "text-brand-accent tracking-normal" : ""}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.9, ease: "easeOut" }}
            className="text-white/80 font-sans font-light text-[clamp(1rem,0.65rem+0.9vw,1.3rem)] leading-relaxed max-w-[34rem]"
          >
            i’m an art director blending an advertising background with a love for ai,
            motion, and visual craft. currently based in hamburg, vibecoding and
            building creative systems.
          </motion.p>
        </div>
      </div>
    </section>
  );
};
