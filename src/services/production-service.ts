'use server';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, getDoc, query, orderBy, runTransaction } from 'firebase/firestore';
import { ProductionOrder, Product, ProductVariant, Fabric } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getProductFabricsForProduct } from './product-fabric-service';

const productionOrdersCollection = collection(db, 'production_orders');
const fabricsCollection = collection(db, 'fabrics');

const fromFirestore = async (docSnap: any): Promise<ProductionOrder> => {
  const data = docSnap.data();
  
  let productData: Product | undefined = undefined;
  let variantData: ProductVariant | undefined = undefined;

  if (data.product_id) {
    const productDoc = await getDoc(doc(db, 'products', data.product_id));
    if (productDoc.exists()) {
      const p = { id: productDoc.id, ...productDoc.data() } as Product;
      productData = p;
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
    await runTransaction(db, async (transaction) => {
        const orderDocRef = doc(db, 'production_orders', id);
        const orderDoc = await transaction.get(orderDocRef);

        if (!orderDoc.exists()) {
            throw new Error("Production order not found.");
        }
        
        const productionOrder = await fromFirestore(orderDoc);
        
        // Update the status of the production order
        transaction.update(orderDocRef, {
            status: status,
            updatedAt: serverTimestamp()
        });

        // If status is 'done', deduct fabric
        if (status === 'done' && productionOrder.product_id) {
            const productFabrics = await getProductFabricsForProduct(productionOrder.product_id);
            
            for (const pf of productFabrics) {
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

                transaction.update(fabricDocRef, { length_in_meters: newStock });
            }
        }
    });

    revalidatePath('/production');
    revalidatePath('/fabrics');
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
