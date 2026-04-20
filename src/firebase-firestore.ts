import { getFirestore } from 'firebase/firestore';
import { firebaseApp, firebaseDatabaseId } from './firebase-app';

export const db = getFirestore(firebaseApp, firebaseDatabaseId);
