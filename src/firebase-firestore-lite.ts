import { Firestore, getFirestore } from 'firebase/firestore/lite';
import { firebaseApp } from './firebase-app';

export const dbLite: Firestore | null = firebaseApp
  ? getFirestore(firebaseApp)
  : null;
