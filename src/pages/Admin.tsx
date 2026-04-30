import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Trash2, Edit3, LogOut, Info, Rocket,
  Check, CheckCircle2, Image as ImageIcon, Star,
  Compass, Zap, Cpu, Code, ArrowRight, AlertTriangle
} from 'lucide-react';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getRedirectResult, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';

import { auth } from '../firebase-auth';
import { db } from '../firebase-firestore';
import { storage } from '../firebase-storage';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';
import { handleFirestoreError, OperationType } from '../utils/error-handlers';
import { toReadableGoogleSignInError } from '../utils/auth-errors';
import { PageTransition } from '../components/PageTransition';
import { StorageOptimizer } from '../admin/storage-optimizer';

import { GalleryAdmin } from '../admin/gallery-admin';
import { LabAdmin } from '../admin/lab-admin';
import { ProjectsAdmin } from '../admin/projects-admin';
import { VideosAdmin } from '../admin/videos-admin';
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

type AdminNotice = {
  tone: 'success' | 'error';
  message: string;
};

type DeleteTarget = {
  collectionName: string;
  id: string;
  label: string;
};

const COLLECTION_LABELS: Record<string, string> = {
  projects: 'project',
  videos: 'video',
  labItems: 'lab item',
  gallery: 'gallery image',
};

const hasText = (value?: string | null) => Boolean(value?.trim());

