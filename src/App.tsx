import { BrowserRouter as Router, Routes, Route, Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef, createContext, useContext, useMemo } from 'react';
import { Cat, Menu, X, ArrowUpRight, Github, Linkedin, Mail, Play, ExternalLink, Code, Info, Calendar, Users, CheckCircle2, AlertCircle, Filter, Tag as TagIcon, Plus, Trash2, Edit3, Image as ImageIcon, Save, LogOut, Compass, Zap, Cpu, Search, Check, ArrowRight, Rocket } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Project, Video, LabItem, ProjectPillar, GalleryImage } from './types';
import { projects as mockProjects, videos as mockVideos, labItems as mockLabItems } from './data';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { collection, onSnapshot, query, getDocFromServer, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, uploadBytes, uploadString } from 'firebase/storage';
import { storage } from './firebase';

// --- Firebase Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Error Boundary ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error) message = parsed.error;
      } catch (e) {
        message = this.state.error?.message || message;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-brand-bg text-white">
          <div className="max-w-md w-full p-8 glass rounded-3xl text-center">
            <AlertCircle className="mx-auto mb-6 text-brand-accent" size={48} />
            <h2 className="text-2xl font-bold mb-4">Application Error</h2>
            <p className="text-brand-muted mb-8">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-brand-accent text-brand-bg font-bold uppercase tracking-widest rounded-full"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Auth Context ---

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false });

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // Simple admin check for UI purposes - rules enforce it properly
        const adminEmail = "helloveo333@gmail.com";
        setIsAdmin(user.email?.toLowerCase().trim() === adminEmail.toLowerCase().trim());
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Data Context ---

interface DataContextType {
  projects: Project[];
  videos: Video[];
  labItems: LabItem[];
  galleryImages: GalleryImage[];
  loading: boolean;
}

const DataContext = createContext<DataContextType>({ projects: [], videos: [], labItems: [], galleryImages: [], loading: true });

const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [videos, setVideos] = useState<Video[]>(mockVideos);
  const [labItems, setLabItems] = useState<LabItem[]>(mockLabItems);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... test connection logic exists ...
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      if (!snapshot.empty) {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));

    const unsubVideos = onSnapshot(collection(db, 'videos'), (snapshot) => {
      if (!snapshot.empty) {
        setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video)));
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'videos'));

    const unsubLab = onSnapshot(collection(db, 'labItems'), (snapshot) => {
      if (!snapshot.empty) {
        setLabItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LabItem)));
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'labItems'));

    const unsubGallery = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      if (!snapshot.empty) {
        setGalleryImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage)));
      }
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'gallery'));

    return () => {
      unsubProjects();
      unsubVideos();
      unsubLab();
      unsubGallery();
    };
  }, []);

  return (
    <DataContext.Provider value={{ projects, videos, labItems, galleryImages, loading }}>
      <SpotlightCursor />
      {children}
    </DataContext.Provider>
  );
};

const SpotlightCursor = () => {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const updatePosition = () => {
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${mouseRef.current.x - 150}px, ${mouseRef.current.y - 150}px, 0)`;
      }
      requestRef.current = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove);
    requestRef.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div 
      ref={spotlightRef}
      id="spotlight"
      className="fixed top-0 left-0 w-[300px] h-[300px] rounded-full pointer-events-none z-[9999] opacity-[0.15] blur-[40px]"
      style={{
        background: 'radial-gradient(circle, var(--accent-color) 0%, transparent 70%)',
        willChange: 'transform'
      }}
    />
  );
};

const useMagnetic = () => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      
      // Cap at 15px
      const moveX = Math.max(-15, Math.min(15, distanceX * 0.3));
      const moveY = Math.max(-15, Math.min(15, distanceY * 0.3));
      
      el.style.transform = `translate(${moveX}px, ${moveY}px)`;
    };

    const handleMouseLeave = () => {
      el.style.transform = 'translate(0, 0)';
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return ref;
};

// --- Components ---

const MagneticPill = ({ children, className }: { children: React.ReactNode, className: string }) => {
  const ref = useMagnetic();
  return (
    <div ref={ref} className={cn("magnetic-btn", className)}>
      {children}
    </div>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const location = useLocation();

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount + 1 >= 5) {
      window.location.href = '/admin';
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setClickCount(0), 2000);
    return () => clearTimeout(timer);
  }, [clickCount]);

  const navLinks = [
    { name: 'Work', path: '/work' },
    { name: 'Lab', path: '/lab' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-8 flex justify-between items-center mix-blend-difference">
      <Link 
        to="/" 
        onClick={handleLogoClick}
        className="text-2xl font-bold tracking-tighter hover:opacity-70 transition-opacity"
      >
        STUDIO<span className="text-brand-accent">.</span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex gap-8 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "text-sm uppercase tracking-widest hover:text-brand-accent transition-colors",
              location.pathname.startsWith(link.path) ? "text-brand-accent" : "text-white"
            )}
          >
            {link.name}
          </Link>
        ))}
        <Link 
          ref={useMagnetic()}
          to="/about"
          className="magnetic-btn px-5 py-2 border border-brand-accent/20 rounded-full text-xs uppercase tracking-widest hover:bg-brand-accent hover:text-brand-bg transition-all"
        >
          Let's Build
        </Link>
      </div>

      {/* Mobile Toggle */}
      <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-brand-bg flex flex-col items-center justify-center gap-8 z-40"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="text-4xl font-bold tracking-tighter hover:text-brand-accent transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Link 
              ref={useMagnetic()}
              to="/about"
              onClick={() => setIsOpen(false)}
              className="magnetic-btn mt-4 px-8 py-3 border border-brand-accent/20 rounded-full text-sm uppercase tracking-widest hover:bg-brand-accent hover:text-brand-bg transition-all"
            >
              Let's Build
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const V60EasterEgg = () => {
  return (
    <div className="v60-wrapper flex items-center gap-10 group cursor-default select-none">
      <span className="v60-text text-[12px] uppercase tracking-[1px] text-white/50 opacity-0 -translate-x-[10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700 pointer-events-none text-right whitespace-nowrap leading-relaxed font-sans">
        COFFEE'S READY. LET'S WORK. <br />
        <span className="text-brand-accent">hello@studio.io</span>
      </span>
      
      <div className="relative w-[180px] h-[240px]">
        <svg viewBox="0 0 100 120" fill="none" className="w-full h-full overflow-visible">
          {/* Organic Steam */}
          <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            {[0, 1, 2].map((i) => (
              <motion.path
                key={i}
                d={`M ${45 + i * 5} 25 Q ${50 + i * 5} ${15 - i * 5} ${45 + i * 5} ${5 - i * 5}`}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
                strokeLinecap="round"
                animate={{
                  d: [
                    `M ${45 + i * 5} 25 Q ${50 + i * 5} ${15 - i * 5} ${45 + i * 5} ${5 - i * 5}`,
                    `M ${48 + i * 5} 25 Q ${45 + i * 5} ${12 - i * 5} ${50 + i * 5} ${2 - i * 5}`,
                    `M ${45 + i * 5} 25 Q ${50 + i * 5} ${15 - i * 5} ${45 + i * 5} ${5 - i * 5}`,
                  ],
                  opacity: [0.1, 0.4, 0.1],
                  y: [0, -15, -30],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.8,
                }}
              />
            ))}
          </g>

          {/* Trigger Dot */}
          <motion.circle 
            cx="50" 
            cy="30" 
            r="3" 
            className="fill-brand-accent"
            whileHover={{ scale: 1.5 }}
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Falling Drip (Organic Drip Physics) */}
          <motion.circle
            cx="50"
            cy="70"
            r="1.5"
            className="fill-brand-accent opacity-0 group-hover:opacity-100"
            animate={{
              y: [0, 35],
              opacity: [0, 1, 0],
              scale: [1, 1.2, 0.8]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.5
            }}
          />

          {/* Coffee Liquid (Behind) with Ripple Effect */}
          <g className="coffee-liquid-group">
            <motion.path
              d="M 36 106 Q 50 106 64 106 L 64 106 Q 50 106 36 106 Z"
              fill="var(--accent-color)"
              className="coffee-liquid-fill"
              animate={{
                d: [
                  "M 36 106 Q 50 104 64 106 L 64 106 Q 50 106 36 106 Z",
                  "M 36 106 Q 50 108 64 106 L 64 106 Q 50 106 36 106 Z",
                  "M 36 106 Q 50 104 64 106 L 64 106 Q 50 106 36 106 Z",
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Main Liquid Body */}
            <motion.rect 
              x="36" y="90" width="28" height="16" rx="2" 
              fill="var(--accent-color)" 
              className="coffee-liquid-fill"
            />
          </g>

          {/* Water Stream (Behind) */}
          <motion.line 
            x1="50" y1="70" 
            x2="50" y2="105" 
            stroke="var(--accent-color)" 
            strokeWidth="3" 
            className="water-stream-line"
            initial={{ strokeDashoffset: 35 }}
            whileInView={{ strokeDashoffset: 0 }}
          />
          
          {/* V60 Dripper (Tactile Settle) */}
          <motion.path 
            d="M 25 40 L 75 40 M 30 40 L 45 70 L 55 70 L 70 40" 
            fill="none" 
            stroke="rgba(255,255,255,0.4)" 
            strokeWidth="1.5" 
            className="group-hover:stroke-white/60 transition-colors duration-700"
            whileHover={{ y: 2 }}
          />
          
          {/* Glass Mug with Zero-Overlap Handle */}
          <g>
            <path 
              d="M 35 75 Q 35 72 38 72 L 62 72 Q 65 72 65 75 L 65 80 C 75 80 75 95 65 95 L 65 104 Q 65 107 62 107 L 38 107 Q 35 107 35 104 Z" 
              fill="none" 
              stroke="rgba(255,255,255,0.4)" 
              strokeWidth="1.5" 
              className="group-hover:stroke-white/60 transition-colors duration-700"
            />
          </g>
          
          <style>{`
            .water-stream-line {
              stroke-dasharray: 35;
              stroke-dashoffset: 35;
              transition: stroke-dashoffset 0.8s cubic-bezier(0.25, 1, 0.5, 1);
            }
            .group:hover .water-stream-line {
              stroke-dashoffset: 0;
            }
            .coffee-liquid-fill {
              transform: scaleY(0);
              transform-origin: bottom;
              transition: transform 2s 0.3s cubic-bezier(0.25, 1, 0.5, 1);
            }
            .group:hover .coffee-liquid-fill {
              transform: scaleY(1);
            }
          `}</style>
        </svg>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="px-6 py-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-end gap-12 relative overflow-hidden">
    <div className="max-w-md">
      <h3 className="text-4xl font-bold tracking-tighter mb-6">Let's build something amazing together.</h3>
      <p className="text-brand-muted mb-8">Available for freelance projects and creative collaborations worldwide.</p>
      <div className="flex flex-col gap-12">
        <a 
          href="mailto:hello@studio.com" 
          className="text-xl font-medium border-b border-brand-accent pb-1 hover:text-brand-accent transition-colors w-fit"
        >
          hello@studio.com
        </a>
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-widest text-brand-muted">Socials</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-brand-accent transition-colors"><Linkedin size={20} /></a>
            <a href="#" className="hover:text-brand-accent transition-colors"><Mail size={20} /></a>
          </div>
        </div>
      </div>
    </div>
    
    <div className="flex flex-col items-end gap-6">
      <V60EasterEgg />
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-brand-muted">
        <span>© 2026 STUDIO</span>
        <span className="w-1 h-1 bg-brand-accent rounded-full" />
        <span>Built with Coffee</span>
      </div>
    </div>
  </footer>
);

// --- Pages ---

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const RevealText = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={cn("overflow-hidden py-2 -my-2", className)}>
      <motion.span
        variants={{
          hidden: { y: '110%' },
          visible: { 
            y: 0,
            transition: { duration: 1.2, ease: [0.19, 1, 0.22, 1] }
          }
        }}
        className="block"
      >
        {children}
      </motion.span>
    </div>
  );
};

const BentoCard = ({ project }: { project: Project }) => {
  const cardRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <Link 
      to={`/work/${project.id}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="bento-card relative aspect-[4/5] bg-white/5 rounded-2xl overflow-hidden group cursor-pointer"
    >
      <div className="bento-card-content absolute inset-[1px] bg-brand-bg rounded-[15px] z-10 overflow-hidden">
        <div className="grain-overlay" />
        <img 
          src={project.thumbnail} 
          alt={project.title} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105 grayscale hover:grayscale-0"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/80 to-transparent z-20">
          <span className="text-[10px] uppercase tracking-widest text-brand-accent mb-2 block">{project.pillar}</span>
          <h3 className="text-2xl font-bold tracking-tight">{project.title}</h3>
        </div>
      </div>
    </Link>
  );
};

