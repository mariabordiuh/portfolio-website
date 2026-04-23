import React, { createContext, useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../firebase-firestore';
import { handleFirestoreError, OperationType } from '../utils/error-handlers';
import { Project, Video, LabItem, GalleryImage, HomeHeroSettings } from '../types';
import { DEFAULT_HOME_HERO_SETTINGS, HOME_HERO_SETTINGS_ID, normalizeHomeHeroSettings } from '../utils/home-hero';
import { normalizeProject } from '../utils/portfolio';
import { readSessionCache, writeSessionCache } from '../utils/session-cache';

type DataCollectionKey = 'projects' | 'videos' | 'labItems' | 'galleryImages' | 'homeHero';
type DataCollectionConfig = Partial<Record<DataCollectionKey, boolean>>;

interface DataContextType {
  projects: Project[];
  videos: Video[];
  labItems: LabItem[];
  galleryImages: GalleryImage[];
  homeHero: HomeHeroSettings;
  homeHeroReady: boolean;
  loading: boolean;
}

export const DataContext = createContext<DataContextType>({ 
  projects: [], 
  videos: [], 
  labItems: [], 
  galleryImages: [], 
  homeHero: DEFAULT_HOME_HERO_SETTINGS,
  homeHeroReady: false,
  loading: true 
});

const DEFAULT_COLLECTIONS: Record<DataCollectionKey, boolean> = {
  projects: true,
  videos: true,
  labItems: true,
  galleryImages: true,
  homeHero: false,
};

const CACHE_KEYS: Record<DataCollectionKey, string> = {
  projects: 'projects',
  videos: 'videos',
  labItems: 'lab-items',
  galleryImages: 'gallery-images',
  homeHero: 'home-hero',
};

const resolveCollections = (collections?: DataCollectionConfig) => ({
  projects: collections?.projects ?? DEFAULT_COLLECTIONS.projects,
  videos: collections?.videos ?? DEFAULT_COLLECTIONS.videos,
  labItems: collections?.labItems ?? DEFAULT_COLLECTIONS.labItems,
  galleryImages: collections?.galleryImages ?? DEFAULT_COLLECTIONS.galleryImages,
  homeHero: collections?.homeHero ?? DEFAULT_COLLECTIONS.homeHero,
});

export const DataProvider = ({
  children,
  collections,
}: {
  children: React.ReactNode;
  collections?: DataCollectionConfig;
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [labItems, setLabItems] = useState<LabItem[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [homeHero, setHomeHero] = useState<HomeHeroSettings>(DEFAULT_HOME_HERO_SETTINGS);
  const [homeHeroReady, setHomeHeroReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const enabledCollections = resolveCollections(collections);

  useEffect(() => {
    setLoading(true);
    const cachedProjects = enabledCollections.projects
      ? readSessionCache<Project[]>(CACHE_KEYS.projects)
      : null;
    const cachedVideos = enabledCollections.videos
      ? readSessionCache<Video[]>(CACHE_KEYS.videos)
      : null;
    const cachedLabItems = enabledCollections.labItems
      ? readSessionCache<LabItem[]>(CACHE_KEYS.labItems)
      : null;
    const cachedGalleryImages = enabledCollections.galleryImages
      ? readSessionCache<GalleryImage[]>(CACHE_KEYS.galleryImages)
      : null;
    const cachedHomeHero = enabledCollections.homeHero
      ? readSessionCache<HomeHeroSettings>(CACHE_KEYS.homeHero)
      : null;

    setProjects(cachedProjects || []);
    setVideos(cachedVideos || []);
    setLabItems(cachedLabItems || []);
    setGalleryImages(cachedGalleryImages || []);
    setHomeHero(cachedHomeHero || DEFAULT_HOME_HERO_SETTINGS);
    setHomeHeroReady(!enabledCollections.homeHero || Boolean(cachedHomeHero));

    const unsubscribers: Array<() => void> = [];

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };

    if (
      enabledCollections.projects ||
      enabledCollections.videos ||
      enabledCollections.labItems ||
      enabledCollections.galleryImages ||
      enabledCollections.homeHero
    ) {
      testConnection();
    } else {
      setLoading(false);
      return () => {};
    }

    let projectsLoaded = !enabledCollections.projects;
    let videosLoaded = !enabledCollections.videos;
    let labItemsLoaded = !enabledCollections.labItems;
    let galleryLoaded = !enabledCollections.galleryImages;
    let homeHeroLoaded = !enabledCollections.homeHero;

    const checkAllLoaded = () => {
      if (projectsLoaded && videosLoaded && labItemsLoaded && galleryLoaded && homeHeroLoaded) {
        setLoading(false);
      }
    };

    if (enabledCollections.projects) {
      const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
        const nextProjects = snapshot.docs.map((entry) =>
          normalizeProject({ id: entry.id, ...entry.data() } as Project),
        );
        setProjects(nextProjects);
        writeSessionCache(CACHE_KEYS.projects, nextProjects);
        projectsLoaded = true;
        checkAllLoaded();
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));
      unsubscribers.push(unsubProjects);
    }

    if (enabledCollections.videos) {
      const unsubVideos = onSnapshot(collection(db, 'videos'), (snapshot) => {
        const nextVideos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
        setVideos(nextVideos);
        writeSessionCache(CACHE_KEYS.videos, nextVideos);
        videosLoaded = true;
        checkAllLoaded();
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'videos'));
      unsubscribers.push(unsubVideos);
    }

    if (enabledCollections.labItems) {
      const unsubLab = onSnapshot(collection(db, 'labItems'), (snapshot) => {
        const nextLabItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LabItem));
        setLabItems(nextLabItems);
        writeSessionCache(CACHE_KEYS.labItems, nextLabItems);
        labItemsLoaded = true;
        checkAllLoaded();
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'labItems'));
      unsubscribers.push(unsubLab);
    }

    if (enabledCollections.galleryImages) {
      const unsubGallery = onSnapshot(collection(db, 'gallery'), (snapshot) => {
        const nextGalleryImages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage));
        setGalleryImages(nextGalleryImages);
        writeSessionCache(CACHE_KEYS.galleryImages, nextGalleryImages);
        galleryLoaded = true;
        checkAllLoaded();
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'gallery'));
      unsubscribers.push(unsubGallery);
    }

    if (enabledCollections.homeHero) {
      const unsubHomeHero = onSnapshot(
        doc(db, 'settings', HOME_HERO_SETTINGS_ID),
        (snapshot) => {
          const nextHomeHero = snapshot.exists()
            ? normalizeHomeHeroSettings({ id: snapshot.id, ...snapshot.data() } as Partial<HomeHeroSettings>)
            : DEFAULT_HOME_HERO_SETTINGS;
          setHomeHero(nextHomeHero);
          writeSessionCache(CACHE_KEYS.homeHero, nextHomeHero);
          setHomeHeroReady(true);
          homeHeroLoaded = true;
          checkAllLoaded();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'settings/homeHero'),
      );
      unsubscribers.push(unsubHomeHero);
    }

    checkAllLoaded();

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [
    enabledCollections.galleryImages,
    enabledCollections.homeHero,
    enabledCollections.labItems,
    enabledCollections.projects,
    enabledCollections.videos,
  ]);

  return (
    <DataContext.Provider value={{ projects, videos, labItems, galleryImages, homeHero, homeHeroReady, loading }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
