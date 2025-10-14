
import { create } from 'zustand';
import { Supplier } from '@/lib/types';
import { getSuppliers as fetchSuppliersFromService, addSupplier as addSupplierToService, updateSupplier as updateSupplierInService, deleteSupplier as deleteSupplierFromService } from '@/services/supplier-service';

type SupplierState = {
  suppliers: Supplier[];
  selectedSupplier: Supplier | null;
  isLoading: boolean;
  error: string | null;
  fetchSuppliers: () => Promise<void>;
  addSupplier: (newSupplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (supplierId: string, supplierData: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  setSelectedSupplier: (supplier: Supplier | null) => void;
};

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  selectedSupplier: null,
  isLoading: false,
  error: null,
  fetchSuppliers: async () => {
    set({ isLoading: true, error: null });
    try {
      const suppliers = await fetchSuppliersFromService();
      set({ suppliers, isLoading: false });
      if (get().selectedSupplier === null && suppliers.length > 0) {
        set({ selectedSupplier: suppliers[0] });
      }
    } catch (error) {
      set({ error: 'Failed to fetch suppliers', isLoading: false });
    }
  },
  addSupplier: async (newSupplier) => {
    set({ isLoading: true });
    try {
      await addSupplierToService(newSupplier);
      await get().fetchSuppliers(); // Refetch after adding
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add supplier';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  updateSupplier: async (supplierId, supplierData) => {
    set({ isLoading: true });
    try {
      await updateSupplierInService(supplierId, supplierData);
      await get().fetchSuppliers(); // Refetch after updating
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update supplier';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  deleteSupplier: async (supplierId) => {
    set({ isLoading: true });
    try {
      await deleteSupplierFromService(supplierId);
      set(state => {
        const remainingSuppliers = state.suppliers.filter(s => s.id !== supplierId);
        const newSelectedSupplier = state.selectedSupplier?.id === supplierId ? (remainingSuppliers[0] || null) : state.selectedSupplier;
        return {
          suppliers: remainingSuppliers,
          selectedSupplier: newSelectedSupplier,
          isLoading: false
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete supplier';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  setSelectedSupplier: (supplier) => set({ selectedSupplier: supplier }),
}));
