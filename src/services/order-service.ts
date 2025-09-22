'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, writeBatch, serverTimestamp, query, orderBy, getDoc, runTransaction, deleteDoc } from 'firebase/firestore';
import { Order, Customer, Product, OrderItem, Fabric, ProductionOrder, ProductVariant } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getProductFabricsForProduct } from './product-fabric-service';

const ordersCollection = collection(db, 'orders');
const productsCollection = collection(db, 'products');

const fromFirestore = async (docSnap: any): Promise<Order> => {
  const data = docSnap.data();
  
  let customerData: Customer | undefined = undefined;
  if (data.customer_id) {
    const customerDocSnap = await getDoc(doc(db, 'customers', data.customer_id));
    if (customerDocSnap.exists()) {
      customerData = { id: customerDocSnap.id, ...customerDocSnap.data(), created_at: customerDocSnap.data().created_at?.toDate()?.toISOString() || new Date().toISOString() } as Customer;
    }
  }

  return {
    id: docSnap.id,
    customer_id: data.customer_id,
    customer: customerData,
    status: data.status,
    source: data.source,
    payment_status: data.payment_status,
    payment_method: data.payment_method,
    amount_paid: data.amount_paid,
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
    return Promise.all(snapshot.docs.map(docSnap => fromFirestore(docSnap)));
  } catch (error) {
    console.error('Error getting orders: ', error);
    return [];
  }
}

export async function addOrder(orderData: Omit<Order, 'id' | 'created_at' | 'customer'>) {
  try {
    const newOrderId = await runTransaction(db, async (transaction) => {
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Order must have items.');
      }

      // 1. Read all necessary data first
      const productIds = [...new Set(orderData.items.map(item => item.productId))];
      const productRefs = productIds.map(id => doc(db, 'products', id));
      const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));
      
      const productsMap = new Map<string, { doc: any, data: Product }>();
      for (const productDoc of productDocs) {
        if (!productDoc.exists()) throw new Error(`Product with ID ${productDoc.id} not found.`);
        productsMap.set(productDoc.id, { doc: productDoc, data: { id: productDoc.id, ...productDoc.data() } as Product });
      }

      // 2. Process logic: check stock, fabrics, and prepare updates
      let finalOrderStatus: Order['status'] = 'processing';
      const productionOrdersToCreate: Omit<ProductionOrder, 'id' | 'created_at'>[] = [];
      const stockUpdates = new Map<string, { ref: any, newVariants: ProductVariant[] }>();

      // Pre-fetch all unique fabrics to avoid re-fetching inside the loop
      const allRecipeItems = (await Promise.all(productIds.map(id => getProductFabricsForProduct(id)))).flat();
      const uniqueFabricIds = [...new Set(allRecipeItems.map(item => item.fabric_id))];
      const fabricRefs = uniqueFabricIds.map(id => doc(db, 'fabrics', id));
      const fabricDocs = await Promise.all(fabricRefs.map(ref => transaction.get(ref)));
      const fabricsMap = new Map<string, Fabric>();
      fabricDocs.forEach(doc => {
          if (doc.exists()) {
              fabricsMap.set(doc.id, {id: doc.id, ...doc.data()} as Fabric);
          }
      });


      for (const item of orderData.items) {
        const productInfo = productsMap.get(item.productId);
        if (!productInfo) throw new Error(`Internal error: Product info for ${item.productId} not found.`);

        const currentVariants = stockUpdates.get(item.productId)?.newVariants || productInfo.data.variants;
        const variantIndex = currentVariants.findIndex(v => v.id === item.variant.id);
        if (variantIndex === -1) throw new Error(`Variant ${item.variant.id} not found for product ${item.productName}`);
        
        const variantToUpdate = currentVariants[variantIndex];
        
        if (variantToUpdate.stock_quantity >= item.quantity) {
          if (finalOrderStatus !== 'sold_out') {
            const newVariants = [...currentVariants];
            newVariants[variantIndex] = { ...variantToUpdate, stock_quantity: variantToUpdate.stock_quantity - item.quantity };
            stockUpdates.set(item.productId, { ref: productInfo.doc.ref, newVariants });
          }
        } else {
          finalOrderStatus = 'pending';
          const recipe = await getProductFabricsForProduct(productInfo.data.id);
          if (recipe.length === 0) {
             console.warn(`Product ${productInfo.data.name} is out of stock and has no recipe.`);
             finalOrderStatus = 'sold_out';
             break; // Stop processing further items if one is sold out
          }

          let canProduce = true;
          for (const recipeItem of recipe) {
            const fabric = fabricsMap.get(recipeItem.fabric_id);
            if (!fabric || fabric.length_in_meters < (recipeItem.fabric_quantity_meters * item.quantity)) {
              canProduce = false;
              console.warn(`Not enough fabric ${recipeItem.fabric_id} to produce ${productInfo.data.name}.`);
              break;
            }
          }

          if (canProduce) {
            productionOrdersToCreate.push({
              product_id: item.productId,
              variant_id: item.variant.id,
              required_quantity: item.quantity,
              sales_order_id: '',
              status: 'pending'
            });
          } else {
            finalOrderStatus = 'sold_out';
            break; // Stop processing items, the order is sold out
          }
        }
      }
      
      // 3. Perform all writes
      const newOrderRef = doc(collection(db, 'orders'));
      transaction.set(newOrderRef, {
        ...orderData,
        status: finalOrderStatus,
        created_at: serverTimestamp(),
      });
      
      // If the order is sold_out, we don't update stock or create production orders
      if (finalOrderStatus !== 'sold_out') {
        stockUpdates.forEach(update => {
          transaction.update(update.ref, { variants: update.newVariants });
        });

        productionOrdersToCreate.forEach(poData => {
          const newProdOrderRef = doc(collection(db, 'production_orders'));
          transaction.set(newProdOrderRef, {
            ...poData,
            sales_order_id: newOrderRef.id,
            created_at: serverTimestamp()
          });
        });
      }


      return newOrderRef.id;
    });

    // 4. Revalidate paths
    revalidatePath('/orders');
    revalidatePath('/pos');
    revalidatePath('/dashboard');
    revalidatePath('/products');
    revalidatePath('/production');

    return newOrderId;
  } catch (error) {
    console.error('Error adding order: ', error);
    throw new Error('Could not add order. ' + (error instanceof Error ? error.message : ''));
  }
}


