import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore/lite';
import { dbLite } from '../firebase-firestore-lite';
import { Project, Video, GalleryImage } from '../types';
import { normalizeProject, toPortfolioItem, videoToPortfolioItem, galleryToPortfolioItem, PortfolioItem } from '../utils/portfolio';
import { readSessionCache, writeSessionCache } from '../utils/session-cache';

const PERSISTED_FEATURED_ITEMS_KEY = 'featured-items-persisted-v1';
const PERSISTED_FEATURED_ITEMS_TTL_MS = 1000 * 60 * 60 * 6;

type PersistedFeaturedItems = {
  items: PortfolioItem[];
  savedAt: number;
};

const readPersistedFeaturedItems = (): PortfolioItem[] | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PERSISTED_FEATURED_ITEMS_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedFeaturedItems;
    if (!parsed?.items?.length || typeof parsed.savedAt !== 'number') {
      return null;
    }

    if (Date.now() - parsed.savedAt > PERSISTED_FEATURED_ITEMS_TTL_MS) {
      window.localStorage.removeItem(PERSISTED_FEATURED_ITEMS_KEY);
      return null;
    }

    return parsed.items;
  } catch {
    return null;
  }
};

const writePersistedFeaturedItems = (items: PortfolioItem[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      PERSISTED_FEATURED_ITEMS_KEY,
      JSON.stringify({
        items,
        savedAt: Date.now(),
      } satisfies PersistedFeaturedItems),
    );
  } catch {
    // Best-effort cache only.
  }
};

/**
 * Lightweight hook that only fetches documents where `featured == true`.
 * This avoids downloading entire collections on the homepage.
 */
export const useFeaturedItems = () => {
  const initialItems =
    readSessionCache<PortfolioItem[]>('featured-items') || readPersistedFeaturedItems() || [];
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [loading, setLoading] = useState(() => initialItems.length === 0);

  useEffect(() => {
    let cancelled = false;

    if (initialItems.length > 0) {
      writeSessionCache('featured-items', initialItems);
      return () => {
        cancelled = true;
      };
    }

    const loadFeaturedItems = async () => {
      if (!dbLite) {
        setLoading(false);
        return;
      }

      try {
        const [projectsSnapshot, videosSnapshot, gallerySnapshot] = await Promise.all([
          getDocs(query(collection(dbLite, 'projects'), where('status', '==', 'published'))),
          getDocs(query(collection(dbLite, 'videos'), where('status', '==', 'published'))),
          getDocs(query(collection(dbLite, 'gallery'), where('status', '==', 'published'))),
        ]);

        if (cancelled) {
          return;
        }

        const featuredProjects = projectsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Project))
          .filter((item) => item.featured)
          .map((item) => toPortfolioItem(normalizeProject(item)));

        const featuredVideos = videosSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Video))
          .filter((item) => item.featured)
          .map((item) => videoToPortfolioItem(item));

        const featuredGallery = gallerySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as GalleryImage))
          .filter((item) => item.featured)
          .map((item) => galleryToPortfolioItem(item));

        const nextItems = [...featuredProjects, ...featuredVideos, ...featuredGallery];
        setItems(nextItems);
        writeSessionCache('featured-items', nextItems);
        writePersistedFeaturedItems(nextItems);
      } catch (error) {
        console.error('Failed to load featured portfolio items:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadFeaturedItems();

    return () => {
      cancelled = true;
    };
  }, [initialItems]);

  return { items, loading };
};
