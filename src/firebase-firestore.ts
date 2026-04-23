import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseApp, firebaseDatabaseId } from './firebase-app';

export const db: Firestore | null = firebaseApp
  ? getFirestore(firebaseApp, firebaseDatabaseId)
  : null;
