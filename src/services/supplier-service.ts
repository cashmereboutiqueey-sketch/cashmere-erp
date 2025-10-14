
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Supplier } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const suppliersCollection = collection(db, 'suppliers');

const fromFirestore = (doc: any): Supplier => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    payment_terms: data.payment_terms,
  };
};

export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const snapshot = await getDocs(suppliersCollection);
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error('Error getting suppliers: ', error);
    return [];
  }
}

export async function addSupplier(supplierData: Omit<Supplier, 'id' | 'email'>) {
  try {
    const docRef = await addDoc(suppliersCollection, {
      ...supplierData,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/suppliers');
    return docRef.id;
  } catch (error) {
    console.error('Error adding supplier: ', error);
    throw new Error('Could not add supplier. Please check your database permissions.');
  }
}

export async function updateSupplier(id: string, supplierData: Partial<Supplier>) {
  try {
    const supplierDoc = doc(db, 'suppliers', id);
    await updateDoc(supplierDoc, {
        ...supplierData,
        updatedAt: serverTimestamp()
    });
    revalidatePath('/suppliers');
  } catch (error) {
    console.error('Error updating supplier: ', error);
    throw new Error('Could not update supplier. Please check your database permissions.');
  }
}

export async function deleteSupplier(id: string) {
  try {
    const supplierDoc = doc(db, 'suppliers', id);
    await deleteDoc(supplierDoc);
    revalidatePath('/suppliers');
  } catch (error) {
    console.error('Error deleting supplier: ', error);
    throw new Error('Could not delete supplier');
  }
}
