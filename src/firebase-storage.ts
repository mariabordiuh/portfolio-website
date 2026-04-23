import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseApp, firebaseStorageBucket } from './firebase-app';

export const storage: FirebaseStorage | null = firebaseApp
  ? getStorage(firebaseApp, `gs://${firebaseStorageBucket}`)
  : null;
