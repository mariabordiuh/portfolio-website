import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore/lite';
import { dbLite } from '../firebase-firestore-lite';
import { Project, Video, GalleryImage } from '../types';
import { normalizeProject, toPortfolioItem, videoToPortfolioItem, galleryToPortfolioItem, PortfolioItem } from '../utils/portfolio';
import { readSessionCache, writeSessionCache } from '../utils/session-cache';

/**
 * Lightweight hook that only fetches documents where `featured == true`.
 * This avoids downloading entire collections on the homepage.
 */
export const useFeaturedItems = () => {
  const [items, setItems] = useState<PortfolioItem[]>(() => readSessionCache<PortfolioItem[]>('featured-items') || []);
  const [loading, setLoading] = useState(() => !readSessionCache<PortfolioItem[]>('featured-items'));

  useEffect(() => {
    let cancelled = false;

    const loadFeaturedItems = async () => {
      if (!dbLite) {
        setLoading(false);
        return;
      }

      try {
        const [projectsSnapshot, videosSnapshot, gallerySnapshot] = await Promise.all([
          getDocs(query(collection(dbLite, 'projects'), where('featured', '==', true))),
          getDocs(query(collection(dbLite, 'videos'), where('featured', '==', true))),
          getDocs(query(collection(dbLite, 'gallery'), where('featured', '==', true))),
        ]);

        if (cancelled) {
          return;
        }

        const featuredProjects = projectsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Project))
          .filter((item) => item.status !== 'draft')
          .map((item) => toPortfolioItem(normalizeProject(item)));

        const featuredVideos = videosSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Video))
          .filter((item) => item.status !== 'draft')
          .map((item) => videoToPortfolioItem(item));

        const featuredGallery = gallerySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as GalleryImage))
          .filter((item) => item.status !== 'draft')
          .map((item) => galleryToPortfolioItem(item));

        const nextItems = [...featuredProjects, ...featuredVideos, ...featuredGallery];
        setItems(nextItems);
        writeSessionCache('featured-items', nextItems);
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
  }, []);

  return { items, loading };
};
