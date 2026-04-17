import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { labItems as fallbackLabItems, projects as fallbackProjects, videos as fallbackVideos } from './data';
import { GalleryImage, LabItem, Project, Video } from './types';

export function useLivePortfolioData() {
  const [projects, setProjects] = useState<Project[]>(fallbackProjects);
  const [videos, setVideos] = useState<Video[]>(fallbackVideos);
  const [labItems, setLabItems] = useState<LabItem[]>(fallbackLabItems);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    const unsubProjects = onSnapshot(
      collection(db, 'projects'),
      (snapshot) => {
        if (!snapshot.empty) {
          setProjects(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as Project)));
        }
      },
      () => {},
    );

    const unsubVideos = onSnapshot(
      collection(db, 'videos'),
      (snapshot) => {
        if (!snapshot.empty) {
          setVideos(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as Video)));
        }
      },
      () => {},
    );

    const unsubLabItems = onSnapshot(
      collection(db, 'labItems'),
      (snapshot) => {
        if (!snapshot.empty) {
          setLabItems(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as LabItem)));
        }
      },
      () => {},
    );

    const unsubGallery = onSnapshot(
      collection(db, 'gallery'),
      (snapshot) => {
        if (!snapshot.empty) {
          setGalleryImages(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as GalleryImage)));
        }
      },
      () => {},
    );

    return () => {
      unsubProjects();
      unsubVideos();
      unsubLabItems();
      unsubGallery();
    };
  }, []);

  return { projects, videos, labItems, galleryImages };
}
