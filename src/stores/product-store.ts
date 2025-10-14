
import { create } from 'zustand';
import { Product, ProductFabric } from '@/lib/types';
import { getProducts as fetchProductsFromService, addProduct as addProductToService, updateProduct as updateProductInService, deleteProduct as deleteProductFromService } from '@/services/product-service';

type ProductState = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (newProduct: Omit<Product, 'id' | 'created_at'> & { fabrics: Omit<ProductFabric, 'product_id'>[] }) => Promise<void>;
  updateProduct: (productId: string, productData: Partial<Product> & { fabrics?: Omit<ProductFabric, 'product_id'>[] }) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
};

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await fetchProductsFromService();
      set({ products, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch products', isLoading: false });
    }
  },
  addProduct: async (newProduct) => {
    set({ isLoading: true });
    try {
      await addProductToService(newProduct);
      await get().fetchProducts(); // Refetch after adding
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add product';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  updateProduct: async (productId, productData) => {
    set({ isLoading: true });
    try {
      await updateProductInService(productId, productData);
      await get().fetchProducts(); // Refetch after updating
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  deleteProduct: async (productId) => {
    set({ isLoading: true });
    try {
      await deleteProductFromService(productId);
      set(state => ({
        products: state.products.filter(p => p.id !== productId),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
