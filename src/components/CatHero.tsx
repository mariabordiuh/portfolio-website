import { motion, type Variants } from 'motion/react';
import { useData } from '../context/DataContext';

export const CatHero = () => {
  const { homeHero } = useData();
  const headline = "Visuals, motion & systems.";
  const words = headline.split(" ");

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

  return (
    <section className="relative min-h-[100svh] w-full bg-[#0a0a0a] overflow-hidden">
      
      {/* Background Full-Screen Dynamic Media */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {homeHero.mode === 'video' && (homeHero.desktopVideo || homeHero.mobileVideo) ? (
          <motion.video
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={homeHero.desktopVideo || homeHero.mobileVideo}
            className={`w-full h-full object-cover ${homeHero.flipHorizontal ? '-scale-x-100' : ''}`}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={homeHero.desktopImage || homeHero.posterImage || homeHero.mobileImage}
            alt="Hero Media"
            className={`w-full h-full object-cover ${homeHero.flipHorizontal ? '-scale-x-100' : ''}`}
          />
        )}
        
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
