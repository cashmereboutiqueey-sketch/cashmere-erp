
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, runTransaction } from 'firebase/firestore';
import { Product, ProductFabric, ProductVariant } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { addProductFabrics, deleteProductFabrics } from './product-fabric-service';

const productsCollection = collection(db, 'products');

const fromFirestore = (doc: any): Product => {
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
    name: data.name,
    category: data.category,
    difficulty: data.difficulty,
    created_at: convertTimestampToString(timestamp),
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
      difficulty: productData.difficulty,
      variants: variantsWithIds,
      created_at: serverTimestamp(),
    });

    if (productData.fabrics && productData.fabrics.length > 0) {
        await addProductFabrics(newProductRef.id, productData.fabrics, batch);
    }

    await batch.commit();

    revalidatePath('/products');
    revalidatePath('/pricing');
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
    revalidatePath('/pricing');
  } catch (error) {
    console.error('Error updating product: ', error);
    throw new Error('Could not update product');
  }
}

export async function updateProductCost(productId: string, newCost: number) {
    try {
        await runTransaction(db, async (transaction) => {
            const productRef = doc(db, 'products', productId);
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) {
                throw new Error("Product not found");
            }
            const productData = productDoc.data() as Product;
            const updatedVariants = productData.variants.map(variant => ({
                ...variant,
                cost: newCost
            }));
            transaction.update(productRef, { variants: updatedVariants });
        });
        revalidatePath('/products');
        revalidatePath('/pricing');
    } catch (error) {
        console.error('Error updating product cost:', error);
        throw new Error('Could not update product cost');
    }
}

export async function updateProductPrice(productId: string, newPrice: number) {
    try {
        await runTransaction(db, async (transaction) => {
            const productRef = doc(db, 'products', productId);
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) {
                throw new Error("Product not found");
            }
            const productData = productDoc.data() as Product;
            const updatedVariants = productData.variants.map(variant => ({
                ...variant,
                price: newPrice
            }));
            transaction.update(productRef, { variants: updatedVariants });
        });
        revalidatePath('/products');
        revalidatePath('/pricing');
    } catch (error) {
        console.error('Error updating product price:', error);
        throw new Error('Could not update product price');
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
    revalidatePath('/pricing');
  } catch (error) {
    console.error('Error deleting product: ', error);
    throw new Error('Could not delete product');
  }
}

    