
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { app, db } from '@/services/firebase';
import { User } from '@/lib/types';
import { mockUsers } from '@/lib/data'; // We'll get user roles from here

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseAuthUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => void;
}

const auth = getAuth(app);
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // In a real app, you would fetch user roles from your database.
        // For this demo, we'll find the matching mock user to get the role.
        const userRoleData = mockUsers.find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());

        if (userRoleData) {
            const appUser: User = {
                id: fbUser.uid,
                name: fbUser.displayName || userRoleData.name,
                email: fbUser.email!,
                avatarUrl: fbUser.photoURL || userRoleData.avatarUrl,
                role: userRoleData.role,
            };
            setUser(appUser);
        } else {
            console.warn("User logged in but no role found in mock data for:", fbUser.email);
            // Fallback for users created in Firebase console not in mock data
             const fallbackUser: User = {
                id: fbUser.uid,
                name: fbUser.displayName || 'New User',
                email: fbUser.email!,
                avatarUrl: fbUser.photoURL || '',
                role: 'sales', // default role
            };
            setUser(fallbackUser);
        }

      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if(userCredential.user) {
        const userRoleData = mockUsers.find(u => u.email.toLowerCase() === userCredential.user.email?.toLowerCase());
        if (userRoleData) {
            const appUser: User = {
                id: userCredential.user.uid,
                name: userCredential.user.displayName || userRoleData.name,
                email: userCredential.user.email!,
                avatarUrl: userCredential.user.photoURL || userRoleData.avatarUrl,
                role: userRoleData.role,
            };
            setUser(appUser);
            return appUser;
        }
    }
    return null;
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = { user, firebaseUser, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
