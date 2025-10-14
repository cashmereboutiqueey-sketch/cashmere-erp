
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseAuthUser } from 'firebase/auth';
import { app } from '@/services/firebase';
import { User } from '@/lib/types';
import { getUsers, addUser } from '@/services/user-service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseAuthUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => void;
}

const auth = getAuth(app);
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchUserRole = async (email: string): Promise<User | null> => {
    // This is inefficient but necessary for the demo to map email to user document ID
    const allUsers = await getUsers(); 
    return allUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email) {
        setLoading(true);
        let userRoleData = await fetchUserRole(fbUser.email);
        
        if (!userRoleData) {
            console.warn("User not found in ERP, creating new admin user for:", fbUser.email);
            const newUser: Omit<User, 'id'> = {
                name: fbUser.displayName || 'Admin User',
                email: fbUser.email,
                avatarUrl: fbUser.photoURL || `https://picsum.photos/seed/${fbUser.uid}/100/100`,
                role: 'admin',
            };
            const newUserId = await addUser(newUser);
            userRoleData = { ...newUser, id: newUserId };
        }

        const appUser: User = {
            id: userRoleData.id,
            name: fbUser.displayName || userRoleData.name,
            email: fbUser.email!,
            avatarUrl: fbUser.photoURL || userRoleData.avatarUrl,
            role: userRoleData.role,
        };
        setUser(appUser);

      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (!userCredential.user || !userCredential.user.email) {
      return null;
    }
    
    const fbUser = userCredential.user;
    let userRoleData = await fetchUserRole(fbUser.email);
    
    if (!userRoleData) {
        const newUser: Omit<User, 'id'> = {
            name: fbUser.displayName || 'Admin User',
            email: fbUser.email!,
            avatarUrl: fbUser.photoURL || `https://picsum.photos/seed/${fbUser.uid}/100/100`,
            role: 'admin',
        };
        const newUserId = await addUser(newUser);
        userRoleData = { ...newUser, id: newUserId };
    }
    
    const appUser: User = {
        id: userRoleData.id,
        name: fbUser.displayName || userRoleData.name,
        email: fbUser.email!,
        avatarUrl: fbUser.photoURL || userRoleData.avatarUrl,
        role: userRoleData.role,
    };
    
    setUser(appUser);
    return appUser;
  };

  const logout = () => {
    setUser(null);
    return signOut(auth);
  };

  const value = { user, firebaseUser, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
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
