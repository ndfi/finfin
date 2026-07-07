"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";

const firebaseConfig = {
   apiKey: "AIzaSyCBBqoOwbkjFOnwPAHnsYo8IXrKMRSMFkU",
      authDomain: "finishfin.firebaseapp.com",
      projectId: "finishfin",
      storageBucket: "finishfin.firebasestorage.app",
      messagingSenderId: "892001175544",
      appId: "1:892001175544:web:42ae800ee71a2f175e380d",
      measurementId: "G-PRJ1GK8Q85"
};

// Avoid re-initializing on hot reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// ---------------------------------------------------------------------------
// Simple household Auth context. One shared login is common for a family app,
// but each member can still have their own email/password if you prefer to
// track "createdBy" per transaction.
// ---------------------------------------------------------------------------
const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}
