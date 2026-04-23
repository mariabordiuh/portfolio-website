import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase-firestore';
import { Project, Video, GalleryImage } from '../types';
import { normalizeProject, toPortfolioItem, videoToPortfolioItem, galleryToPortfolioItem, PortfolioItem } from '../utils/portfolio';

/**
 * Lightweight hook that only fetches documents where `featured == true`.
 * This avoids downloading entire collections on the homepage.
 */
export const useFeaturedItems = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let projectsDone = false;
    let videosDone = false;
    let galleryDone = false;

    let featuredProjects: PortfolioItem[] = [];
    let featuredVideos: PortfolioItem[] = [];
    let featuredGallery: PortfolioItem[] = [];

    const handleListenerError = (collectionName: string, markDone: () => void) => (error: unknown) => {
      console.error(`Failed to load featured ${collectionName}:`, error);
      markDone();
      merge();
    };

    const merge = () => {
      if (projectsDone && videosDone && galleryDone) {
        setItems([...featuredProjects, ...featuredVideos, ...featuredGallery]);
        setLoading(false);
      }
    };

    const unsubProjects = onSnapshot(
      query(collection(db, 'projects'), where('featured', '==', true)),
      (snapshot) => {
        featuredProjects = snapshot.docs.map((doc) =>
          toPortfolioItem(normalizeProject({ id: doc.id, ...doc.data() } as Project)),
        );
        projectsDone = true;
        merge();
      },
      handleListenerError('projects', () => {
        featuredProjects = [];
        projectsDone = true;
      }),
    );

    const unsubVideos = onSnapshot(
      query(collection(db, 'videos'), where('featured', '==', true)),
      (snapshot) => {
        featuredVideos = snapshot.docs.map((doc) =>
          videoToPortfolioItem({ id: doc.id, ...doc.data() } as Video),
        );
        videosDone = true;
        merge();
      },
      handleListenerError('videos', () => {
        featuredVideos = [];
        videosDone = true;
      }),
    );

    const unsubGallery = onSnapshot(
      query(collection(db, 'gallery'), where('featured', '==', true)),
      (snapshot) => {
        featuredGallery = snapshot.docs.map((doc) =>
          galleryToPortfolioItem({ id: doc.id, ...doc.data() } as GalleryImage),
        );
        galleryDone = true;
        merge();
      },
      handleListenerError('gallery images', () => {
        featuredGallery = [];
        galleryDone = true;
      }),
    );

    return () => {
      unsubProjects();
      unsubVideos();
      unsubGallery();
    };
  }, []);

  return { items, loading };
};
