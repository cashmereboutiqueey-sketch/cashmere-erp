

'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, getDoc, query, orderBy, runTransaction, where } from 'firebase/firestore';
import { ProductionOrder, Product, ProductVariant, Fabric, ProductFabric } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getProductFabricsForProduct } from './product-fabric-service';

const productionOrdersCollection = collection(db, 'production_orders');
const fabricsCollection = collection(db, 'fabrics');
const productFabricsCollection = collection(db, 'product_fabrics');

const fromFirestore = async (docSnap: any): Promise<ProductionOrder> => {
  const data = docSnap.data();
  
  let productData: Product | undefined = undefined;
  let variantData: ProductVariant | undefined = undefined;

  if (data.product_id) {
    const productDoc = await getDoc(doc(db, 'products', data.product_id));
    if (productDoc.exists()) {
      const pData = productDoc.data();
      const productTimestamp = pData.created_at || pData.createdAt;
      const p = { 
        id: productDoc.id, 
        ...pData,
        created_at: productTimestamp.toDate().toISOString()
      } as Product;
      productData = p;
      if (data.variant_id) {
        variantData = p.variants.find(v => v.id === data.variant_id);
      }
    }
  }
  const productionOrderTimestamp = data.created_at || data.createdAt;

  return {
    id: docSnap.id,
    product_id: data.product_id,
    variant_id: data.variant_id,
    product: productData,
    variant: variantData,
    sales_order_id: data.sales_order_id,
    required_quantity: data.required_quantity,
    status: data.status,
    created_at: productionOrderTimestamp.toDate().toISOString(),
    worker_id: data.worker_id,
    worker_name: data.worker_name,
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

export async function assignWorkerToProductionOrder(orderId: string, workerId: string, workerName: string) {
    try {
        const orderDoc = doc(db, 'production_orders', orderId);
        await updateDoc(orderDoc, {
            worker_id: workerId,
            worker_name: workerName,
            updatedAt: serverTimestamp()
        });
        revalidatePath('/production');
    } catch (error) {
        console.error('Error assigning worker to production order: ', error);
        throw new Error('Could not assign worker');
    }
}

export async function updateProductionOrderStatus(id: string, status: ProductionOrder['status']) {
  try {
    await runTransaction(db, async (transaction) => {
        const orderDocRef = doc(db, 'production_orders', id);
        const orderDoc = await transaction.get(orderDocRef);

        if (!orderDoc.exists()) {
            throw new Error("Production order not found.");
        }
        
        const productionOrder = orderDoc.data() as Omit<ProductionOrder, 'id' | 'created_at'>;
        const currentStatus = productionOrder.status;

        // Prevent re-processing a 'done' order or deducting fabric multiple times
        if (currentStatus === 'done' && status === 'done') {
            console.log("Order is already done. No action taken.");
            return;
        }
        
        // If status is changing to 'done', deduct fabric
        if (status === 'done' && productionOrder.product_id) {
            const productFabricsQuery = query(productFabricsCollection, where('product_id', '==', productionOrder.product_id));
            const productFabricsSnapshot = await getDocs(productFabricsQuery); // This is now a regular query, not inside transaction.get
            
            if (productFabricsSnapshot.empty) {
                throw new Error(`No recipe found for product ID ${productionOrder.product_id}. Cannot deduct fabric.`);
            }

            const fabricUpdates: {ref: any, newStock: number, name: string, needed: number, available: number}[] = [];

            // Read all fabric stocks first
            for(const pfDoc of productFabricsSnapshot.docs) {
                const pf = pfDoc.data() as ProductFabric;
                const totalFabricNeeded = pf.fabric_quantity_meters * productionOrder.required_quantity;
                const fabricDocRef = doc(db, 'fabrics', pf.fabric_id);
                const fabricDoc = await transaction.get(fabricDocRef);

                if (!fabricDoc.exists()) {
                    throw new Error(`Fabric with ID ${pf.fabric_id} not found.`);
                }
                
                const fabricData = fabricDoc.data() as Fabric;
                const newStock = fabricData.length_in_meters - totalFabricNeeded;

                if (newStock < 0) {
                     throw new Error(`Not enough stock for fabric ${fabricData.name}. Required: ${totalFabricNeeded}m, Available: ${fabricData.length_in_meters}m`);
                }
                
                fabricUpdates.push({
                    ref: fabricDocRef,
                    newStock: newStock,
                    name: fabricData.name,
                    needed: totalFabricNeeded,
                    available: fabricData.length_in_meters
                });
            }

            // Perform all fabric updates
            for (const update of fabricUpdates) {
                transaction.update(update.ref, { length_in_meters: update.newStock });
            }
        }
        
        // Finally, update the status of the production order
        transaction.update(orderDocRef, {
            status: status,
            updatedAt: serverTimestamp()
        });
    });

    revalidatePath('/production');
    revalidatePath('/fabrics');
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error updating production order status: ', error);
    throw new Error(`Could not update production order status. ${error instanceof Error ? error.message : ''}`);
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
