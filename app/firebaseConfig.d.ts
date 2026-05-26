import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export const auth: Auth;
export const db: Firestore;
declare const app: FirebaseApp;
export default app;
