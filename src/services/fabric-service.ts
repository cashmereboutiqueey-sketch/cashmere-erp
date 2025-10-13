
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Fabric } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const fabricsCollection = collection(db, 'fabrics');

const fromFirestore = (doc: any): Fabric => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    code: data.code,
    color: data.color,
    length_in_meters: data.length_in_meters,
    supplier_id: data.supplier_id,
    price_per_meter: data.price_per_meter,
    min_stock_level: data.min_stock_level,
  };
};

export async function getFabrics(): Promise<Fabric[]> {
  try {
    // Return empty array to clear demo data
    return [];
  } catch (error) {
    console.error('Error getting fabrics: ', error);
    return [];
  }
}

export async function addFabric(fabricData: Omit<Fabric, 'id'>) {
  try {
    const docRef = await addDoc(fabricsCollection, {
      ...fabricData,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/fabrics');
    return docRef.id;
  } catch (error) {
    console.error('Error adding fabric: ', error);
    throw new Error('Could not add fabric');
  }
}

export async function updateFabric(id: string, fabricData: Partial<Fabric>) {
  try {
    const fabricDoc = doc(db, 'fabrics', id);
    await updateDoc(fabricDoc, {
        ...fabricData,
        updatedAt: serverTimestamp()
    });
    revalidatePath('/fabrics');
  } catch (error) {
    console.error('Error updating fabric: ', error);
    throw new Error('Could not update fabric');
  }
}

export async function deleteFabric(id: string) {
  try {
    const fabricDoc = doc(db, 'fabrics', id);
    await deleteDoc(fabricDoc);
    revalidatePath('/fabrics');
  } catch (error) {
    console.error('Error deleting fabric: ', error);
    throw new Error('Could not delete fabric');
  }
}
