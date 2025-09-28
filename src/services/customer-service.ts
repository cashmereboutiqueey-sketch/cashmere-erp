
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
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    if (typeof timestamp === 'string') {
        return timestamp;
    }
    // Fallback for any other case
    return new Date().toISOString();
  };

  return {
    id: doc.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    avatarUrl: data.avatarUrl,
    notes: data.notes,
    created_at: convertTimestampToString(data.created_at || data.createdAt),
  };
};

export async function getCustomers(): Promise<Customer[]> {
  try {
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
