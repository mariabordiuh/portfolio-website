import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { RevealText } from '../components/RevealText';

export const HeroSection = () => {
  return (
    <section className="min-h-[90vh] flex flex-col justify-center items-center text-center relative overflow-hidden px-6">
      {/* Atmospheric depth */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -right-1/4 w-[80vw] h-[80vw] border border-brand-accent/5 rounded-full blur-[120px] opacity-[0.06]" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[60vw] h-[60vw] border border-white/5 rounded-full blur-[100px] opacity-[0.04]" />
      </div>

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
        className="mb-12 z-10"
      >
        <h1
          className="font-black tracking-tighter uppercase mb-4 leading-[0.9]"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
        >
          <RevealText>Art direction, motion,</RevealText>
          <RevealText>and AI-led image systems<span className="text-brand-accent">.</span></RevealText>
        </h1>
      </motion.div>

      <div className="max-w-3xl mx-auto space-y-12 z-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-fluid-base font-medium tracking-tight text-white/70 leading-relaxed"
        >
          Maria Bordiuh. Hamburg-based Art Director and AI Creative Director, working across CGI, generative image, motion, and brand systems. Selected work below.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex flex-wrap justify-center items-center gap-4"
        >
          <Link
            to="/work"
            className="px-8 py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-full hover:bg-brand-accent transition-all"
          >
            View work
          </Link>
          <Link
            to="/about"
            className="px-8 py-4 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-full hover:bg-white hover:text-black transition-all"
          >
            About
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="mt-24 z-10"
      >
        <div className="flex flex-col items-center gap-4 animate-bounce">
          <span className="text-[8px] uppercase tracking-[0.4em] text-brand-muted font-mono">Scroll to explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-brand-accent to-transparent" />
        </div>
      </motion.div>
    </section>
  );
};
