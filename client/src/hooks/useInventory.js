import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApiIMS } from '../services/imsApi';

/**
 * Custom hook for inventory queries
 * Provides caching, automatic refetching, and request deduplication
 */

// Query keys for consistent cache management
export const inventoryKeys = {
  all: ['inventory'],
  lists: () => [...inventoryKeys.all, 'list'],
  list: (filters) => [...inventoryKeys.lists(), filters],
  details: () => [...inventoryKeys.all, 'detail'],
  detail: (id) => [...inventoryKeys.details(), id],
  categories: () => [...inventoryKeys.all, 'categories'],
  locations: () => [...inventoryKeys.all, 'locations'],
};

/**
 * Hook to fetch all inventory items
 */
export function useInventory(options = {}) {
  return useQuery({
    queryKey: inventoryKeys.lists(),
    queryFn: async () => {
      const response = await inventoryApiIMS.getItems();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch inventory');
      }
      return response.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - inventory changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch inventory categories
 */
export function useCategories(options = {}) {
  return useQuery({
    queryKey: inventoryKeys.categories(),
    queryFn: async () => {
      const response = await inventoryApiIMS.getCategories();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch categories');
      }
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories change infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
}

/**
 * Hook to fetch inventory locations
 */
export function useLocations(options = {}) {
  return useQuery({
    queryKey: inventoryKeys.locations(),
    queryFn: async () => {
      const response = await inventoryApiIMS.getLocations();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch locations');
      }
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - locations change infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
}

/**
 * Hook to create a new inventory item
 * Automatically invalidates and refetches inventory list
 */
export function useCreateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData) => {
      const response = await inventoryApiIMS.createItem(itemData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create inventory item');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch inventory list
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
    },
  });
}

/**
 * Hook to update an inventory item
 */
export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await inventoryApiIMS.updateItem(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update inventory item');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch inventory list
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

/**
 * Hook to delete an inventory item
 */
export function useDeleteInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventoryApiIMS.deleteItem(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete inventory item');
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch inventory list
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

