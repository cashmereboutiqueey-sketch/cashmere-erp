
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Worker, WorkLog } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const workersCollection = collection(db, 'workers');
const workLogsCollection = collection(db, 'work_logs');

const fromFirestore = (doc: any): Worker => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    hourly_rate: data.hourly_rate || 0,
  };
};

const workLogFromFirestore = (doc: any): WorkLog => {
    const data = doc.data();
    const timestamp = data.created_at || data.createdAt;

    const convertTimestampToString = (ts: any): string => {
        if (!ts) return new Date().toISOString();
        if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
        if (typeof ts === 'string') return ts;
        if (ts.seconds !== undefined && ts.nanoseconds !== undefined) return new Date(ts.seconds * 1000 + ts.nanoseconds / 1000000).toISOString();
        return new Date(ts).toISOString();
    };

    return {
        id: doc.id,
        worker_id: data.worker_id,
        date: data.date,
        hours: data.hours,
        created_at: convertTimestampToString(timestamp),
    }
}

export async function getWorkers(): Promise<Worker[]> {
  try {
    const snapshot = await getDocs(workersCollection);
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error('Error getting workers: ', error);
    return [];
  }
}

export async function addWorker(workerData: Omit<Worker, 'id' | 'hourly_rate'>) {
  try {
    const docRef = await addDoc(workersCollection, {
      ...workerData,
      hourly_rate: 0,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/production');
    revalidatePath('/workers');
    return docRef.id;
  } catch (error) {
    console.error('Error adding worker: ', error);
    throw new Error('Could not add worker');
  }
}

export async function updateWorkerRate(workerId: string, hourlyRate: number) {
    try {
        const workerDoc = doc(db, 'workers', workerId);
        await updateDoc(workerDoc, { hourly_rate: hourlyRate });
        revalidatePath('/workers');
    } catch (error) {
        console.error('Error updating worker rate: ', error);
        throw new Error('Could not update worker rate');
    }
}

export async function addWorkLog(logData: Omit<WorkLog, 'id' | 'created_at'>) {
    try {
        const docRef = await addDoc(workLogsCollection, {
            ...logData,
            created_at: serverTimestamp(),
        });
        revalidatePath('/workers');
        return docRef.id;
    } catch (error) {
        console.error('Error adding work log: ', error);
        throw new Error('Could not add work log');
    }
}

export async function getWorkLogs(): Promise<WorkLog[]> {
    try {
        const snapshot = await getDocs(workLogsCollection);
        return snapshot.docs.map(workLogFromFirestore);
    } catch(error) {
        console.error('Error getting work logs: ', error);
        return [];
    }
}
