'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, writeBatch, serverTimestamp, query, orderBy, getDoc, runTransaction } from 'firebase/firestore';
import { Order, Customer, Product, OrderItem, Fabric, ProductionOrder } from '@/lib/types';
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
      customerData = { id: customerDocSnap.id, ...customerDocSnap.data() } as Customer;
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
    return Promise.all(snapshot.docs.map(doc => fromFirestore(doc)));
  } catch (error) {
    console.error('Error getting orders: ', error);
    return [];
  }
}

export async function addOrder(orderData: Omit<Order, 'id' | 'created_at' | 'customer'>) {
  try {
    const newOrderId = await runTransaction(db, async (transaction) => {
      const itemsToProduce: { item: OrderItem; product: Product }[] = [];
      const itemsToShip: { item: OrderItem; product: Product }[] = [];
      
      if (!orderData.items) {
        throw new Error('Order must have items.');
      }

      // --- READ PHASE ---
      const productDocsMap: Map<string, Product> = new Map();
      for (const item of orderData.items) {
        const productRef = doc(db, 'products', item.productId);
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw new Error(`Product with ID ${item.productId} not found.`);
        const productData = { id: productDoc.id, ...productDoc.data() } as Product;
        productDocsMap.set(item.productId, productData);
        
        const variant = productData.variants.find(v => v.id === item.variant.id);
        if (!variant) throw new Error(`Variant not found for product ${item.productName}`);

        if (variant.stock_quantity >= item.quantity) {
          itemsToShip.push({ item, product: productData });
        } else {
          itemsToProduce.push({ item, product: productData });
        }
      }
      
      const productionOrdersToCreate: Omit<ProductionOrder, 'id' | 'created_at'>[] = [];
      let finalOrderStatus: Order['status'] = 'pending';

      if (itemsToProduce.length > 0) {
        // Some items are out of stock, check fabric availability.
        for (const { item, product } of itemsToProduce) {
            const recipe = await getProductFabricsForProduct(product.id);
            if(recipe.length === 0) {
                console.warn(`Product ${product.name} has no recipe. Cannot create production order. Order will remain pending.`);
                continue; // Skip to next item, order remains pending
            }

            let canProduce = true;
            for (const recipeItem of recipe) {
                const fabricRef = doc(db, 'fabrics', recipeItem.fabric_id);
                const fabricDoc = await transaction.get(fabricRef);
                if (!fabricDoc.exists()) {
                    console.warn(`Fabric ${recipeItem.fabric_id} not found. Cannot produce ${product.name}.`);
                    canProduce = false;
                    break;
                };

                const fabricData = fabricDoc.data() as Fabric;
                const requiredFabric = recipeItem.fabric_quantity_meters * item.quantity;
                if(fabricData.length_in_meters < requiredFabric) {
                    console.warn(`Not enough fabric ${fabricData.name} to produce ${product.name}.`);
                    canProduce = false;
                    break;
                }
            }

            if (canProduce) {
                 productionOrdersToCreate.push({
                    product_id: item.productId,
                    variant_id: item.variant.id,
                    required_quantity: item.quantity,
                    sales_order_id: '', // Will be set after order is created
                    status: 'pending'
                });
            }
        }
      } else {
        // All items are in stock.
        finalOrderStatus = 'processing';
      }

      // --- WRITE PHASE ---
      const newOrderRef = doc(collection(db, 'orders'));
      transaction.set(newOrderRef, {
        ...orderData,
        status: finalOrderStatus,
        created_at: serverTimestamp(),
      });

      // Decrement stock for items that are ready to ship.
      for (const { item } of itemsToShip) {
        const productData = productDocsMap.get(item.productId);
        if (!productData) continue;
        
        const productRef = doc(db, 'products', item.productId);
        const newVariants = productData.variants.map(v => 
          v.id === item.variant.id 
            ? { ...v, stock_quantity: v.stock_quantity - item.quantity } 
            : v
        );
        transaction.update(productRef, { variants: newVariants });
      }
      
      // Create Production Orders for items that need to be produced and have enough fabric.
      for (const poData of productionOrdersToCreate) {
          const newProdOrderRef = doc(collection(db, 'production_orders'));
          transaction.set(newProdOrderRef, {
              ...poData,
              sales_order_id: newOrderRef.id,
              created_at: serverTimestamp()
          });
      }

      return newOrderRef.id;
    });

    revalidatePath('/orders');
    revalidatePath('/pos');
    revalidatePath('/dashboard');
    revalidatePath('/products');
    revalidatePath('/production');

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