const VelocityMarquee = () => {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollPos = useRef(0);
  const velocity = useRef(0);
  const baseSpeed = 1.5;
  const currentX = useRef(0);

  useEffect(() => {
    let lastScroll = window.scrollY;
    
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      velocity.current = (currentScroll - lastScroll) * 0.15;
      lastScroll = currentScroll;
    };

    const animate = () => {
      // Lerp velocity back to 0
      velocity.current *= 0.95;
      
      // Update position
      currentX.current -= (baseSpeed + Math.abs(velocity.current));
      
      // Reset for infinite loop
      if (trackRef.current) {
        const trackWidth = trackRef.current.offsetWidth / 2;
        if (Math.abs(currentX.current) >= trackWidth) {
          currentX.current = 0;
        }
        trackRef.current.style.transform = `translate3d(${currentX.current}px, 0, 0)`;
      }
      
      requestAnimationFrame(animate);
    };

    window.addEventListener('scroll', handleScroll);
    const animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const text = "CREATIVE DIRECTOR — AI ARTIST — DESIGN ENGINEER — ";

  return (
    <div className="velocity-marquee overflow-hidden w-full py-20 border-y border-white/5 select-none">
      <div 
        ref={trackRef}
        className="marquee-track flex whitespace-nowrap"
      >
        <span className="text-[15vw] font-bold uppercase tracking-tighter leading-none text-transparent stroke-text opacity-20">
          {text}{text}{text}{text}
        </span>
        <span className="text-[15vw] font-bold uppercase tracking-tighter leading-none text-transparent stroke-text opacity-20">
          {text}{text}{text}{text}
        </span>
      </div>
      <style>{`
        .stroke-text {
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
};

const WorkStack = ({ projects }: { projects: Project[] }) => {
  return (
    <section id="work-stack" className="px-6 py-32 space-y-[20vh]">
      <div className="flex justify-between items-end mb-20">
        <h2 className="text-sm uppercase tracking-[0.3em] text-brand-muted">Case Studies</h2>
      </div>
      
      <div className="relative">
        {projects.slice(0, 4).map((project, index) => (
          <div 
            key={project.id}
            className="project-card sticky bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 min-h-[70vh] flex flex-col md:flex-row gap-12 shadow-[-20px_-20px_50px_rgba(0,0,0,0.8)]"
            style={{ 
              top: `${10 + index * 2}vh`,
              zIndex: index + 1
            }}
          >
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-brand-accent mb-4 block">Project 0{index + 1}</span>
                <h3 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-6">{project.title}</h3>
                <p className="text-xl text-brand-muted max-w-md leading-relaxed">{project.description}</p>
              </div>
              <Link 
                to={`/work/${project.id}`}
                className="group flex items-center gap-4 text-sm uppercase tracking-widest w-fit"
              >
                View Case Study <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-brand-accent group-hover:text-brand-bg transition-all"><ArrowUpRight size={16} /></div>
              </Link>
            </div>
            <div className="flex-1 aspect-video md:aspect-auto bg-white/5 rounded-2xl overflow-hidden relative">
              <div className="grain-overlay" />
              <img 
                src={project.thumbnail} 
                alt={project.title} 
                className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const Home = () => {
  const { projects } = useContext(DataContext);
  
  return (
    <PageTransition>
      <div className="pt-32 px-6">
        <section className="min-h-[70vh] flex flex-col justify-center">
          <motion.h1 
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            className="text-[12vw] leading-[0.85] font-bold tracking-tighter uppercase mb-12"
          >
            <RevealText>Art</RevealText>
            <RevealText>Director<span className="text-brand-accent">.</span></RevealText>
          </motion.h1>
          <div className="grid md:grid-cols-2 gap-12 items-end">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl md:text-2xl text-brand-muted max-w-xl leading-relaxed text-balance"
            >
              Creative Director & Design Engineer blending high-end aesthetics with cutting-edge AI technology.
            </motion.p>
            <div className="flex gap-4">
              <MagneticPill className="px-4 py-1 rounded-full border border-brand-accent/20 text-[10px] uppercase tracking-widest text-brand-muted hover:bg-brand-accent hover:text-brand-bg transition-all cursor-default">AI Artist</MagneticPill>
              <MagneticPill className="px-4 py-1 rounded-full border border-brand-accent/20 text-[10px] uppercase tracking-widest text-brand-muted hover:bg-brand-accent hover:text-brand-bg transition-all cursor-default">Vibe Coder</MagneticPill>
            </div>
          </div>
        </section>

        <section className="py-32">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-sm uppercase tracking-[0.3em] text-brand-muted">Selected Work</h2>
            <Link to="/work" className="group flex items-center gap-2 text-sm uppercase tracking-widest">
              View All <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
          <div id="bento-grid" className="grid md:grid-cols-3 gap-[2px]">
            {projects.slice(0, 6).map((project) => (
              <BentoCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        <VelocityMarquee />

        <WorkStack projects={projects} />
      </div>
    </PageTransition>
  );
};

const Tag = ({ name, active, onClick }: { name: string, active?: boolean, onClick?: (e?: React.MouseEvent) => void }) => (
  <button 
    onClick={(e) => onClick?.(e)}
    className={cn(
      "px-3 py-1 rounded-full text-[10px] uppercase tracking-widest transition-all",
      active 
        ? "bg-brand-accent text-brand-bg font-bold" 
        : "bg-white/5 text-brand-muted hover:bg-white/10 hover:text-white"
    )}
  >
    {name}
  </button>
);

const Work = () => {
  const { projects, videos, galleryImages } = useContext(DataContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const activePillar = searchParams.get('pillar') as ProjectPillar | null;
  const activeTool = searchParams.get('tool');

  const pillars: ProjectPillar[] = ['AI Generated', 'Animations & Motion', 'Illustration & Design', 'Art Direction'];

  const filteredWork = useMemo(() => {
    // 1. Projects
    const filteredProjects = projects.filter(p => {
      const matchesPillar = !activePillar || p.pillar === activePillar;
      const matchesTool = !activeTool || p.tools.includes(activeTool);
      const matchesSub = activePillar !== 'AI Generated' || !searchParams.get('sub') || p.subCategory === searchParams.get('sub') || searchParams.get('sub') === 'Images' || searchParams.get('sub') === 'Videos';
      
      // Specifically handle the "Images" and "Videos" toggle for AI Generated
      const sub = searchParams.get('sub');
      if (activePillar === 'AI Generated' && sub === 'Images') return false; // Projects are case studies
      if (activePillar === 'AI Generated' && sub === 'Videos') return false; 
      
      return matchesPillar && matchesTool && matchesSub;
    }).map(p => ({ ...p, type: 'project' as const }));

    // 2. Videos
    const filteredVideos = videos.filter(v => {
      const matchesPillar = !activePillar || v.pillar === activePillar;
      const sub = searchParams.get('sub');
      const matchesSub = activePillar !== 'AI Generated' || !sub || sub === 'All' || sub === 'Videos';
      return matchesPillar && matchesSub;
    }).map(v => ({ ...v, type: 'video' as const }));

    // 3. Gallery Images
    const filteredGallery = galleryImages.filter(g => {
      const matchesPillar = !activePillar || g.pillar === activePillar;
      const sub = searchParams.get('sub');
      const matchesSub = activePillar !== 'AI Generated' || !sub || sub === 'All' || sub === 'Images';
      return matchesPillar && matchesSub;
    }).map(g => ({ ...g, type: 'image' as const }));

    return [...filteredProjects, ...filteredVideos, ...filteredGallery].sort((a, b) => {
      // Logic: projects first, then by createdAt or id
      if (a.type === b.type) return 0;
      if (a.type === 'project') return -1;
      if (b.type === 'project') return 1;
      return 0;
    });
  }, [projects, videos, galleryImages, activePillar, activeTool, searchParams]);

  const allTools = useMemo(() => {
    const tools = new Set<string>();
    projects.forEach(p => p.tools.forEach(t => tools.add(t)));
    galleryImages.forEach(g => { if(g.software) tools.add(g.software); });
    return Array.from(tools).sort();
  }, [projects, galleryImages]);

  const pillarImages: Record<ProjectPillar, string> = {
    'AI Generated': 'https://picsum.photos/seed/ai-pillar/1200/1500',
    'Animations & Motion': 'https://picsum.photos/seed/motion-pillar/1200/1500',
    'Illustration & Design': 'https://picsum.photos/seed/design-pillar/1200/1500',
    'Art Direction': 'https://picsum.photos/seed/art-pillar/1200/1500'
  };

  return (
    <PageTransition>
      <div className="pt-40 px-6 pb-32">
        <header className="mb-20">
          <div className="flex items-center gap-4 mb-4">
            {activePillar && (
              <button 
                onClick={() => setSearchParams({})}
                className="text-brand-muted hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest"
              >
                <ArrowUpRight size={14} className="rotate-[-135deg]" /> Back to Categories
              </button>
            )}
          </div>
          <motion.h1 
            initial="hidden"
            animate="visible"
            key={activePillar || 'Selected Work'}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            className="text-7xl font-bold tracking-tighter uppercase mb-12"
          >
            <RevealText>{activePillar || 'Selected Work'}</RevealText>
          </motion.h1>
          
          {activePillar && (
            <div className="space-y-8">
              {/* Sub-category Filter for AI Generated */}
              {activePillar === 'AI Generated' && (
                <div className="flex gap-4 pl-4 border-l border-white/10">
                  {['All', 'Images', 'Videos'].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        if (sub === 'All') newParams.delete('sub');
                        else newParams.set('sub', sub);
                        setSearchParams(newParams);
                      }}
                      className={cn(
                        "text-[10px] uppercase tracking-widest transition-all",
                        (searchParams.get('sub') || 'All') === sub ? "text-brand-accent" : "text-brand-muted hover:text-white"
                      )}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              {/* Tool Filter */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest text-brand-muted flex items-center gap-2">
                  <Filter size={12} /> Filter by Tool:
                </span>
                {activeTool && (
                  <button 
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete('tool');
                      setSearchParams(newParams);
                    }}
                    className="text-[10px] uppercase tracking-widest text-brand-accent hover:underline"
                  >
                    Clear ({activeTool})
                  </button>
                )}
                <div className="flex flex-wrap gap-2">
                  {allTools.map(tool => (
                    <Tag 
                      key={tool} 
                      name={tool} 
                      active={activeTool === tool}
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('tool', tool);
                        setSearchParams(newParams);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </header>

        {!activePillar ? (
          /* Category Boxes */
          <div className="grid md:grid-cols-2 gap-8">
            {pillars.map((pillar) => (
              <button
                key={pillar}
                onClick={() => setSearchParams({ pillar })}
                className="group relative aspect-[16/9] overflow-hidden rounded-3xl bg-white/5 text-left"
              >
                <img 
                  src={pillarImages[pillar]} 
                  alt={pillar}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700 grayscale hover:grayscale-0"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 p-12 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-brand-accent mb-4 block">Explore Pillar</span>
                  <h2 className="text-5xl font-bold tracking-tighter uppercase leading-none">{pillar}</h2>
                </div>
                <div className="absolute top-12 right-12 w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-brand-accent group-hover:border-brand-accent transition-all">
                  <ArrowUpRight size={20} className="group-hover:text-brand-bg transition-colors" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Unified Work Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredWork.map((item: any) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="group"
                >
                  {item.type === 'project' ? (
                    <Link to={`/work/${item.id}`} className="block">
                      <div className="aspect-[4/5] bg-white/5 rounded-2xl overflow-hidden relative mb-6">
                        <img 
                          src={item.thumbnail} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105 grayscale hover:grayscale-0"
                          alt={item.title} 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ArrowUpRight size={48} className="text-white" />
                        </div>
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold tracking-tight group-hover:text-brand-accent transition-colors">{item.title}</h3>
                        <span className="text-[8px] font-black uppercase tracking-widest text-brand-accent bg-brand-accent/10 px-2 py-1 rounded">Case Study</span>
                      </div>
                    </Link>
                  ) : item.type === 'video' ? (
                    <div className="block cursor-pointer">
                      <div className="aspect-video bg-white/5 rounded-2xl overflow-hidden relative mb-6">
                        <img 
                          src={item.thumbnail} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                          alt={item.title} 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <motion.div whileHover={{ scale: 1.1 }} className="w-16 h-16 rounded-full bg-brand-accent flex items-center justify-center text-brand-bg shadow-2xl">
                              <Zap size={24} fill="currentColor" />
                           </motion.div>
                        </div>
                        <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" muted loop playsInline onMouseEnter={e => (e.target as HTMLVideoElement).play()} onMouseLeave={e => (e.target as HTMLVideoElement).pause()} />
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold tracking-tight">{item.title}</h3>
                        <span className="text-[8px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-1 rounded">Reel</span>
                      </div>
                    </div>
                  ) : (
                    <div className="block cursor-pointer" onClick={() => setSelectedImage(item)}>
                      <div className="aspect-square bg-white/5 rounded-2xl overflow-hidden relative mb-6">
                        <img 
                          src={item.url} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:rotate-2 group-hover:scale-110"
                          alt="" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-bold uppercase tracking-widest opacity-60">Archive Asset</h4>
                        <span className="text-[8px] font-black uppercase tracking-widest text-purple-400 bg-purple-400/10 px-2 py-1 rounded">Still</span>
                      </div>
                    </div>
                  )}

                  {item.tools && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {item.tools.map((tool: string) => (
                        <Tag 
                          key={tool} 
                          name={tool} 
                          active={activeTool === tool}
                          onClick={() => {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.set('tool', tool);
                            setSearchParams(newParams);
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {item.software && (
                    <div className="mt-4">
                       <Tag name={item.software} active={activeTool === item.software} onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.set('tool', item.software);
                          setSearchParams(newParams);
                       }} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredWork.length === 0 && activePillar && (
          <div className="py-32 text-center">
            <p className="text-brand-muted">The archive is silent. No matching assets found for '{activePillar}'.</p>
          </div>
        )}

        <AnimatePresence>
          {selectedImage && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 md:p-12"
            >
              <button className="absolute top-10 right-10 text-white hover:text-brand-accent transition-colors">
                <X size={32}/>
              </button>
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-7xl w-full flex flex-col items-center gap-8"
                onClick={e => e.stopPropagation()}
              >
                <div className="relative group">
                  <img 
                    src={selectedImage.url} 
                    alt="" 
                    className="max-w-full max-h-[75vh] rounded-2xl object-contain shadow-[0_0_100px_rgba(var(--accent-rgb),0.2)]" 
                    referrerPolicy="no-referrer"
                  />
                  {selectedImage.software && (
                    <div className="absolute -bottom-4 -left-4 p-8 glass rounded-3xl border border-white/10 max-w-sm">
                      <span className="text-[10px] text-brand-accent uppercase font-black tracking-widest block mb-2">{selectedImage.software}</span>
                      <p className="text-sm border-l border-brand-accent/30 pl-4 leading-relaxed">{selectedImage.info}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {selectedImage.tags?.map(t => (
                    <Tag key={t} name={t} />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

const CaseStudy = () => {
  const { id } = useParams();
  const { projects } = useContext(DataContext);
  const project = projects.find(p => p.id === id);

  if (!project) return <div className="pt-40 px-6">Project not found</div>;

  const isArtDirection = project.pillar === 'Art Direction';

  if (isArtDirection) {
    return (
      <PageTransition>
        <article className="bg-brand-bg text-white selection:bg-white selection:text-black">
          {/* 1. HERO SECTION */}
          <section className="h-screen w-full relative overflow-hidden">
            <div className="grain-overlay" />
            {project.videoUrl ? (
              <video 
                src={project.videoUrl} 
                autoPlay 
                muted 
                loop 
                playsInline 
                className="w-full h-full object-cover" 
              />
            ) : (
              <img 
                src={project.thumbnail} 
                alt={project.title} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent flex flex-col justify-end p-12 md:p-24">
              <div className="max-w-7xl mx-auto w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                >
                  <p className="text-xs md:text-sm uppercase tracking-[0.5em] mb-8 font-bold text-white/40">
                    {project.client} <span className="mx-4">/</span> {project.globalContext}
                  </p>
                </motion.div>
                

                <h1 className="text-5xl md:text-[8vw] leading-[0.9] font-bold tracking-tighter uppercase mb-8">
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
                        i % 3 === 0 ? "italic font-black" : "font-extrabold"
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
                        <span className="text-[10px] uppercase tracking-widest text-brand-muted mb-2">Pillar</span>
                        <span className="text-xs uppercase font-bold tracking-widest">{project.pillar}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-brand-muted mb-2">Category</span>
                        <span className="text-xs uppercase font-bold tracking-widest">{project.category}</span>
                     </div>
                  </div>
                  <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex flex-col items-center gap-4 group cursor-pointer"
                  >
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 group-hover:text-white transition-colors">Scroll to explore</span>
                    <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          <div className="max-w-7xl mx-auto w-full">
            {/* 01. ROLE SECTION */}
            <section className="py-60 px-12 md:px-0 grid md:grid-cols-2 gap-20 items-end relative">
              <div className="order-2 md:order-1 relative">
                <span className="text-[12rem] md:text-[20rem] font-bold tracking-tighter opacity-5 leading-none absolute -top-1/2 -left-12 md:-left-24 select-none pointer-events-none">01</span>
                <h4 className="text-xs uppercase tracking-[0.4em] text-brand-muted mb-12 relative z-10">Role & Ownership</h4>
                <div className="space-y-6 relative z-10">
                  {project.mariaRole?.map((role, i) => (
                    <motion.p 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-4xl md:text-6xl font-bold tracking-tighter uppercase leading-none"
                    >
                      {role}<span className="text-brand-accent">.</span>
                    </motion.p>
                  ))}
                </div>
              </div>
              <div className="order-1 md:order-2 md:pb-2">
                <p className="text-xl text-brand-muted leading-relaxed max-w-sm italic serif">
                  Directing the narrative through visual tension and technical precision. Bridging the gap between the prompt and the pixel.
                </p>
              </div>
            </section>

            {/* 02. STRATEGIC NARRATIVE */}
            <section className="py-60 px-12 md:px-0 relative overflow-hidden">
               <span className="text-[12rem] md:text-[20rem] font-bold tracking-tighter opacity-5 leading-none absolute top-1/2 right-0 -translate-y-1/2 select-none pointer-events-none">02</span>
               <div className="max-w-3xl relative z-10">
                  <h4 className="text-xs uppercase tracking-[0.4em] text-brand-muted mb-12">The Strategic Narrative</h4>
                  <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9] mb-12">AI-Accelerated<br/>Psychology.</h2>
                  <p className="text-xl md:text-2xl text-white/80 leading-relaxed mb-8">
                     Using AI to deconstruct the dual-audience tension: identifying visual anchors that trigger childhood joy while satisfying a mother's need for "crafted" quality.
                  </p>
               </div>
            </section>

            {/* 03. THE BRIEF / PROBLEM */}
            <section className="py-60 px-12 md:px-0 relative">
              <span className="text-[12rem] md:text-[20rem] font-bold tracking-tighter opacity-5 leading-none absolute top-0 -left-12 md:-left-24 select-none pointer-events-none">03</span>
              <div className="grid md:grid-cols-2 gap-24 relative z-10 pt-20">
                <div>
                   <h4 className="text-xs uppercase tracking-[0.4em] text-brand-muted mb-12">The Core Challenge</h4>
                   <h2 className="text-5xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.9] mb-12">
                     Playful for kids.<br/>Crafted for mothers.
                   </h2>
                </div>
                <div className="flex flex-col justify-end">
                   <p className="text-brand-muted text-lg md:text-xl leading-relaxed max-w-lg mb-8">
                     {project.description}
                   </p>
                   <div className="flex gap-4">
                      {project.tools.map(tool => (
                        <span key={tool} className="text-[10px] font-mono border border-white/20 px-3 py-1 rounded-full text-white/40">{tool}</span>
                      ))}
                   </div>
                </div>
              </div>
            </section>

            {/* 04. MOODBOARD SECTION */}
            <section className="py-40 bg-brand-bg overflow-hidden relative">
              <span className="text-[12rem] md:text-[20rem] font-bold tracking-tighter opacity-5 leading-none absolute top-40 -right-12 md:-right-24 select-none pointer-events-none text-right">04</span>
              <div className="flex justify-between items-end mb-24 px-12 md:px-0 relative z-10">
                <h4 className="text-xs uppercase tracking-[0.3em] text-brand-muted">Controlled Chaos / Direction</h4>
                <div className="w-1/2 h-[1px] bg-white/10" />
              </div>
              <div className="relative h-[600px] md:h-[1200px] relative z-10">
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
                      className="w-[250px] md:w-[500px] group cursor-none"
                    >
                      <img 
                        src={img} 
                        alt="Moodboard Item" 
                        className="grayscale hover:grayscale-0 transition-all duration-1000 shadow-2xl border border-white/5"
                        style={{ transform: `rotate(${rotations[i % rotations.length]}deg)` }}
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* 05. EXPLORATION PHASE */}
            <section className="py-60 px-12 md:px-0 relative">
              <span className="text-[12rem] md:text-[20rem] font-bold tracking-tighter opacity-5 leading-none absolute top-0 -left-12 md:-left-24 select-none pointer-events-none">05</span>
              <div className="grid md:grid-cols-[1fr_2fr] gap-20 items-start mb-24 relative z-10 pt-20">
                <div className="sticky top-40">
                  <h4 className="text-xs uppercase tracking-[0.3em] text-brand-muted mb-12 block">Recursive Search Arc</h4>
                  <h2 className="text-5xl font-bold tracking-tighter uppercase leading-none mb-8">Creative<br/>Search</h2>
                  <p className="text-brand-muted text-sm leading-relaxed max-w-xs">{project.explorationCaption}</p>
                </div>
                <div>
                  {project.explorationType === 'masonry' ? (
                    <div className="columns-1 md:columns-2 gap-8 space-y-8">
                      {project.explorationImages?.map((img, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          className="break-inside-avoid overflow-hidden shadow-xl"
                        >
                          <img src={img} alt="Exploration" className="w-full grayscale hover:grayscale-0 transition-all duration-1000" referrerPolicy="no-referrer" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {project.explorationVideos?.map((vid, i) => (
                        <div key={i} className="aspect-[9/16] bg-white/5 overflow-hidden">
                          <video src={vid} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 06. HYBRIDIZATION LOGIC */}
            <section className="py-60 px-12 md:px-0 relative">
               <span className="text-[12rem] md:text-[20rem] font-bold tracking-tighter opacity-5 leading-none absolute top-0 -right-12 md:-right-24 select-none pointer-events-none text-right">06</span>
               <div className="grid md:grid-cols-2 gap-20 items-center relative z-10 pt-20">
                  <div className="glass p-12 rounded-[3rem] border border-white/10 order-2 md:order-1">
                     <div className="grid grid-cols-2 gap-4">
                        {project.hybridizationImages?.map((img, i) => (
                          <div key={i} className={cn("aspect-square overflow-hidden rounded-2xl", i === 2 && "col-span-2 aspect-video")}>
                             <img src={img} alt="Hybridization" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="order-1 md:order-2">
                     <h4 className="text-xs uppercase tracking-[0.3em] text-brand-muted mb-12">The Hybridization Logic</h4>
                     <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9] mb-8">Style mixing<br/>via Firefly.</h2>
                     <p className="text-brand-muted text-lg leading-relaxed max-w-sm">
                        {project.hybridizationCaption}
                     </p>
                  </div>
               </div>
            </section>

            {/* 07. THE DECISION MOMENT */}
            <section className="py-60 px-12 md:px-20 text-center relative overflow-hidden">
               <span className="text-[12rem] md:text-[20rem] font-bold tracking-tighter opacity-5 leading-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none">07</span>
              <h4 className="text-xs uppercase tracking-[0.3em] text-brand-muted mb-12 relative z-10">The Tipping Point</h4>
              <blockquote className="text-4xl md:text-7xl font-bold tracking-tighter leading-none uppercase relative z-10 max-w-5xl mx-auto">
                {project.decisionMomentCopy}
              </blockquote>
            </section>

            {/* 08. COLOR SYSTEM */}
            <section className="py-40 px-12 md:px-0 relative">
               <span className="text-[12rem] md:text-[20rem] font-bold tracking-tighter opacity-5 leading-none absolute top-0 -left-12 md:-left-24 select-none pointer-events-none">08</span>
              <div className="flex justify-between items-center mb-24 relative z-10 pt-20">
                <h4 className="text-xs uppercase tracking-[0.3em] text-brand-muted">The Chromatic Logic</h4>
                <span className="font-mono text-[10px] opacity-30 tracking-widest">HSV // RGB // HEX</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 h-[500px] md:h-[700px] border border-white/5 bg-white/5 overflow-hidden rounded-3xl relative z-10">
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
                      <h5 className="text-2xl font-bold uppercase tracking-tighter text-white leading-none">{color.emotion}</h5>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* 09. ANIMATIC / PRODUCTION */}
            <section className="py-40 px-12 md:px-0 relative hidden md:block">
               <span className="text-[12rem] md:text-[20rem] font-bold tracking-tighter opacity-5 leading-none absolute top-0 -right-12 md:-right-24 select-none pointer-events-none text-right">09</span>
              <h4 className="text-xs uppercase tracking-[0.3em] text-brand-muted mb-12 relative z-10">Execution / Coloring Pages</h4>
              <div className="aspect-video bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 relative z-10">
                <video src={project.animaticVideoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              </div>
              <p className="mt-6 text-brand-muted text-sm uppercase tracking-widest relative z-10">{project.animaticCaption}</p>
            </section>
          </div>

          {/* 10. OUTCOME */}
          <section className="py-40 relative">
             <span className="text-[12rem] md:text-[24rem] font-bold tracking-tighter opacity-5 leading-none absolute bottom-0 -left-12 md:-left-24 select-none pointer-events-none">10</span>
            <div className="flex flex-col">
              {project.outcomeVisuals?.map((img, i) => (
                <div key={i} className="w-full h-[70vh] md:h-screen overflow-hidden sticky top-0">
                  <motion.img 
                    initial={{ scale: 1.1 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 2 }}
                    src={img} 
                    alt="Final Outcome" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
              ))}
            </div>
            <div className="relative z-10 max-w-7xl mx-auto w-full px-12 md:px-0 py-40 bg-brand-bg/80 backdrop-blur-3xl mt-[-20vh] border border-white/5 rounded-[4rem]">
              <div className="max-w-4xl mx-auto text-center">
                <span className="text-brand-accent text-6xl md:text-[12rem] font-bold block opacity-10 leading-none mb-[-4rem] select-none uppercase tracking-tighter">FIN</span>
                <p className="text-xl md:text-3xl font-bold uppercase tracking-[0.3em] leading-tight text-white relative z-20">
                  {project.outcomeResultCopy}
                </p>
              </div>
            </div>
          </section>

          {/* Navigation Footer */}
          <section className="py-40 border-t border-white/10 px-12">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Link to="/work" className="text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">← Back to catalogue</Link>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-brand-muted mb-4 italic">Index</p>
                <h3 className="text-4xl font-bold uppercase tracking-tighter">View All Work</h3>
              </div>
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
        <Link to="/work" className="text-xs uppercase tracking-widest text-brand-muted hover:text-white transition-colors mb-24 inline-block">← Back to catalogue</Link>
        <header className="mb-32">
          <span className="text-xs uppercase tracking-widest text-brand-accent mb-6 block">{project.pillar}</span>
          <h1 className="text-6xl md:text-9xl font-bold tracking-tighter uppercase mb-12 leading-none">{project.title}</h1>
          <p className="text-xl md:text-3xl text-brand-muted max-w-3xl mx-auto leading-relaxed">{project.description}</p>
        </header>

        <div className="space-y-32">
          {project.videoUrl && (
            <div className="aspect-video bg-white/5 rounded-3xl overflow-hidden glass border border-white/10 max-w-5xl mx-auto">
              <video src={project.videoUrl} controls className="w-full h-full" />
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-12">
            {project.images.map((img, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl overflow-hidden bg-white/5 border border-white/10 relative"
              >
                <div className="grain-overlay" />
                <img src={img} alt="Work" className="w-full grayscale hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

const Lab = () => {
  const { labItems } = useContext(DataContext);
  const [activeItem, setActiveItem] = useState<LabItem | null>(null);

  return (
    <PageTransition>
      <div className="pt-40 px-6 pb-32">
        <header className="mb-20">
          <motion.h1 
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            className="text-7xl font-bold tracking-tighter uppercase mb-6"
          >
            <RevealText>The Lab</RevealText>
          </motion.h1>
          <p className="text-brand-muted max-w-xl">Experiments, tests, learnings, and unfinished vibecodings.</p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {labItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setActiveItem(item)}
              className="p-8 bg-white/5 rounded-3xl border border-white/10 flex flex-col gap-6 hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <span className="px-3 py-1 rounded-full bg-brand-accent/20 text-brand-accent text-[10px] uppercase tracking-widest font-bold">
                  {item.type}
                </span>
                <span className="text-[10px] font-mono text-brand-muted">{item.date}</span>
              </div>
              {item.image && (
                <div className="aspect-square rounded-xl overflow-hidden bg-black/20">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 grayscale hover:grayscale-0" referrerPolicy="no-referrer" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-brand-accent transition-colors">{item.title}</h3>
                <p className="text-brand-muted text-sm leading-relaxed mb-4 line-clamp-3">{item.content}</p>
                <div className="flex flex-wrap gap-2">
                  {item.tools.map(tool => (
                    <Tag 
                      key={tool} 
                      name={tool} 
                      onClick={(e) => {
                        e?.stopPropagation();
                        window.location.href = `/work?tool=${tool}`;
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lab Item Modal */}
        <AnimatePresence>
          {activeItem && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6"
            >
              <button 
                className="absolute top-8 right-8 text-white hover:text-brand-accent transition-colors"
                onClick={() => setActiveItem(null)}
              >
                <X size={32} />
              </button>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-3xl glass rounded-3xl overflow-hidden p-8 md:p-12"
              >
                <div className="flex justify-between items-start mb-8">
                  <span className="px-3 py-1 rounded-full bg-brand-accent/20 text-brand-accent text-xs uppercase tracking-widest font-bold">
                    {activeItem.type}
                  </span>
                  <span className="text-sm font-mono text-brand-muted">{activeItem.date}</span>
                </div>
                <h2 className="text-4xl font-bold tracking-tighter uppercase mb-6">{activeItem.title}</h2>
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <p className="text-brand-muted leading-relaxed mb-8">{activeItem.content}</p>
                    <div className="flex flex-wrap gap-2 mb-8">
                      {activeItem.tools.map(tool => (
                        <Tag 
                          key={tool} 
                          name={tool} 
                          onClick={() => {
                            window.location.href = `/work?tool=${tool}`;
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  {activeItem.image && (
                    <div className="rounded-2xl overflow-hidden bg-white/5 aspect-square">
                      <img src={activeItem.image} alt={activeItem.title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
                {activeItem.code && (
                  <div className="mt-8 p-6 bg-black/40 rounded-2xl font-mono text-sm text-brand-accent overflow-x-auto border border-white/5">
                    <pre><code>{activeItem.code}</code></pre>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

const About = () => (
  <PageTransition>
    <div className="pt-40 px-6 pb-32">
      <div className="grid md:grid-cols-2 gap-20 items-start">
        <div className="sticky top-40">
          <div className="aspect-[3/4] bg-white/5 rounded-3xl overflow-hidden relative mb-8">
            <img 
              src="https://picsum.photos/seed/profile/800/1200" 
              alt="Profile" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 border-[20px] border-brand-bg/50 pointer-events-none" />
            <Link to="/admin" className="opacity-0 hover:opacity-10 transition-opacity absolute bottom-2 right-2 cursor-default z-10">
              <Cat size={12} />
            </Link>
          </div>
          <div className="flex gap-4">
            <a href="#" className="flex-1 p-4 glass rounded-2xl flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all">
              <Linkedin size={18} /> <span className="text-xs uppercase tracking-widest font-bold">LinkedIn</span>
            </a>
            <a href="#" className="flex-1 p-4 glass rounded-2xl flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all">
              <Mail size={18} /> <span className="text-xs uppercase tracking-widest font-bold">Email</span>
            </a>
          </div>
        </div>
        
        <div>
          <motion.h1 
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            className="text-7xl font-bold tracking-tighter uppercase mb-12"
          >
            <RevealText>Art Director</RevealText>
            <RevealText>& Design Engineer<span className="text-brand-accent">.</span></RevealText>
          </motion.h1>
          <div className="space-y-8 text-xl text-brand-muted leading-relaxed">
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

          <div className="mt-20 grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-white mb-6">Expertise</h3>
              <ul className="space-y-3 text-sm">
                <li>Art Direction</li>
                <li>Creative Strategy</li>
                <li>AI Art & Prompting</li>
                <li>Design Engineering</li>
                <li>Motion Design</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-widest text-white mb-6">Tools</h3>
              <ul className="space-y-3 text-sm">
                <li>Midjourney / Stable Diffusion</li>
                <li>Adobe Creative Cloud</li>
                <li>Figma / Framer</li>
                <li>React / Three.js</li>
                <li>Vibe Coding</li>
              </ul>
            </div>
          </div>
          <div className="mt-20 p-8 glass rounded-3xl border border-brand-accent/20">
            <h3 className="text-2xl font-bold mb-4 uppercase tracking-tighter">Let's build something amazing together!</h3>
            <p className="text-brand-muted mb-8">Ready to start a new project or just want to say hi?</p>
            <button className="w-full py-4 bg-brand-accent text-brand-bg font-bold uppercase tracking-widest rounded-full hover:scale-[1.02] transition-transform text-xs">
              Schedule a free consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  </PageTransition>
);

const Admin = () => {
  const { user, loading, isAdmin: isUserAdmin } = useContext(AuthContext);
  const { projects, videos, labItems, galleryImages } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState<'projects' | 'videos' | 'lab' | 'gallery'>('projects');
  
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingVideo, setEditingVideo] = useState<Partial<Video> | null>(null);
  const [editingLab, setEditingLab] = useState<Partial<LabItem> | null>(null);
  const [editingGalleryImage, setEditingGalleryImage] = useState<Partial<GalleryImage> | null>(null);
  const [bulkGalleryQueue, setBulkGalleryQueue] = useState<{ 
    file: File; 
    url?: string; 
    previewUrl?: string;
    dbId?: string;
    software?: string; 
    info?: string; 
    tags: string[]; 
    status: string; 
    progress: number 
  }[]>([]);
  const [bulkTags, setBulkTags] = useState<string[]>([]);
  const [bulkPillar, setBulkPillar] = useState<ProjectPillar>('Illustration & Design');
  
  const [projectStep, setProjectStep] = useState(0);
  const PROJECT_STEPS = [
    { id: 'vision', label: 'Vision', icon: <Compass size={14} /> },
    { id: 'story', label: 'Story', icon: <Zap size={14} /> },
    { id: 'engine', label: 'Process', icon: <Cpu size={14} /> },
    { id: 'render', label: 'Visuals', icon: <ImageIcon size={14} /> },
    { id: 'meta', label: 'Tech', icon: <Code size={14} /> },
  ];

  const [editingLibraryItem, setEditingLibraryItem] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>({});
  const [storageConnected, setStorageConnected] = useState<'testing' | 'ok' | 'blocked'>('testing');

  useEffect(() => {
    const testStorage = async () => {
      try {
        const response = await fetch(`https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o`, { method: 'GET', mode: 'no-cors' });
        setStorageConnected('ok');
      } catch (e) {
        setStorageConnected('blocked');
        console.error("Storage Blocked:", e);
      }
    };
    testStorage();
    const interval = setInterval(testStorage, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (file: File, field: string, stateSetter: any) => {
    if (!file) return;
    
    if (!auth.currentUser) {
      alert("STOP: You are not logged in. Firebase blocks all anonymous uploads.");
      handleLogin();
      return;
    }

    const uploadId = `${field}_${Date.now()}_${file.name}`;
    setUploadProgress(prev => ({ ...prev, [uploadId]: 1 }));
    setUploadStatus(prev => ({ ...prev, [uploadId]: 'Verifying Sync...' }));

    // Connectivity Ping
    try {
      await fetch(`https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o`, { method: 'GET', mode: 'no-cors' });
      console.log("[Diagnostic] Connectivity OK");
    } catch (e) {
      console.error("[Diagnostic] Link Failed:", e);
      setUploadStatus(prev => ({ ...prev, [uploadId]: 'Link Blocked by Browser' }));
      alert("CONNECTION BLOCKED: Your browser is refusing to talk to Firebase Storage. Please disable VPN or Ad-Blockers (uBlock, etc) and try again.");
      setUploadProgress(prev => { const n = {...prev}; delete n[uploadId]; return n; });
      return;
    }
    
    console.log(`[Diagnostic] Attempting upload for: ${file.name} (${file.size} bytes)`);

    return new Promise(async (resolve, reject) => {
      const storagePath = `${activeTab}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, storagePath);

      console.log(`[Diagnostic] Target: gs://${storage.app.options.storageBucket}/${storagePath}`);
      setUploadStatus(prev => ({ ...prev, [uploadId]: 'Opening Port...' }));

      // FOR FILES < 50MB: Use simple uploadBytes (MUCH more reliable)
      if (file.size < 50 * 1024 * 1024) {
        console.log("[Diagnostic] Using direct upload (non-resumable) for stability");
        try {
          setUploadProgress(prev => ({ ...prev, [uploadId]: 20 }));
          setUploadStatus(prev => ({ ...prev, [uploadId]: 'Streaming Data...' }));
          
          const result = await uploadBytes(storageRef, file, { 
            contentType: file.type || 'image/jpeg',
            customMetadata: { 'originalName': file.name }
          });
          
          setUploadProgress(prev => ({ ...prev, [uploadId]: 95 }));
          setUploadStatus(prev => ({ ...prev, [uploadId]: 'Generating Link...' }));
          
          const downloadURL = await getDownloadURL(result.ref);
          
          if (stateSetter) {
            stateSetter((prev: any) => {
              if (!prev) return prev;
              if (Array.isArray(prev[field])) {
                return { ...prev, [field]: [...prev[field], downloadURL] };
              }
              return { ...prev, [field]: downloadURL };
            });
          }
          
          setUploadProgress(prev => {
            const newState = { ...prev };
            delete newState[uploadId];
            return newState;
          });
          setUploadStatus(prev => {
            const newState = { ...prev };
            delete newState[uploadId];
            return newState;
          });
          resolve(downloadURL);
        } catch (err: any) {
          console.error("[Diagnostic] Upload Failed:", err);
          alert(`UPLOAD ERROR: ${err.code}\n\n${err.message}`);
          setUploadProgress(prev => { const n = {...prev}; delete n[uploadId]; return n; });
          reject(err);
        }
        return;
      }

      try {
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        const startTimer = setTimeout(() => {
          if (uploadProgress[uploadId] === 1) {
            console.error("[Diagnostic] Upload Stalled during initialization.");
            alert(`UPLOAD STALLED: The browser is refusing to open the data stream to Firebase.`);
          }
        }, 15000);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(prev => ({ ...prev, [uploadId]: Math.max(progress, 1) }));
            setUploadStatus(prev => ({ ...prev, [uploadId]: `${snapshot.state}: ${snapshot.bytesTransferred} bytes` }));
            if (progress > 1) clearTimeout(startTimer);
          }, 
          (error) => {
            clearTimeout(startTimer);
            setUploadProgress(prev => { const n = {...prev}; delete n[uploadId]; return n; });
            reject(error);
          }, 
          async () => {
            clearTimeout(startTimer);
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            if (stateSetter) {
              stateSetter((prev: any) => {
                if (!prev) return prev;
                if (Array.isArray(prev[field])) return { ...prev, [field]: [...prev[field], downloadURL] };
                return { ...prev, [field]: downloadURL };
              });
            }
            setUploadProgress(prev => { const n = {...prev}; delete n[uploadId]; return n; });
            setUploadStatus(prev => { const n = {...prev}; delete n[uploadId]; return n; });
            resolve(downloadURL);
          }
        );
      } catch (err: any) {
        alert(`SYSTEM ERROR: ${err.message}`);
        reject(err);
      }
    });
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const saveToFirestore = async (collectionName: string, data: any, id: string | undefined, resetFn: () => void) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data, updatedAt: serverTimestamp() };
      if (id) {
        const { id: _, ...updateData } = payload;
        await updateDoc(doc(db, collectionName, id), updateData);
      } else {
        await addDoc(collection(db, collectionName), payload);
      }
      resetFn();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionName);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteFromFirestore = async (collectionName: string, id: string) => {
    if (!confirm(`Delete this ${collectionName.slice(0, -1)}?`)) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, collectionName);
    }
  };

  const handleAddStringToArray = (field: keyof Project, value: string) => {
    if (!value) return;
    const currentArray = (editingProject?.[field] as string[]) || [];
    setEditingProject({ ...editingProject, [field]: [...currentArray, value] });
  };

  const handleRemoveFromArray = (field: keyof Project, index: number) => {
    const currentArray = (editingProject?.[field] as string[]) || [];
    const newArray = [...currentArray];
    newArray.splice(index, 1);
    setEditingProject({ ...editingProject, [field]: newArray });
  };

  if (loading) return <div className="pt-40 px-6 min-h-screen text-brand-muted">Loading Secure Access...</div>;

  if (!user || !isUserAdmin) {
    return (
      <PageTransition>
        <div className="pt-40 px-6 min-h-screen flex flex-col items-center justify-center">
          <div className="w-full max-w-md p-12 glass rounded-3xl text-center border border-white/5">
            <Cat size={48} className="mx-auto mb-8 text-brand-accent animate-pulse" />
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-4">Master Control</h1>
            <p className="text-brand-muted mb-8 italic text-sm">Restricted Access: Creative Direction Workspace</p>
            
            {!user ? (
              <div className="space-y-6">
                <button 
                  onClick={handleLogin} 
                  className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-brand-accent transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  Identify with Google
                </button>
                <p className="text-[10px] text-brand-muted uppercase tracking-[0.2em] leading-relaxed">
                  If the login popup doesn't appear, please <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="text-brand-accent underline">open the app in a new tab</a>.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <p className="text-red-400 text-xs font-black uppercase tracking-widest mb-1">Access Denied</p>
                  <p className="text-white text-[10px] opacity-70 truncate">{user.email}</p>
                </div>
                <p className="text-[10px] text-brand-muted uppercase tracking-widest leading-relaxed">
                  Your identity is not authorized for database manipulation.
                </p>
                <button onClick={() => auth.signOut()} className="w-full py-4 glass border border-white/10 text-white rounded-xl hover:bg-white/5 tracking-widest uppercase font-black text-[10px] transition-all">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="pt-32 px-6 pb-40 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-20">
          <div className="w-full space-y-8">
            {/* Connection Advisory */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-3 bg-brand-accent/5 border border-brand-accent/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-brand-accent"
            >
              <div className="flex items-center gap-3">
                <Info size={14} /> 
                <span>Upload Issue? Open the app in a NEW TAB (top-right icon) to bypass security blocks.</span>
              </div>
              <div className="flex items-center gap-4 opacity-70">
                 <span>Plan B: Host on ImgBB & paste link</span>
              </div>
            </motion.div>

            <h1 className="text-8xl font-black tracking-tighter uppercase leading-[0.8]">Master<br/><span className="text-brand-accent">Control.</span></h1>
            
            <div className="mt-12 flex flex-col md:flex-row gap-6 items-center w-full">
              <div className="flex flex-wrap gap-4">
                {(['projects', 'videos', 'lab', 'gallery'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
                    className={cn(
                      "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shrink-0",
                      activeTab === tab 
                        ? "bg-brand-accent text-brand-bg border-brand-accent shadow-xl shadow-brand-accent/20" 
                        : "glass text-brand-muted border-white/5 hover:text-white hover:border-white/10"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex-grow flex items-center gap-4 glass rounded-2xl border border-white/5 px-6 py-1 w-full md:max-w-md focus-within:border-brand-accent/50 transition-all">
                <Search size={16} className="text-brand-muted" />
                <input 
                  type="text" 
                  placeholder={`Search ${activeTab}...`} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none py-3 text-xs uppercase tracking-widest w-full"
                />
              </div>
              
              <div className="h-10 w-[1px] bg-white/10 mx-2 self-center hidden lg:block" />

              <div className="relative group/create shrink-0">
                 <button className="px-8 py-3 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center gap-3 hover:bg-brand-accent transition-all">
                    <Plus size={14} strokeWidth={3} /> Create New
                 </button>
                 <div className="absolute top-full left-0 mt-2 w-48 glass rounded-2xl border border-white/10 opacity-0 invisible group-hover/create:opacity-100 group-hover/create:visible transition-all z-50 overflow-hidden translate-y-2 group-hover/create:translate-y-0 shadow-2xl">
                    <button 
                      onClick={() => { setActiveTab('projects'); setEditingProject({ title: '', pillar: 'Art Direction', category: '', tools: [], mariaRole: [], moodboardImages: [], explorationImages: [], hybridizationImages: [], outcomeVisuals: [], images: [], colorSystem: [] }); }}
                      className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      Project
                    </button>
                    <button 
                      onClick={() => { setActiveTab('videos'); setEditingVideo({ title: '', url: '', thumbnail: '', description: '' }); }}
                      className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      Video
                    </button>
                    <button 
                      onClick={() => { setActiveTab('lab'); setEditingLab({ title: '', type: 'Experiment', content: '', tools: [], date: new Date().toISOString().split('T')[0] }); }}
                      className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      Lab Item
                    </button>
                    <button 
                      onClick={() => { setActiveTab('gallery'); setEditingGalleryImage({ url: '', tags: [], software: '', info: '' }); }}
                      className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      Single Image
                    </button>
                    <label className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors cursor-pointer block">
                      Bulk Gallery
                      <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          setBulkGalleryQueue(files.map(f => ({ 
                            file: f, 
                            previewUrl: URL.createObjectURL(f),
                            tags: [], 
                            status: 'Ready', 
                            progress: 0 
                          })));
                          setActiveTab('gallery');
                          e.target.value = '';
                        }
                      }} />
                    </label>
                  </div>
               </div>

               {/* Identity & Rescue Section */}
               <div className="flex items-center gap-4 glass pl-4 pr-4 py-2 rounded-2xl border border-white/10 shrink-0 self-center">
                  <div className="flex flex-col items-end mr-2">
                    <div className="flex items-center gap-1">
                       <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", storageConnected === 'ok' ? "bg-green-400" : storageConnected === 'testing' ? "bg-yellow-400" : "bg-red-400")} />
                       <span className="text-[6px] font-black uppercase tracking-widest opacity-60">
                         {storageConnected === 'ok' ? 'Link Ready' : storageConnected === 'testing' ? 'Syncing...' : 'Link Blocked'}
                       </span>
                    </div>
                    {storageConnected === 'blocked' && <span className="text-[5px] text-red-500 font-black uppercase tracking-tighter">Ad-Block Detected</span>}
                  </div>
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-brand-accent/30 bg-black/40">
                    <img 
                      src={user?.photoURL || 'https://picsum.photos/seed/user/200/200'} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                      alt="" 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/200/200' }}
                    />
                  </div>
                  <div className="hidden lg:block whitespace-nowrap overflow-hidden">
                    <p className="text-[8px] font-black uppercase tracking-widest text-brand-accent">Identity Verified</p>
                    <p className="text-[10px] font-medium text-white/60 truncate max-w-[120px]">{user?.email}</p>
                  </div>
                  <div className="h-6 w-[1px] bg-white/10 mx-1" />
                  <button 
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="flex flex-col items-center gap-1 group/rescue"
                    title="FIX CONNECTION: Open in New Tab"
                  >
                    <Rocket size={14} className="text-brand-accent group-hover/rescue:animate-bounce" />
                    <span className="text-[6px] font-black uppercase tracking-widest opacity-50">Rescue</span>
                  </button>
                  <button 
                    onClick={() => auth.signOut()} 
                    className="p-2 hover:text-red-400 transition-colors opacity-50 hover:opacity-100"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
               </div>
            </div>
          </div>
        </header>

        {/* Content Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'projects' && projects
            .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(p => (
            <div key={p.id} className="glass p-6 rounded-3xl border border-white/5 flex flex-col justify-between group h-64 overflow-hidden relative">
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                <img src={p.thumbnail} className="w-full h-full object-cover grayscale" alt="" />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent">{p.pillar}</span>
                   <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[8px] font-black uppercase tracking-widest text-brand-muted">Stored</span>
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter leading-tight">{p.title}</h3>
                <p className="text-xs text-brand-muted uppercase tracking-widest mt-2">{p.category}</p>
              </div>
              <div className="relative z-10 flex gap-2">
                <button onClick={() => setEditingProject(p)} className="flex-1 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest"><Edit3 size={14}/> Edit</button>
                <button onClick={() => deleteFromFirestore('projects', p.id)} className="px-4 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}

          {activeTab === 'videos' && videos
            .filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(v => (
            <div key={v.id} className="glass p-6 rounded-3xl border border-white/5 flex flex-col justify-between group">
              <div>
                <img src={v.thumbnail} className="w-full h-32 object-cover rounded-xl mb-4 grayscale" alt="" />
                <h3 className="text-xl font-bold uppercase tracking-tighter">{v.title}</h3>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEditingVideo(v)} className="flex-1 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors font-bold uppercase text-[10px] tracking-widest">Edit</button>
                <button onClick={() => deleteFromFirestore('videos', v.id)} className="px-4 py-3 text-red-400 opacity-50 hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}

          {activeTab === 'lab' && labItems
            .filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.type.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(l => (
            <div key={l.id} className="glass p-6 rounded-3xl border border-white/5 flex flex-col justify-between group">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent mb-2 block">{l.type}</span>
                <h3 className="text-xl font-bold uppercase tracking-tighter">{l.title}</h3>
                <p className="text-xs text-brand-muted mt-2 truncate">{l.content}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEditingLab(l)} className="flex-1 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors font-bold uppercase text-[10px] tracking-widest">Edit</button>
                <button onClick={() => deleteFromFirestore('labItems', l.id)} className="px-4 py-3 text-red-400 opacity-50 hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}

          {activeTab === 'gallery' && galleryImages
            .filter(img => img.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) || img.software?.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(img => (
            <div key={img.id} className="glass rounded-3xl border border-white/5 overflow-hidden group">
              <div className="aspect-square relative flex flex-col justify-end p-6">
                <img src={img.url} className="absolute inset-0 w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex flex-col justify-end p-6 border-4 border-transparent group-hover:border-brand-accent transition-all rounded-[2rem] m-2">
                  <div className="space-y-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
                    <div className="flex flex-wrap gap-1">
                      {img.tags?.map(t => <span key={t} className="text-[8px] bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-widest">#{t}</span>)}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingGalleryImage(img)} className="flex-1 py-2 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-lg">Edit</button>
                      <button onClick={() => deleteFromFirestore('gallery', img.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 transition-colors"><Trash2 size={12}/></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Project Modal */}
        <AnimatePresence>
          {editingProject && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 sm:p-12 overflow-hidden">
              <div className="w-full max-w-6xl glass rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] relative border border-white/10">
                {/* Visual Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-50">
                   <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${((projectStep + 1) / PROJECT_STEPS.length) * 100}%` }} 
                     className="h-full bg-brand-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)]"
                   />
                </div>

                <div className="flex justify-between items-center px-12 py-8 bg-brand-bg/40 backdrop-blur-xl border-b border-white/5">
                  <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-black tracking-tighter uppercase">{editingProject.id ? 'Refine' : 'Birth'} Project</h2>
                    <div className="flex gap-2">
                      {PROJECT_STEPS.map((step, idx) => (
                        <button
                          key={step.id}
                          onClick={() => setProjectStep(idx)}
                          className={cn(
                            "group relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            projectStep === idx ? "text-brand-accent bg-brand-accent/10" : "text-brand-muted hover:text-white"
                          )}
                        >
                          <span className="opacity-50">{idx + 1}.</span>
                          <span className="hidden sm:inline">{step.label}</span>
                          {projectStep === idx && <motion.div layoutId="step-pill" className="absolute inset-0 border border-brand-accent/30 rounded-xl" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => { setEditingProject(null); setProjectStep(0); }} className="p-3 glass rounded-full hover:bg-brand-accent hover:text-brand-bg transition-all"><X size={20} /></button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-12">
                  <form onSubmit={(e) => { e.preventDefault(); saveToFirestore('projects', editingProject, editingProject.id, () => { setEditingProject(null); setProjectStep(0); }); }} className="max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                      {projectStep === 0 && (
                        <motion.section 
                          key="step-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                          className="space-y-12"
                        >
                          <h3 className="text-xl font-black uppercase tracking-widest text-brand-accent flex items-center gap-4">
                            <span className="w-10 h-10 rounded-full border border-brand-accent flex items-center justify-center text-xs">01</span>
                            Core Identity
                          </h3>
                          <div className="grid md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                              <InputGroup label="Project Name" description="The public-facing title of the record." value={editingProject.title || ''} onChange={v => setEditingProject({...editingProject, title: v})} />
                              <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">
                                   Main Focus (Pillar)
                                   <span className="block mt-1 text-[8px] font-normal tracking-wide opacity-60 normal-case">Which discipline does this primarily belong to?</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                  {['Art Direction', 'AI Generated', 'Animations & Motion', 'Illustration & Design'].map(p => (
                                    <button
                                      key={p} type="button"
                                      onClick={() => setEditingProject({...editingProject, pillar: p as any})}
                                      className={cn(
                                        "px-4 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all text-center",
                                        editingProject.pillar === p ? "bg-white text-black border-white" : "glass border-white/5 hover:border-white/20"
                                      )}
                                    >
                                      {p}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-8">
                               <InputGroup label="Category" description="e.g. Branded Content, Personal Practice" value={editingProject.category || ''} onChange={v => setEditingProject({...editingProject, category: v})} />
                               <InputGroup label="Client / Partner" description="Who was this for? (Optional)" value={editingProject.client || ''} onChange={v => setEditingProject({...editingProject, client: v})} />
                               <div className="p-8 glass rounded-3xl border border-brand-accent/10">
                                 <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-4 block font-black">Cover Visual (Thumbnail)</label>
                                 <UploadBox field="thumbnail" value={editingProject.thumbnail} onUpload={handleFileUpload} progress={uploadProgress} status={uploadStatus} state={editingProject} stateSetter={setEditingProject} />
                               </div>
                            </div>
                          </div>
                        </motion.section>
                      )}

                      {projectStep === 1 && (
                        <motion.section 
                          key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                          className="space-y-12"
                        >
                          <h3 className="text-xl font-black uppercase tracking-widest text-brand-accent flex items-center gap-4">
                            <span className="w-10 h-10 rounded-full border border-brand-accent flex items-center justify-center text-xs">02</span>
                            The Narrative
                          </h3>
                          <div className="space-y-10">
                            <div className="p-8 glass rounded-3xl border border-white/5">
                              <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-4 block font-black">
                                Brief & Intent
                                <span className="block mt-1 text-[8px] font-normal tracking-wide opacity-60 normal-case">Write a concise narrative about the project's soul.</span>
                              </label>
                              <textarea value={editingProject.description || ''} onChange={e => setEditingProject({...editingProject, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 outline-none focus:border-brand-accent min-h-[150px] resize-none leading-relaxed text-sm" placeholder="Tell the story of how this project lived..." />
                            </div>
                            <InputGroup label="Global Context" description="Why does this project matter in the larger world?" value={editingProject.globalContext || ''} onChange={v => setEditingProject({...editingProject, globalContext: v})} isTextarea />
                            <InputGroup label="The Creative Tension" description="What was the core problem or friction to solve?" value={editingProject.creativeTension || ''} onChange={v => setEditingProject({...editingProject, creativeTension: v})} isTextarea />
                          </div>
                        </motion.section>
                      )}

                      {projectStep === 2 && (
                        <motion.section 
                          key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                          className="space-y-12"
                        >
                          <h3 className="text-xl font-black uppercase tracking-widest text-brand-accent flex items-center gap-4">
                            <span className="w-10 h-10 rounded-full border border-brand-accent flex items-center justify-center text-xs">03</span>
                            Execution Engine
                          </h3>
                          <div className="grid md:grid-cols-2 gap-10">
                            <div className="space-y-10">
                              <ListManager label="What you did (Maria's Roles)" items={editingProject.mariaRole || []} onAdd={v => setEditingProject({...editingProject, mariaRole: [...(editingProject.mariaRole || []), v]})} onRemove={i => setEditingProject({...editingProject, mariaRole: editingProject.mariaRole?.filter((_, idx) => idx !== i)})} />
                              <ListManager label="Tools / Tech Used" items={editingProject.tools || []} onAdd={v => setEditingProject({...editingProject, tools: [...(editingProject.tools || []), v]})} onRemove={i => setEditingProject({...editingProject, tools: editingProject.tools?.filter((_, idx) => idx !== i)})} />
                            </div>
                            <div className="p-10 glass rounded-[2.5rem] border border-white/10">
                               <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-6 block font-black underline decoration-brand-accent/30 decoration-2 underline-offset-8">Vibe Check (Color System)</label>
                               <ColorPaletteManager colors={editingProject.colorSystem || []} onChange={v => setEditingProject({...editingProject, colorSystem: v})} />
                            </div>
                          </div>
                        </motion.section>
                      )}

                      {projectStep === 3 && (
                        <motion.section 
                          key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                          className="space-y-16"
                        >
                          <div className="flex justify-between items-end border-b border-white/10 pb-6">
                            <h3 className="text-xl font-black uppercase tracking-widest text-brand-accent flex items-center gap-4">
                              <span className="w-10 h-10 rounded-full border border-brand-accent flex items-center justify-center text-xs">04</span>
                              Visual Production
                            </h3>
                            <button type="button" onClick={() => setProjectStep(4)} className="text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-white transition-colors">Skip to Tech Meta →</button>
                          </div>
                          
                          <ImagePhaseManager title="Moodboard / Direction" field="moodboardImages" images={editingProject.moodboardImages || []} onUpload={handleFileUpload} progress={uploadProgress} status={uploadStatus} state={editingProject} stateSetter={setEditingProject} onRemove={i => setEditingProject({...editingProject, moodboardImages: editingProject.moodboardImages?.filter((_, idx) => idx !== i)})} />
                          
                          <div className="space-y-6 pt-12 border-t border-white/5">
                            <div className="flex justify-between items-center mb-6">
                               <h4 className="text-xl font-black uppercase tracking-tighter">Exploration Phase</h4>
                               <div className="flex gap-2">
                                 {['masonry', 'slot-machine'].map(type => (
                                   <button 
                                     key={type} type="button"
                                     onClick={() => setEditingProject({...editingProject, explorationType: type as any})}
                                     className={cn("px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all", editingProject.explorationType === type ? "bg-white text-black border-white" : "glass border-white/5")}
                                   >
                                     {type}
                                   </button>
                                 ))}
                               </div>
                            </div>
                            <ImagePhaseManager hideHeading field="explorationImages" images={editingProject.explorationImages || []} onUpload={handleFileUpload} progress={uploadProgress} status={uploadStatus} state={editingProject} stateSetter={setEditingProject} onRemove={i => setEditingProject({...editingProject, explorationImages: editingProject.explorationImages?.filter((_, idx) => idx !== i)})} />
                            <InputGroup label="Process Note / Caption" value={editingProject.explorationCaption || ''} onChange={v => setEditingProject({...editingProject, explorationCaption: v})} />
                          </div>

                          <div className="space-y-6 pt-12 border-t border-white/5">
                            <h4 className="text-xl font-black uppercase tracking-tighter">Decision & Result</h4>
                            <ImagePhaseManager hideHeading field="hybridizationImages" images={editingProject.hybridizationImages || []} onUpload={handleFileUpload} progress={uploadProgress} status={uploadStatus} state={editingProject} stateSetter={setEditingProject} onRemove={i => setEditingProject({...editingProject, hybridizationImages: editingProject.hybridizationImages?.filter((_, idx) => idx !== i)})} />
                            <InputGroup label="The Spark (Decision Moment)" value={editingProject.decisionMomentCopy || ''} onChange={v => setEditingProject({...editingProject, decisionMomentCopy: v})} isTextarea />
                          </div>

                          <div className="p-12 glass rounded-[3rem] border border-brand-accent/30 bg-brand-accent/[0.02]">
                            <h4 className="text-3xl font-black uppercase tracking-widest text-brand-accent mb-8">Final Outcome</h4>
                            <ImagePhaseManager hideHeading field="outcomeVisuals" images={editingProject.outcomeVisuals || []} onUpload={handleFileUpload} progress={uploadProgress} status={uploadStatus} state={editingProject} stateSetter={setEditingProject} onRemove={i => setEditingProject({...editingProject, outcomeVisuals: editingProject.outcomeVisuals?.filter((_, idx) => idx !== i)})} />
                            <div className="mt-8">
                              <InputGroup label="Final Result Summary" value={editingProject.outcomeResultCopy || ''} onChange={v => setEditingProject({...editingProject, outcomeResultCopy: v})} isTextarea />
                            </div>
                          </div>
                        </motion.section>
                      )}

                      {projectStep === 4 && (
                        <motion.section 
                          key="step-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                          className="space-y-12"
                        >
                          <h3 className="text-xl font-black uppercase tracking-widest text-brand-accent flex items-center gap-4">
                            <span className="w-10 h-10 rounded-full border border-brand-accent flex items-center justify-center text-xs">05</span>
                            Technical Meta
                          </h3>
                          <div className="grid md:grid-cols-2 gap-10">
                            <div className="space-y-10">
                              <InputGroup label="Primary Video URL" description="The main visual experience." value={editingProject.videoUrl || ''} onChange={v => setEditingProject({...editingProject, videoUrl: v})} />
                              <InputGroup label="Animatic / Extra Video" description="Behind the scenes or motion studies." value={editingProject.animaticVideoUrl || ''} onChange={v => setEditingProject({...editingProject, animaticVideoUrl: v})} />
                            </div>
                            <div className="space-y-8">
                               <InputGroup label="Sub-Category Label" description="Used for filtering (e.g. CGI, Branding)" value={editingProject.subCategory || ''} onChange={v => setEditingProject({...editingProject, subCategory: v})} />
                               <InputGroup label="Animatic Insight" description="Briefly explain the intent of the animatic." value={editingProject.animaticCaption || ''} onChange={v => setEditingProject({...editingProject, animaticCaption: v})} isTextarea />
                            </div>
                          </div>
                          
                          <div className="mt-20 p-12 glass rounded-3xl border border-white/5 text-center">
                             <div className="w-20 h-20 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                               <Check size={40} className="text-brand-accent" />
                             </div>
                             <h4 className="text-2xl font-black uppercase tracking-widest mb-2 font-mono">Archive Ready?</h4>
                             <p className="text-brand-muted uppercase text-[10px] tracking-widest font-black">All sections have been validated. You can now deploy this case study.</p>
                          </div>
                        </motion.section>
                      )}
                    </AnimatePresence>
                  </form>
                </div>

                <div className="flex gap-4 p-10 bg-brand-bg/60 backdrop-blur-2xl border-t border-white/5 z-40">
                  <div className="flex-grow flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setProjectStep(prev => Math.max(0, prev - 1))}
                      disabled={projectStep === 0}
                      className="px-8 py-5 glass border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-30 disabled:grayscale transition-all hover:bg-white/5"
                    >
                      ← Back
                    </button>
                    {projectStep < PROJECT_STEPS.length - 1 ? (
                      <button 
                        type="button" 
                        onClick={() => setProjectStep(prev => prev + 1)}
                        className="px-12 py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl text-[10px] hover:bg-brand-accent transition-all flex items-center gap-2"
                      >
                        Next Section <ArrowRight size={14} />
                      </button>
                    ) : (
                      <div className="flex-grow" />
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    {Object.keys(uploadProgress).length > 0 && (
                      <button 
                        type="button" 
                        onClick={() => { if(confirm("This will stop waiting for current uploads. Use this if an upload is stuck at 0%. Continue?")) setUploadProgress({}); }}
                        className="px-4 py-5 border border-brand-accent/30 text-brand-accent rounded-2xl font-black uppercase tracking-widest text-[8px] hover:bg-brand-accent/10 transition-all flex items-center gap-2"
                        title="Clear stuck uploads"
                      >
                        <Zap size={14} className="animate-pulse" /> Reset Sync
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.preventDefault(); saveToFirestore('projects', editingProject, editingProject.id, () => { setEditingProject(null); setProjectStep(0); }); }}
                      disabled={isSubmitting} 
                      className={cn(
                        "px-12 py-5 font-black uppercase tracking-widest rounded-2xl hover:scale-[1.05] active:scale-95 transition-all text-[10px] shadow-2xl disabled:opacity-50",
                        Object.keys(uploadProgress).length > 0 ? "bg-white/10 text-white/40" : "bg-brand-accent text-brand-bg shadow-brand-accent/20"
                      )}
                    >
                      {isSubmitting ? 'Syncing...' : Object.keys(uploadProgress).length > 0 ? 'Upload Pending...' : 'Deploy to Database'}
                    </button>
                    <button type="button" onClick={() => { setEditingProject(null); setProjectStep(0); }} className="px-8 py-5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500/20 hover:text-red-400 transition-colors">Discard</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Modal */}
        <AnimatePresence>
          {editingVideo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6">
              <div className="w-full max-w-2xl glass rounded-3xl p-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-10">Video Config</h2>
                <form onSubmit={(e) => { e.preventDefault(); saveToFirestore('videos', editingVideo, editingVideo.id, () => setEditingVideo(null)); }} className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-4 block font-black text-center">Assign to Work Pillar</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Animations & Motion', 'AI Generated'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEditingVideo({...editingVideo, pillar: p as any})}
                          className={cn(
                            "px-4 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all text-center",
                            editingVideo.pillar === p ? "bg-white text-black border-white" : "glass border-white/5 hover:border-white/20"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <InputGroup label="Title" value={editingVideo.title || ''} onChange={v => setEditingVideo({...editingVideo, title: v})} />
                  <InputGroup label="Video URL" value={editingVideo.url || ''} onChange={v => setEditingVideo({...editingVideo, url: v})} />
                  <InputGroup label="Thumbnail URL" value={editingVideo.thumbnail || ''} onChange={v => setEditingVideo({...editingVideo, thumbnail: v})} />
                  <InputGroup label="Description" value={editingVideo.description || ''} onChange={v => setEditingVideo({...editingVideo, description: v})} isTextarea />
                  <div className="flex gap-4 pt-6">
                    <button 
                      type="submit" 
                      disabled={isSubmitting || Object.keys(uploadProgress).length > 0}
                      className="flex-1 py-4 bg-brand-accent text-brand-bg font-black uppercase tracking-widest rounded-2xl disabled:opacity-50"
                    >
                      {Object.keys(uploadProgress).length > 0 ? 'Wait for uploads...' : 'Save Video'}
                    </button>
                    <button type="button" onClick={() => setEditingVideo(null)} className="px-8 py-4 glass rounded-2xl">Cancel</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lab Modal */}
        <AnimatePresence>
          {editingLab && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6">
              <div className="w-full max-w-2xl glass rounded-3xl p-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-10">Lab Record</h2>
                <form onSubmit={(e) => { e.preventDefault(); saveToFirestore('labItems', editingLab, editingLab.id, () => setEditingLab(null)); }} className="space-y-6">
                  <InputGroup label="Title" value={editingLab.title || ''} onChange={v => setEditingLab({...editingLab, title: v})} />
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 block font-bold">Type</label>
                      <select value={editingLab.type} onChange={e => setEditingLab({...editingLab, type: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none appearance-none">
                        {['Experiment', 'Learning', 'AI', 'Vibe'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <InputGroup label="Date" value={editingLab.date || ''} onChange={v => setEditingLab({...editingLab, date: v})} />
                  </div>
                  <InputGroup label="Content" value={editingLab.content || ''} onChange={v => setEditingLab({...editingLab, content: v})} isTextarea />
                  <InputGroup label="Code Snippet" value={editingLab.code || ''} onChange={v => setEditingLab({...editingLab, code: v})} isTextarea />
                  <label className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 block font-bold">Cover Image</label>
                  <UploadBox field="image" value={editingLab.image} onUpload={handleFileUpload} progress={uploadProgress} status={uploadStatus} state={editingLab} stateSetter={setEditingLab} />
                  <ListManager label="Tools" items={editingLab.tools || []} onAdd={v => setEditingLab({...editingLab, tools: [...(editingLab.tools || []), v]})} onRemove={i => setEditingLab({...editingLab, tools: editingLab.tools?.filter((_, idx) => idx !== i)})} />
                  <div className="flex gap-4 pt-6">
                    {Object.keys(uploadProgress).length > 0 && (
                      <button type="button" onClick={() => setUploadProgress({})} className="px-4 py-4 border border-brand-accent/30 text-brand-accent rounded-2xl hover:bg-brand-accent/10 transition-all"><Zap size={16}/></button>
                    )}
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className={cn(
                        "flex-1 py-4 font-black uppercase tracking-widest rounded-2xl disabled:opacity-50",
                        Object.keys(uploadProgress).length > 0 ? "bg-white/10 text-white/40" : "bg-brand-accent text-brand-bg"
                      )}
                    >
                      {isSubmitting ? 'Syncing...' : Object.keys(uploadProgress).length > 0 ? 'Wait for Sync...' : 'Publish'}
                    </button>
                    <button type="button" onClick={() => setEditingLab(null)} className="px-8 py-4 glass rounded-2xl">Cancel</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gallery Image Modal */}
        <AnimatePresence>
          {editingGalleryImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6">
              <div className="w-full max-w-2xl glass rounded-3xl p-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-10">Archive Record</h2>
                <form onSubmit={(e) => { e.preventDefault(); saveToFirestore('gallery', editingGalleryImage, editingGalleryImage.id, () => setEditingGalleryImage(null)); }} className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-4 block font-black text-center">Assign to Work Pillar</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Illustration & Design', 'AI Generated'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEditingGalleryImage({...editingGalleryImage, pillar: p as any})}
                          className={cn(
                            "px-4 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all text-center",
                            editingGalleryImage.pillar === p ? "bg-white text-black border-white" : "glass border-white/5 hover:border-white/20"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <InputGroup label="Image URL" value={editingGalleryImage.url || ''} onChange={v => setEditingGalleryImage({...editingGalleryImage, url: v})} />
                  <InputGroup label="Software" value={editingGalleryImage.software || ''} onChange={v => setEditingGalleryImage({...editingGalleryImage, software: v})} />
                  <InputGroup label="Context/Info" value={editingGalleryImage.info || ''} onChange={v => setEditingGalleryImage({...editingGalleryImage, info: v})} isTextarea />
                  <ListManager label="Tags" items={editingGalleryImage.tags || []} onAdd={v => setEditingGalleryImage({...editingGalleryImage, tags: [...(editingGalleryImage.tags || []), v]})} onRemove={i => setEditingGalleryImage({...editingGalleryImage, tags: editingGalleryImage.tags?.filter((_, idx) => idx !== i)})} />
                  <div className="flex gap-4 pt-6">
                    <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-brand-accent text-brand-bg font-black uppercase tracking-widest rounded-2xl">Publish</button>
                    <button type="button" onClick={() => setEditingGalleryImage(null)} className="px-8 py-4 glass rounded-2xl">Cancel</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Gallery Modal */}
        <AnimatePresence>
          {bulkGalleryQueue.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/98 flex items-center justify-center p-4 md:p-6 backdrop-blur-3xl">
              <div className="w-full max-w-7xl h-full max-h-[90vh] glass rounded-[2rem] md:rounded-[3rem] border border-white/10 flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                
                {/* Header */}
                <div className="px-6 md:px-12 py-6 md:py-8 bg-brand-bg/60 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                      Archive Cloud Sync
                      <span className="px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-[10px] text-brand-accent">{bulkGalleryQueue.length} Assets</span>
                    </h2>
                    <p className="text-brand-muted uppercase text-[8px] mt-2 tracking-widest flex items-center gap-2">
                       <Compass size={10} /> Batch upload to the global production archive
                    </p>
                  </div>
                  
                  <div className="flex gap-4 w-full md:w-auto">
                     <button 
                       onClick={async () => {
                         if (!confirm(`Initialize cloud sync for ${bulkGalleryQueue.filter(it => it.status !== 'Uploaded').length} assets?`)) return;
                         setIsSubmitting(true);
                         const newQueue = [...bulkGalleryQueue];
                         
                         for (let i = 0; i < newQueue.length; i++) {
                           const item = newQueue[i];
                           if (item.status === 'Uploaded') continue;
                           
                           try {
                             item.status = 'Uploading...';
                             setBulkGalleryQueue([...newQueue]);
                             
                             // Upload file
                             const url = await handleFileUpload(item.file, 'bulk', null);
                             item.url = url as string;
                             item.status = 'Syncing...';
                             item.progress = 100;
                             setBulkGalleryQueue([...newQueue]);
                             
                             // Save to Firestore with CURRENT state (allows user to keep editing other items)
                             const payload = { 
                               url: item.url, 
                               pillar: bulkPillar,
                               tags: [...bulkTags, ...item.tags],
                               software: item.software || '',
                               info: item.info || '',
                               createdAt: serverTimestamp(),
                               updatedAt: serverTimestamp()
                             };
                             const docRef = await addDoc(collection(db, 'gallery'), payload);
                             item.dbId = docRef.id;
                             
                             item.status = 'Uploaded';
                             setBulkGalleryQueue([...newQueue]);
                           } catch (err) {
                             item.status = 'Failed';
                             setBulkGalleryQueue([...newQueue]);
                           }
                         }
                         setIsSubmitting(false);
                         if (newQueue.every(it => it.status === 'Uploaded')) {
                           // Cleanup revoke URLs
                           bulkGalleryQueue.forEach(it => { if(it.previewUrl) URL.revokeObjectURL(it.previewUrl); });
                           setBulkGalleryQueue([]);
                           setBulkTags([]);
                         }
                       }}
                       disabled={isSubmitting}
                       className="flex-grow md:flex-initial px-10 py-4 bg-brand-accent text-brand-bg font-black uppercase tracking-widest rounded-xl text-[10px] hover:scale-105 transition-all shadow-xl disabled:opacity-30"
                     >
                       {isSubmitting ? 'Syncing Queue...' : 'Begin Cloud Sync'}
                     </button>
                     <button 
                       onClick={() => { 
                         if(confirm("Discard queue? (Local previews will be lost)")) { 
                           bulkGalleryQueue.forEach(it => { if(it.previewUrl) URL.revokeObjectURL(it.previewUrl); });
                           setBulkGalleryQueue([]); 
                           setBulkTags([]); 
                         }
                       }} 
                       className="px-6 py-4 border border-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500/20 transition-colors"
                     >
                       <X size={16} />
                     </button>
                  </div>
                </div>

                {/* Batch Progress Bar */}
                {isSubmitting && (
                  <div className="w-full bg-white/5 h-1 relative overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(bulkGalleryQueue.filter(it => it.status === 'Uploaded').length / bulkGalleryQueue.length) * 100}%` }}
                        className="absolute inset-0 bg-brand-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]"
                     />
                  </div>
                )}

                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                  {/* Global Settings - Compact Sidebar */}
                  <div className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-white/5 p-6 md:p-8 space-y-8 overflow-y-auto shrink-0 bg-white/[0.01]">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Batch Pillar</h3>
                         <Compass size={12} className="text-brand-accent/40" />
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {['Illustration & Design', 'AI Generated'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setBulkPillar(p as ProjectPillar)}
                            className={cn(
                               "px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all text-left",
                               bulkPillar === p ? "bg-white text-black border-white" : "glass border-white/5 hover:border-white/20"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Batch Scope</h3>
                         <TagIcon size={12} className="text-brand-accent/40" />
                      </div>
                      <p className="text-[9px] text-brand-muted leading-relaxed">Specific tags applied to every instance in this batch.</p>
                      <div className="p-4 glass rounded-[1.5rem] border border-white/5">
                        <ListManager 
                          label="" 
                          items={bulkTags} 
                          onAdd={(t) => setBulkTags([...bulkTags, t])}
                          onRemove={(i) => setBulkTags(bulkTags.filter((_, idx) => idx !== i))}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/5 space-y-3">
                       <div className="flex justify-between text-[8px] uppercase tracking-widest">
                         <span className="text-brand-muted">Total Payload</span> 
                         <span className="text-white font-bold">{(bulkGalleryQueue.reduce((acc, it) => acc + it.file.size, 0) / (1024 * 1024)).toFixed(2)} MB</span>
                       </div>
                       <div className="flex justify-between text-[8px] uppercase tracking-widest">
                         <span className="text-brand-muted">Uploaded</span> 
                         <span className="text-white font-bold">{bulkGalleryQueue.filter(it => it.status === 'Uploaded').length} / {bulkGalleryQueue.length}</span>
                       </div>
                    </div>

                    <div className="p-4 rounded-xl bg-brand-accent/[0.03] border border-brand-accent/10 text-[8px] text-brand-accent/60 uppercase tracking-widest leading-normal">
                       Tip: Local previews (indicated by 'Ready' status) allow you to view images before they reach the cloud.
                    </div>
                  </div>

                  {/* Individual Editor - More Compact Cards */}
                  <div className="flex-grow p-4 md:p-8 overflow-y-auto custom-scrollbar space-y-4 content-start bg-black/20">
                    {bulkGalleryQueue.map((item, idx) => (
                      <div key={idx} className={cn(
                        "p-4 md:p-6 glass rounded-2xl border transition-all flex flex-col sm:flex-row gap-6 relative group",
                        item.status === 'Uploaded' ? "border-green-500/30 bg-green-500/[0.02]" : 
                        item.status === 'Uploading...' ? "border-brand-accent/30 bg-brand-accent/[0.02] shadow-[0_0_30px_rgba(var(--accent-rgb),0.05)]" : "border-white/5"
                      )}>
                        
                        {/* Status Icon Overlay */}
                        <div className="absolute top-4 right-4 z-10">
                           {item.status === 'Uploaded' && <CheckCircle2 size={18} className="text-green-400" />}
                           {item.status === 'Uploading...' && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Plus size={18} className="text-brand-accent" /></motion.div>}
                           {item.status === 'Failed' && <AlertCircle size={18} className="text-red-500" />}
                           {item.status === 'Ready' && <ImageIcon size={14} className="opacity-20" />}
                        </div>

                        {/* Thumbnail View */}
                        <div className="w-full sm:w-32 aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0 relative">
                           {item.url || item.previewUrl ? (
                             <img src={item.url || item.previewUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                           ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                <ImageIcon size={24} className="opacity-10" />
                                {item.status === 'Uploading...' && (
                                  <div className="space-y-2 w-full px-4">
                                     <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div animate={{ width: `${item.progress}%` }} className="h-full bg-brand-accent" />
                                     </div>
                                     <span className="text-[7px] font-black uppercase text-center block text-brand-accent">{item.progress}%</span>
                                  </div>
                                )}
                             </div>
                           )}
                        </div>

                        {/* Controls */}
                        <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6">
                           <div className="space-y-4">
                              <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-brand-muted/60">Asset Origin</span>
                                <h4 className="text-xs font-bold uppercase truncate max-w-[200px]">{item.file.name}</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <span className="text-[7px] font-black uppercase tracking-widest text-brand-muted/40">Software</span>
                                  <input 
                                    type="text" 
                                    placeholder="C4D, MJ..." 
                                    value={item.software || ''} 
                                    disabled={item.status === 'Uploading...' || item.status === 'Syncing...'}
                                    onChange={async (e) => {
                                      const newVal = e.target.value;
                                      const newQueue = [...bulkGalleryQueue];
                                      newQueue[idx].software = newVal;
                                      setBulkGalleryQueue(newQueue);
                                      
                                      // If already uploaded, update Firestore immediately
                                      if (item.dbId) {
                                        await updateDoc(doc(db, 'gallery', item.dbId), { software: newVal });
                                      }
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[9px] outline-none focus:border-brand-accent transition-colors"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[7px] font-black uppercase tracking-widest text-brand-muted/40">Context</span>
                                  <input 
                                    type="text" 
                                    placeholder="Brief info..." 
                                    value={item.info || ''} 
                                    disabled={item.status === 'Uploading...' || item.status === 'Syncing...'}
                                    onChange={async (e) => {
                                      const newVal = e.target.value;
                                      const newQueue = [...bulkGalleryQueue];
                                      newQueue[idx].info = newVal;
                                      setBulkGalleryQueue(newQueue);

                                      if (item.dbId) {
                                        await updateDoc(doc(db, 'gallery', item.dbId), { info: newVal });
                                      }
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[9px] outline-none focus:border-brand-accent transition-colors"
                                  />
                                </div>
                              </div>
                           </div>

                           <div className="space-y-2">
                             <div className="flex justify-between items-center">
                                <span className="text-[7px] font-black uppercase tracking-widest text-brand-muted/40">Item Specific Tags</span>
                                {item.tags.length > 0 && <span className="text-[7px] text-brand-accent font-bold uppercase">{item.tags.length} Active</span>}
                             </div>
                             <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl min-h-[50px]">
                               <ListManager 
                                 label="" 
                                 items={item.tags} 
                                 onAdd={async (t) => {
                                   if(item.status === 'Uploading...') return;
                                   const newItems = [...item.tags, t];
                                   const newQueue = [...bulkGalleryQueue];
                                   newQueue[idx].tags = newItems;
                                   setBulkGalleryQueue(newQueue);

                                   if (item.dbId) {
                                      await updateDoc(doc(db, 'gallery', item.dbId), { tags: [...bulkTags, ...newItems] });
                                   }
                                 }}
                                 onRemove={async (ti) => {
                                   if(item.status === 'Uploading...') return;
                                   const newItems = item.tags.filter((_, tidx) => tidx !== ti);
                                   const newQueue = [...bulkGalleryQueue];
                                   newQueue[idx].tags = newItems;
                                   setBulkGalleryQueue(newQueue);

                                   if (item.dbId) {
                                      await updateDoc(doc(db, 'gallery', item.dbId), { tags: [...bulkTags, ...newItems] });
                                   }
                                 }}
                               />
                             </div>
                           </div>
                        </div>

                        {/* Removal */}
                        {item.status !== 'Uploading...' && item.status !== 'Uploaded' && (
                          <div className="absolute bottom-4 right-4 flex items-center gap-2">
                             <button 
                                onClick={() => setBulkGalleryQueue(bulkGalleryQueue.filter((_, bi) => bi !== idx))}
                                className="p-2 text-white/20 hover:text-red-400 transition-colors"
                             >
                               <Trash2 size={14} />
                             </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

/* Helper Components for Admin Forms */
const InputGroup = ({ label, value, onChange, isTextarea = false, description }: { label: string, value: string, onChange: (v: string) => void, isTextarea?: boolean, description?: string }) => (
  <div>
    <label className="text-[10px] uppercase tracking-widest text-brand-muted mb-4 block font-black">
      {label}
      {description && <span className="block mt-1 text-[8px] font-normal tracking-wide opacity-60 normal-case">{description}</span>}
    </label>
    {isTextarea ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent min-h-[100px] resize-none" />
    ) : (
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent transition-all" />
    )}
  </div>
);

const UploadBox = ({ field, value, onUpload, progress, status, state, stateSetter }: any) => {
  const uploadKey = Object.keys(progress).find(key => key.startsWith(`${field}_`));
  const isUploading = !!uploadKey;
  const currentProgress = uploadKey ? progress[uploadKey] : 0;
  const currentStatus = uploadKey ? status[uploadKey] : '';

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex-grow relative group">
          <input type="text" value={value || ''} onChange={e => stateSetter((prev: any) => ({...prev, [field]: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-brand-accent outline-none text-xs" placeholder="Paste direct URL link here..." />
          {!value && !isUploading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-[8px] font-black uppercase tracking-widest text-brand-muted">← Fast Link Fallback</span>
            </div>
          )}
        </div>
        <label className={cn(
          "cursor-pointer p-4 rounded-2xl transition-all",
          isUploading ? "bg-brand-accent text-brand-bg animate-pulse" : "glass hover:bg-white/10"
        )}>
          {isUploading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Plus size={20} /></motion.div> : <ImageIcon size={20} />}
          <input type="file" className="hidden" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if(file) {
              onUpload(file, field, stateSetter);
              e.target.value = ''; // Reset to allow same file selection
            }
          }} />
        </label>
      </div>
      {isUploading && (
        <div className="space-y-2">
          <div className="w-full bg-white/10 h-[2px] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${currentProgress}%` }} 
              className="bg-brand-accent h-full shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" 
            />
          </div>
          <p className="text-[8px] font-black uppercase tracking-widest text-brand-accent">
            Uploading... {currentProgress}% 
            <span className="ml-2 opacity-60 font-medium normal-case tracking-normal">({currentStatus})</span>
          </p>
        </div>
      )}
      {value && !isUploading && (
        <div className="aspect-video w-32 rounded-lg overflow-hidden border border-white/10 relative group">
          <img src={value} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" alt="" />
          <button onClick={() => stateSetter((p: any) => ({...p, [field]: ''}))} className="absolute inset-0 bg-red-500/80 items-center justify-center hidden group-hover:flex"><Trash2 size={16} /></button>
        </div>
      )}
    </div>
  );
};

const ListManager = ({ label, items, onAdd, onRemove }: { label: string, items: string[], onAdd: (v: string) => void, onRemove: (i: number) => void }) => {
  const [val, setVal] = useState('');
  return (
    <div className="space-y-4">
      <label className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 block font-black">{label}</label>
      <div className="flex gap-2">
        <input type="text" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); onAdd(val); setVal(''); } }} className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-accent text-sm" placeholder="Add entry..." />
        <button type="button" onClick={() => { onAdd(val); setVal(''); }} className="px-4 bg-white/10 rounded-xl hover:bg-brand-accent hover:text-brand-bg transition-all"><Plus size={16}/></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span key={i} className="px-3 py-1 glass rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 group">
            {it} <button type="button" onClick={() => onRemove(i)} className="opacity-30 group-hover:opacity-100 hover:text-red-400"><X size={10} /></button>
          </span>
        ))}
      </div>
    </div>
  );
};

const ImagePhaseManager = ({ title, field, images, onUpload, progress, status, state, stateSetter, onRemove, hideHeading = false }: any) => {
  const uploadingThisField = Object.keys(progress).filter(key => key.startsWith(`${field}_`));

  return (
    <div className="space-y-6">
      {!hideHeading && <h4 className="text-xl font-black uppercase tracking-tighter">{title}</h4>}
      <div className="flex gap-4">
        <input type="text" placeholder="Paste image URL..." className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent text-sm" onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); const v = (e.target as HTMLInputElement).value; if(v){ stateSetter((prev: any) => ({...prev, [field]: [...(prev[field] || []), v]})); (e.target as HTMLInputElement).value = ''; } } }} />
        <label className="cursor-pointer px-6 bg-white/10 rounded-2xl hover:bg-brand-accent hover:text-brand-bg transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs">
          <Plus size={18} /> Upload Image
          <input type="file" className="hidden" accept="image/*" multiple onChange={e => { 
            if(e.target.files) {
              Array.from(e.target.files).forEach(f => onUpload(f, field, stateSetter));
              e.target.value = ''; // Reset
            }
          }} />
        </label>
      </div>
      
      {uploadingThisField.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 glass rounded-2xl border border-brand-accent/20 border-dashed">
          {uploadingThisField.map(key => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-brand-accent">
                <span className="truncate max-w-[100px]">{key.split('_').pop()}</span>
                <span>{progress[key]}%</span>
              </div>
              <p className="text-[7px] text-white/40 truncate mb-1">{status[key]}</p>
              <div className="w-full bg-white/5 h-[3px] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress[key]}%` }} className="h-full bg-brand-accent" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {images.map((img: string, i: number) => (
          <div key={i} className="aspect-square relative group rounded-2xl overflow-hidden border border-white/5">
            <img src={img} className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-110" alt="" />
            <button type="button" onClick={() => onRemove(i)} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={24} className="text-white"/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ColorPaletteManager = ({ colors, onChange }: { colors: { hex: string, emotion: string }[], onChange: (v: { hex: string, emotion: string }[]) => void }) => {
  const [newColor, setNewColor] = useState({ hex: '#000000', emotion: '' });
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input type="color" value={newColor.hex} onChange={e => setNewColor({...newColor, hex: e.target.value})} className="w-16 h-12 bg-transparent border-none outline-none cursor-pointer" />
        <input type="text" value={newColor.emotion} onChange={e => setNewColor({...newColor, emotion: e.target.value})} className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" placeholder="Emotion/Feeling..." />
        <button type="button" onClick={() => { if(newColor.emotion){ onChange([...colors, newColor]); setNewColor({ hex: '#000000', emotion: '' }); } }} className="px-6 bg-white/10 rounded-xl hover:bg-brand-accent hover:text-brand-bg transition-all"><Plus size={18}/></button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {colors.map((c, i) => (
          <div key={i} className="p-4 glass rounded-2xl flex items-center gap-4 relative group">
            <div className="w-10 h-10 rounded-lg shadow-inner" style={{ backgroundColor: c.hex }} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">{c.hex}</p>
              <p className="text-xs text-brand-muted">{c.emotion}</p>
            </div>
            <button type="button" onClick={() => onChange(colors.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let rafId: number;
    let mouseX = -100;
    let mouseY = -100;

    const updatePosition = () => {
      cursor.style.setProperty('--x', `${mouseX - 6}px`);
      cursor.style.setProperty('--y', `${mouseY - 6}px`);
      rafId = requestAnimationFrame(updatePosition);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseEnter = () => {
      cursor.style.setProperty('--scale', '0.5');
    };

    const handleMouseLeave = () => {
      cursor.style.setProperty('--scale', '1');
    };

    rafId = requestAnimationFrame(updatePosition);
    window.addEventListener('mousemove', onMouseMove);

    const attachListeners = () => {
      const targets = document.querySelectorAll('a, button, .project-card, [role="button"], input, textarea, select, label');
      targets.forEach(target => {
        target.addEventListener('mouseenter', handleMouseEnter);
        target.addEventListener('mouseleave', handleMouseLeave);
      });
    };

    attachListeners();

    const observer = new MutationObserver(() => {
      attachListeners();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
      observer.disconnect();
      const targets = document.querySelectorAll('a, button, .project-card, [role="button"], input, textarea, select, label');
      targets.forEach(target => {
        target.removeEventListener('mouseenter', handleMouseEnter);
        target.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  return <div id="cursor-dot" ref={cursorRef} />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <Router>
            <CustomCursor />
            <div className="min-h-screen flex flex-col selection:bg-brand-accent selection:text-brand-bg">
              <Navbar />
              <main className="flex-grow">
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/work" element={<Work />} />
                    <Route path="/work/:id" element={<CaseStudy />} />
                    <Route path="/lab" element={<Lab />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/admin" element={<Admin />} />
                  </Routes>
                </AnimatePresence>
              </main>
              <Footer />
            </div>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
