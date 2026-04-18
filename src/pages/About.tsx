import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Linkedin, Mail, Cat } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { RevealText } from '../components/RevealText';

export const About = () => {
  const [catAnimating, setCatAnimating] = useState(false);

  const handleCatClick = () => {
    new Audio('/sounds/meow.mp3').play().catch(() => {});
    setCatAnimating(true);
  };

  return (
  <PageTransition>
    <div className="pt-40 px-6 pb-32 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 gap-20 items-start">
        <div className="sticky top-40 z-10">
          <div className="aspect-[3/4] bg-white/5 rounded-3xl overflow-hidden relative mb-8 shadow-2xl">
            <div className="grain-overlay" />
            {/* TODO: Maria to add real photo — drop an <img> here replacing this div */}
            <div className="w-full h-full bg-white/[0.04]" />
            <div className="absolute inset-0 border-[20px] border-brand-bg/50 pointer-events-none" />
            <motion.button
              onClick={handleCatClick}
              animate={catAnimating ? { scale: [1, 1.4, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              onAnimationComplete={() => setCatAnimating(false)}
              className="absolute bottom-2 right-2 cursor-default z-10 text-black opacity-30"
              aria-hidden="true"
            >
              <Cat size={20} />
            </motion.button>
          </div>
          <div className="flex gap-4">
            <a
              href="https://linkedin.com/in/mariabordiuh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 p-4 glass rounded-2xl flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all group"
            >
              <Linkedin size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest font-black">LinkedIn</span>
            </a>
            <a
              href="mailto:mariabordiuh@gmail.com"
              className="flex-1 p-4 glass rounded-2xl flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all group"
            >
              <Mail size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest font-black">Email</span>
            </a>
          </div>
        </div>
        
        <div className="relative">
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
            className="mb-12"
          >
            <h4 className="text-[10px] uppercase tracking-[0.5em] text-brand-muted mb-8 font-mono">Archive // About // 01</h4>
            <h1 className="text-fluid-xl font-black tracking-tighter uppercase mb-2 leading-[0.8]">
              <RevealText>Art Director</RevealText>
              <RevealText>& Design Engineer<span className="text-brand-accent">.</span></RevealText>
            </h1>
          </motion.div>
          
          <div className="space-y-8 text-fluid-base text-brand-muted leading-relaxed font-medium">
            <p>
              I'm an Art Director and AI Creative Director based in Hamburg. I lead visual systems from concept to delivery — character design, brand worlds, campaign imagery, motion — and increasingly build those systems using a stack that mixes traditional craft with AI as a production layer, not a novelty.
            </p>
            <p>
              I work across pharma (Novo Nordisk), FMCG (Morshynska, Nestlé), fashion tech (Fashn.ai integrations), and independent creative projects. My practice spans Houdini for CGI, Midjourney and Firefly for generative image exploration, Make.com for creative automation, and a model-routing stack that sits across Claude, Gemini, and DeepSeek. I speak German and English fluently; Ukrainian is my first language.
            </p>
            <p>
              My role is usually vision and direction — the story, the visual logic, the decisions. I coordinate specialists for execution and treat AI the same way: another skilled collaborator whose output needs editing, not worship.
            </p>
          </div>

          <div className="mt-24 grid grid-cols-2 gap-12 border-t border-white/5 pt-12">
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-white mb-6 font-bold">Expertise</h3>
              <ul className="space-y-4 text-xs font-mono text-brand-muted">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-brand-accent rounded-full" /> Art Direction</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-brand-accent rounded-full" /> Creative Strategy</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-brand-accent rounded-full" /> AI Art & Prompting</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-brand-accent rounded-full" /> Design Engineering</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-brand-accent rounded-full" /> Motion Design</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-white mb-6 font-bold">Toolchain</h3>
              <ul className="space-y-4 text-xs font-mono text-brand-muted">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-brand-accent rounded-full" /> Midjourney</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-brand-accent rounded-full" /> Adobe Firefly</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-brand-accent rounded-full" /> Runway Gen-2</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-brand-accent rounded-full" /> React / Vite</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-brand-accent rounded-full" /> Tailwind CSS</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageTransition>
  );
};
