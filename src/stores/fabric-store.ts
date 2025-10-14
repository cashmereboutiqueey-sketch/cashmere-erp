
import { create } from 'zustand';
import { Fabric } from '@/lib/types';
import { getFabrics as fetchFabricsFromService, addFabric as addFabricToService, updateFabric as updateFabricInService, deleteFabric as deleteFabricFromService } from '@/services/fabric-service';

type FabricState = {
  fabrics: Fabric[];
  isLoading: boolean;
  error: string | null;
  fetchFabrics: () => Promise<void>;
  addFabric: (newFabric: Omit<Fabric, 'id'>) => Promise<void>;
  updateFabric: (fabricId: string, fabricData: Partial<Fabric>) => Promise<void>;
  deleteFabric: (fabricId: string) => Promise<void>;
};

export const useFabricStore = create<FabricState>((set, get) => ({
  fabrics: [],
  isLoading: false,
  error: null,
  fetchFabrics: async () => {
    set({ isLoading: true, error: null });
    try {
      const fabrics = await fetchFabricsFromService();
      set({ fabrics, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch fabrics', isLoading: false });
    }
  },
  addFabric: async (newFabric) => {
    set({ isLoading: true });
    try {
      await addFabricToService(newFabric);
      await get().fetchFabrics(); // Refetch after adding
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add fabric';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  updateFabric: async (fabricId, fabricData) => {
    set({ isLoading: true });
    try {
      await updateFabricInService(fabricId, fabricData);
      await get().fetchFabrics(); // Refetch after updating
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update fabric';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  deleteFabric: async (fabricId) => {
    set({ isLoading: true });
    try {
      await deleteFabricFromService(fabricId);
      set(state => ({
        fabrics: state.fabrics.filter(f => f.id !== fabricId),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete fabric';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
