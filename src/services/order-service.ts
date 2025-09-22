'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, writeBatch, serverTimestamp, query, orderBy, getDoc } from 'firebase/firestore';
import { Order, Customer } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const ordersCollection = collection(db, 'orders');

const fromFirestore = async (doc: any): Promise<Order> => {
  const data = doc.data();
  
  let customerData: Customer | undefined = undefined;
  if (data.customer_id) {
    const customerDoc = await getDoc(doc(db, 'customers', data.customer_id));
    if (customerDoc.exists()) {
      customerData = { id: customerDoc.id, ...customerDoc.data() } as Customer;
    }
  }

  return {
    id: doc.id,
    customer_id: data.customer_id,
    customer: customerData,
    status: data.status,
    source: data.source,
    payment_status: data.payment_status,
    total_amount: data.total_amount,
    created_at: data.created_at.toDate().toISOString(),
    items: data.items,
  };
};

export async function getOrders(): Promise<Order[]> {
  try {
    const q = query(ordersCollection, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        console.log('No orders found.');
        return [];
    }
    // Using Promise.all to handle async fetching of customer data
    return Promise.all(snapshot.docs.map(doc => fromFirestore(doc)));
  } catch (error) {
    console.error('Error getting orders: ', error);
    return [];
  }
}

export async function addOrder(orderData: Omit<Order, 'id' | 'created_at' | 'customer'>) {
  try {
    const docRef = await addDoc(ordersCollection, {
      ...orderData,
      created_at: serverTimestamp(),
    });
    revalidatePath('/orders');
    revalidatePath('/pos');
    revalidatePath('/dashboard');
    return docRef.id;
  } catch (error) {
    console.error('Error adding order: ', error);
    throw new Error('Could not add order');
  }
}

export async function updateOrderStatus(id: string, status: Order['status']) {
  try {
    const orderDoc = doc(db, 'orders', id);
    await updateDoc(orderDoc, {
        status: status,
        updatedAt: serverTimestamp()
    });
    revalidatePath('/orders');
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error updating order status: ', error);
    throw new Error('Could not update order status');
  }
}

export async function deleteOrder(id: string) {
  try {
    const orderDoc = doc(db, 'orders', id);
    await deleteDoc(orderDoc);
    revalidatePath('/orders');
  } catch (error) {
    console.error('Error deleting order: ', error);
    throw new Error('Could not delete order');
  }
}
