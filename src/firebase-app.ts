/// <reference types="vite/client" />
import { initializeApp, FirebaseApp } from 'firebase/app';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const firebaseConfigured = Boolean(apiKey);

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp: FirebaseApp | null = firebaseConfigured
  ? initializeApp(firebaseConfig)
  : null;
export const firebaseDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
export const firebaseStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
