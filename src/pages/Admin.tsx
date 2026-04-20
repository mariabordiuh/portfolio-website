import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Trash2, Edit3, Search, LogOut, Info, Rocket, 
  Check, CheckCircle2, Image as ImageIcon,
  Compass, Zap, Cpu, Code, ArrowRight
} from 'lucide-react';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { auth } from '../firebase-auth';
import { db } from '../firebase-firestore';
import { storage } from '../firebase-storage';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';
import { handleFirestoreError, OperationType } from '../utils/error-handlers';
import { toReadableGoogleSignInError } from '../utils/auth-errors';
import { PageTransition } from '../components/PageTransition';
import { cn } from '../lib/utils';
import { Project, Video, LabItem, GalleryImage, ProjectPillar, HomeHeroSettings } from '../types';
import { 
  InputGroup, UploadBox, ListManager, ImagePhaseManager
} from '../components/AdminComponents';
import {
  DEFAULT_HOME_HERO_SETTINGS,
  HOME_HERO_SETTINGS_ID,
  normalizeHomeHeroSettings,
} from '../utils/home-hero';
import {
  inferProjectContentType,
  normalizePillar,
  splitTagLikeString,
  uniqueStrings,
  WORK_PILLARS,
} from '../utils/portfolio';

const STEP_ICONS = {
  identity: <Compass size={14} />,
  story: <Zap size={14} />,
  process: <Cpu size={14} />,
  visuals: <ImageIcon size={14} />,
  publish: <Code size={14} />,
};

const PROJECT_STEPS_BY_PILLAR: Record<ProjectPillar, { id: string; label: string; icon: React.ReactNode }[]> = {
  'Art Direction': [
    { id: 'identity', label: 'Identity', icon: STEP_ICONS.identity },
    { id: 'story', label: 'Narrative', icon: STEP_ICONS.story },
    { id: 'process', label: 'Process', icon: STEP_ICONS.process },
    { id: 'visuals', label: 'Visuals', icon: STEP_ICONS.visuals },
    { id: 'publish', label: 'Publish', icon: STEP_ICONS.publish },
  ],
  'AI Generated': [
    { id: 'identity', label: 'Identity', icon: STEP_ICONS.identity },
    { id: 'visuals', label: 'Asset', icon: STEP_ICONS.visuals },
    { id: 'publish', label: 'Publish', icon: STEP_ICONS.publish },
  ],
  'Illustration & Design': [
    { id: 'identity', label: 'Identity', icon: STEP_ICONS.identity },
    { id: 'visuals', label: 'Gallery', icon: STEP_ICONS.visuals },
    { id: 'publish', label: 'Publish', icon: STEP_ICONS.publish },
  ],
  'Animation & Motion': [
    { id: 'identity', label: 'Identity', icon: STEP_ICONS.identity },
    { id: 'visuals', label: 'Motion', icon: STEP_ICONS.visuals },
    { id: 'publish', label: 'Publish', icon: STEP_ICONS.publish },
  ],
};

const createEmptyProject = (pillar: ProjectPillar = 'Art Direction'): Partial<Project> => ({
  title: '',
  pillar,
  contentType: pillar === 'Art Direction' ? 'art-direction' : inferProjectContentType({ pillar }),
  aiSubtype: pillar === 'AI Generated' ? 'ai-image' : undefined,
  motionType: pillar === 'Animation & Motion' ? 'embed' : undefined,
  category: '',
  categories: [],
  description: '',
  thumbnail: '',
  heroImage: '',
  images: [],
  mediaUrl: '',
  embedUrl: '',
  tools: [],
  year: '',
  client: '',
  role: '',
  credits: [],
  creativeTension: '',
  globalContext: '',
  approach: '',
  moodboardImages: [],
  sketchImages: [],
  explorationType: 'masonry',
  slotMachineGridSize: 4,
  slotMachineFps: 12,
  explorationImages: [],
  outcomeImages: [],
  outcomeCopy: '',
});

const applyProjectPillar = (draft: Partial<Project>, pillar: ProjectPillar): Partial<Project> => ({
  ...draft,
  pillar,
  contentType: pillar === 'Art Direction' ? 'art-direction' : inferProjectContentType({ ...draft, pillar }),
  aiSubtype: pillar === 'AI Generated' ? draft.aiSubtype || 'ai-image' : undefined,
  motionType: pillar === 'Animation & Motion' ? draft.motionType || 'embed' : undefined,
});

