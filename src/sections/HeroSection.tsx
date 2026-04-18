import { motion } from 'motion/react';
import { RevealText } from '../components/RevealText';
import { MagneticPill } from '../components/MagneticPill';

export const HeroSection = () => {
  return (
    <section className="min-h-[90vh] flex flex-col justify-center items-center text-center relative overflow-hidden px-6">
      {/* Isolated Atmospheric Depth */}
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
              staggerChildren: 0.15
            }
          }
        }}
        className="mb-12 z-10"
      >
        <h4 className="text-[10px] uppercase tracking-[0.5em] text-brand-muted mb-8 font-mono">Creative Direction // Prototype v.01</h4>
        <h1 className="text-fluid-xl leading-[0.8] font-black tracking-tighter uppercase mb-4">
          <RevealText>Maria</RevealText>
          <RevealText>Bordiuh<span className="text-brand-accent">.</span></RevealText>
        </h1>
      </motion.div>
      
      <div className="max-w-4xl mx-auto space-y-12 z-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-fluid-lg font-bold tracking-tight text-white leading-tight"
        >
          Art Director & AI Synthesis Specialist building high-fidelity digital narratives at the intersection of aesthetics and code.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap justify-center items-center gap-6"
        >
          <div className="flex gap-4">
            <MagneticPill className="px-6 py-2 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-brand-muted hover:border-brand-accent hover:text-white transition-all cursor-default font-mono">
              Archive // 2026
            </MagneticPill>
            <MagneticPill className="px-6 py-2 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-brand-muted hover:border-brand-accent hover:text-white transition-all cursor-default font-mono">
              Vibe Coding // Active
            </MagneticPill>
          </div>
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-24 z-10"
      >
        <div className="flex flex-col items-center gap-4 animate-bounce">
          <span className="text-[8px] uppercase tracking-[0.4em] text-brand-muted font-mono">Scroll to Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-brand-accent to-transparent" />
        </div>
      </motion.div>
    </section>
  );
};
