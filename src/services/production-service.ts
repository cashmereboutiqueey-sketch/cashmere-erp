'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, getDoc, query, orderBy } from 'firebase/firestore';
import { ProductionOrder, Product, ProductVariant } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const productionOrdersCollection = collection(db, 'production_orders');

const fromFirestore = async (docSnap: any): Promise<ProductionOrder> => {
  const data = docSnap.data();
  
  let productData: Product | undefined = undefined;
  let variantData: ProductVariant | undefined = undefined;

  if (data.product_id) {
    const productDoc = await getDoc(doc(db, 'products', data.product_id));
    if (productDoc.exists()) {
      const p = productDoc.data() as Product;
      productData = { id: productDoc.id, ...p };
      if (data.variant_id) {
        variantData = p.variants.find(v => v.id === data.variant_id);
      }
    }
  }

  return {
    id: docSnap.id,
    product_id: data.product_id,
    variant_id: data.variant_id,
    product: productData,
    variant: variantData,
    sales_order_id: data.sales_order_id,
    required_quantity: data.required_quantity,
    status: data.status,
    created_at: data.created_at.toDate().toISOString(),
  };
};

export async function getProductionOrders(): Promise<ProductionOrder[]> {
  try {
    const q = query(productionOrdersCollection, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        console.log('No production orders found.');
        return [];
    }
    return Promise.all(snapshot.docs.map(fromFirestore));
  } catch (error) {
    console.error('Error getting production orders: ', error);
    return [];
  }
}

export async function addProductionOrder(orderData: Omit<ProductionOrder, 'id' | 'created_at' | 'product' | 'variant'>) {
  try {
    const docRef = await addDoc(productionOrdersCollection, {
      ...orderData,
      created_at: serverTimestamp(),
    });
    revalidatePath('/production');
    return docRef.id;
  } catch (error) {
    console.error('Error adding production order: ', error);
    throw new Error('Could not add production order');
  }
}

export async function updateProductionOrderStatus(id: string, status: ProductionOrder['status']) {
  try {
    const orderDoc = doc(db, 'production_orders', id);
    await updateDoc(orderDoc, {
        status: status,
        updatedAt: serverTimestamp()
    });
    revalidatePath('/production');
  } catch (error) {
    console.error('Error updating production order status: ', error);
    throw new Error('Could not update production order status');
  }
}

export async function deleteProductionOrder(id: string) {
  try {
    const orderDoc = doc(db, 'production_orders', id);
    await deleteDoc(orderDoc);
    revalidatePath('/production');
  } catch (error) {
    console.error('Error deleting production order: ', error);
    throw new Error('Could not delete production order');
  }
}
