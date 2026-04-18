import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PageTransition } from '../components/PageTransition';
import { cn } from '../lib/utils';

// Helper for Firebase Storage srcSet (Simplified for now)
const getSrcSet = (url: string) => {
  if (!url.includes('firebasestorage')) return undefined;
  // This is a placeholder logic as Firebase Storage doesn't support dynamic resizing via query params out of the box without Extensions
  // But we'll follow the user's logic of appending width params if they have a custom proxy or specific setup
  return `${url}&w=400 400w, ${url}&w=800 800w, ${url}&w=1200 1200w`;
};

const ProjectMedia = ({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) => {
  const isVideo = src.endsWith('.mp4') || src.includes('video');
  
  if (isVideo) {
    return (
      <video 
        src={src} 
        autoPlay 
        muted 
        loop 
        playsInline 
        className={cn("w-full h-full object-cover", className)}
        style={style}
      />
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      srcSet={getSrcSet(src)}
      sizes="(max-width: 768px) 100vw, 80vw"
      width={1920}
      height={1080}
      loading="lazy"
      decoding="async"
      className={cn("w-full h-full object-cover", className)}
      style={style}
      referrerPolicy="no-referrer"
    />
  );
};

export const ProjectDetail = () => {
  const { id } = useParams();
  const { projects, loading } = useData();
  const project = projects.find(p => p.id === id);

  if (loading) return <div className="pt-40 px-6 text-center animate-pulse font-mono uppercase tracking-widest opacity-50">Syncing Archive...</div>;
  if (!project) return <div className="pt-40 px-6 text-center">Project not found</div>;

  const isArtDirection = project.pillar === 'Art Direction';

  if (isArtDirection) {
    return (
      <PageTransition>
        <article className="bg-brand-bg text-white selection:bg-brand-accent selection:text-brand-bg">
          {/* 1. HERO SECTION */}
          <section className="h-screen w-full relative overflow-hidden">
            <div className="grain-overlay" />
            <ProjectMedia src={project.videoUrl || project.thumbnail} alt={project.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent flex flex-col justify-end p-12 md:p-24">
              <div className="max-w-7xl mx-auto w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                >
                  <p className="text-xs md:text-sm uppercase tracking-[0.5em] mb-8 font-bold text-white/40 font-mono">
                    {project.client} <span className="mx-4">/</span> {project.globalContext}
                  </p>
                </motion.div>
                

                <h1 className="text-fluid-xl leading-[0.9] font-black tracking-tighter uppercase mb-8">
                  {project.creativeTension.split(" ").map((word, i) => (
                    <motion.span 
                      key={i}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 1.2, 
                        delay: i * 0.1, 
                        ease: [0.19, 1, 0.22, 1] 
                      }}
                      className={cn(
                        "inline-block mr-[0.2em] last:mr-0",
                        i % 3 === 0 ? "italic text-brand-accent" : ""
                      )}
                    >
                      {word}
                    </motion.span>
                  ))}
                </h1>

                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="h-[1px] bg-white/20 mb-12"
                />

                <div className="flex justify-between items-center">
                  <div className="flex gap-12">
                     <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 font-mono">Pillar</span>
                        <span className="text-xs uppercase font-bold tracking-widest">{project.pillar}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 font-mono">Category</span>
                        <span className="text-xs uppercase font-bold tracking-widest">{project.category}</span>
                     </div>
                  </div>
                  <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex flex-col items-center gap-4 group cursor-pointer"
                  >
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 group-hover:text-white transition-colors font-mono">Scroll to explore</span>
                    <div className="w-px h-12 bg-gradient-to-b from-brand-accent to-transparent" />
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          <div className="max-w-7xl mx-auto w-full">
            {/* 01. ROLE SECTION */}
            <section className="py-60 px-6 md:px-0 grid md:grid-cols-2 gap-20 items-end relative">
              <div className="order-2 md:order-1 relative">
                <span className="text-[15rem] md:text-[25rem] font-bold tracking-tighter opacity-5 leading-none absolute -top-1/2 -left-12 md:-left-24 select-none pointer-events-none">01</span>
                <h4 className="text-xs uppercase tracking-[0.4em] text-brand-muted mb-12 relative z-10 font-mono">Role & Ownership</h4>
                <div className="space-y-6 relative z-10">
                  {project.mariaRole?.map((role, i) => (
                    <motion.p 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-fluid-lg font-black tracking-tighter uppercase leading-none"
                    >
                      {role}<span className="text-brand-accent">.</span>
                    </motion.p>
                  ))}
                </div>
              </div>
              <div className="order-1 md:order-2 md:pb-2">
                <p className="text-xl text-brand-muted leading-relaxed max-w-sm italic">
                  Directing the narrative through visual tension and technical precision. Bridging the gap between the prompt and the pixel.
                </p>
              </div>
            </section>

            {/* 02. STRATEGIC NARRATIVE */}
            <section className="py-60 px-6 md:px-0 relative overflow-hidden">
               <span className="text-[15rem] md:text-[25rem] font-bold tracking-tighter opacity-5 leading-none absolute top-1/2 right-0 -translate-y-1/2 select-none pointer-events-none">02</span>
               <div className="max-w-3xl relative z-10">
                  <h4 className="text-xs uppercase tracking-[0.4em] text-brand-muted mb-12 font-mono">The Strategic Narrative</h4>
                  <h2 className="text-fluid-lg font-black tracking-tighter uppercase leading-[0.9] mb-12">AI-Accelerated<br/>Psychology.</h2>
                  <p className="text-xl md:text-2xl text-white/80 leading-relaxed mb-8 font-medium">
                     Using AI to deconstruct the dual-audience tension: identifying visual anchors that trigger childhood joy while satisfying a mother's need for "crafted" quality.
                  </p>
               </div>
            </section>

            {/* 03. THE BRIEF / PROBLEM */}
            <section className="py-60 px-6 md:px-0 relative">
              <span className="text-[15rem] md:text-[25rem] font-bold tracking-tighter opacity-5 leading-none absolute top-0 -left-12 md:-left-24 select-none pointer-events-none">03</span>
              <div className="grid md:grid-cols-2 gap-24 relative z-10 pt-20">
                <div>
                   <h4 className="text-xs uppercase tracking-[0.4em] text-brand-muted mb-12 font-mono">The Core Challenge</h4>
                   <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-12">
                     Playful for kids.<br/>Crafted for mothers.
                   </h2>
                </div>
                <div className="flex flex-col justify-end">
                   <p className="text-brand-muted text-lg md:text-xl leading-relaxed max-w-lg mb-8 italic">
                     {project.description}
                   </p>
                   <div className="flex gap-4">
                      {project.tools.map(tool => (
                        <span key={tool} className="text-[10px] font-mono border border-white/20 px-3 py-1 rounded-full text-white/40 uppercase tracking-widest">{tool}</span>
                      ))}
                   </div>
                </div>
              </div>
            </section>

            {/* 04. MOODBOARD SECTION */}
            <section className="py-40 bg-brand-bg overflow-hidden relative">
              <span className="text-[15rem] md:text-[25rem] font-bold tracking-tighter opacity-5 leading-none absolute top-40 -right-12 md:-right-24 select-none pointer-events-none text-right">04</span>
              <div className="flex justify-between items-end mb-24 px-6 md:px-0 relative z-10">
                <h4 className="text-xs uppercase tracking-[0.3em] text-brand-muted font-mono">Controlled Chaos / Direction</h4>
                <div className="w-1/2 h-[1px] bg-white/10" />
              </div>
              <div className="relative h-[600px] md:h-[1200px] z-10">
                {project.moodboardImages?.map((img, i) => {
                  const rotations = [-4, 3, -2, 4, -3];
                  const positions = [
                    { top: '5%', left: '0%' },
                    { top: '10%', right: '5%' },
                    { bottom: '15%', left: '10%' },
                    { bottom: '5%', right: '15%' },
                    { top: '40%', left: '40%', translate: '-50% -50%', scale: 1.2 }
                  ];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8, y: 50 }}
                      whileInView={{ opacity: 1, scale: positions[i % positions.length].scale || 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
                      style={{ 
                        position: 'absolute',
                        ...positions[i % positions.length],
                        zIndex: i === 4 ? 20 : i
                      }}
                      className="w-[250px] md:w-[500px] group"
                    >
                       <div className="grain-overlay" />
                       <ProjectMedia src={img} alt="Moodboard Item" className="grayscale hover:grayscale-0 transition-all duration-1000 shadow-2xl border border-white/5" style={{ transform: `rotate(${rotations[i % rotations.length]}deg)` }} />
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* 05. EXPLORATION PHASE */}
            <section className="py-60 px-6 md:px-0 relative">
              <span className="text-[15rem] md:text-[25rem] font-bold tracking-tighter opacity-5 leading-none absolute top-0 -left-12 md:-left-24 select-none pointer-events-none">05</span>
              <div className="grid md:grid-cols-[1fr_2fr] gap-20 items-start mb-24 relative z-10 pt-20">
                <div className="sticky top-40">
                  <h4 className="text-xs uppercase tracking-[0.3em] text-brand-muted mb-12 block font-mono">Recursive Search Arc</h4>
                  <h2 className="text-fluid-lg font-black tracking-tighter uppercase leading-none mb-8">Creative<br/>Search</h2>
                  <p className="text-brand-muted text-sm leading-relaxed max-w-xs italic">{project.explorationCaption}</p>
                </div>
                <div>
                  {project.explorationType === 'masonry' ? (
                    <div className="columns-1 md:columns-2 gap-8 space-y-8">
                      {project.explorationImages?.map((img, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          className="break-inside-avoid overflow-hidden shadow-xl rounded-2xl border border-white/5 relative"
                        >
                          <div className="grain-overlay" />
                          <ProjectMedia src={img} alt="Exploration" className="w-full grayscale hover:grayscale-0 transition-all duration-1000" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {project.explorationVideos?.map((vid, i) => (
                        <div key={i} className="aspect-[9/16] bg-white/5 overflow-hidden rounded-2xl relative border border-white/5">
                           <div className="grain-overlay" />
                           <video src={vid} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 06. HYBRIDIZATION LOGIC */}
            <section className="py-60 px-6 md:px-0 relative">
               <span className="text-[15rem] md:text-[25rem] font-bold tracking-tighter opacity-5 leading-none absolute top-0 -right-12 md:-right-24 select-none pointer-events-none text-right">06</span>
               <div className="grid md:grid-cols-2 gap-20 items-center relative z-10 pt-20">
                  <div className="glass p-12 rounded-[3.5rem] border border-white/10 order-2 md:order-1 relative overflow-hidden">
                     <div className="grain-overlay" />
                     <div className="grid grid-cols-2 gap-4 relative z-10">
                        {project.hybridizationImages?.map((img, i) => (
                          <div key={i} className={cn("aspect-square overflow-hidden rounded-2xl border border-white/5", i === 2 && "col-span-2 aspect-video")}>
                             <ProjectMedia src={img} alt="Hybridization" className="grayscale hover:grayscale-0 transition-all duration-1000" />
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="order-1 md:order-2">
                     <h4 className="text-xs uppercase tracking-[0.3em] text-brand-muted mb-12 font-mono">The Hybridization Logic</h4>
                     <h2 className="text-fluid-lg font-black tracking-tighter uppercase leading-[0.9] mb-8">Style mixing<br/>via Firefly.</h2>
                     <p className="text-brand-muted text-lg leading-relaxed max-w-sm italic">
                        {project.hybridizationCaption}
                     </p>
                  </div>
               </div>
            </section>

            {/* 07. THE DECISION MOMENT */}
            <section className="py-60 px-6 md:px-20 text-center relative overflow-hidden">
               <span className="text-[15rem] md:text-[30rem] font-bold tracking-tighter opacity-5 leading-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none">07</span>
              <h4 className="text-xs uppercase tracking-[0.3em] text-brand-muted mb-12 relative z-10 font-mono">The Tipping Point</h4>
              <blockquote className="text-fluid-lg font-black tracking-tighter leading-none uppercase relative z-10 max-w-5xl mx-auto italic">
                {project.decisionMomentCopy}
              </blockquote>
            </section>

            {/* 08. COLOR SYSTEM */}
            <section className="py-40 px-6 md:px-0 relative">
               <span className="text-[15rem] md:text-[25rem] font-bold tracking-tighter opacity-5 leading-none absolute top-0 -left-12 md:-left-24 select-none pointer-events-none">08</span>
              <div className="flex justify-between items-center mb-24 relative z-10 pt-20">
                <h4 className="text-xs uppercase tracking-[0.3em] text-brand-muted font-mono">The Chromatic Logic</h4>
                <span className="font-mono text-[10px] opacity-30 tracking-widest">HSV // RGB // HEX</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 h-[500px] md:h-[700px] border border-white/5 bg-white/5 overflow-hidden rounded-[3rem] relative z-10 shadow-2xl">
                {project.colorSystem?.map((color, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ flexGrow: 0 }}
                    whileInView={{ flexGrow: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="relative group overflow-hidden"
                    style={{ backgroundColor: color.hex }}
                  >
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                      <p className="font-mono text-xs uppercase tracking-widest mb-2 text-white">{color.hex}</p>
                      <h5 className="text-2xl font-bold uppercase tracking-tighter text-white leading-none italic">{color.emotion}</h5>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* 09. ANIMATIC / PRODUCTION */}
            <section className="py-40 px-6 md:px-0 relative hidden md:block">
               <span className="text-[15rem] md:text-[25rem] font-bold tracking-tighter opacity-5 leading-none absolute top-0 -right-12 md:-right-24 select-none pointer-events-none text-right">09</span>
              <h4 className="text-xs uppercase tracking-[0.3em] text-brand-muted mb-12 relative z-10 font-mono">Execution / Coloring Pages</h4>
              <div className="aspect-video bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 relative z-10 rounded-[3rem] shadow-2xl">
                <div className="grain-overlay" />
                <video src={project.animaticVideoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              </div>
              <p className="mt-6 text-brand-muted text-sm uppercase tracking-widest relative z-10 font-mono italic">{project.animaticCaption}</p>
            </section>
          </div>

          {/* 10. OUTCOME */}
          <section className="py-40 relative">
             <span className="text-[15rem] md:text-[30rem] font-bold tracking-tighter opacity-5 leading-none absolute bottom-0 -left-12 md:-left-24 select-none pointer-events-none">10</span>
            <div className="flex flex-col">
              {project.outcomeVisuals?.map((img, i) => (
                <div key={i} className="w-full h-[70vh] md:h-screen overflow-hidden sticky top-0">
                  <motion.div 
                    initial={{ scale: 1.1 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 2 }}
                    className="w-full h-full"
                  >
                     <ProjectMedia src={img} alt="Final Outcome" />
                  </motion.div>
                </div>
              ))}
            </div>
            <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-0 py-40 bg-brand-bg/80 backdrop-blur-3xl mt-[-20vh] border border-white/5 rounded-[4rem] shadow-2xl">
              <div className="max-w-4xl mx-auto text-center">
                <span className="text-brand-accent text-fluid-xl font-black block opacity-10 leading-none mb-[-2rem] select-none uppercase tracking-tighter">FIN</span>
                <p className="text-fluid-lg font-black uppercase tracking-[0.2em] leading-tight text-white relative z-20 italic">
                  {project.outcomeResultCopy}
                </p>
              </div>
            </div>
          </section>

          {/* Navigation Footer */}
          <section className="py-40 border-t border-white/10 px-6">
            <div className="max-w-7xl mx-auto flex justify-between items-center transition-all">
              <Link to="/work" className="text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity font-mono">← Back to catalogue</Link>
              <Link to="/work" className="text-right group">
                <p className="text-xs uppercase tracking-widest text-brand-muted mb-4 italic font-mono">Index</p>
                <h3 className="text-4xl font-black uppercase tracking-tighter group-hover:text-brand-accent transition-colors">View All Work</h3>
              </Link>
            </div>
          </section>
        </article>
      </PageTransition>
    );
  }

  // Simplified Layout for other pillars
  return (
    <PageTransition>
      <div className="pt-40 px-6 pb-32 max-w-7xl mx-auto text-center">
        <Link to="/work" className="text-xs uppercase tracking-widest text-brand-muted hover:text-white transition-colors mb-24 inline-block font-mono">← Back to catalogue</Link>
        <header className="mb-32">
          <span className="text-xs uppercase tracking-widest text-brand-accent mb-6 block font-mono">{project.pillar}</span>
          <h1 className="text-fluid-xl font-black tracking-tighter uppercase mb-12 leading-none">{project.title}</h1>
          <p className="text-xl md:text-3xl text-brand-muted max-w-3xl mx-auto leading-relaxed italic">{project.description}</p>
        </header>

        <div className="space-y-32">
          {project.videoUrl && (
            <div className="aspect-video bg-white/5 rounded-[3rem] overflow-hidden glass border border-white/10 max-w-5xl mx-auto shadow-2xl relative">
              <div className="grain-overlay" />
              <video src={project.videoUrl} controls className="w-full h-full relative z-10" />
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-12">
            {project.images.map((img, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/10 relative group shadow-xl"
              >
                <div className="grain-overlay" />
                <ProjectMedia src={img} alt="Work" className="grayscale hover:grayscale-0 transition-all duration-700" />
              </motion.div>
            ))}
          </div>
        </div>

        <section className="py-40 border-t border-white/10 mt-40">
           <Link to="/work" className="group">
              <p className="text-xs uppercase tracking-widest text-brand-muted mb-4 italic font-mono">Archive</p>
              <h3 className="text-4xl font-black uppercase tracking-tighter group-hover:text-brand-accent transition-colors">Return to Index</h3>
           </Link>
        </section>
      </div>
    </PageTransition>
  );
};
