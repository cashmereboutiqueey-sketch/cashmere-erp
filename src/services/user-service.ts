
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const usersCollection = collection(db, 'users');

const fromFirestore = (doc: any): User => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatarUrl,
    role: data.role,
  };
};

export async function getUsers(): Promise<User[]> {
  try {
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error('Error getting users: ', error);
    return [];
  }
}

export async function addUser(userData: Omit<User, 'id'>) {
  try {
    const docRef = await addDoc(usersCollection, {
      ...userData,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/settings');
    return docRef.id;
  } catch (error) {
    console.error('Error adding user: ', error);
    throw new Error('Could not add user');
  }
}

export async function updateUserRole(id: string, role: User['role']) {
  try {
    const userDoc = doc(db, 'users', id);
    await updateDoc(userDoc, {
      role: role,
      updatedAt: serverTimestamp()
    });
    revalidatePath('/settings');
  } catch (error) {
    console.error('Error updating user role: ', error);
    throw new Error('Could not update user role');
  }
}
