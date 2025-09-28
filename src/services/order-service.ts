
'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, writeBatch, serverTimestamp, query, orderBy, getDoc, runTransaction, deleteDoc, where, Timestamp } from 'firebase/firestore';
import { Order, Customer, Product, OrderItem, Fabric, ProductionOrder, ProductVariant, OrderFulfillmentType, ProductFabric, ShippingStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getProductFabricsForProduct } from './product-fabric-service';
import type { DateRange } from 'react-day-picker';

const ordersCollection = collection(db, 'orders');

// Simplified journal entry logger
const logJournalEntry = (description: string, entries: {account: string, debit?: number, credit?: number}[]) => {
    console.log(`-- JOURNAL ENTRY: ${description} --`);
    entries.forEach(entry => {
        console.log(`  ${entry.account}: Debit: ${entry.debit || 0}, Credit: ${entry.credit || 0}`);
    });
    console.log('------------------------------------');
}

const fromFirestore = async (docSnap: any): Promise<Order> => {
  const data = docSnap.data();
  
  let customerData: Customer | undefined = undefined;
  if (data.customer_id) {
    const customerDocSnap = await getDoc(doc(db, 'customers', data.customer_id));
    if (customerDocSnap.exists()) {
      const custData = customerDocSnap.data();
      customerData = { 
        id: customerDocSnap.id, 
        ...custData, 
        created_at: custData.created_at?.toDate()?.toISOString() || new Date().toISOString() 
      } as Customer;
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
    fulfillment_type: data.fulfillment_type,
    shipping_status: data.shipping_status,
    carrier_id: data.carrier_id,
  };
};

export async function getOrders(dateRange?: DateRange): Promise<Order[]> {
  try {
    let q;
    if (dateRange?.from && dateRange?.to) {
        q = query(
            ordersCollection,
            where('created_at', '>=', Timestamp.fromDate(dateRange.from)),
            where('created_at', '<=', Timestamp.fromDate(dateRange.to)),
            orderBy('created_at', 'desc')
        );
    } else {
        q = query(ordersCollection, orderBy('created_at', 'desc'));
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        console.log('No orders found for the specified criteria.');
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

      let finalOrderStatus: Order['status'] = 'processing';
      let finalFulfillmentType: OrderFulfillmentType = 'from_stock';
      
      const productionOrdersToCreate: Omit<ProductionOrder, 'id' | 'created_at'>[] = [];
      const stockUpdates = new Map<string, { ref: any, newVariants: ProductVariant[] }>();

      // Pre-fetch all products and fabrics to use inside the transaction
      const productIds = [...new Set(orderData.items.map(item => item.productId))];
      const productRefs = productIds.map(id => doc(db, 'products', id));
      const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));
      const productsMap = new Map<string, { doc: any, data: Product }>();
      productDocs.forEach(productDoc => {
        if (!productDoc.exists()) throw new Error(`Product with ID ${productDoc.id} not found.`);
        productsMap.set(productDoc.id, { doc: productDoc, data: { id: productDoc.id, ...productDoc.data() } as Product });
      });

      const allFabricsSnap = await getDocs(collection(db, 'fabrics'));
      const allFabricsMap = new Map<string, Fabric>();
      allFabricsSnap.forEach(doc => allFabricsMap.set(doc.id, { id: doc.id, ...doc.data()} as Fabric));
      
      const allProductFabricsSnap = await getDocs(collection(db, 'product_fabrics'));
      const productFabricsMap = new Map<string, ProductFabric[]>();
      allProductFabricsSnap.forEach(doc => {
          const pf = doc.data() as ProductFabric;
          const existing = productFabricsMap.get(pf.product_id) || [];
          existing.push(pf);
          productFabricsMap.set(pf.product_id, existing);
      });

      // Main logic loop
      for (const item of orderData.items) {
        const productInfo = productsMap.get(item.productId);
        if (!productInfo) throw new Error(`Internal error: Product info for ${item.productId} not found.`);
        
        const currentVariants = stockUpdates.get(item.productId)?.newVariants || productInfo.data.variants;
        const variantIndex = currentVariants.findIndex(v => v.id === item.variant.id);
        if (variantIndex === -1) throw new Error(`Variant ${item.variant.id} not found for product ${item.productName}`);
        
        const variantInCart = currentVariants[variantIndex];
        
        if (variantInCart.stock_quantity >= item.quantity) {
          // Sell from stock
          const newVariants = [...currentVariants];
          newVariants[variantIndex] = { ...variantInCart, stock_quantity: variantInCart.stock_quantity - item.quantity };
          stockUpdates.set(item.productId, { ref: productInfo.doc.ref, newVariants });
        } else {
          // Out of stock, check if we can produce it
          finalFulfillmentType = 'make_to_order';
          finalOrderStatus = 'pending';

          const recipe = productFabricsMap.get(item.productId);
          if (!recipe || recipe.length === 0) {
            finalOrderStatus = 'sold_out';
            throw new Error(`Cannot produce "${item.productName}": No recipe found.`);
          }

          for (const recipeItem of recipe) {
            const fabric = allFabricsMap.get(recipeItem.fabric_id);
            if (!fabric) {
              finalOrderStatus = 'sold_out';
              throw new Error(`Cannot produce "${item.productName}": Recipe fabric ID ${recipeItem.fabric_id} not found.`);
            }
            const requiredFabric = recipeItem.fabric_quantity_meters * item.quantity;
            if (fabric.length_in_meters < requiredFabric) {
              finalOrderStatus = 'sold_out';
              throw new Error(`Cannot produce "${item.productName}": Not enough ${fabric.name} fabric. Required: ${requiredFabric}m, Available: ${fabric.length_in_meters}m.`);
            }
          }

          // If all fabric checks pass, queue for production
          productionOrdersToCreate.push({
            product_id: item.productId,
            variant_id: item.variant.id,
            required_quantity: item.quantity,
            sales_order_id: '', // Will be set later
            status: 'pending'
          });
        }
      }

      // Create new order document
      const newOrderRef = doc(collection(db, 'orders'));
      transaction.set(newOrderRef, {
        ...orderData,
        status: finalOrderStatus,
        fulfillment_type: finalFulfillmentType,
        shipping_status: finalOrderStatus === 'processing' ? 'ready_to_ship' : 'pending',
        created_at: serverTimestamp(),
      });
      
      // Apply stock updates
      stockUpdates.forEach(update => {
        transaction.update(update.ref, { variants: update.newVariants });
      });

      // Create production orders
      productionOrdersToCreate.forEach(poData => {
        const newProdOrderRef = doc(collection(db, 'production_orders'));
        transaction.set(newProdOrderRef, {
          ...poData,
          sales_order_id: newOrderRef.id, // Link to the new sales order
          created_at: serverTimestamp()
        });
      });

      logJournalEntry(`Sale - Order ${newOrderRef.id.slice(0,5)}`, [
          { account: 'Accounts Receivable', debit: orderData.total_amount },
          { account: 'Sales Revenue', credit: orderData.total_amount },
      ]);
      if (orderData.amount_paid && orderData.amount_paid > 0) {
          logJournalEntry(`Payment - Order ${newOrderRef.id.slice(0,5)}`, [
              { account: 'Cash', debit: orderData.amount_paid },
              { account: 'Accounts Receivable', credit: orderData.amount_paid },
          ]);
      }

      return newOrderRef.id;
    });

    revalidatePath('/orders');
    revalidatePath('/pos');
    revalidatePath('/dashboard');
    revalidatePath('/products');
    revalidatePath('/production');
    revalidatePath('/finance');

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

            // Auto-posting to GL
            logJournalEntry(`Payment - Order ${orderId.slice(0,5)}`, [
                { account: 'Cash on Hand', debit: amount },
                { account: 'Accounts Receivable', credit: amount },
            ]);
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

