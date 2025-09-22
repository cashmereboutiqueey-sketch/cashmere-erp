'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, writeBatch, serverTimestamp, query, orderBy, getDoc, runTransaction } from 'firebase/firestore';
import { Order, Customer, Product, OrderItem } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const ordersCollection = collection(db, 'orders');
const productsCollection = collection(db, 'products');

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
    const newOrderId = await runTransaction(db, async (transaction) => {
        // 1. Create the new order document
        const newOrderRef = doc(collection(db, "orders"));
        transaction.set(newOrderRef, {
            ...orderData,
            created_at: serverTimestamp(),
        });

        if (!orderData.items) return newOrderRef.id;

        // 2. Update stock for each item in the order
        for (const item of orderData.items) {
            const productRef = doc(db, 'products', item.productId);
            const productDoc = await transaction.get(productRef);

            if (!productDoc.exists()) {
                throw new Error(`Product with ID ${item.productId} not found.`);
            }

            const product = productDoc.data() as Product;
            const variantIndex = product.variants.findIndex(v => v.id === item.variant.id);

            if (variantIndex === -1) {
                throw new Error(`Variant with SKU ${item.variant.sku} not found in product ${product.name}.`);
            }

            const newStock = product.variants[variantIndex].stock_quantity - item.quantity;
            if (newStock < 0) {
                throw new Error(`Not enough stock for ${product.name} - ${item.variant.sku}. Required: ${item.quantity}, Available: ${product.variants[variantIndex].stock_quantity}`);
            }

            product.variants[variantIndex].stock_quantity = newStock;
            transaction.update(productRef, { variants: product.variants });
        }

        return newOrderRef.id;
    });

    revalidatePath('/orders');
    revalidatePath('/pos');
    revalidatePath('/dashboard');
    revalidatePath('/products');

    return newOrderId;
  } catch (error) {
    console.error('Error adding order and updating stock: ', error);
    throw new Error('Could not add order. ' + (error instanceof Error ? error.message : ''));
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
    const orderDocRef = doc(db, 'orders', id);
    try {
        await runTransaction(db, async (transaction) => {
            const orderDoc = await transaction.get(orderDocRef);
            if (!orderDoc.exists()) {
                throw new Error("Order does not exist!");
            }
            const orderData = orderDoc.data() as Order;

            // Optional: Re-stock items when an order is deleted.
            if (orderData.items) {
                 for (const item of orderData.items) {
                    const productRef = doc(db, 'products', item.productId);
                    const productDoc = await transaction.get(productRef);
                    if (productDoc.exists()) {
                        const product = productDoc.data() as Product;
                        const variantIndex = product.variants.findIndex(v => v.id === item.variant.id);
                        if(variantIndex > -1) {
                            product.variants[variantIndex].stock_quantity += item.quantity;
                            transaction.update(productRef, { variants: product.variants });
                        }
                    }
                }
            }
            
            transaction.delete(orderDocRef);
        });

        revalidatePath('/orders');
        revalidatePath('/products');

    } catch (error) {
        console.error("Error deleting order: ", error);
        throw new Error("Could not delete order");
    }
}
