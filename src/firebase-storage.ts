import { getStorage } from 'firebase/storage';
import { firebaseApp, firebaseStorageBucket } from './firebase-app';

export const storage = getStorage(firebaseApp, `gs://${firebaseStorageBucket}`);