export async function updateOrderShipping(id: string, shippingStatus: ShippingStatus) {
  try {
    const orderDocRef = doc(db, 'orders', id);
    const updateData: { shipping_status: ShippingStatus, carrier_id?: 'a' | 'b', updatedAt: any } = {
      shipping_status: shippingStatus,
      updatedAt: serverTimestamp(),
    };

    if (shippingStatus === 'assigned_to_carrier_a') {
      updateData.carrier_id = 'a';
    } else if (shippingStatus === 'assigned_to_carrier_b') {
      updateData.carrier_id = 'b';
    }

    await updateDoc(orderDocRef, updateData);
    revalidatePath('/shipping');
    revalidatePath('/orders');
  } catch (error) {
    console.error('Error updating order shipping status: ', error);
    throw new Error('Could not update order shipping status');
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

            if (orderData.items && orderData.fulfillment_type !== 'make_to_order') {
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

            // Auto-posting for reversal
            logJournalEntry(`Reversal - Deleted Order ${id.slice(0,5)}`, [
                { account: 'Sales Revenue', debit: orderData.total_amount },
                { account: 'Accounts Receivable', credit: orderData.total_amount },
            ]);
            if (orderData.amount_paid && orderData.amount_paid > 0) {
                 logJournalEntry(`Reversal - Payment for Deleted Order ${id.slice(0,5)}`, [
                    { account: 'Accounts Receivable', debit: orderData.amount_paid },
                    { account: 'Cash on Hand', credit: orderData.amount_paid },
                ]);
            }

        });

        revalidatePath('/orders');
        revalidatePath('/products');
        revalidatePath('/finance');

    } catch (error) {
        console.error("Error deleting order: ", error);
        throw new Error("Could not delete order");
    }
}
    