export async function addPaymentToOrder(orderId: string, amount: number) {
    try {
        await runTransaction(db, async (transaction) => {
            const orderRef = doc(db, 'orders', orderId);
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) {
                throw new Error("Order not found");
            }
            const orderData = orderDoc.data() as Order;
            const currentPaid = orderData.amount_paid || 0;
            const newPaidAmount = currentPaid + amount;

            let newPaymentStatus: Order['payment_status'] = 'partially_paid';
            if (newPaidAmount >= orderData.total_amount) {
                newPaymentStatus = 'paid';
            }

            transaction.update(orderRef, {
                amount_paid: newPaidAmount,
                payment_status: newPaymentStatus,
                updatedAt: serverTimestamp(),
            });
        });

        revalidatePath('/orders');
        revalidatePath('/finance');
    } catch (error) {
        console.error("Error adding payment to order:", error);
        throw new Error("Could not add payment. " + (error instanceof Error ? error.message : ''));
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
            const orderData = await fromFirestore(orderDoc);

            if (orderData.items) {
                 for (const item of orderData.items) {
                    const productRef = doc(db, 'products', item.productId);
                    const productDoc = await transaction.get(productRef);
                    if (productDoc.exists()) {
                        const product = productDoc.data() as Product;
                        const newVariants = product.variants.map(v => 
                          v.id === item.variant.id 
                            ? { ...v, stock_quantity: v.stock_quantity + item.quantity } 
                            : v
                        );
                        transaction.update(productRef, { variants: newVariants });
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
