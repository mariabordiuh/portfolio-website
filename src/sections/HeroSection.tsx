import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useData } from '../context/DataContext';
import { RevealText } from '../components/RevealText';
import { DEFAULT_HOME_HERO_SETTINGS } from '../utils/home-hero';

export const HeroSection = () => {
  const { homeHero, homeHeroReady } = useData();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const desktopImageSrc =
    homeHero.desktopImage || homeHero.posterImage || DEFAULT_HOME_HERO_SETTINGS.desktopImage;
  const mobileImageSrc = homeHero.mobileImage || homeHero.posterImage || desktopImageSrc;
  const posterImageSrc = homeHero.posterImage || mobileImageSrc || desktopImageSrc;
  const desktopVideoSrc = homeHero.desktopVideo || homeHero.mobileVideo || '';
  const mobileVideoSrc = homeHero.mobileVideo || homeHero.desktopVideo || '';
  const shouldRenderVideo = homeHero.mode === 'video' && Boolean(desktopVideoSrc || mobileVideoSrc);

  useEffect(() => {
    setIsVideoPlaying(false);
  }, [desktopVideoSrc, homeHero.mode, mobileVideoSrc, posterImageSrc]);

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0 bg-brand-bg">
        {homeHeroReady ? shouldRenderVideo ? (
          <div className="relative h-full w-full">
            {posterImageSrc ? (
              <img
                src={posterImageSrc}
                alt=""
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className={`absolute inset-0 z-10 h-full w-full object-cover object-[70%_50%] md:object-center transition-opacity duration-[1500ms] ${
                  isVideoPlaying ? 'opacity-0' : 'opacity-100'
                } ${homeHero.flipPosterHorizontal ? '-scale-x-100' : ''}`}
                aria-hidden="true"
              />
            ) : null}
            <video
              key={mobileVideoSrc}
              src={mobileVideoSrc}
              className={`relative z-0 block h-full w-full object-cover object-[70%_50%] md:hidden ${homeHero.flipHorizontal ? '-scale-x-100' : ''}`}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onPlay={() => setIsVideoPlaying(true)}
              onPlaying={() => setIsVideoPlaying(true)}
              aria-hidden="true"
            />
            <video
              key={desktopVideoSrc}
              src={desktopVideoSrc}
              className={`relative z-0 hidden h-full w-full object-cover object-center md:block ${homeHero.flipHorizontal ? '-scale-x-100' : ''}`}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onPlay={() => setIsVideoPlaying(true)}
              onPlaying={() => setIsVideoPlaying(true)}
              aria-hidden="true"
            />
          </div>
        ) : (
          <picture>
            <source media="(max-width: 767px)" srcSet={mobileImageSrc} />
            <img
              src={desktopImageSrc}
              alt=""
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className={`h-full w-full object-cover object-[70%_50%] md:object-center ${homeHero.flipHorizontal ? '-scale-x-100' : ''}`}
              aria-hidden="true"
            />
          </picture>
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.96)_0%,rgba(5,5,5,0.78)_28%,rgba(5,5,5,0.32)_52%,rgba(5,5,5,0.08)_72%,rgba(5,5,5,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.24)_0%,rgba(5,5,5,0)_26%,rgba(5,5,5,0.12)_60%,rgba(5,5,5,0.72)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1380px] items-end px-4 pb-10 pt-24 sm:px-6 sm:pb-14 sm:pt-28 md:px-8 md:pb-18 md:pt-36">
        <div className="w-full max-w-[760px]">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15,
                },
              },
            }}
            className="mb-5 sm:mb-6 md:mb-8"
          >
            <h1
              className="mb-4 pb-[0.1em] text-left font-black leading-[0.84] tracking-[-0.03em] text-white"
              style={{ fontSize: 'clamp(2.35rem, 8vw, 6.2rem)' }}
            >
              <RevealText>Art direction,</RevealText>
              <RevealText>motion, and</RevealText>
              <RevealText>AI-led image systems<span className="text-brand-accent">.</span></RevealText>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[34rem] text-left text-[clamp(0.92rem,0.68rem+0.8vw,1.1rem)] font-medium leading-relaxed text-white/72"
          >
            Maria Bordiuh. Hamburg-based Art Director and AI Creative Director, working across CGI,
            generative image, motion, and brand systems.
          </motion.p>
        </div>
      </div>
    </section>
  );
};
