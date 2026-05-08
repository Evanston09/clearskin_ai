import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import {
  type Auth,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { type Firestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth as firebaseAuth, db as firestoreDb } from '@/firebaseConfig';

const auth = firebaseAuth as Auth;
const db = firestoreDb as Firestore;

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function saveUserProfile(user: User, extra?: { username?: string }) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: extra?.username ?? user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (newUser) => {
      setUser(newUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await saveUserProfile(user);
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: username });
    await saveUserProfile(user, { username });
  };

  const signInWithGoogle = async () => {
    throw new Error('Google Sign-In is disabled in Expo Go. Use email sign-in for now.');
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
