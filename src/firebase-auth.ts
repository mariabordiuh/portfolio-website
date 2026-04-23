import { getAuth, Auth } from 'firebase/auth';
import { firebaseApp } from './firebase-app';

export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
