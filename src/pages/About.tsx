import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Linkedin, Mail, Cat } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { RevealText } from '../components/RevealText';

export const About = () => (
  <PageTransition>
    <div className="pt-40 px-6 pb-32 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 gap-20 items-start">
        <div className="sticky top-40 z-10">
          <div className="aspect-[3/4] bg-white/5 rounded-3xl overflow-hidden relative mb-8 shadow-2xl">
            <div className="grain-overlay" />
            <img 
              src="https://picsum.photos/seed/profile/800/1200" 
              alt="Profile" 
              width={800}
              height={1200}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 scale-105 hover:scale-100"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 border-[20px] border-brand-bg/50 pointer-events-none" />
            <Link to="/admin" className="opacity-0 hover:opacity-10 transition-opacity absolute bottom-2 right-2 cursor-default z-10">
              <Cat size={12} />
            </Link>
          </div>
          <div className="flex gap-4">
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 p-4 glass rounded-2xl flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all group"
            >
              <Linkedin size={18} className="group-hover:scale-110 transition-transform" /> 
              <span className="text-[10px] uppercase tracking-widest font-black">LinkedIn</span>
            </a>
            <a 
              href="mailto:hello@studio.com" 
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
              I am a creative director with over a decade of experience in visual storytelling and digital innovation. My work sits at the intersection of high-end design and emerging technologies.
            </p>
            <p>
              I believe in "Vibe Coding" — the art of creating digital experiences that feel as good as they look. Whether it's a global campaign or a niche AI experiment, my goal is to push the boundaries of what's possible.
            </p>
            <p>
              I'm a nerd at heart, obsessed with prompt engineering, synthetic media, and the future of human-computer interaction. I work well with teams but am equally comfortable building solo from my home studio.
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
