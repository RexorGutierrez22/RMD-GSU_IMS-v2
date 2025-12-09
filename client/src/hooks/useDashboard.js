import { useQuery } from '@tanstack/react-query';

/**
 * Custom hook for dashboard queries
 */

// Query keys for dashboard
export const dashboardKeys = {
  all: ['dashboard'],
  stats: () => [...dashboardKeys.all, 'stats'],
  studentsCount: () => [...dashboardKeys.all, 'studentsCount'],
  employeesCount: () => [...dashboardKeys.all, 'employeesCount'],
  inventoryStats: () => [...dashboardKeys.all, 'inventoryStats'],
};

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats(options = {}) {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch students count
 */
export function useStudentsCount(options = {}) {
  return useQuery({
    queryKey: dashboardKeys.studentsCount(),
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/dashboard/students-count');
      if (response.status === 429) {
        const error = new Error('Rate limit exceeded');
        error.response = { status: 429 };
        throw error;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch students count');
      }
      const data = await response.json();
      return data.count ?? data.total ?? 0;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors (429) - wait for next refetch
      if (error?.response?.status === 429) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    ...options,
  });
}

/**
 * Hook to fetch employees count
 */
export function useEmployeesCount(options = {}) {
  return useQuery({
    queryKey: dashboardKeys.employeesCount(),
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/dashboard/employees-count');
      if (response.status === 429) {
        const error = new Error('Rate limit exceeded');
        error.response = { status: 429 };
        throw error;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch employees count');
      }
      const data = await response.json();
      return data.count ?? data.total ?? 0;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors (429) - wait for next refetch
      if (error?.response?.status === 429) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    ...options,
  });
}

/**
 * Hook to fetch inventory statistics
 */
export function useInventoryStats(options = {}) {
  return useQuery({
    queryKey: dashboardKeys.inventoryStats(),
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/dashboard/inventory-stats');
      if (response.status === 429) {
        const error = new Error('Rate limit exceeded');
        error.response = { status: 429 };
        throw error;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch inventory stats');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors (429) - wait for next refetch
      if (error?.response?.status === 429) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    ...options,
  });
}

