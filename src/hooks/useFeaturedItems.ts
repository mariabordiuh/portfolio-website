import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore/lite';
import { dbLite } from '../firebase-firestore-lite';
import { Project, Video, GalleryImage } from '../types';
import {
  normalizeProject,
  toPortfolioItem,
  videoToPortfolioItem,
  galleryToPortfolioItem,
  PortfolioItem,
  WORK_PILLARS,
} from '../utils/portfolio';
import { readSessionCache, writeSessionCache } from '../utils/session-cache';

const PERSISTED_FEATURED_ITEMS_KEY = 'featured-items-persisted-v2';
const PERSISTED_FEATURED_ITEMS_TTL_MS = 1000 * 60 * 60 * 6;
const FEATURED_SESSION_CACHE_KEY = 'featured-items-v2';

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

const SOURCE_WEIGHT: Record<PortfolioItem['source'], number> = {
  project: 0,
  video: 1,
  gallery: 2,
};

const sortPriorityItems = (items: PortfolioItem[]) =>
  [...items].sort((left, right) => {
    const leftRank = left.workPriorityRank ?? Number.POSITIVE_INFINITY;
    const rightRank = right.workPriorityRank ?? Number.POSITIVE_INFINITY;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.title.localeCompare(right.title);
  });

const sortBalancedItems = (items: PortfolioItem[]) =>
  [...items].sort((left, right) => {
    const sourceDelta = SOURCE_WEIGHT[left.source] - SOURCE_WEIGHT[right.source];
    if (sourceDelta !== 0) {
      return sourceDelta;
    }

    return left.title.localeCompare(right.title);
  });

const uniqueById = (items: PortfolioItem[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
};

const buildBalancedFallback = (items: PortfolioItem[]) => {
  const sorted = sortBalancedItems(items);
  const preferred = sorted.filter((item) => item.source !== 'gallery');
  const used = new Set<string>();
  const pool: PortfolioItem[] = [];

  for (const pillar of WORK_PILLARS) {
    const candidate =
      preferred.find((item) => item.pillar === pillar && !used.has(item.id)) ??
      sorted.find((item) => item.pillar === pillar && !used.has(item.id));

    if (!candidate) {
      continue;
    }

    used.add(candidate.id);
    pool.push(candidate);
  }

  for (const candidate of sorted) {
    if (used.has(candidate.id)) {
      continue;
    }

    used.add(candidate.id);
    pool.push(candidate);
  }

  return pool;
};

const buildSelectedPool = (items: PortfolioItem[]) => {
  const ranked = sortPriorityItems(items.filter((item) => typeof item.workPriorityRank === 'number'));

  if (ranked.length > 0) {
    const featured = sortBalancedItems(items.filter((item) => item.featured));
    const fallback = buildBalancedFallback(items);
    return uniqueById([...ranked, ...featured, ...fallback]).slice(0, 12);
  }

  return buildBalancedFallback(items).slice(0, 12);
};

/**
 * Homepage selection hook.
 * Uses explicit ranking when available, otherwise falls back to a balanced
 * published mix so the homepage never depends on a single optional flag.
 */
export const useFeaturedItems = () => {
  const initialItems =
    readSessionCache<PortfolioItem[]>(FEATURED_SESSION_CACHE_KEY) || readPersistedFeaturedItems() || [];
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [loading, setLoading] = useState(() => initialItems.length === 0);

  useEffect(() => {
    let cancelled = false;

    if (initialItems.length > 0) {
      writeSessionCache(FEATURED_SESSION_CACHE_KEY, initialItems);
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

        const publishedProjects = projectsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Project))
          .map((item) => toPortfolioItem(normalizeProject(item)));

        const publishedVideos = videosSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Video))
          .map((item) => videoToPortfolioItem(item));

        const publishedGallery = gallerySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as GalleryImage))
          .map((item) => galleryToPortfolioItem(item));

        const nextItems = buildSelectedPool([
          ...publishedProjects,
          ...publishedVideos,
          ...publishedGallery,
        ]);
        setItems(nextItems);
        writeSessionCache(FEATURED_SESSION_CACHE_KEY, nextItems);
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
