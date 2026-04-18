import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Trash2, Edit3, Search, LogOut, Info, Rocket, 
  Check, CheckCircle2, AlertCircle, Image as ImageIcon, 
  Compass, Zap, Cpu, Code, Tag as TagIcon, ArrowRight
} from 'lucide-react';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { auth, db, storage } from '../firebase';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';
import { handleFirestoreError, OperationType } from '../utils/error-handlers';
import { PageTransition } from '../components/PageTransition';
import { cn } from '../lib/utils';
import { Project, Video, LabItem, GalleryImage, ProjectPillar } from '../types';
import { 
  InputGroup, UploadBox, ListManager, ImagePhaseManager, ColorPaletteManager 
} from '../components/AdminComponents';

const PROJECT_STEPS = [
  { id: 'vision', label: 'Vision', icon: <Compass size={14} /> },
  { id: 'story', label: 'Story', icon: <Zap size={14} /> },
  { id: 'engine', label: 'Process', icon: <Cpu size={14} /> },
  { id: 'render', label: 'Visuals', icon: <ImageIcon size={14} /> },
  { id: 'meta', label: 'Tech', icon: <Code size={14} /> },
];

export const Admin = () => {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>({});
  const [storageConnected, setStorageConnected] = useState<'testing' | 'ok' | 'blocked'>('testing');

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

  if (loading) return <div className="pt-40 px-6 min-h-screen text-brand-muted uppercase font-mono tracking-widest text-center">Identifying Identity...</div>;

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
                {(['projects', 'videos', 'lab', 'gallery'] as const).map(tab => (
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
                    {tab}
                  </button>
                ))}
              </div>

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
                    <button onClick={() => setEditingProject({ title: '', pillar: 'Art Direction', category: '', tools: [], mariaRole: [], moodboardImages: [], explorationImages: [], hybridizationImages: [], outcomeVisuals: [], images: [], colorSystem: [] })} className="w-full px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 border-b border-white/5">Project</button>
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
            </div>
          </div>
        </header>

        {/* Content Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
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
                <button onClick={() => setEditingProject(p)} className="flex-1 py-4 glass border border-white/10 rounded-2xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl"><Edit3 size={14}/> Edit</button>
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
                     animate={{ width: `${((projectStep + 1) / PROJECT_STEPS.length) * 100}%` }} 
                     className="h-full bg-brand-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)]"
                   />
                </div>

                <div className="flex justify-between items-center px-10 py-10 bg-brand-bg/60 backdrop-blur-xl border-b border-white/5">
                  <div className="flex items-center gap-12">
                    <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">{editingProject.id ? 'Edit' : 'Create'}</h2>
                    <div className="flex gap-3">
                      {PROJECT_STEPS.map((step, idx) => (
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
                  <button onClick={() => { setEditingProject(null); setProjectStep(0); }} className="p-4 glass rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={24} /></button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-12">
                  <form className="max-w-4xl mx-auto pb-40">
                    <AnimatePresence mode="wait">
                      {projectStep === 0 && (
                        <motion.section key="step-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-16">
                          <header className="flex items-center gap-6 mb-12">
                             <span className="w-12 h-12 rounded-2xl border-2 border-brand-accent flex items-center justify-center font-black text-xs text-brand-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]">01</span>
                             <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter">Core Identity</h3>
                                <p className="text-[10px] uppercase font-mono tracking-widest text-brand-muted">Defining the archive anchor</p>
                             </div>
                          </header>
                          <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-10">
                              <InputGroup label="Project Name" description="The public-facing identifier." value={editingProject.title || ''} onChange={v => setEditingProject({...editingProject, title: v})} />
                              <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">Architecture Discipline</label>
                                <div className="grid grid-cols-2 gap-4">
                                  {['Art Direction', 'AI Generated', 'Animations & Motion', 'Illustration & Design'].map(p => (
                                    <button
                                      key={p} type="button"
                                      onClick={() => setEditingProject({...editingProject, pillar: p as any})}
                                      className={cn(
                                        "px-4 py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all text-center leading-tight h-20 flex items-center justify-center",
                                        editingProject.pillar === p ? "bg-white text-black border-white shadow-xl" : "glass border-white/5 hover:border-white/20"
                                      )}
                                    >
                                      {p}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-10">
                               <InputGroup label="Archive Category" description="e.g. CGI, Interactive, Branding" value={editingProject.category || ''} onChange={v => setEditingProject({...editingProject, category: v})} />
                               <InputGroup label="Client / Partner" description="Entity association (Optional)" value={editingProject.client || ''} onChange={v => setEditingProject({...editingProject, client: v})} />
                               <div className="p-10 glass rounded-[3rem] border border-brand-accent/10 relative overflow-hidden">
                                 <div className="grain-overlay" />
                                 <label className="text-[10px] uppercase tracking-widest text-brand-accent mb-6 block font-black border-b border-brand-accent/20 pb-4">Cover Visual Index</label>
                                 <UploadBox field="thumbnail" value={editingProject.thumbnail} onUpload={handleFileUpload} progress={uploadProgress} status={uploadStatus} state={editingProject} stateSetter={setEditingProject} />
                               </div>
                            </div>
                          </div>
                        </motion.section>
                      )}

                      {/* Other steps follow similar extraction pattern from App.tsx but using the components... */}
                      {/* Truncating slightly for brevity, but I must ensure ALL steps are here */}
                      {projectStep === 1 && (
                         <motion.section key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-16">
                            <header className="flex items-center gap-6 mb-12">
                               <span className="w-12 h-12 rounded-2xl border-2 border-brand-accent flex items-center justify-center font-black text-xs text-brand-accent">02</span>
                               <h3 className="text-3xl font-black uppercase tracking-tighter">Narrative Arc</h3>
                            </header>
                            <div className="space-y-12">
                               <div className="p-10 glass rounded-[3rem] border border-white/5 space-y-4">
                                  <label className="text-[10px] uppercase tracking-widest text-brand-accent block font-black">Case Study Synopsis</label>
                                  <textarea value={editingProject.description || ''} onChange={e => setEditingProject({...editingProject, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-8 outline-none focus:border-brand-accent min-h-[200px] resize-none leading-relaxed text-sm italic" placeholder="Tell the story of how this project lived..." />
                               </div>
                               <InputGroup label="Global Impact" description="Strategic context behind the visual." value={editingProject.globalContext || ''} onChange={v => setEditingProject({...editingProject, globalContext: v})} isTextarea />
                               <InputGroup label="Creative Tension" description="The core friction being resolved." value={editingProject.creativeTension || ''} onChange={v => setEditingProject({...editingProject, creativeTension: v})} isTextarea />
                            </div>
                         </motion.section>
                      )}

                      {projectStep === 2 && (
                         <motion.section key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-16">
                            <header className="flex items-center gap-6 mb-12">
                               <span className="w-12 h-12 rounded-2xl border-2 border-brand-accent flex items-center justify-center font-black text-xs text-brand-accent">03</span>
                               <h3 className="text-3xl font-black uppercase tracking-tighter">Process Engine</h3>
                            </header>
                            <div className="grid md:grid-cols-2 gap-20">
                               <div className="space-y-12">
                                  <ListManager label="Creative Roles" items={editingProject.mariaRole || []} onAdd={v => setEditingProject({...editingProject, mariaRole: [...(editingProject.mariaRole || []), v]})} onRemove={i => setEditingProject({...editingProject, mariaRole: editingProject.mariaRole?.filter((_, idx) => idx !== i)})} />
                                  <ListManager label="Toolchain Inventory" items={editingProject.tools || []} onAdd={v => setEditingProject({...editingProject, tools: [...(editingProject.tools || []), v]})} onRemove={i => setEditingProject({...editingProject, tools: editingProject.tools?.filter((_, idx) => idx !== i)})} />
                               </div>
                               <div className="p-10 glass rounded-[3rem] border border-brand-accent/20 bg-brand-accent/[0.01]">
                                  <h4 className="text-[10px] uppercase tracking-widest text-brand-accent mb-10 block font-black font-mono">Chromatic Logic</h4>
                                  <ColorPaletteManager colors={editingProject.colorSystem || []} onChange={v => setEditingProject({...editingProject, colorSystem: v})} />
                               </div>
                            </div>
                         </motion.section>
                      )}

                      {projectStep === 3 && (
                         <motion.section key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-20">
                            <ImagePhaseManager title="01 / Direction Moodboard" field="moodboardImages" images={editingProject.moodboardImages || []} onUpload={handleFileUpload} progress={uploadProgress} status={uploadStatus} state={editingProject} stateSetter={setEditingProject} onRemove={i => setEditingProject({...editingProject, moodboardImages: editingProject.moodboardImages?.filter((_, idx) => idx !== i)})} />
                            
                            <div className="space-y-10 pt-20 border-t border-white/5">
                               <div className="flex justify-between items-center">
                                  <h4 className="text-2xl font-black uppercase tracking-tighter">02 / Creative Search</h4>
                                  <div className="flex gap-2">
                                    {['masonry', 'slot-machine'].map(type => (
                                      <button key={type} type="button" onClick={() => setEditingProject({...editingProject, explorationType: type as any})} className={cn("px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all", editingProject.explorationType === type ? "bg-white text-black border-white" : "glass border-white/20")}>{type}</button>
                                    ))}
                                  </div>
                               </div>
                               <ImagePhaseManager hideHeading field="explorationImages" images={editingProject.explorationImages || []} onUpload={handleFileUpload} progress={uploadProgress} status={uploadStatus} state={editingProject} stateSetter={setEditingProject} onRemove={i => setEditingProject({...editingProject, explorationImages: editingProject.explorationImages?.filter((_, idx) => idx !== i)})} />
                               <InputGroup label="Search Arc Commentary" value={editingProject.explorationCaption || ''} onChange={v => setEditingProject({...editingProject, explorationCaption: v})} isTextarea />
                            </div>

                            <div className="space-y-10 pt-20 border-t border-white/5">
                               <h4 className="text-2xl font-black uppercase tracking-tighter">03 / Hybridization Proofs</h4>
                               <ImagePhaseManager hideHeading field="hybridizationImages" images={editingProject.hybridizationImages || []} onUpload={handleFileUpload} progress={uploadProgress} status={uploadStatus} state={editingProject} stateSetter={setEditingProject} onRemove={i => setEditingProject({...editingProject, hybridizationImages: editingProject.hybridizationImages?.filter((_, idx) => idx !== i)})} />
                               <InputGroup label="The Spark (Decision Point)" value={editingProject.decisionMomentCopy || ''} onChange={v => setEditingProject({...editingProject, decisionMomentCopy: v})} isTextarea />
                            </div>

                            <div className="space-y-10 p-12 bg-white/[0.01] rounded-[4rem] border border-white/5">
                               <h4 className="text-3xl font-black uppercase tracking-widest text-brand-accent">04 / Master Outcome</h4>
                               <ImagePhaseManager hideHeading field="outcomeVisuals" images={editingProject.outcomeVisuals || []} onUpload={handleFileUpload} progress={uploadProgress} status={uploadStatus} state={editingProject} stateSetter={setEditingProject} onRemove={i => setEditingProject({...editingProject, outcomeVisuals: editingProject.outcomeVisuals?.filter((_, idx) => idx !== i)})} />
                               <InputGroup label="Final Archive Synthesis" value={editingProject.outcomeResultCopy || ''} onChange={v => setEditingProject({...editingProject, outcomeResultCopy: v})} isTextarea />
                            </div>
                         </motion.section>
                      )}

                      {projectStep === 4 && (
                         <motion.section key="step-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-16">
                            <header className="flex items-center gap-6 mb-12">
                               <span className="w-12 h-12 rounded-2xl border-2 border-brand-accent flex items-center justify-center font-black text-xs text-brand-accent">05</span>
                               <h3 className="text-3xl font-black uppercase tracking-tighter">Technical Meta</h3>
                            </header>
                            <div className="grid md:grid-cols-2 gap-12">
                               <div className="space-y-10">
                                  <InputGroup label="Primary Experience URL (.mp4)" value={editingProject.videoUrl || ''} onChange={v => setEditingProject({...editingProject, videoUrl: v})} />
                                  <InputGroup label="Production Study URL (.mp4)" value={editingProject.animaticVideoUrl || ''} onChange={v => setEditingProject({...editingProject, animaticVideoUrl: v})} />
                               </div>
                               <div className="space-y-10">
                                  <InputGroup label="Archive Filter Label" value={editingProject.subCategory || ''} onChange={v => setEditingProject({...editingProject, subCategory: v})} />
                                  <InputGroup label="Study Commentary" value={editingProject.animaticCaption || ''} onChange={v => setEditingProject({...editingProject, animaticCaption: v})} isTextarea />
                               </div>
                            </div>
                            <div className="pt-20 border-t border-white/5 text-center">
                               <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 4 }} className="w-24 h-24 bg-brand-accent/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-brand-accent/20">
                                  <Check size={48} className="text-brand-accent" />
                               </motion.div>
                               <h4 className="text-3xl font-black uppercase tracking-widest mb-4">Integrity Check Passed</h4>
                               <p className="text-brand-muted uppercase text-[10px] tracking-widest font-black max-w-sm mx-auto opacity-50 italic">The Archive item is ready for global distribution.</p>
                            </div>
                         </motion.section>
                      )}
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
                    {projectStep < PROJECT_STEPS.length - 1 ? (
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
                      onClick={(e) => { e.preventDefault(); saveToFirestore('projects', editingProject, editingProject.id, () => { setEditingProject(null); setProjectStep(0); }); }}
                      disabled={isSubmitting || Object.keys(uploadProgress).length > 0} 
                      className={cn(
                        "px-14 py-5 font-black uppercase tracking-widest rounded-2xl transition-all text-[10px] shadow-2xl disabled:opacity-50",
                        Object.keys(uploadProgress).length > 0 ? "glass text-brand-muted" : "bg-brand-accent text-brand-bg"
                      )}
                    >
                      {isSubmitting ? 'Syncing...' : 'Commit to Archive'}
                    </button>
                    <button type="button" onClick={() => { setEditingProject(null); setProjectStep(0); }} className="px-10 py-5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-red-500 transition-all font-mono">Abort</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video / Lab / Gallery Modals follow same refactored pattern... */}
        {/* I'll omit full implementation for brevity but ensure they work by logic */}
        {/* Actually, it's safer to provide them to ensure consistency */}

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
                      {['Animations & Motion', 'AI Generated'].map((p) => (
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
