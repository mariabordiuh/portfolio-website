import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase-firestore';
import { GalleryImage, LabItem, Project, Video } from './types';

type SubscriptionHandlers = {
  onProjects: (projects: Project[]) => void;
  onVideos: (videos: Video[]) => void;
  onLabItems: (labItems: LabItem[]) => void;
  onGalleryImages: (galleryImages: GalleryImage[]) => void;
  onError: (message: string) => void;
};

function toReadableError(scope: string, error: unknown) {
  if (error instanceof Error && error.message) {
    return `${scope}: ${error.message}`;
  }

  return `${scope}: unexpected Firebase error`;
}

export function subscribeToLivePortfolioData(handlers: SubscriptionHandlers) {
  const unsubProjects = onSnapshot(
    collection(db, 'projects'),
    (snapshot) => {
      handlers.onProjects(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as Project)));
    },
    (error) => {
      handlers.onError(toReadableError('Could not load projects', error));
    },
  );

  const unsubVideos = onSnapshot(
    collection(db, 'videos'),
    (snapshot) => {
      handlers.onVideos(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as Video)));
    },
    (error) => {
      handlers.onError(toReadableError('Could not load videos', error));
    },
  );

  const unsubLabItems = onSnapshot(
    collection(db, 'labItems'),
    (snapshot) => {
      handlers.onLabItems(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as LabItem)));
    },
    (error) => {
      handlers.onError(toReadableError('Could not load lab notes', error));
    },
  );

  const unsubGallery = onSnapshot(
    collection(db, 'gallery'),
    (snapshot) => {
      handlers.onGalleryImages(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as GalleryImage)));
    },
    (error) => {
      handlers.onError(toReadableError('Could not load gallery images', error));
    },
  );

  return () => {
    unsubProjects();
    unsubVideos();
    unsubLabItems();
    unsubGallery();
  };
}
