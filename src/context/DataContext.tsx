import React, { createContext, useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/error-handlers';
import { Project, Video, LabItem, GalleryImage } from '../types';
import { normalizeProject } from '../utils/portfolio';

interface DataContextType {
  projects: Project[];
  videos: Video[];
  labItems: LabItem[];
  galleryImages: GalleryImage[];
  loading: boolean;
}

export const DataContext = createContext<DataContextType>({ 
  projects: [], 
  videos: [], 
  labItems: [], 
  galleryImages: [], 
  loading: true 
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [labItems, setLabItems] = useState<LabItem[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    // In a real scoped approach, we'd call these in the specific page components.
    // However, to maintain the existing context-based architecture but add skeletons,
    // we'll keep them here for now but ensure 'loading' is true until first snapshots.
    
    // We'll track individual loading states internally
    let projectsLoaded = false;
    let videosLoaded = false;
    let labItemsLoaded = false;
    let galleryLoaded = false;

    const checkAllLoaded = () => {
      if (projectsLoaded && videosLoaded && labItemsLoaded && galleryLoaded) {
        setLoading(false);
      }
    };

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjects(
        snapshot.docs.map((entry) => normalizeProject({ id: entry.id, ...entry.data() } as Project)),
      );
      projectsLoaded = true;
      checkAllLoaded();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));

    const unsubVideos = onSnapshot(collection(db, 'videos'), (snapshot) => {
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video)));
      videosLoaded = true;
      checkAllLoaded();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'videos'));

    const unsubLab = onSnapshot(collection(db, 'labItems'), (snapshot) => {
      setLabItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LabItem)));
      labItemsLoaded = true;
      checkAllLoaded();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'labItems'));

    const unsubGallery = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      setGalleryImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage)));
      galleryLoaded = true;
      checkAllLoaded();
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'gallery'));

    return () => {
      unsubProjects();
      unsubVideos();
      unsubLab();
      unsubGallery();
    };
  }, []);

  return (
    <DataContext.Provider value={{ projects, videos, labItems, galleryImages, loading }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
