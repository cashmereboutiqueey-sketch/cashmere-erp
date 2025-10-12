
'use server';

import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Notification } from '@/lib/types';
import { revalidatePath } from 'next/cache';


const notificationsCollection = collection(db, 'notifications');

export async function createNotification(notificationData: Omit<Notification, 'id' | 'created_at' | 'read'>) {
    try {
        await addDoc(notificationsCollection, {
            ...notificationData,
            read: false,
            created_at: serverTimestamp(),
        });
        // This won't trigger a client-side revalidation, but it's good practice.
        // The real-time listener in the header will pick up the change.
    } catch (error) {
        console.error("Error creating notification: ", error);
        // We don't throw here as it's a non-critical side effect.
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const batch = writeBatch(db);
        const q = query(notificationsCollection, where('read', '==', false));
        const snapshot = await getDocs(q);
        
        snapshot.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });

        await batch.commit();
    } catch (error) {
        console.error("Error marking notifications as read: ", error);
        throw new Error('Could not update notifications');
    }
}
