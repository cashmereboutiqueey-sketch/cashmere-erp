
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Customer } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const customersCollection = collection(db, 'customers');

// Helper to convert Firestore doc to Customer type
const fromFirestore = (doc: any): Customer => {
  const data = doc.data();
  
  const convertTimestampToString = (timestamp: any): string => {
    if (!timestamp) {
        // Fallback for older records or if timestamp is somehow missing
        return new Date().toISOString();
    }
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    if (typeof timestamp === 'string') {
        return timestamp;
    }
    // Handle cases where it might be a plain object { seconds, nanoseconds }
    if (timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
        return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000).toISOString();
    }
    // Fallback for any other unexpected formats
    return new Date(timestamp).toISOString();
  };

  const timestamp = data.created_at || data.createdAt;

  return {
    id: doc.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    avatarUrl: data.avatarUrl,
    notes: data.notes,
    created_at: convertTimestampToString(timestamp),
  };
};

export async function getCustomers(): Promise<Customer[]> {
  try {
    if (process.env.NODE_ENV === 'development') {
        return [];
    }
    const snapshot = await getDocs(customersCollection);
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error('Error getting customers: ', error);
    return [];
  }
}

export async function addCustomer(customerData: Omit<Customer, 'id' | 'created_at'>) {
  try {
    const docRef = await addDoc(customersCollection, {
      ...customerData,
      created_at: serverTimestamp(),
    });
    revalidatePath('/customers');
    revalidatePath('/pos');
    return docRef.id;
  } catch (error) {
    console.error('Error adding customer: ', error);
    throw new Error('Could not add customer');
  }
}

export async function updateCustomer(id: string, customerData: Partial<Customer>) {
  try {
    const customerDoc = doc(db, 'customers', id);
    await updateDoc(customerDoc, {
        ...customerData,
        updatedAt: serverTimestamp()
    });
    revalidatePath('/customers');
  } catch (error) {
    console.error('Error updating customer: ', error);
    throw new Error('Could not update customer');
  }
}

export async function deleteCustomer(id: string) {
  try {
    const customerDoc = doc(db, 'customers', id);
    await deleteDoc(customerDoc);
    revalidatePath('/customers');
  } catch (error) {
    console.error('Error deleting customer: ', error);
    throw new Error('Could not delete customer');
  }
}
