import { motion } from 'motion/react';

export const CatHero = () => {
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

  const wordVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

  return (
    <section className="min-h-[100svh] w-full bg-[#0a0a0a] flex items-center justify-center p-6 md:p-12 overflow-hidden">
      <div className="max-w-[1380px] w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* Left Column: Text */}
        <div className="flex flex-col justify-center max-w-2xl">
          <motion.h1
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-white font-sans font-bold text-6xl md:text-7xl leading-[1.1] mb-8 flex flex-wrap gap-x-4 gap-y-2"
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                variants={wordVariants}
                className={word === "&" ? "text-[#ff9ebb]" : ""}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.9, ease: "easeOut" }}
            className="text-white/80 font-['DM_Sans'] font-light text-lg md:text-xl leading-relaxed max-w-[34rem]"
          >
            i’m an art director blending an advertising background with a love for ai,
            motion, and visual craft. currently based in hamburg, vibecoding and
            building creative systems.
          </motion.p>
        </div>

        {/* Right Column: 3D Image */}
        <div className="flex justify-center items-center relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#ff9ebb]/20 to-transparent blur-3xl rounded-full" />
          <motion.img
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, type: "spring", stiffness: 60 }}
            src="/media/cat.png"
            alt="3D Fluffy Cat"
            className="w-full max-w-[500px] object-contain rounded-3xl shadow-2xl relative z-10"
          />
        </div>
      </div>
    </section>
  );
};
