
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseAuthUser } from 'firebase/auth';
import { app } from '@/services/firebase';
import { User } from '@/lib/types';
import { getUsers, addUser } from '@/services/user-service';

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
        const allUsers = await getUsers();
        let userRoleData = allUsers.find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());

        if (!userRoleData && fbUser.email) {
            // If no user found, create one for the first authenticated user and make them an admin.
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

        if (userRoleData) {
            const appUser: User = {
                id: userRoleData.id,
                name: fbUser.displayName || userRoleData.name,
                email: fbUser.email!,
                avatarUrl: fbUser.photoURL || userRoleData.avatarUrl,
                role: userRoleData.role,
            };
            setUser(appUser);
        } else {
            console.error("Firebase user could not be mapped to an application user:", fbUser.email);
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
    const allUsers = await getUsers();
    let userRoleData = allUsers.find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());
    
    if (!userRoleData) {
         // Auto-create admin on first login
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
