'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Customer } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const customersCollection = collection(db, 'customers');

// Helper to convert Firestore doc to Customer type
const fromFirestore = (doc: any): Customer => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    avatarUrl: data.avatarUrl,
    notes: data.notes,
  };
};

export async function getCustomers(): Promise<Customer[]> {
  try {
    const snapshot = await getDocs(customersCollection);
    if (snapshot.empty) {
        console.log('No customers found, adding mock data...');
        // Add some mock data if the collection is empty
        const mockCustomers = [
            { name: 'Alia Hassan', email: 'alia.h@example.com', phone: '555-0101', address: '123 Silk Rd, Fashion City', avatarUrl: 'https://picsum.photos/seed/user1/100/100' },
            { name: 'Fatima Ahmed', email: 'fatima.a@example.com', phone: '555-0102', address: '456 Cotton Ave, Style Town', avatarUrl: 'https://picsum.photos/seed/user2/100/100' },
            { name: 'Noor Khan', email: 'noor.k@example.com', phone: '555-0103', address: '789 Wool Blvd, Textile Village', avatarUrl: 'https://picsum.photos/seed/user3/100/100' },
        ];
        for (const customer of mockCustomers) {
            await addDoc(customersCollection, {...customer, createdAt: serverTimestamp()});
        }
        const newSnapshot = await getDocs(customersCollection);
        return newSnapshot.docs.map(fromFirestore);
    }
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error('Error getting customers: ', error);
    return [];
  }
}

export async function addCustomer(customerData: Omit<Customer, 'id'>) {
  try {
    const docRef = await addDoc(customersCollection, {
      ...customerData,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/customers');
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
