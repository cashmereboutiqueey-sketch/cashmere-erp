'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Product, ProductVariant } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const productsCollection = collection(db, 'products');

const fromFirestore = (doc: any): Product => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    category: data.category,
    created_at: data.created_at?.toDate().toISOString() || new Date().toISOString(),
    variants: data.variants || [],
  };
};

export async function getProducts(): Promise<Product[]> {
  try {
    const snapshot = await getDocs(productsCollection);
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error('Error getting products: ', error);
    return [];
  }
}

export async function addProduct(productData: Omit<Product, 'id' | 'created_at'>) {
  try {
    const batch = writeBatch(db);
    
    // Generate unique IDs for variants
    const variantsWithIds = productData.variants.map(variant => ({
        ...variant,
        id: doc(collection(db, 'products')).id // Generate a new unique ID
    }));

    const docRef = doc(productsCollection);
    batch.set(docRef, {
      ...productData,
      variants: variantsWithIds,
      created_at: serverTimestamp(),
    });

    await batch.commit();

    revalidatePath('/products');
    return docRef.id;
  } catch (error) {
    console.error('Error adding product: ', error);
    throw new Error('Could not add product');
  }
}

export async function updateProduct(id: string, productData: Partial<Product>) {
  try {
    const productDoc = doc(db, 'products', id);
    await updateDoc(productDoc, {
        ...productData,
        updatedAt: serverTimestamp()
    });
    revalidatePath('/products');
  } catch (error) {
    console.error('Error updating product: ', error);
    throw new Error('Could not update product');
  }
}

export async function deleteProduct(id: string) {
  try {
    const productDoc = doc(db, 'products', id);
    await deleteDoc(productDoc);
    revalidatePath('/products');
  } catch (error) {
    console.error('Error deleting product: ', error);
    throw new Error('Could not delete product');
  }
}
