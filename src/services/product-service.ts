'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Product, ProductFabric } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { addProductFabrics, deleteProductFabrics } from './product-fabric-service';

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

export async function addProduct(productData: Omit<Product, 'id' | 'created_at'> & { fabrics: Omit<ProductFabric, 'product_id'>[] }) {
  try {
    const batch = writeBatch(db);
    
    const variantsWithIds = productData.variants.map(variant => ({
        ...variant,
        id: doc(collection(db, 'products')).id 
    }));

    const newProductRef = doc(productsCollection);
    batch.set(newProductRef, {
      name: productData.name,
      category: productData.category,
      variants: variantsWithIds,
      created_at: serverTimestamp(),
    });

    if (productData.fabrics && productData.fabrics.length > 0) {
        await addProductFabrics(newProductRef.id, productData.fabrics, batch);
    }

    await batch.commit();

    revalidatePath('/products');
    return newProductRef.id;
  } catch (error) {
    console.error('Error adding product: ', error);
    throw new Error('Could not add product');
  }
}

export async function updateProduct(id: string, productData: Partial<Product> & { fabrics?: Omit<ProductFabric, 'product_id'>[] }) {
  try {
    const batch = writeBatch(db);
    const productDoc = doc(db, 'products', id);

    // Update product main details
    const { fabrics, ...productDetails } = productData;
    batch.update(productDoc, {
        ...productDetails,
        updatedAt: serverTimestamp()
    });

    // Replace the product-fabric relationships
    if (fabrics) {
        await deleteProductFabrics(id, batch);
        await addProductFabrics(id, fabrics, batch);
    }

    await batch.commit();

    revalidatePath('/products');
  } catch (error) {
    console.error('Error updating product: ', error);
    throw new Error('Could not update product');
  }
}

export async function deleteProduct(id: string) {
  try {
    const batch = writeBatch(db);
    
    const productDoc = doc(db, 'products', id);
    batch.delete(productDoc);
    
    // Also delete product-fabric relationships
    await deleteProductFabrics(id, batch);

    await batch.commit();

    revalidatePath('/products');
  } catch (error) {
    console.error('Error deleting product: ', error);
    throw new Error('Could not delete product');
  }
}