const toValidationMessage = (errors: string[]) =>
  errors.length === 1 ? errors[0] : `Missing: ${errors.join(', ')}.`;

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

  const featuredCounts = useMemo(() => ({
    projects: projects.filter(p => p.featured).length,
    videos: videos.filter(v => v.featured).length,
    gallery: galleryImages.filter(g => g.featured).length,
  }), [projects, videos, galleryImages]);
  const topWorkItems = useMemo(
    () => [
      ...projects.map((item) => ({ collectionName: 'projects' as const, id: item.id, rank: item.workPriorityRank })),
      ...videos.map((item) => ({ collectionName: 'videos' as const, id: item.id, rank: item.workPriorityRank })),
      ...galleryImages.map((item) => ({ collectionName: 'gallery' as const, id: item.id, rank: item.workPriorityRank })),
    ].filter((item) => typeof item.rank === 'number' && item.rank >= 1 && item.rank <= 6),
    [projects, videos, galleryImages],
  );

  const [activeTab, setActiveTab] = useState<'projects' | 'videos' | 'lab' | 'gallery' | 'hero' | 'storage'>('projects');
  
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
  const [adminNotice, setAdminNotice] = useState<AdminNotice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  
  const [projectStep, setProjectStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>({});
  const [storageConnected, setStorageConnected] = useState<'testing' | 'ok' | 'blocked'>('testing');
  const [loginError, setLoginError] = useState<string | null>(null);
  const hasActiveUploads = Object.keys(uploadProgress).length > 0;

  const showAdminNotice = (notice: AdminNotice) => {
    setAdminNotice(notice);
  };

  const triggerAdminNotice = (message: string, tone: AdminNotice['tone']) => {
    showAdminNotice({ tone, message });
  };

  const reportFirestoreError = (error: unknown, operationType: OperationType, path: string) => {
    try {
      handleFirestoreError(error, operationType, path);
    } catch (friendlyError) {
      showAdminNotice({
        tone: 'error',
        message: friendlyError instanceof Error ? friendlyError.message : 'something burned. try again.',
      });
    }
  };

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

  useEffect(() => {
    if (!adminNotice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setAdminNotice(null);
    }, 3600);

    return () => window.clearTimeout(timeout);
  }, [adminNotice]);

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error("Google redirect sign-in failed", error);
      setLoginError(toReadableGoogleSignInError(error));
    });
  }, []);

  const handleFileUpload = async (file: File, field: string, stateSetter: any): Promise<string | undefined> => {
    if (!file) return;
    if (!auth.currentUser) {
      const message = 'You are not logged in. Firebase blocks anonymous uploads.';
      showAdminNotice({ tone: 'error', message });
      throw new Error(message);
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
          setUploadProgress(prev => { const n = { ...prev }; delete n[uploadId]; return n; });
          setUploadStatus(prev => { const n = { ...prev }; delete n[uploadId]; return n; });
          showAdminNotice({ tone: 'error', message: 'Upload failed. Please try again.' });
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
          setUploadStatus(prev => { const n = { ...prev }; delete n[uploadId]; return n; });
          showAdminNotice({ tone: 'error', message: 'Upload failed. Please try again.' });
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
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      setLoginError(null);
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      const authError = (error ?? {}) as { code?: string; message?: string };
      const shouldTryRedirect =
        authError.code === 'auth/internal-error' ||
        authError.code === 'auth/network-request-failed' ||
        authError.code === 'auth/popup-blocked' ||
        authError.message?.includes('The requested action is invalid');

      if (shouldTryRedirect) {
        setLoginError('Popup sign-in was blocked by the browser context. Redirecting to Google...');
        await signInWithRedirect(auth, provider);
        return;
      }

      setLoginError(toReadableGoogleSignInError(error));
    }
  };

  const toggleProjectFeatured = async (project: Project) => {
    try {
      const docRef = doc(db, 'projects', project.id);
      await updateDoc(docRef, { featured: !project.featured, updatedAt: serverTimestamp() });
      triggerAdminNotice(`Project ${project.featured ? 'removed from' : 'added to'} Homepage`, 'success');
    } catch (error) {
      console.error(error);
      triggerAdminNotice(`Failed to toggle feature status for ${project.title}`, 'error');
    }
  };

  const toggleVideoFeatured = async (video: Video) => {
    try {
      const docRef = doc(db, 'videos', video.id);
      await updateDoc(docRef, { featured: !video.featured, updatedAt: serverTimestamp() });
      triggerAdminNotice(`Video ${video.featured ? 'removed from' : 'added to'} Homepage`, 'success');
    } catch (error) {
      console.error(error);
      triggerAdminNotice(`Failed to toggle feature status for ${video.title}`, 'error');
    }
  };

  const toggleGalleryFeatured = async (img: GalleryImage) => {
    try {
      const docRef = doc(db, 'gallery', img.id);
      await updateDoc(docRef, { featured: !img.featured, updatedAt: serverTimestamp() });
      triggerAdminNotice(`Gallery image ${img.featured ? 'removed from' : 'added to'} Homepage`, 'success');
    } catch (error) {
      console.error(error);
      triggerAdminNotice(`Failed to toggle gallery image feature status`, 'error');
    }
  };

  const toggleWorkPriority = async (
    collectionName: 'projects' | 'videos' | 'gallery',
    item: Project | Video | GalleryImage,
  ) => {
    try {
      const docRef = doc(db, collectionName, item.id);
      if (item.workPriorityRank) {
        await updateDoc(docRef, { workPriorityRank: null, updatedAt: serverTimestamp() });
        triggerAdminNotice('Removed from Work top 6.', 'success');
        return;
      }

      const usedRanks = new Set(topWorkItems.map((entry) => entry.rank));
      const nextRank = [1, 2, 3, 4, 5, 6].find((rank) => !usedRanks.has(rank));

      if (!nextRank) {
        triggerAdminNotice('Top 6 is full. Remove one first.', 'error');
        return;
      }

      await updateDoc(docRef, { workPriorityRank: nextRank, updatedAt: serverTimestamp() });
      triggerAdminNotice(`Added to Work top ${nextRank}.`, 'success');
    } catch (error) {
      console.error(error);
      triggerAdminNotice('Failed to update Work top 6.', 'error');
    }
  };

  const validateProjectDraft = (draft: Partial<Project>) => {
    const pillar = normalizePillar(draft.pillar);
    const errors: string[] = [];

    if (!hasText(draft.title)) errors.push('title');
    if (!hasText(draft.description)) errors.push('description');

    if (pillar === 'Art Direction') {
      if (!hasText(draft.heroImage) && !hasText(draft.thumbnail)) errors.push('hero image');
      if (!hasText(draft.creativeTension)) errors.push('creative tension');
      if (!hasText(draft.globalContext)) errors.push('global context');
      if (!hasText(draft.approach)) errors.push('approach');
      if (!hasText(draft.outcomeCopy) && !hasText(draft.outcomeResultCopy)) errors.push('outcome copy');
    }

    if (pillar === 'AI Generated') {
      if ((draft.aiSubtype || 'ai-image') === 'ai-video') {
        if (!hasText(draft.mediaUrl) && !hasText(draft.videoUrl)) errors.push('video file');
      } else if (!hasText(draft.thumbnail) && !hasText(draft.heroImage)) {
        errors.push('image asset');
      }
    }

    if (pillar === 'Illustration & Design' && !uniqueStrings(draft.images?.length ? draft.images : [draft.thumbnail]).length) {
      errors.push('images gallery');
    }

    if (pillar === 'Animation & Motion') {
      const motionType = draft.motionType || 'embed';
      if (motionType === 'embed' && !hasText(draft.embedUrl)) errors.push('YouTube / Vimeo URL');
      if (motionType !== 'embed' && !hasText(draft.mediaUrl) && !hasText(draft.videoUrl)) errors.push('motion file');
    }

    return errors;
  };

  const validateHomeHeroDraft = (draft: HomeHeroSettings) => {
    const errors: string[] = [];

    if (draft.mode === 'image' && !hasText(draft.desktopImage)) {
      errors.push('desktop image');
    }

    if (draft.mode === 'video' && !hasText(draft.desktopVideo) && !hasText(draft.mobileVideo)) {
      errors.push('desktop or mobile video');
    }

    return errors;
  };

  const validateCollectionDraft = (collectionName: string, data: any) => {
    const errors: string[] = [];

    if (collectionName === 'videos') {
      if (!hasText(data.title)) errors.push('title');
      if (!hasText(data.url)) errors.push('stream URL');
      if (!hasText(data.thumbnail)) errors.push('thumbnail');
    }

    if (collectionName === 'labItems') {
      if (!hasText(data.title)) errors.push('title');
      if (!hasText(data.content)) errors.push('log / findings');
      if (!hasText(data.date)) errors.push('date');
    }

    if (collectionName === 'gallery') {
      if (!hasText(data.url)) errors.push('asset link');
      if (!data.pillar) errors.push('pillar allocation');
      if (!data.tags?.length) errors.push('at least one tag');
    }

    return errors;
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
        workPriorityRank: draft.workPriorityRank ?? null,
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
        workPriorityRank: draft.workPriorityRank ?? null,
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
        workPriorityRank: draft.workPriorityRank ?? null,
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
      workPriorityRank: draft.workPriorityRank ?? null,
    };
  };

  const saveProject = async () => {
    if (!editingProject) {
      return;
    }

    if (hasActiveUploads) {
      showAdminNotice({ tone: 'error', message: 'Wait for uploads to finish before saving.' });
      return;
    }

    const validationErrors = validateProjectDraft(editingProject);
    if (validationErrors.length) {
      showAdminNotice({ tone: 'error', message: toValidationMessage(validationErrors) });
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
      showAdminNotice({ tone: 'success', message: `${payload.title || 'Project'} saved.` });
    } catch (error) {
      reportFirestoreError(error, OperationType.WRITE, 'projects');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveToFirestore = async (collectionName: string, data: any, id: string | undefined, resetFn: () => void) => {
    if (hasActiveUploads) {
      showAdminNotice({ tone: 'error', message: 'Wait for uploads to finish before saving.' });
      return;
    }

    const validationErrors = validateCollectionDraft(collectionName, data);
    if (validationErrors.length) {
      showAdminNotice({ tone: 'error', message: toValidationMessage(validationErrors) });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...data, updatedAt: serverTimestamp() };
      if (id) {
        const { id: _, ...updateData } = payload;
        await updateDoc(doc(db, collectionName, id), updateData);
      } else {
        await addDoc(collection(db, collectionName), { ...payload, createdAt: serverTimestamp() });
      }
      resetFn();
      showAdminNotice({
        tone: 'success',
        message: `${COLLECTION_LABELS[collectionName] || 'item'} saved.`,
      });
    } catch (error) {
      reportFirestoreError(error, OperationType.WRITE, collectionName);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveHomeHero = async () => {
    if (hasActiveUploads) {
      setHomeHeroNotice({ tone: 'error', message: 'Wait for uploads to finish before saving.' });
      return;
    }

    const validationErrors = validateHomeHeroDraft(homeHeroDraft);
    if (validationErrors.length) {
      setHomeHeroNotice({ tone: 'error', message: toValidationMessage(validationErrors) });
      return;
    }

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

  const requestDeleteFromFirestore = (collectionName: string, id: string, label: string) => {
    setDeleteTarget({ collectionName, id, label });
  };

  const confirmDeleteFromFirestore = async () => {
    if (!deleteTarget) return;

    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, deleteTarget.collectionName, deleteTarget.id));
      showAdminNotice({
        tone: 'success',
        message: `${COLLECTION_LABELS[deleteTarget.collectionName] || 'item'} deleted.`,
      });
      setDeleteTarget(null);
    } catch (error) {
      reportFirestoreError(error, OperationType.DELETE, deleteTarget.collectionName);
    } finally {
      setIsSubmitting(false);
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
                {(['projects', 'videos', 'lab', 'gallery', 'hero', 'storage'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => { setActiveTab(tab); }}
                    aria-pressed={activeTab === tab}
                    className={cn(
                      "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shrink-0",
                      activeTab === tab 
                        ? "bg-brand-accent text-brand-bg border-brand-accent" 
                        : "glass text-brand-muted border-white/5 hover:text-white"
                    )}
                  >
                    {tab === 'hero' ? 'home hero' : tab === 'storage' ? 'storage' : tab}
                    {(tab === 'projects' || tab === 'videos' || tab === 'gallery') && featuredCounts[tab] > 0 ? (
                      <span className="ml-2 inline-flex items-center justify-center min-w-[1.2rem] h-[1.2rem] rounded-full bg-white/20 text-[8px] font-black px-1">
                        {featuredCounts[tab]}★
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              {activeTab === 'hero' ? (
                <div className="glass rounded-2xl border border-white/5 px-6 py-4 text-[10px] uppercase tracking-[0.24em] text-brand-muted font-mono">
                  Singleton setting: <span className="text-brand-accent">settings/{HOME_HERO_SETTINGS_ID}</span>
                </div>
              ) : activeTab === 'storage' ? null : (
                <div className="glass rounded-2xl border border-white/5 px-6 py-4 text-[10px] uppercase tracking-[0.24em] text-brand-muted font-mono">
                  This editor has its own search, create, batch, and filter controls inside the panel below.
                </div>
              )}
            </div>
          </div>
        </header>

        <AnimatePresence>
          {adminNotice ? (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              role={adminNotice.tone === 'error' ? 'alert' : 'status'}
              aria-live={adminNotice.tone === 'error' ? 'assertive' : 'polite'}
              className={cn(
                "relative z-30 mb-8 rounded-2xl border px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]",
                adminNotice.tone === 'success'
                  ? 'border-green-500/20 bg-green-500/10 text-green-400'
                  : 'border-red-500/20 bg-red-500/10 text-red-400',
              )}
            >
              {adminNotice.message}
            </motion.div>
          ) : null}
        </AnimatePresence>

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

                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">Orientation</label>
                      <button
                        type="button"
                        onClick={() => setHomeHeroDraft({ ...homeHeroDraft, flipHorizontal: !homeHeroDraft.flipHorizontal })}
                        className={cn(
                          "w-full px-6 py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.22em] border transition-all h-24 flex items-center justify-center",
                          homeHeroDraft.flipHorizontal ? "bg-white text-black border-white shadow-xl" : "glass border-white/5 hover:border-white/20"
                        )}
                      >
                        {homeHeroDraft.flipHorizontal ? "Mirrored (Flipped)" : "Default"}
                      </button>
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

                          <div className="pt-2 border-t border-white/5 space-y-4">
                            <label className="text-[10px] uppercase tracking-widest text-brand-muted block font-black">Poster Orientation</label>
                            <button
                              type="button"
                              onClick={() => setHomeHeroDraft({ ...homeHeroDraft, flipPosterHorizontal: !homeHeroDraft.flipPosterHorizontal })}
                              className={cn(
                                "w-full md:max-w-xs px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.22em] border transition-all flex items-center justify-center",
                                homeHeroDraft.flipPosterHorizontal ? "bg-white text-black border-white shadow-xl" : "glass border-white/5 hover:border-white/20"
                              )}
                            >
                              {homeHeroDraft.flipPosterHorizontal ? "Mirrored (Flipped)" : "Default"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-4 border-t border-white/5 pt-8 md:flex-row">
                      <button
                        type="button"
                        onClick={saveHomeHero}
                        disabled={isSubmitting || hasActiveUploads}
                        className={cn(
                          "px-10 py-5 font-black uppercase tracking-widest rounded-2xl transition-all text-[10px] shadow-xl",
                          isSubmitting || hasActiveUploads
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
                        role={homeHeroNotice.tone === 'error' ? 'alert' : 'status'}
                        aria-live={homeHeroNotice.tone === 'error' ? 'assertive' : 'polite'}
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

          {activeTab === 'storage' && (
            <StorageOptimizer
              projects={projects}
              videos={videos}
              labItems={labItems}
              galleryImages={galleryImages}
              homeHero={homeHero}
            />
          )}

          {activeTab === 'projects' && (
            <div className="col-span-full">
              <ProjectsAdmin />
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="col-span-full">
              <VideosAdmin />
            </div>
          )}

          {activeTab === 'lab' && (
            <div className="col-span-full">
              <LabAdmin />
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="col-span-full">
              <GalleryAdmin />
            </div>
          )}

        </div>

        {/* Project Edit Modal */}
        <AnimatePresence>
          {editingProject && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-4 sm:p-12 overflow-hidden backdrop-blur-3xl">
              <div className="w-full max-w-6xl glass rounded-[4rem] overflow-hidden flex flex-col max-h-[90vh] relative border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]" role="dialog" aria-modal="true" aria-labelledby="project-editor-title">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5 z-50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((projectStep + 1) / projectSteps.length) * 100}%` }}
                    className="h-full bg-brand-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)]"
                  />
                </div>

                <div className="flex justify-between items-center px-10 py-10 bg-brand-bg/60 backdrop-blur-xl border-b border-white/5">
                  <div className="flex items-center gap-12">
                    <h2 id="project-editor-title" className="text-4xl font-black tracking-tighter uppercase leading-none">{editingProject.id ? 'Edit' : 'Create'}</h2>
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
                  <button type="button" onClick={closeProjectEditor} className="p-4 glass rounded-full hover:bg-red-500 hover:text-white transition-all" aria-label="Close project editor"><X size={24} /></button>
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

                                <div className="space-y-4 pt-4">
                                  <div className="flex items-center justify-between p-6 rounded-3xl glass border border-white/5">
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-white">Feature on Homepage</p>
                                      <p className="text-[10px] text-brand-muted mt-1 font-mono uppercase tracking-wider">Show this project in the Selected Works grid</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setEditingProject({ ...editingProject, featured: !editingProject.featured })}
                                      className={`w-12 h-6 rounded-full transition-colors relative ${editingProject.featured ? 'bg-brand-accent' : 'bg-white/10'}`}
                                      aria-pressed={editingProject.featured}
                                    >
                                      <div className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${editingProject.featured ? 'left-7 bg-black' : 'left-1 bg-white/70'}`} />
                                    </button>
                                  </div>
                                </div>

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
                    {hasActiveUploads && (
                      <button type="button" onClick={() => setUploadProgress({})} className="px-6 py-5 border border-brand-accent/30 text-brand-accent rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-accent/10 transition-all">Clear Sync</button>
                    )}
                    <button 
                      onClick={(e) => { e.preventDefault(); saveProject(); }}
                      disabled={isSubmitting || hasActiveUploads} 
                      className={cn(
                        "px-14 py-5 font-black uppercase tracking-widest rounded-2xl transition-all text-[10px] shadow-2xl disabled:opacity-50",
                        hasActiveUploads ? "glass text-brand-muted" : "bg-brand-accent text-brand-bg"
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
              <div className="w-full max-w-3xl glass rounded-[3rem] p-12 border border-white/10" role="dialog" aria-modal="true" aria-labelledby="video-editor-title">
                <h2 id="video-editor-title" className="text-5xl font-black uppercase tracking-tighter mb-12">Video Node</h2>
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
                    <button type="submit" disabled={isSubmitting || hasActiveUploads} className="flex-grow py-5 bg-brand-accent text-brand-bg font-black uppercase tracking-widest rounded-2xl shadow-xl disabled:opacity-40">Commit Node</button>
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
                 <div className="w-full max-w-4xl glass rounded-[3rem] p-12 border border-white/10 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar" role="dialog" aria-modal="true" aria-labelledby="lab-editor-title">
                    <h2 id="lab-editor-title" className="text-5xl font-black uppercase tracking-tighter mb-12">Lab Entry</h2>
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
                          <button type="submit" disabled={isSubmitting || hasActiveUploads} className="flex-grow py-5 bg-brand-accent text-brand-bg font-black uppercase tracking-widest rounded-2xl shadow-xl disabled:opacity-40">Archive Entry</button>
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
                 <div className="w-full max-w-2xl glass rounded-[3rem] p-12 border border-white/10" role="dialog" aria-modal="true" aria-labelledby="gallery-editor-title">
                    <h2 id="gallery-editor-title" className="text-5xl font-black uppercase tracking-tighter mb-10">Gallery Asset</h2>
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
                          <button type="submit" disabled={isSubmitting || hasActiveUploads} className="flex-grow py-5 bg-brand-accent text-brand-bg font-black uppercase tracking-widest rounded-2xl shadow-xl disabled:opacity-40">Sync Asset</button>
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
               <div className="w-full max-w-7xl h-full flex flex-col bg-brand-bg border border-white/10 rounded-[4rem] shadow-3xl overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="batch-sync-title">
                  <header className="p-12 bg-white/[0.02] border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 shrink-0">
                     <div>
                        <h2 id="batch-sync-title" className="text-5xl font-black uppercase tracking-tighter flex items-center gap-6">Batch Sync <span className="text-brand-accent text-2xl font-mono px-4 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-full">{bulkGalleryQueue.length} items</span></h2>
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
                        <button type="button" onClick={() => { bulkGalleryQueue.forEach(it => { if(it.previewUrl) URL.revokeObjectURL(it.previewUrl); }); setBulkGalleryQueue([]); setBulkTags([]); }} className="p-5 glass rounded-2xl hover:text-red-500 transition-colors" aria-label="Close batch sync"><X size={24} /></button>
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
                           {item.status === 'Ready' && <button type="button" onClick={() => setBulkGalleryQueue(bulkGalleryQueue.filter((_, bi) => bi !== idx))} className="absolute top-4 right-4 text-white/10 hover:text-red-500 transition-colors" aria-label={`Remove ${item.file.name} from batch`}><Trash2 size={18} /></button>}
                        </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {deleteTarget ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[240] flex items-center justify-center bg-black/90 p-6 backdrop-blur-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
              onClick={() => setDeleteTarget(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                className="w-full max-w-lg rounded-[3rem] border border-red-500/20 bg-brand-bg p-10 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <AlertTriangle size={28} />
                </div>
                <h2 id="delete-confirm-title" className="mb-4 text-4xl font-black uppercase tracking-tighter">
                  Delete forever?
                </h2>
                <p className="text-sm leading-relaxed text-white/65">
                  This will permanently delete the {COLLECTION_LABELS[deleteTarget.collectionName] || 'item'}{' '}
                  <span className="text-white">“{deleteTarget.label}”</span> from Firestore. This cannot be undone.
                </p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={confirmDeleteFromFirestore}
                    disabled={isSubmitting}
                    className="flex-1 rounded-2xl bg-red-500 px-6 py-5 text-[10px] font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-red-400 disabled:opacity-40"
                  >
                    {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-[10px] font-black uppercase tracking-[0.22em] text-white/70 transition-colors hover:bg-white hover:text-black"
                  >
                    Keep It
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};
