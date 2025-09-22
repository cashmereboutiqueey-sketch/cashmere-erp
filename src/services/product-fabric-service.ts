'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { ProductFabric } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const productFabricsCollection = collection(db, 'product_fabrics');

// Helper to convert Firestore doc to ProductFabric type
const fromFirestore = (doc: any): ProductFabric => {
  const data = doc.data();
  return {
    product_id: data.product_id,
    fabric_id: data.fabric_id,
    fabric_quantity_meters: data.fabric_quantity_meters,
  };
};

// Seed initial data if the collection is empty
const seedProductFabrics = async () => {
    const snapshot = await getDocs(productFabricsCollection);
    if (snapshot.empty) {
        console.log('Seeding product_fabrics...');
        const initialProductFabrics: Omit<ProductFabric, 'id'>[] = [
            { product_id: 'prod_1', fabric_id: 'fab_1', fabric_quantity_meters: 3.5 }, // Elegant Gold Dress -> Gold Silk
            { product_id: 'prod_2', fabric_id: 'fab_2', fabric_quantity_meters: 1.5 }, // Classic White Shirt -> White Cotton
            { product_id: 'prod_3', fabric_id: 'fab_3', fabric_quantity_meters: 2 }, // Charcoal Gray Pants -> Wool
            { product_id: 'prod_4', fabric_id: 'fab_4', fabric_quantity_meters: 4 }, // Midnight Blue Abaya -> Satin
            { product_id: 'prod_5', fabric_id: 'fab_5', fabric_quantity_meters: 2 }, // Rose Gold Hijab -> Chiffon
            { product_id: 'prod_6', fabric_id: 'fab_6', fabric_quantity_meters: 2.5 }, // Beige Knit Tunic -> Knit
        ];
        for (const pf of initialProductFabrics) {
            await addDoc(productFabricsCollection, pf);
        }
    }
};

// Uncomment the line below to seed data on first run
// seedProductFabrics();

export async function getProductFabricsForProduct(productId: string): Promise<ProductFabric[]> {
  try {
    const q = query(productFabricsCollection, where('product_id', '==', productId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        // For demonstration, we'll create a default if none exists.
        // In a real app, you would have a UI to manage this "Bill of Materials".
        console.warn(`No product-fabric mapping found for product ${productId}. Using a default.`);
        const defaultMapping = {
            product_id: productId,
            fabric_id: 'fab_1', // Defaulting to Gold Silk
            fabric_quantity_meters: 2.0 // Defaulting to 2 meters
        };
        // await addProductFabric(defaultMapping); // Optionally add it to the db
        return [defaultMapping];
    }
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error('Error getting product-fabric relationship: ', error);
    return [];
  }
}

export async function addProductFabric(data: ProductFabric) {
  try {
    const docRef = await addDoc(productFabricsCollection, {
      ...data,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/products'); // Or a dedicated page if you build one
    return docRef.id;
  } catch (error) {
    console.error('Error adding product-fabric relationship: ', error);
    throw new Error('Could not add product-fabric relationship');
  }
}
