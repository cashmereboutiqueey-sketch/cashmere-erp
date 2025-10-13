
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Worker } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const workersCollection = collection(db, 'workers');

const fromFirestore = (doc: any): Worker => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
  };
};

export async function getWorkers(): Promise<Worker[]> {
  try {
    const snapshot = await getDocs(workersCollection);
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error('Error getting workers: ', error);
    return [];
  }
}

export async function addWorker(workerData: Omit<Worker, 'id'>) {
  try {
    const docRef = await addDoc(workersCollection, {
      ...workerData,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/production');
    return docRef.id;
  } catch (error) {
    console.error('Error adding worker: ', error);
    throw new Error('Could not add worker');
  }
}
