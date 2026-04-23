import { initializeFirestore, Firestore } from 'firebase/firestore';
import { firebaseApp, firebaseDatabaseId } from './firebase-app';

export const db: Firestore | null = firebaseApp
  ? initializeFirestore(
      firebaseApp,
      { ignoreUndefinedProperties: true },
      firebaseDatabaseId || undefined,
    )
  : null;
