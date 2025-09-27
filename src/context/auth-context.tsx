
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
        // Find the matching mock user to get the role.
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
            // User is authenticated with Firebase but not found in our app's user list.
            // Log a warning but don't log them out. This allows admins to add them later.
            console.warn("Firebase user not found in application user list:", fbUser.email);
            // Create a user object with a default or 'guest' role if needed, or null.
            // For now, we deny access by setting user to null, but don't sign out of Firebase.
            setUser(null); 
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
    if (!userCredential.user) {
      return null;
    }
    
    const fbUser = userCredential.user;
    // After successful Firebase login, check if user is in our system.
    const userRoleData = mockUsers.find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());
    
    if (!userRoleData) {
        // We do not sign them out. Instead, we prevent app access and throw an informative error.
        throw new Error("Login successful, but this user has not been assigned a role in the ERP system. Please contact an administrator.");
    }
    
    const appUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || userRoleData.name,
        email: fbUser.email!,
        avatarUrl: fbUser.photoURL || userRoleData.avatarUrl,
        role: userRoleData.role,
    };
    
    setUser(appUser);
    return appUser;
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
