import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore/lite';
import { DataContext } from './DataContext';
import { dbLite } from '../firebase-firestore-lite';
import { DEFAULT_HOME_HERO_SETTINGS, HOME_HERO_SETTINGS_ID, normalizeHomeHeroSettings } from '../utils/home-hero';
import { readSessionCache, writeSessionCache } from '../utils/session-cache';
import { normalizeProject } from '../utils/portfolio';
import { GalleryImage, HomeHeroSettings, LabItem, Project, Video } from '../types';

type DataCollectionKey = 'projects' | 'videos' | 'labItems' | 'galleryImages' | 'homeHero';
type DataCollectionConfig = Partial<Record<DataCollectionKey, boolean>>;

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

const publishedCollectionQuery = (
  collectionName: 'projects' | 'videos' | 'labItems' | 'gallery',
) => query(collection(dbLite!, collectionName), where('status', '==', 'published'));

const logPublicDataError = (scope: string, error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Could not load ${scope}: ${message}`);
};

export const PublicDataProvider = ({
  children,
  collections,
  includeDrafts = false,
}: {
  children: React.ReactNode;
  collections?: DataCollectionConfig;
  includeDrafts?: boolean;
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [labItems, setLabItems] = useState<LabItem[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [homeHero, setHomeHero] = useState<HomeHeroSettings>(DEFAULT_HOME_HERO_SETTINGS);
  const [homeHeroReady, setHomeHeroReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const enabledCollections = resolveCollections(collections);
  const filterLiveItems = <T extends { status?: string }>(items: T[]) =>
    includeDrafts ? items : items.filter((item) => item.status !== 'draft');

  useEffect(() => {
    let cancelled = false;

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

    setProjects(filterLiveItems(cachedProjects || []));
    setVideos(filterLiveItems(cachedVideos || []));
    setLabItems(filterLiveItems(cachedLabItems || []));
    setGalleryImages(filterLiveItems(cachedGalleryImages || []));
    setHomeHero(cachedHomeHero || DEFAULT_HOME_HERO_SETTINGS);
    setHomeHeroReady(!enabledCollections.homeHero || Boolean(cachedHomeHero));

    const load = async () => {
      if (!dbLite) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      const tasks: Promise<void>[] = [];

      if (enabledCollections.projects) {
        tasks.push(
          getDocs(publishedCollectionQuery('projects'))
            .then((snapshot) => {
              if (cancelled) return;
              const nextProjects = snapshot.docs.map((entry) =>
                normalizeProject({ id: entry.id, ...entry.data() } as Project),
              );
              setProjects(filterLiveItems(nextProjects));
              writeSessionCache(CACHE_KEYS.projects, nextProjects);
            })
            .catch((error) => logPublicDataError('projects', error)),
        );
      }

      if (enabledCollections.videos) {
        tasks.push(
          getDocs(publishedCollectionQuery('videos'))
            .then((snapshot) => {
              if (cancelled) return;
              const nextVideos = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as Video));
              setVideos(filterLiveItems(nextVideos));
              writeSessionCache(CACHE_KEYS.videos, nextVideos);
            })
            .catch((error) => logPublicDataError('videos', error)),
        );
      }

      if (enabledCollections.labItems) {
        tasks.push(
          getDocs(publishedCollectionQuery('labItems'))
            .then((snapshot) => {
              if (cancelled) return;
              const nextLabItems = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as LabItem));
              setLabItems(filterLiveItems(nextLabItems));
              writeSessionCache(CACHE_KEYS.labItems, nextLabItems);
            })
            .catch((error) => logPublicDataError('lab items', error)),
        );
      }

      if (enabledCollections.galleryImages) {
        tasks.push(
          getDocs(publishedCollectionQuery('gallery'))
            .then((snapshot) => {
              if (cancelled) return;
              const nextGalleryImages = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as GalleryImage));
              setGalleryImages(filterLiveItems(nextGalleryImages));
              writeSessionCache(CACHE_KEYS.galleryImages, nextGalleryImages);
            })
            .catch((error) => logPublicDataError('gallery images', error)),
        );
      }

      if (enabledCollections.homeHero) {
        tasks.push(
          getDoc(doc(dbLite, 'settings', HOME_HERO_SETTINGS_ID))
            .then((snapshot) => {
              if (cancelled) return;
              const nextHomeHero = snapshot.exists()
                ? normalizeHomeHeroSettings({ id: snapshot.id, ...snapshot.data() } as Partial<HomeHeroSettings>)
                : DEFAULT_HOME_HERO_SETTINGS;
              setHomeHero(nextHomeHero);
              setHomeHeroReady(true);
              writeSessionCache(CACHE_KEYS.homeHero, nextHomeHero);
            })
            .catch((error) => logPublicDataError('home hero settings', error)),
        );
      }

      await Promise.allSettled(tasks);

      if (!cancelled) {
        setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    enabledCollections.galleryImages,
    enabledCollections.homeHero,
    enabledCollections.labItems,
    enabledCollections.projects,
    enabledCollections.videos,
    includeDrafts,
  ]);

  return (
    <DataContext.Provider value={{ projects, videos, labItems, galleryImages, homeHero, homeHeroReady, loading }}>
      {children}
    </DataContext.Provider>
  );
};
