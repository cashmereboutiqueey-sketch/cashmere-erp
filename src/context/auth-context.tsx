
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseAuthUser } from 'firebase/auth';
import { app } from '@/services/firebase';
import { User } from '@/lib/types';
import { getUsers } from '@/services/user-service';

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
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      const usersFromDb = await getUsers();
      setAllUsers(usersFromDb);
    };
    fetchAllUsers();
  }, []);

  const fetchUserRole = useCallback((email: string): User | null => {
    if (!email || allUsers.length === 0) return null;
    return allUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }, [allUsers]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email) {
          if (allUsers.length > 0) {
              setLoading(true);
              const userRoleData = fetchUserRole(fbUser.email);
              if (userRoleData) {
                  setUser({
                      id: userRoleData.id,
                      name: fbUser.displayName || userRoleData.name,
                      email: fbUser.email,
                      avatarUrl: fbUser.photoURL || userRoleData.avatarUrl,
                      role: userRoleData.role,
                  });
              } else {
                  setUser(null); // Explicitly set user to null if not found
              }
              setLoading(false);
          }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [allUsers, fetchUserRole]);
  
   // Effect to handle user setting when allUsers loads after fbUser is set
  useEffect(() => {
    if (firebaseUser && firebaseUser.email && allUsers.length > 0 && !user) {
       setLoading(true);
       const userRoleData = fetchUserRole(firebaseUser.email);
       if (userRoleData) {
            setUser({
                id: userRoleData.id,
                name: firebaseUser.displayName || userRoleData.name,
                email: firebaseUser.email,
                avatarUrl: firebaseUser.photoURL || userRoleData.avatarUrl,
                role: userRoleData.role,
            });
       }
       setLoading(false);
    }
  }, [firebaseUser, allUsers, user, fetchUserRole]);


  const login = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (!userCredential.user || !userCredential.user.email) {
      return null;
    }
    
    const fbUser = userCredential.user;
    const userRoleData = fetchUserRole(fbUser.email);
    
    if (userRoleData) {
        const appUser: User = {
            id: userRoleData.id,
            name: fbUser.displayName || userRoleData.name,
            email: fbUser.email!,
            avatarUrl: fbUser.photoURL || userRoleData.avatarUrl,
            role: userRoleData.role,
        };
        setUser(appUser);
        return appUser;
    }
    
    return null; // User not found in our DB
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