export const Admin = () => {
  const { user, loading, isAdmin: isUserAdmin } = useContext(AuthContext);
  const { projects, videos, labItems, galleryImages, homeHero } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState<'projects' | 'videos' | 'lab' | 'gallery' | 'hero'>('projects');
  
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingVideo, setEditingVideo] = useState<Partial<Video> | null>(null);
  const [editingLab, setEditingLab] = useState<Partial<LabItem> | null>(null);
  const [editingGalleryImage, setEditingGalleryImage] = useState<Partial<GalleryImage> | null>(null);
  const [homeHeroDraft, setHomeHeroDraft] = useState<HomeHeroSettings>(DEFAULT_HOME_HERO_SETTINGS);
  
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
  const [homeHeroNotice, setHomeHeroNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  
  const [projectStep, setProjectStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>({});
  const [storageConnected, setStorageConnected] = useState<'testing' | 'ok' | 'blocked'>('testing');
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const testStorage = async () => {
      try {
        await fetch(`https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o`, { method: 'GET', mode: 'no-cors' });
        setStorageConnected('ok');
      } catch (e) {
        setStorageConnected('blocked');
      }
    };
    testStorage();
    const interval = setInterval(testStorage, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setHomeHeroDraft(homeHero);
  }, [homeHero]);

  useEffect(() => {
    if (!homeHeroNotice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setHomeHeroNotice(null);
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [homeHeroNotice]);

  const handleFileUpload = async (file: File, field: string, stateSetter: any): Promise<string | undefined> => {
    if (!file) return;
    if (!auth.currentUser) {
      alert("STOP: You are not logged in. Firebase blocks all anonymous uploads.");
      return;
    }

    const uploadId = `${field}_${Date.now()}_${file.name}`;
    setUploadProgress(prev => ({ ...prev, [uploadId]: 1 }));
    setUploadStatus(prev => ({ ...prev, [uploadId]: 'Verifying Sync...' }));

    return new Promise(async (resolve, reject) => {
      const storagePath = `${activeTab}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, storagePath);

      if (file.size < 50 * 1024 * 1024) {
        try {
          setUploadProgress(prev => ({ ...prev, [uploadId]: 30 }));
          setUploadStatus(prev => ({ ...prev, [uploadId]: 'Streaming...' }));
          
          const result = await uploadBytes(storageRef, file, { 
            contentType: file.type || 'image/jpeg'
          });
          
          setUploadProgress(prev => ({ ...prev, [uploadId]: 95 }));
          const downloadURL = await getDownloadURL(result.ref);
          
          if (stateSetter) {
            stateSetter((prev: any) => {
              if (!prev) return prev;
              if (Array.isArray(prev[field])) return { ...prev, [field]: [...prev[field], downloadURL] };
              return { ...prev, [field]: downloadURL };
            });
          }
          
          setUploadProgress(prev => { const n = { ...prev }; delete n[uploadId]; return n; });
          setUploadStatus(prev => { const n = { ...prev }; delete n[uploadId]; return n; });
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
        return;
      }

      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(prev => ({ ...prev, [uploadId]: Math.max(progress, 1) }));
          setUploadStatus(prev => ({ ...prev, [uploadId]: `${snapshot.state}` }));
        }, 
        (error) => {
          setUploadProgress(prev => { const n = { ...prev }; delete n[uploadId]; return n; });
          reject(error);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          if (stateSetter) {
            stateSetter((prev: any) => {
              if (!prev) return prev;
              if (Array.isArray(prev[field])) return { ...prev, [field]: [...prev[field], downloadURL] };
              return { ...prev, [field]: downloadURL };
            });
          }
          setUploadProgress(prev => { const n = { ...prev }; delete n[uploadId]; return n; });
          setUploadStatus(prev => { const n = { ...prev }; delete n[uploadId]; return n; });
          resolve(downloadURL);
        }
      );
    });
  };

  const handleLogin = async () => {
    try {
      setLoginError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      setLoginError(toReadableGoogleSignInError(error));
    }
  };

  const closeProjectEditor = () => {
    setEditingProject(null);
    setProjectStep(0);
  };

  const sanitizeProjectDraft = (draft: Partial<Project>) => {
    const pillar = normalizePillar(draft.pillar);
    const title = draft.title?.trim() || '';
    const description = draft.description?.trim() || '';
    const tools = uniqueStrings(draft.tools);

    if (pillar === 'Art Direction') {
      const categories = uniqueStrings(
        draft.categories?.length ? draft.categories : splitTagLikeString(draft.category),
      );
      const heroImage = draft.heroImage?.trim() || draft.thumbnail?.trim() || '';
      const outcomeImages = uniqueStrings(
        draft.outcomeImages?.length ? draft.outcomeImages : draft.outcomeVisuals,
      );

      return {
        title,
        pillar,
        contentType: 'art-direction',
        category: categories.join(', '),
        categories,
        description,
        thumbnail: heroImage,
        heroImage,
        images: [],
        mediaUrl: '',
        embedUrl: '',
        tools,
        year: draft.year?.trim() || '',
        client: draft.client?.trim() || '',
        role: draft.role?.trim() || '',
        creativeTension: draft.creativeTension?.trim() || '',
        globalContext: draft.globalContext?.trim() || '',
        approach: draft.approach?.trim() || '',
        moodboardImages: uniqueStrings(draft.moodboardImages),
        sketchImages: uniqueStrings(draft.sketchImages),
        explorationType: draft.explorationType || 'masonry',
        slotMachineGridSize: draft.slotMachineGridSize ?? 4,
        slotMachineFps: draft.slotMachineFps ?? 12,
        explorationImages: uniqueStrings(draft.explorationImages),
        outcomeImages,
        outcomeVisuals: outcomeImages,
        outcomeCopy: draft.outcomeCopy?.trim() || draft.outcomeResultCopy?.trim() || '',
        outcomeResultCopy: draft.outcomeCopy?.trim() || draft.outcomeResultCopy?.trim() || '',
        credits: uniqueStrings(draft.credits),
      };
    }

    if (pillar === 'AI Generated') {
      const aiSubtype = draft.aiSubtype === 'ai-video' ? 'ai-video' : 'ai-image';
      const thumbnail = draft.thumbnail?.trim() || draft.heroImage?.trim() || '';
      const mediaUrl = aiSubtype === 'ai-video' ? draft.mediaUrl?.trim() || draft.videoUrl?.trim() || '' : '';

      return {
        title,
        pillar,
        contentType: aiSubtype,
        aiSubtype,
        category: '',
        categories: [],
        description,
        thumbnail,
        heroImage: thumbnail,
        images: aiSubtype === 'ai-image' && thumbnail ? [thumbnail] : [],
        mediaUrl,
        videoUrl: mediaUrl,
        embedUrl: '',
        tools,
      };
    }

    if (pillar === 'Illustration & Design') {
      const images = uniqueStrings(draft.images?.length ? draft.images : [draft.thumbnail]);
      const thumbnail = draft.thumbnail?.trim() || images[0] || '';

      return {
        title,
        pillar,
        contentType: 'illustration',
        category: '',
        categories: [],
        description,
        thumbnail,
        heroImage: thumbnail,
        images,
        mediaUrl: '',
        embedUrl: '',
        tools,
      };
    }

    const motionType = draft.motionType || 'embed';
    const embedUrl = motionType === 'embed' ? draft.embedUrl?.trim() || '' : '';
    const mediaUrl = motionType === 'embed' ? '' : draft.mediaUrl?.trim() || draft.videoUrl?.trim() || '';
    const thumbnail = draft.thumbnail?.trim() || (motionType === 'gif' ? mediaUrl : '');

    return {
      title,
      pillar,
      contentType: motionType === 'embed' ? 'motion-embed' : motionType === 'gif' ? 'motion-gif' : 'motion-video',
      motionType,
      category: '',
      categories: [],
      description,
      thumbnail,
      heroImage: thumbnail,
      images: motionType === 'gif' && mediaUrl ? [mediaUrl] : [],
      mediaUrl,
      videoUrl: mediaUrl,
      embedUrl,
      tools,
    };
  };

  const saveProject = async () => {
    if (!editingProject) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = sanitizeProjectDraft(editingProject);
      const isEditing = Boolean(editingProject.id);
      const reference = isEditing
        ? doc(db, 'projects', editingProject.id as string)
        : doc(collection(db, 'projects'));

      await setDoc(reference, {
        ...payload,
        createdAt: (editingProject as any).createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      closeProjectEditor();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'projects');
    } finally {
      setIsSubmitting(false);
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

  const saveHomeHero = async () => {
    setIsSubmitting(true);
    setHomeHeroNotice(null);
    try {
      const normalized = normalizeHomeHeroSettings(homeHeroDraft);
      const { id: _id, ...payload } = normalized;

      await setDoc(
        doc(db, 'settings', HOME_HERO_SETTINGS_ID),
        {
          ...payload,
          createdAt: homeHero.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setHomeHeroNotice({ tone: 'success', message: 'Homepage hero saved.' });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, 'settings/homeHero');
      } catch (friendlyError) {
        setHomeHeroNotice({
          tone: 'error',
          message:
            friendlyError instanceof Error ? friendlyError.message : 'something burned. try again.',
        });
      }
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

  const currentProjectPillar = normalizePillar(editingProject?.pillar);
  const projectSteps = PROJECT_STEPS_BY_PILLAR[currentProjectPillar];
  const currentProjectStepId = projectSteps[projectStep]?.id || projectSteps[0].id;

  useEffect(() => {
    if (!editingProject) {
      return;
    }

    if (projectStep > projectSteps.length - 1) {
      setProjectStep(projectSteps.length - 1);
    }
  }, [editingProject, projectStep, projectSteps.length]);

  if (loading) return <div className="pt-40 px-6 min-h-screen text-brand-muted uppercase font-mono tracking-widest text-center">brewing...</div>;

  if (!user || !isUserAdmin) {
    return (
      <PageTransition>
        <div className="pt-40 px-6 min-h-screen flex flex-col items-center justify-center">
          <div className="w-full max-w-md p-12 glass rounded-[3rem] text-center border border-white/5 relative overflow-hidden">
            <div className="grain-overlay" />
            <span className="w-24 h-24 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <LogOut size={48} className="text-brand-accent animate-pulse" />
            </span>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-4">Insecure Link</h1>
            <p className="text-brand-muted mb-8 italic text-sm">Restricted Access: Creative Direction Workspace Only</p>
            {loginError ? (
              <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">Google Sign-In Failed</p>
                <p className="text-sm leading-relaxed text-white/80">{loginError}</p>
              </div>
            ) : null}
            
            {!user ? (
              <button 
                onClick={handleLogin} 
                className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-brand-accent transition-all flex items-center justify-center gap-2"
              >
                Authenticate with Google
              </button>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">Access Denied</p>
                  <p className="text-white text-[10px] opacity-70 truncate font-mono">{user.email}</p>
                </div>
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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mb-20 relative z-20">
          <div className="w-full space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-4 bg-brand-accent/5 border border-brand-accent/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-brand-accent shadow-[0_4px_20px_rgba(var(--accent-rgb),0.05)]"
            >
              <div className="flex items-center gap-3">
                <Info size={14} className="flex-shrink-0" /> 
                <span>Upload Issue? Open the app in a NEW TAB to bypass restricted iframe context.</span>
              </div>
              <button onClick={() => window.open(window.location.href, '_blank')} className="flex items-center gap-2 hover:underline">
                 <Rocket size={12} /> Sync Direct Link
              </button>
            </motion.div>

            <h1 className="text-8xl md:text-9xl font-black tracking-tighter uppercase leading-[0.8]">Base<br/><span className="text-brand-accent">Control.</span></h1>
            
            <div className="mt-12 flex flex-col md:flex-row gap-6 items-center w-full">
              <div className="flex flex-wrap gap-3">
                {(['projects', 'videos', 'lab', 'gallery', 'hero'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
                    className={cn(
                      "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shrink-0",
                      activeTab === tab 
                        ? "bg-brand-accent text-brand-bg border-brand-accent" 
                        : "glass text-brand-muted border-white/5 hover:text-white"
                    )}
                  >
                    {tab === 'hero' ? 'home hero' : tab}
                  </button>
                ))}
              </div>

              {activeTab !== 'hero' ? (
                <>
                  <div className="flex-grow flex items-center gap-4 glass rounded-2xl border border-white/5 px-6 py-2 w-full md:max-w-md focus-within:border-brand-accent/40 transition-all font-mono">
                    <Search size={16} className="text-brand-muted" />
                    <input 
                      type="text" 
                      placeholder={`Filter archive...`} 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none py-3 text-xs uppercase tracking-widest w-full"
                    />
                  </div>
                  
                  <div className="relative group/create shrink-0">
                     <button className="px-8 py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center gap-3 hover:bg-brand-accent transition-all shadow-xl">
                        <Plus size={14} strokeWidth={3} /> Create New
                     </button>
                     <div className="absolute top-full right-0 md:left-0 mt-4 w-52 glass rounded-[2rem] border border-white/10 opacity-0 invisible group-hover/create:opacity-100 group-hover/create:visible transition-all z-[100] overflow-hidden translate-y-2 group-hover/create:translate-y-0 shadow-3xl">
                        <button onClick={() => setEditingProject(createEmptyProject())} className="w-full px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 border-b border-white/5">Project</button>
                        <button onClick={() => setEditingVideo({ title: '', url: '', thumbnail: '', description: '' })} className="w-full px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 border-b border-white/5">Video</button>
                        <button onClick={() => setEditingLab({ title: '', type: 'Experiment', content: '', tools: [], date: new Date().toISOString().split('T')[0] })} className="w-full px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 border-b border-white/5">Lab Item</button>
                        <button onClick={() => setEditingGalleryImage({ url: '', tags: [], software: '', info: '' })} className="w-full px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 border-b border-white/5">Gallery Single</button>
                        <label className="w-full px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 cursor-pointer block">
                          Bulk Sync
                          <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => {
                            if (e.target.files) {
                              const files = Array.from(e.target.files);
                              setBulkGalleryQueue(files.map(f => ({ file: f, previewUrl: URL.createObjectURL(f), tags: [], status: 'Ready', progress: 0 })));
                              e.target.value = '';
                            }
                          }} />
                        </label>
                      </div>
                   </div>
                </>
              ) : (
                <div className="glass rounded-2xl border border-white/5 px-6 py-4 text-[10px] uppercase tracking-[0.24em] text-brand-muted font-mono">
                  Singleton setting: <span className="text-brand-accent">settings/{HOME_HERO_SETTINGS_ID}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {activeTab === 'hero' ? (
            <div className="lg:col-span-3">
              <div className="glass rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="border-b border-white/5 bg-white/[0.02] px-10 py-10">
                  <div className="max-w-4xl space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">Homepage Hero</p>
                    <h2 className="text-5xl font-black uppercase tracking-tighter">Media Control</h2>
                    <p className="max-w-2xl text-sm leading-relaxed text-white/65">
                      Choose whether the first screen uses an image or a video, then set separate
                      desktop and mobile assets. Mobile falls back to desktop when left empty.
                    </p>
                  </div>
                </div>

                <div className="grid gap-10 px-10 py-10 xl:grid-cols-[minmax(0,1.1fr)_22rem]">
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">Hero mode</label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {[
                          ['image', 'Image Hero'],
                          ['video', 'Video Hero'],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setHomeHeroDraft({ ...homeHeroDraft, mode: value as HomeHeroSettings['mode'] })}
                            className={cn(
                              "px-6 py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.22em] border transition-all h-24 flex items-center justify-center",
                              homeHeroDraft.mode === value ? "bg-white text-black border-white shadow-xl" : "glass border-white/5 hover:border-white/20"
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {homeHeroDraft.mode === 'image' ? (
                      <div className="grid gap-8 lg:grid-cols-2">
                        <div className="p-8 glass rounded-[2.5rem] border border-brand-accent/10 space-y-6">
                          <label className="text-[10px] uppercase tracking-widest text-brand-accent block font-black">Desktop image</label>
                          <UploadBox
                            field="desktopImage"
                            value={homeHeroDraft.desktopImage}
                            onUpload={handleFileUpload}
                            progress={uploadProgress}
                            status={uploadStatus}
                            state={homeHeroDraft}
                            stateSetter={setHomeHeroDraft}
                            accept="image/*"
                            placeholder="Paste desktop hero image URL..."
                          />
                        </div>

                        <div className="p-8 glass rounded-[2.5rem] border border-white/5 space-y-6">
                          <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">Mobile image</label>
                          <UploadBox
                            field="mobileImage"
                            value={homeHeroDraft.mobileImage}
                            onUpload={handleFileUpload}
                            progress={uploadProgress}
                            status={uploadStatus}
                            state={homeHeroDraft}
                            stateSetter={setHomeHeroDraft}
                            accept="image/*"
                            placeholder="Optional mobile-specific hero image..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-8 xl:grid-cols-2">
                        <div className="p-8 glass rounded-[2.5rem] border border-brand-accent/10 space-y-6">
                          <label className="text-[10px] uppercase tracking-widest text-brand-accent block font-black">Desktop video</label>
                          <UploadBox
                            field="desktopVideo"
                            value={homeHeroDraft.desktopVideo}
                            onUpload={handleFileUpload}
                            progress={uploadProgress}
                            status={uploadStatus}
                            state={homeHeroDraft}
                            stateSetter={setHomeHeroDraft}
                            accept="video/*"
                            mediaType="video"
                            placeholder="Paste desktop hero video URL..."
                          />
                        </div>

                        <div className="p-8 glass rounded-[2.5rem] border border-white/5 space-y-6">
                          <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">Mobile video</label>
                          <UploadBox
                            field="mobileVideo"
                            value={homeHeroDraft.mobileVideo}
                            onUpload={handleFileUpload}
                            progress={uploadProgress}
                            status={uploadStatus}
                            state={homeHeroDraft}
                            stateSetter={setHomeHeroDraft}
                            accept="video/*"
                            mediaType="video"
                            placeholder="Optional mobile-specific hero video..."
                          />
                        </div>

                        <div className="p-8 glass rounded-[2.5rem] border border-white/5 space-y-6 xl:col-span-2">
                          <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">Poster image fallback</label>
                          <UploadBox
                            field="posterImage"
                            value={homeHeroDraft.posterImage}
                            onUpload={handleFileUpload}
                            progress={uploadProgress}
                            status={uploadStatus}
                            state={homeHeroDraft}
                            stateSetter={setHomeHeroDraft}
                            accept="image/*"
                            placeholder="Shown while video loads or when motion is reduced..."
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-4 border-t border-white/5 pt-8 md:flex-row">
                      <button
                        type="button"
                        onClick={saveHomeHero}
                        disabled={isSubmitting || Object.keys(uploadProgress).length > 0}
                        className={cn(
                          "px-10 py-5 font-black uppercase tracking-widest rounded-2xl transition-all text-[10px] shadow-xl",
                          isSubmitting || Object.keys(uploadProgress).length > 0
                            ? "glass text-brand-muted"
                            : "bg-brand-accent text-brand-bg"
                        )}
                      >
                        {isSubmitting ? 'Saving Hero...' : 'Save Homepage Hero'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setHomeHeroDraft(homeHero)}
                        className="px-10 py-5 glass border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all"
                      >
                        Reset to Live
                      </button>
                    </div>

                    {homeHeroNotice ? (
                      <div
                        className={cn(
                          "rounded-2xl border px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em]",
                          homeHeroNotice.tone === 'success'
                            ? 'border-green-500/20 bg-green-500/10 text-green-400'
                            : 'border-red-500/20 bg-red-500/10 text-red-400'
                        )}
                      >
                        {homeHeroNotice.message}
                      </div>
                    ) : null}
                  </div>

                  <aside className="space-y-6">
                    <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8">
                      <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">Current setup</p>
                      <div className="space-y-4 text-sm text-white/70">
                        <p><span className="text-white">Mode:</span> {homeHeroDraft.mode}</p>
                        <p><span className="text-white">Desktop:</span> {homeHeroDraft.mode === 'image' ? (homeHeroDraft.desktopImage ? 'set' : 'missing') : (homeHeroDraft.desktopVideo ? 'set' : 'missing')}</p>
                        <p><span className="text-white">Mobile:</span> {homeHeroDraft.mode === 'image' ? (homeHeroDraft.mobileImage ? 'set' : 'falls back to desktop') : (homeHeroDraft.mobileVideo ? 'set' : 'falls back to desktop')}</p>
                        {homeHeroDraft.mode === 'video' ? (
                          <p><span className="text-white">Poster:</span> {homeHeroDraft.posterImage ? 'set' : 'falls back automatically'}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8">
                      <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">Recommended</p>
                      <div className="space-y-3 text-sm leading-relaxed text-white/65">
                        <p>Desktop: wide cinematic crop, around 2:1 or 21:9.</p>
                        <p>Mobile: portrait or tall crop that keeps the focal point visible.</p>
                        <p>Video mode works best with a lightweight looping MP4 plus a crisp poster image.</p>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'projects' && projects
            .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(p => (
            <div key={p.id} className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group h-80 overflow-hidden relative shadow-2xl">
              <div className="absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity">
                <img src={p.thumbnail} className="w-full h-full object-cover grayscale" alt="" />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent">{p.pillar}</span>
                   <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>
                <h3 className="text-4xl font-black uppercase tracking-tighter leading-none mb-3">{p.title}</h3>
                <p className="text-[10px] text-brand-muted uppercase tracking-[0.3em] font-mono">{p.category}</p>
              </div>
              <div className="relative z-10 flex gap-4 pt-10">
                <button
                  onClick={() =>
                    setEditingProject({
                      ...p,
                      pillar: normalizePillar(p.pillar),
                      heroImage: p.heroImage || p.thumbnail,
                      categories: p.categories?.length ? p.categories : splitTagLikeString(p.category),
                      outcomeImages: p.outcomeImages?.length ? p.outcomeImages : p.outcomeVisuals || [],
                      outcomeCopy: p.outcomeCopy || p.outcomeResultCopy || '',
                    })
                  }
                  className="flex-1 py-4 glass border border-white/10 rounded-2xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl"
                >
                  <Edit3 size={14}/> Edit
                </button>
                <button onClick={() => deleteFromFirestore('projects', p.id)} className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}

          {activeTab === 'videos' && videos
            .filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(v => (
            <div key={v.id} className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group h-80 overflow-hidden relative shadow-2xl">
              <div className="absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity">
                <img src={v.thumbnail} className="w-full h-full object-cover grayscale" alt="" />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-3">{v.title}</h3>
                <p className="text-[10px] text-brand-muted line-clamp-2 uppercase tracking-widest italic">{v.description}</p>
              </div>
              <div className="relative z-10 flex gap-4">
                <button onClick={() => setEditingVideo(v)} className="flex-1 py-4 glass border border-white/10 rounded-2xl hover:bg-white hover:text-black transition-all font-black uppercase text-[10px] tracking-widest shadow-xl">Edit</button>
                <button onClick={() => deleteFromFirestore('videos', v.id)} className="w-14 h-14 text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}

          {activeTab === 'lab' && labItems
            .filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(l => (
            <div key={l.id} className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group h-80 shadow-2xl">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent mb-4 block font-mono">{l.type} // {l.date}</span>
                <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">{l.title}</h3>
                <p className="text-[10px] text-brand-muted uppercase tracking-widest line-clamp-4 italic leading-relaxed">{l.content}</p>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setEditingLab(l)} className="flex-1 py-4 glass border border-white/10 rounded-2xl hover:bg-white hover:text-black transition-all font-black uppercase text-[10px] tracking-widest shadow-xl">Edit Entry</button>
                <button onClick={() => deleteFromFirestore('labItems', l.id)} className="w-14 h-14 text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}

          {activeTab === 'gallery' && galleryImages
            .filter(img => img.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
            .map(img => (
            <div key={img.id} className="glass rounded-[2rem] border border-white/5 overflow-hidden group shadow-2xl relative aspect-square">
                <img src={img.url} className="absolute inset-0 w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110" alt="" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-all">
                  <div className="space-y-4 translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex flex-wrap gap-2">
                      {img.tags?.map(t => <span key={t} className="text-[7px] font-black bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-widest">#{t}</span>)}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setEditingGalleryImage(img)} className="flex-1 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-brand-accent transition-colors">Edit</button>
                      <button onClick={() => deleteFromFirestore('gallery', img.id)} className="w-10 h-10 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"><Trash2 size={16}/></button>
                    </div>
                  </div>
                </div>
            </div>
          ))}
        </div>

        {/* Project Edit Modal */}
        <AnimatePresence>
          {editingProject && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-4 sm:p-12 overflow-hidden backdrop-blur-3xl">
              <div className="w-full max-w-6xl glass rounded-[4rem] overflow-hidden flex flex-col max-h-[90vh] relative border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5 z-50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((projectStep + 1) / projectSteps.length) * 100}%` }}
                    className="h-full bg-brand-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)]"
                  />
                </div>

                <div className="flex justify-between items-center px-10 py-10 bg-brand-bg/60 backdrop-blur-xl border-b border-white/5">
                  <div className="flex items-center gap-12">
                    <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">{editingProject.id ? 'Edit' : 'Create'}</h2>
                    <div className="flex gap-3">
                      {projectSteps.map((step, idx) => (
                        <button
                          key={step.id}
                          onClick={() => setProjectStep(idx)}
                          className={cn(
                            "group relative px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3",
                            projectStep === idx ? "text-brand-accent bg-brand-accent/5 lg:bg-brand-accent/10" : "text-brand-muted hover:text-white"
                          )}
                        >
                          <span className={cn("hidden sm:inline transition-colors font-mono", projectStep === idx ? "text-brand-accent" : "text-white/20")}>0{idx + 1}.</span>
                          <span className="hidden lg:inline">{step.label}</span>
                          <span className="lg:hidden">{step.icon}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={closeProjectEditor} className="p-4 glass rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={24} /></button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-12">
                  <form className="max-w-4xl mx-auto pb-40">
                    <AnimatePresence mode="wait">
                      {currentProjectStepId === 'identity' ? (
                        <motion.section key="project-identity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-14">
                          <header className="flex items-center gap-6">
                            <span className="w-12 h-12 rounded-2xl border-2 border-brand-accent flex items-center justify-center font-black text-xs text-brand-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]">01</span>
                            <div>
                              <h3 className="text-3xl font-black uppercase tracking-tighter">Project Identity</h3>
                              <p className="text-[10px] uppercase font-mono tracking-widest text-brand-muted">Choose the pillar first, then the rest of the form adapts.</p>
                            </div>
                          </header>

                          <div className="grid gap-12 lg:grid-cols-2">
                            <div className="space-y-10">
                              <InputGroup label="Title" description="The name shown on the work grid." value={editingProject.title || ''} onChange={v => setEditingProject({ ...editingProject, title: v })} />
                              <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">Pillar</label>
                                <div className="grid grid-cols-2 gap-4">
                                  {WORK_PILLARS.map((pillar) => (
                                    <button
                                      key={pillar}
                                      type="button"
                                      onClick={() => setEditingProject(applyProjectPillar(editingProject, pillar))}
                                      className={cn(
                                        "px-4 py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all text-center leading-tight h-20 flex items-center justify-center",
                                        currentProjectPillar === pillar ? "bg-white text-black border-white shadow-xl" : "glass border-white/5 hover:border-white/20"
                                      )}
                                    >
                                      {pillar}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {currentProjectPillar === 'AI Generated' ? (
                                <div className="space-y-4">
                                  <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">AI subtype</label>
                                  <div className="grid grid-cols-2 gap-4">
                                    {[
                                      ['ai-image', 'AI Image'],
                                      ['ai-video', 'AI Video'],
                                    ].map(([value, label]) => (
                                      <button
                                        key={value}
                                        type="button"
                                        onClick={() => setEditingProject({ ...editingProject, aiSubtype: value as Project['aiSubtype'] })}
                                        className={cn(
                                          "px-4 py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all text-center leading-tight h-20 flex items-center justify-center",
                                          (editingProject.aiSubtype || 'ai-image') === value ? "bg-white text-black border-white shadow-xl" : "glass border-white/5 hover:border-white/20"
                                        )}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {currentProjectPillar === 'Animation & Motion' ? (
                                <div className="space-y-4">
                                  <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">Motion format</label>
                                  <div className="grid grid-cols-3 gap-4">
                                    {[
                                      ['embed', 'Embed'],
                                      ['gif', 'GIF'],
                                      ['mp4', 'MP4'],
                                    ].map(([value, label]) => (
                                      <button
                                        key={value}
                                        type="button"
                                        onClick={() => setEditingProject({ ...editingProject, motionType: value as Project['motionType'] })}
                                        className={cn(
                                          "px-4 py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all text-center leading-tight h-20 flex items-center justify-center",
                                          (editingProject.motionType || 'embed') === value ? "bg-white text-black border-white shadow-xl" : "glass border-white/5 hover:border-white/20"
                                        )}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {currentProjectPillar === 'Art Direction' ? (
                                <div className="grid gap-8 md:grid-cols-2">
                                  <InputGroup label="Client" value={editingProject.client || ''} onChange={v => setEditingProject({ ...editingProject, client: v })} />
                                  <InputGroup label="Year" value={editingProject.year || ''} onChange={v => setEditingProject({ ...editingProject, year: v })} />
                                  <InputGroup label="Role" value={editingProject.role || ''} onChange={v => setEditingProject({ ...editingProject, role: v })} />
                                  <div className="md:col-span-2">
                                    <ListManager
                                      label="Categories / Tags"
                                      items={editingProject.categories?.length ? editingProject.categories : splitTagLikeString(editingProject.category)}
                                      onAdd={value => {
                                        const nextCategories = uniqueStrings([
                                          ...(editingProject.categories?.length ? editingProject.categories : splitTagLikeString(editingProject.category)),
                                          value,
                                        ]);
                                        setEditingProject({ ...editingProject, categories: nextCategories, category: nextCategories.join(', ') });
                                      }}
                                      onRemove={index => {
                                        const currentCategories = editingProject.categories?.length ? editingProject.categories : splitTagLikeString(editingProject.category);
                                        const nextCategories = currentCategories.filter((_, currentIndex) => currentIndex !== index);
                                        setEditingProject({ ...editingProject, categories: nextCategories, category: nextCategories.join(', ') });
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : null}
                            </div>

                            <div className="space-y-10">
                              <InputGroup
                                label={currentProjectPillar === 'Art Direction' ? 'Case study summary' : 'Description'}
                                description={currentProjectPillar === 'Art Direction' ? 'This appears in the case-study header and the work grid.' : 'A short description for the modal preview.'}
                                value={editingProject.description || ''}
                                onChange={v => setEditingProject({ ...editingProject, description: v })}
                                isTextarea
                              />

                              {currentProjectPillar === 'Art Direction' ? (
                                <div className="p-10 glass rounded-[3rem] border border-brand-accent/10 relative overflow-hidden">
                                  <div className="grain-overlay" />
                                  <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-6 block font-black border-b border-brand-accent/20 pb-4">Hero image</label>
                                  <UploadBox
                                    field="heroImage"
                                    value={editingProject.heroImage || editingProject.thumbnail}
                                    onUpload={handleFileUpload}
                                    progress={uploadProgress}
                                    status={uploadStatus}
                                    state={editingProject}
                                    stateSetter={setEditingProject}
                                    accept="image/*"
                                  />
                                </div>
                              ) : null}

                              {currentProjectPillar !== 'Art Direction' ? (
                                <ListManager
                                  label="Tools"
                                  items={editingProject.tools || []}
                                  onAdd={value => setEditingProject({ ...editingProject, tools: [...(editingProject.tools || []), value] })}
                                  onRemove={index => setEditingProject({ ...editingProject, tools: editingProject.tools?.filter((_, currentIndex) => currentIndex !== index) })}
                                />
                              ) : null}
                            </div>
                          </div>
                        </motion.section>
                      ) : null}

                      {currentProjectStepId === 'story' ? (
                        <motion.section key="project-story" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                          <header className="flex items-center gap-6">
                            <span className="w-12 h-12 rounded-2xl border-2 border-brand-accent flex items-center justify-center font-black text-xs text-brand-accent">02</span>
                            <div>
                              <h3 className="text-3xl font-black uppercase tracking-tighter">Case Study Narrative</h3>
                              <p className="text-[10px] uppercase font-mono tracking-widest text-brand-muted">Art Direction gets the full case-study structure.</p>
                            </div>
                          </header>
                          <div className="space-y-10">
                            <InputGroup label="Creative tension" value={editingProject.creativeTension || ''} onChange={v => setEditingProject({ ...editingProject, creativeTension: v })} isTextarea />
                            <InputGroup label="Global context" value={editingProject.globalContext || ''} onChange={v => setEditingProject({ ...editingProject, globalContext: v })} isTextarea />
                            <InputGroup label="Approach" value={editingProject.approach || ''} onChange={v => setEditingProject({ ...editingProject, approach: v })} isTextarea />
                          </div>
                        </motion.section>
                      ) : null}

                      {currentProjectStepId === 'process' ? (
                        <motion.section key="project-process" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                          <header className="flex items-center gap-6">
                            <span className="w-12 h-12 rounded-2xl border-2 border-brand-accent flex items-center justify-center font-black text-xs text-brand-accent">03</span>
                            <div>
                              <h3 className="text-3xl font-black uppercase tracking-tighter">
                                {currentProjectPillar === 'AI Generated' ? 'Tools' : 'Tools & Credits'}
                              </h3>
                              <p className="text-[10px] uppercase font-mono tracking-widest text-brand-muted">
                                {currentProjectPillar === 'AI Generated'
                                  ? 'AI pieces only need the tool tags used to make them.'
                                  : 'Keep the production details compact and useful.'}
                              </p>
                            </div>
                          </header>
                          <div className={`grid gap-10 ${currentProjectPillar === 'AI Generated' ? '' : 'lg:grid-cols-2'}`}>
                            <ListManager
                              label="Tools"
                              items={editingProject.tools || []}
                              onAdd={value => setEditingProject({ ...editingProject, tools: [...(editingProject.tools || []), value] })}
                              onRemove={index => setEditingProject({ ...editingProject, tools: editingProject.tools?.filter((_, currentIndex) => currentIndex !== index) })}
                            />
                            {currentProjectPillar !== 'AI Generated' ? (
                              <ListManager
                                label="Credits"
                                items={editingProject.credits || []}
                                onAdd={value => setEditingProject({ ...editingProject, credits: [...(editingProject.credits || []), value] })}
                                onRemove={index => setEditingProject({ ...editingProject, credits: editingProject.credits?.filter((_, currentIndex) => currentIndex !== index) })}
                              />
                            ) : null}
                          </div>
                        </motion.section>
                      ) : null}

                      {currentProjectStepId === 'visuals' ? (
                        <motion.section key="project-visuals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-16">
                          <header className="flex items-center gap-6">
                            <span className="w-12 h-12 rounded-2xl border-2 border-brand-accent flex items-center justify-center font-black text-xs text-brand-accent">
                              {currentProjectPillar === 'Art Direction' ? '04' : '02'}
                            </span>
                            <div>
                              <h3 className="text-3xl font-black uppercase tracking-tighter">
                                {currentProjectPillar === 'Art Direction' ? 'Visual System' : 'Media'}
                              </h3>
                              <p className="text-[10px] uppercase font-mono tracking-widest text-brand-muted">
                                Upload or paste the exact media this pillar needs.
                              </p>
                            </div>
                          </header>

                          {currentProjectPillar === 'Art Direction' ? (
                            <div className="space-y-14">
                              <ImagePhaseManager
                                title="Moodboard Images"
                                field="moodboardImages"
                                images={editingProject.moodboardImages || []}
                                onUpload={handleFileUpload}
                                progress={uploadProgress}
                                status={uploadStatus}
                                state={editingProject}
                                stateSetter={setEditingProject}
                                onRemove={index => setEditingProject({ ...editingProject, moodboardImages: editingProject.moodboardImages?.filter((_, currentIndex) => currentIndex !== index) })}
                              />
                              <ImagePhaseManager
                                title="Sketches"
                                field="sketchImages"
                                images={editingProject.sketchImages || []}
                                onUpload={handleFileUpload}
                                progress={uploadProgress}
                                status={uploadStatus}
                                state={editingProject}
                                stateSetter={setEditingProject}
                                onRemove={index => setEditingProject({ ...editingProject, sketchImages: editingProject.sketchImages?.filter((_, currentIndex) => currentIndex !== index) })}
                              />
                              <div className="space-y-6">
                                <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">Exploration display mode</label>
                                <div className="grid grid-cols-2 gap-4">
                                  {(['masonry', 'slot-machine'] as const).map(mode => (
                                    <button
                                      key={mode}
                                      type="button"
                                      onClick={() => setEditingProject({ ...editingProject, explorationType: mode })}
                                      className={cn(
                                        "px-4 py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all h-20 flex items-center justify-center",
                                        (editingProject.explorationType || 'masonry') === mode ? "bg-white text-black border-white shadow-xl" : "glass border-white/5 hover:border-white/20"
                                      )}
                                    >
                                      {mode}
                                    </button>
                                  ))}
                                </div>
                                {(editingProject.explorationType || 'masonry') === 'slot-machine' ? (
                                  <div className="grid gap-8 md:grid-cols-2 p-8 glass rounded-[2rem] border border-brand-accent/10">
                                    <div className="space-y-4">
                                      <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">Grid size</label>
                                      <div className="grid grid-cols-2 gap-3">
                                        {[3, 4].map(size => (
                                          <button
                                            key={size}
                                            type="button"
                                            onClick={() => setEditingProject({ ...editingProject, slotMachineGridSize: size })}
                                            className={cn(
                                              "px-4 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                              (editingProject.slotMachineGridSize ?? 4) === size ? "bg-white text-black border-white" : "glass border-white/5"
                                            )}
                                          >
                                            {size}×{size}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">FPS</label>
                                      <input
                                        type="number"
                                        value={editingProject.slotMachineFps ?? 12}
                                        onChange={e => setEditingProject({ ...editingProject, slotMachineFps: Number(e.target.value) })}
                                        min={1}
                                        max={60}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent text-sm"
                                      />
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                              <ImagePhaseManager
                                title="Exploration Images"
                                field="explorationImages"
                                images={editingProject.explorationImages || []}
                                onUpload={handleFileUpload}
                                progress={uploadProgress}
                                status={uploadStatus}
                                state={editingProject}
                                stateSetter={setEditingProject}
                                onRemove={index => setEditingProject({ ...editingProject, explorationImages: editingProject.explorationImages?.filter((_, currentIndex) => currentIndex !== index) })}
                              />
                              <ImagePhaseManager
                                title="Outcome Images"
                                field="outcomeImages"
                                images={editingProject.outcomeImages || editingProject.outcomeVisuals || []}
                                onUpload={handleFileUpload}
                                progress={uploadProgress}
                                status={uploadStatus}
                                state={editingProject}
                                stateSetter={setEditingProject}
                                onRemove={index => {
                                  const nextOutcomeImages = (editingProject.outcomeImages || editingProject.outcomeVisuals || []).filter((_, currentIndex) => currentIndex !== index);
                                  setEditingProject({ ...editingProject, outcomeImages: nextOutcomeImages, outcomeVisuals: nextOutcomeImages });
                                }}
                              />
                            </div>
                          ) : null}

                          {currentProjectPillar === 'AI Generated' ? (
                            <div className="space-y-10">
                              {(editingProject.aiSubtype || 'ai-image') === 'ai-image' ? (
                                <div className="p-10 glass rounded-[3rem] border border-brand-accent/10 relative overflow-hidden">
                                  <div className="grain-overlay" />
                                  <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-6 block font-black border-b border-brand-accent/20 pb-4">Image asset</label>
                                  <UploadBox
                                    field="thumbnail"
                                    value={editingProject.thumbnail}
                                    onUpload={handleFileUpload}
                                    progress={uploadProgress}
                                    status={uploadStatus}
                                    state={editingProject}
                                    stateSetter={setEditingProject}
                                    accept="image/*"
                                  />
                                </div>
                              ) : (
                                <div className="p-10 glass rounded-[3rem] border border-brand-accent/10 relative overflow-hidden">
                                  <div className="grain-overlay" />
                                  <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-6 block font-black border-b border-brand-accent/20 pb-4">Video file</label>
                                  <UploadBox
                                    field="mediaUrl"
                                    value={editingProject.mediaUrl || editingProject.videoUrl}
                                    onUpload={handleFileUpload}
                                    progress={uploadProgress}
                                    status={uploadStatus}
                                    state={editingProject}
                                    stateSetter={setEditingProject}
                                    accept="video/*"
                                    mediaType="video"
                                    placeholder="Paste direct video URL here..."
                                  />
                                </div>
                              )}
                            </div>
                          ) : null}

                          {currentProjectPillar === 'Illustration & Design' ? (
                            <ImagePhaseManager
                              title="Images Gallery"
                              field="images"
                              images={editingProject.images || []}
                              onUpload={handleFileUpload}
                              progress={uploadProgress}
                              status={uploadStatus}
                              state={editingProject}
                              stateSetter={setEditingProject}
                              onRemove={index => setEditingProject({ ...editingProject, images: editingProject.images?.filter((_, currentIndex) => currentIndex !== index) })}
                            />
                          ) : null}

                          {currentProjectPillar === 'Animation & Motion' ? (
                            <div className="space-y-10">
                              {(editingProject.motionType || 'embed') === 'embed' ? (
                                <div className="grid gap-10 lg:grid-cols-2">
                                  <InputGroup label="YouTube / Vimeo URL" value={editingProject.embedUrl || ''} onChange={v => setEditingProject({ ...editingProject, embedUrl: v })} />
                                  <div className="p-10 glass rounded-[3rem] border border-brand-accent/10 relative overflow-hidden">
                                    <div className="grain-overlay" />
                                    <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-6 block font-black border-b border-brand-accent/20 pb-4">Thumbnail</label>
                                    <UploadBox
                                      field="thumbnail"
                                      value={editingProject.thumbnail}
                                      onUpload={handleFileUpload}
                                      progress={uploadProgress}
                                      status={uploadStatus}
                                      state={editingProject}
                                      stateSetter={setEditingProject}
                                      accept="image/*"
                                    />
                                  </div>
                                </div>
                              ) : null}

                              {(editingProject.motionType || 'embed') === 'gif' ? (
                                <div className="grid gap-10 lg:grid-cols-2">
                                  <div className="p-10 glass rounded-[3rem] border border-brand-accent/10 relative overflow-hidden">
                                    <div className="grain-overlay" />
                                    <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-6 block font-black border-b border-brand-accent/20 pb-4">GIF file</label>
                                    <UploadBox
                                      field="mediaUrl"
                                      value={editingProject.mediaUrl || editingProject.videoUrl}
                                      onUpload={handleFileUpload}
                                      progress={uploadProgress}
                                      status={uploadStatus}
                                      state={editingProject}
                                      stateSetter={setEditingProject}
                                      accept="image/gif"
                                      placeholder="Paste direct GIF URL here..."
                                    />
                                  </div>
                                  <div className="p-10 glass rounded-[3rem] border border-brand-accent/10 relative overflow-hidden">
                                    <div className="grain-overlay" />
                                    <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-6 block font-black border-b border-brand-accent/20 pb-4">Thumbnail</label>
                                    <UploadBox
                                      field="thumbnail"
                                      value={editingProject.thumbnail}
                                      onUpload={handleFileUpload}
                                      progress={uploadProgress}
                                      status={uploadStatus}
                                      state={editingProject}
                                      stateSetter={setEditingProject}
                                      accept="image/*"
                                    />
                                  </div>
                                </div>
                              ) : null}

                              {(editingProject.motionType || 'embed') === 'mp4' ? (
                                <div className="grid gap-10 lg:grid-cols-2">
                                  <div className="p-10 glass rounded-[3rem] border border-brand-accent/10 relative overflow-hidden">
                                    <div className="grain-overlay" />
                                    <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-6 block font-black border-b border-brand-accent/20 pb-4">MP4 file</label>
                                    <UploadBox
                                      field="mediaUrl"
                                      value={editingProject.mediaUrl || editingProject.videoUrl}
                                      onUpload={handleFileUpload}
                                      progress={uploadProgress}
                                      status={uploadStatus}
                                      state={editingProject}
                                      stateSetter={setEditingProject}
                                      accept="video/*"
                                      mediaType="video"
                                      placeholder="Paste direct MP4 URL here..."
                                    />
                                  </div>
                                  <div className="p-10 glass rounded-[3rem] border border-brand-accent/10 relative overflow-hidden">
                                    <div className="grain-overlay" />
                                    <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-6 block font-black border-b border-brand-accent/20 pb-4">Thumbnail</label>
                                    <UploadBox
                                      field="thumbnail"
                                      value={editingProject.thumbnail}
                                      onUpload={handleFileUpload}
                                      progress={uploadProgress}
                                      status={uploadStatus}
                                      state={editingProject}
                                      stateSetter={setEditingProject}
                                      accept="image/*"
                                    />
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </motion.section>
                      ) : null}

                      {currentProjectStepId === 'publish' ? (
                        <motion.section key="project-publish" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                          <header className="flex items-center gap-6">
                            <span className="w-12 h-12 rounded-2xl border-2 border-brand-accent flex items-center justify-center font-black text-xs text-brand-accent">
                              {projectSteps.length === 5 ? '05' : '03'}
                            </span>
                            <div>
                              <h3 className="text-3xl font-black uppercase tracking-tighter">Ready to Publish</h3>
                              <p className="text-[10px] uppercase font-mono tracking-widest text-brand-muted">Final polish before this item hits the archive.</p>
                            </div>
                          </header>

                          {currentProjectPillar === 'Art Direction' ? (
                            <InputGroup
                              label="Outcome Copy"
                              description="The final paragraph that closes the case study."
                              value={editingProject.outcomeCopy || editingProject.outcomeResultCopy || ''}
                              onChange={v => setEditingProject({ ...editingProject, outcomeCopy: v, outcomeResultCopy: v })}
                              isTextarea
                            />
                          ) : null}

                          <div className="grid gap-6 rounded-[3rem] border border-white/10 bg-white/[0.03] p-8 md:grid-cols-2">
                            <div>
                              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">Current pillar</p>
                              <p className="text-2xl font-black uppercase tracking-tight">{currentProjectPillar}</p>
                            </div>
                            <div>
                              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">What will be saved</p>
                              <p className="text-sm leading-relaxed text-white/65">
                                {currentProjectPillar === 'Art Direction'
                                  ? 'A full case study with hero image, narrative, galleries, tools, and credits.'
                                  : currentProjectPillar === 'AI Generated'
                                    ? 'A single AI image or video asset that opens in a modal from the work grid.'
                                    : currentProjectPillar === 'Illustration & Design'
                                      ? 'A still-image gallery entry that opens in a modal from the work grid.'
                                      : 'A motion piece with either an embed URL, GIF, or MP4 plus a thumbnail.'}
                              </p>
                            </div>
                          </div>

                          <div className="pt-10 border-t border-white/5 text-center">
                            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 4 }} className="w-24 h-24 bg-brand-accent/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-brand-accent/20">
                              <Check size={48} className="text-brand-accent" />
                            </motion.div>
                            <h4 className="text-3xl font-black uppercase tracking-widest mb-4">Schema Aligned</h4>
                            <p className="text-brand-muted uppercase text-[10px] tracking-widest font-black max-w-sm mx-auto opacity-50 italic">This item now matches the pillar-specific archive model.</p>
                          </div>
                        </motion.section>
                      ) : null}
                    </AnimatePresence>
                  </form>
                </div>

                {/* Footer Controls */}
                <div className="p-10 bg-brand-bg/80 backdrop-blur-3xl border-t border-white/5 z-[110] flex flex-col md:flex-row gap-6 relative">
                  <div className="flex-grow flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setProjectStep(prev => Math.max(0, prev - 1))}
                      disabled={projectStep === 0}
                      className="px-10 py-5 glass border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-20 transition-all hover:bg-white hover:text-black"
                    >
                      ← Previous
                    </button>
                    {projectStep < projectSteps.length - 1 ? (
                      <button 
                        type="button" 
                        onClick={() => setProjectStep(prev => prev + 1)}
                        className="px-14 py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl text-[10px] hover:bg-brand-accent transition-all flex items-center gap-3 shadow-xl"
                      >
                        Advance Phase <ArrowRight size={14} />
                      </button>
                    ) : <div className="flex-grow" />}
                  </div>
                  
                  <div className="flex gap-4">
                    {Object.keys(uploadProgress).length > 0 && (
                      <button type="button" onClick={() => setUploadProgress({})} className="px-6 py-5 border border-brand-accent/30 text-brand-accent rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-accent/10 transition-all">Clear Sync</button>
                    )}
                    <button 
                      onClick={(e) => { e.preventDefault(); saveProject(); }}
                      disabled={isSubmitting || Object.keys(uploadProgress).length > 0} 
                      className={cn(
                        "px-14 py-5 font-black uppercase tracking-widest rounded-2xl transition-all text-[10px] shadow-2xl disabled:opacity-50",
                        Object.keys(uploadProgress).length > 0 ? "glass text-brand-muted" : "bg-brand-accent text-brand-bg"
                      )}
                    >
                      {isSubmitting ? 'Syncing...' : 'Commit to Archive'}
                    </button>
                    <button type="button" onClick={closeProjectEditor} className="px-10 py-5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-red-500 transition-all font-mono">Abort</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Modal */}
        <AnimatePresence>
          {editingVideo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-6 backdrop-blur-3xl">
              <div className="w-full max-w-3xl glass rounded-[3rem] p-12 border border-white/10">
                <h2 className="text-5xl font-black uppercase tracking-tighter mb-12">Video Node</h2>
                <form onSubmit={(e) => { e.preventDefault(); saveToFirestore('videos', editingVideo, editingVideo.id, () => setEditingVideo(null)); }} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-4 block font-black text-center">Target Discipline</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Animation & Motion', 'AI Generated'].map((p) => (
                        <button key={p} type="button" onClick={() => setEditingVideo({...editingVideo, pillar: p as any})} className={cn("px-4 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all h-16 flex items-center justify-center", editingVideo.pillar === p ? "bg-white text-black border-white shadow-xl" : "glass border-white/5")}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <InputGroup label="Visual Title" value={editingVideo.title || ''} onChange={v => setEditingVideo({...editingVideo, title: v})} />
                    <InputGroup label="Thumbnail Link" value={editingVideo.thumbnail || ''} onChange={v => setEditingVideo({...editingVideo, thumbnail: v})} />
                  </div>
                  <InputGroup label="Stream URL (.mp4)" value={editingVideo.url || ''} onChange={v => setEditingVideo({...editingVideo, url: v})} />
                  <InputGroup label="Concept Description" value={editingVideo.description || ''} onChange={v => setEditingVideo({...editingVideo, description: v})} isTextarea />
                  <div className="flex gap-4 pt-10 border-t border-white/5">
                    <button type="submit" disabled={isSubmitting} className="flex-grow py-5 bg-brand-accent text-brand-bg font-black uppercase tracking-widest rounded-2xl shadow-xl">Commit Node</button>
                    <button type="button" onClick={() => setEditingVideo(null)} className="px-10 py-5 glass rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Labs / Gallery would be here too - I'll keep them streamlined */}
        <AnimatePresence>
           {editingLab && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-6 backdrop-blur-3xl">
                 <div className="w-full max-w-4xl glass rounded-[3rem] p-12 border border-white/10 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <h2 className="text-5xl font-black uppercase tracking-tighter mb-12">Lab Entry</h2>
                    <form onSubmit={(e) => { e.preventDefault(); saveToFirestore('labItems', editingLab, editingLab.id, () => setEditingLab(null)); }} className="space-y-10">
                       <InputGroup label="Experiment Title" value={editingLab.title || ''} onChange={v => setEditingLab({...editingLab, title: v})} />
                       <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-brand-muted mb-4 block font-black">Variant Class</label>
                            <select value={editingLab.type} onChange={e => setEditingLab({...editingLab, type: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none appearance-none text-xs font-black uppercase tracking-widest focus:border-brand-accent">
                              {['Experiment', 'Learning', 'AI', 'Vibe'].map(t => <option key={t} value={t} className="bg-brand-bg">{t}</option>)}
                            </select>
                          </div>
                          <InputGroup label="Archive Date" value={editingLab.date || ''} onChange={v => setEditingLab({...editingLab, date: v})} />
                       </div>
                       <InputGroup label="Log / Findings" value={editingLab.content || ''} onChange={v => setEditingLab({...editingLab, content: v})} isTextarea />
                       <InputGroup label="Code Logic (Optional)" value={editingLab.code || ''} onChange={v => setEditingLab({...editingLab, code: v})} isTextarea />
                       <div className="space-y-4">
                          <label className="text-[10px] uppercase tracking-widest text-brand-accent block font-black">Asset Visual</label>
                          <UploadBox field="image" value={editingLab.image} onUpload={handleFileUpload} progress={uploadProgress} status={uploadStatus} state={editingLab} stateSetter={setEditingLab} />
                       </div>
                       <ListManager label="Tool Integration" items={editingLab.tools || []} onAdd={v => setEditingLab({...editingLab, tools: [...(editingLab.tools || []), v]})} onRemove={i => setEditingLab({...editingLab, tools: editingLab.tools?.filter((_, idx) => idx !== i)})} />
                       <div className="flex gap-4 pt-10 border-t border-white/5">
                          <button type="submit" disabled={isSubmitting} className="flex-grow py-5 bg-brand-accent text-brand-bg font-black uppercase tracking-widest rounded-2xl shadow-xl">Archive Entry</button>
                          <button type="button" onClick={() => setEditingLab(null)} className="px-10 py-5 glass rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                       </div>
                    </form>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

        {/* Gallery single modal */}
        <AnimatePresence>
           {editingGalleryImage && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-6 backdrop-blur-3xl">
                 <div className="w-full max-w-2xl glass rounded-[3rem] p-12 border border-white/10">
                    <h2 className="text-5xl font-black uppercase tracking-tighter mb-10">Gallery Asset</h2>
                    <form onSubmit={(e) => { e.preventDefault(); saveToFirestore('gallery', editingGalleryImage, editingGalleryImage.id, () => setEditingGalleryImage(null)); }} className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] uppercase tracking-widest text-brand-accent block font-black text-center">Pillar Allocation</label>
                          <div className="grid grid-cols-2 gap-4">
                            {['Illustration & Design', 'AI Generated'].map((p) => (
                              <button key={p} type="button" onClick={() => setEditingGalleryImage({...editingGalleryImage, pillar: p as any})} className={cn("px-4 py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all h-20 flex items-center justify-center leading-tight", editingGalleryImage.pillar === p ? "bg-white text-black border-white shadow-xl" : "glass border-white/5")}>{p}</button>
                            ))}
                          </div>
                       </div>
                       <InputGroup label="Asset Link" value={editingGalleryImage.url || ''} onChange={v => setEditingGalleryImage({...editingGalleryImage, url: v})} />
                       <div className="grid grid-cols-2 gap-6">
                          <InputGroup label="Render Engine / Software" value={editingGalleryImage.software || ''} onChange={v => setEditingGalleryImage({...editingGalleryImage, software: v})} />
                          <InputGroup label="Prompt / Context" value={editingGalleryImage.info || ''} onChange={v => setEditingGalleryImage({...editingGalleryImage, info: v})} />
                       </div>
                       <ListManager label="Taxonomy Tags" items={editingGalleryImage.tags || []} onAdd={v => setEditingGalleryImage({...editingGalleryImage, tags: [...(editingGalleryImage.tags || []), v]})} onRemove={i => setEditingGalleryImage({...editingGalleryImage, tags: editingGalleryImage.tags?.filter((_, idx) => idx !== i)})} />
                       <div className="flex gap-4 pt-10 border-t border-white/5">
                          <button type="submit" className="flex-grow py-5 bg-brand-accent text-brand-bg font-black uppercase tracking-widest rounded-2xl shadow-xl">Sync Asset</button>
                          <button type="button" onClick={() => setEditingGalleryImage(null)} className="px-10 py-5 glass rounded-2xl text-[10px] font-black uppercase tracking-widest">Discard</button>
                       </div>
                    </form>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

        {/* Bulk Gallery UI remains similar to App.tsx but simplified if needed - but I'll provide it fully as it's critical */}
        <AnimatePresence>
          {bulkGalleryQueue.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/99 flex items-center justify-center p-4 md:p-12 backdrop-blur-3xl overflow-hidden">
               <div className="w-full max-w-7xl h-full flex flex-col bg-brand-bg border border-white/10 rounded-[4rem] shadow-3xl overflow-hidden">
                  <header className="p-12 bg-white/[0.02] border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 shrink-0">
                     <div>
                        <h2 className="text-5xl font-black uppercase tracking-tighter flex items-center gap-6">Batch Sync <span className="text-brand-accent text-2xl font-mono px-4 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-full">{bulkGalleryQueue.length} items</span></h2>
                        <p className="text-[10px] uppercase tracking-widest text-brand-muted mt-4 font-mono italic">Initiating multi-asset deployment to the global production archive</p>
                     </div>
                     <div className="flex gap-6 w-full md:w-auto">
                        <button 
                          onClick={async () => {
                             setIsSubmitting(true);
                             const newQueue = [...bulkGalleryQueue];
                             for (let i = 0; i < newQueue.length; i++) {
                               const item = newQueue[i];
                               if (item.status === 'Uploaded') continue;
                               try {
                                 item.status = 'Uploading...'; setBulkGalleryQueue([...newQueue]);
                                 const url = await handleFileUpload(item.file, 'bulk', null);
                                 item.url = url as string;
                                 item.status = 'Committing...'; setBulkGalleryQueue([...newQueue]);
                                 const payload = { url: item.url, pillar: bulkPillar, tags: [...bulkTags, ...item.tags], software: item.software || '', info: item.info || '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
                                 const docRef = await addDoc(collection(db, 'gallery'), payload);
                                 item.dbId = docRef.id; item.status = 'Uploaded'; item.progress = 100; setBulkGalleryQueue([...newQueue]);
                               } catch (err) { item.status = 'Failed'; setBulkGalleryQueue([...newQueue]); }
                             }
                             setIsSubmitting(false);
                             if (newQueue.every(it => it.status === 'Uploaded')) { setBulkGalleryQueue([]); setBulkTags([]); }
                          }}
                          disabled={isSubmitting}
                          className="flex-grow md:flex-initial px-14 py-5 bg-brand-accent text-brand-bg font-black uppercase tracking-widest rounded-2xl shadow-xl disabled:opacity-30"
                        >
                          {isSubmitting ? 'Syncing Queue...' : 'Initiate Batch Deploy'}
                        </button>
                        <button onClick={() => { bulkGalleryQueue.forEach(it => { if(it.previewUrl) URL.revokeObjectURL(it.previewUrl); }); setBulkGalleryQueue([]); setBulkTags([]); }} className="p-5 glass rounded-2xl hover:text-red-500 transition-colors"><X size={24} /></button>
                     </div>
                  </header>

                  {/* Batch Global settings */}
                  <div className="p-8 border-b border-white/5 bg-white/[0.01] flex flex-wrap gap-12 shrink-0">
                     <div className="space-y-4">
                        <span className="text-[10px] uppercase font-black text-brand-accent tracking-widest">Target Pillar For Batch</span>
                        <div className="flex gap-3">
                           {['Illustration & Design', 'AI Generated'].map(p => (
                              <button key={p} onClick={() => setBulkPillar(p as any)} className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all", bulkPillar === p ? "bg-white text-black border-white" : "glass border-white/5 text-brand-muted")}>{p}</button>
                           ))}
                        </div>
                     </div>
                     <div className="flex-grow max-w-sm">
                        <ListManager label="Shared Semantic Tags" items={bulkTags} onAdd={t => setBulkTags([...bulkTags, t])} onRemove={i => setBulkTags(bulkTags.filter((_, idx) => idx !== i))} />
                     </div>
                  </div>

                  <div className="flex-grow overflow-y-auto custom-scrollbar p-8 bg-black/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 content-start">
                     {bulkGalleryQueue.map((item, idx) => (
                        <div key={idx} className={cn("p-8 glass rounded-[3rem] border transition-all space-y-8 relative group", item.status === 'Uploaded' ? "border-green-500/40" : "border-white/5")}>
                           <div className="aspect-square rounded-3xl overflow-hidden bg-white/5 relative border border-white/5">
                              {item.url || item.previewUrl ? <img src={item.url || item.previewUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><ImageIcon size={48} /></div>}
                              {item.status === 'Uploading...' && <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-8"><div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mb-4"><motion.div initial={{ width: 0 }} animate={{ width: `${item.progress}%` }} className="h-full bg-brand-accent" /></div><span className="text-[10px] font-black uppercase text-brand-accent">Syncing // {item.progress}%</span></div>}
                              {item.status === 'Uploaded' && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><CheckCircle2 size={48} className="text-green-500 shadow-2xl" /></div>}
                           </div>
                           <div className="space-y-6">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-muted truncate italic mb-2 opacity-50">{item.file.name}</h4>
                              <div className="grid grid-cols-2 gap-4">
                                 <input type="text" placeholder="Engine..." value={item.software || ''} onChange={e => { const nq = [...bulkGalleryQueue]; nq[idx].software = e.target.value; setBulkGalleryQueue(nq); }} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] uppercase font-black tracking-widest outline-none focus:border-brand-accent" />
                                 <input type="text" placeholder="Context..." value={item.info || ''} onChange={e => { const nq = [...bulkGalleryQueue]; nq[idx].info = e.target.value; setBulkGalleryQueue(nq); }} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] uppercase font-black tracking-widest outline-none focus:border-brand-accent" />
                              </div>
                              <ListManager label="Semantic Detail" items={item.tags} onAdd={t => { const nq = [...bulkGalleryQueue]; nq[idx].tags.push(t); setBulkGalleryQueue(nq); }} onRemove={ti => { const nq = [...bulkGalleryQueue]; nq[idx].tags.splice(ti, 1); setBulkGalleryQueue(nq); }} />
                           </div>
                           {item.status === 'Ready' && <button onClick={() => setBulkGalleryQueue(bulkGalleryQueue.filter((_, bi) => bi !== idx))} className="absolute top-4 right-4 text-white/10 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>}
                        </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};
