'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, query, where, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { ProductFabric } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const productFabricsCollection = collection(db, 'product_fabrics');

const fromFirestore = (doc: any): ProductFabric => {
  const data = doc.data();
  return {
    product_id: data.product_id,
    fabric_id: data.fabric_id,
    fabric_quantity_meters: data.fabric_quantity_meters,
  };
};

export async function getAllProductFabrics(): Promise<ProductFabric[]> {
    try {
        const snapshot = await getDocs(productFabricsCollection);
        return snapshot.docs.map(fromFirestore);
    } catch (error) {
        console.error('Error getting all product-fabric relationships: ', error);
        return [];
    }
}


export async function getProductFabricsForProduct(productId: string): Promise<ProductFabric[]> {
  try {
    const q = query(productFabricsCollection, where('product_id', '==', productId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error('Error getting product-fabric relationship: ', error);
    return [];
  }
}

export async function addProductFabrics(productId: string, fabrics: Omit<ProductFabric, 'product_id'>[], batch: any) {
  for (const fabric of fabrics) {
    const docRef = doc(collection(db, 'product_fabrics'));
    batch.set(docRef, { ...fabric, product_id: productId, createdAt: serverTimestamp() });
  }
}


export async function deleteProductFabrics(productId: string, batch: any) {
    const q = query(productFabricsCollection, where('product_id', '==', productId));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
}
