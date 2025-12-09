import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApiIMS } from '../services/imsApi';

/**
 * Custom hook for transaction queries
 * Provides caching, automatic refetching, and request deduplication
 */

// Query keys for consistent cache management
export const transactionKeys = {
  all: ['transactions'],
  lists: () => [...transactionKeys.all, 'list'],
  list: (filters) => [...transactionKeys.lists(), filters],
  borrowRequests: () => [...transactionKeys.all, 'borrowRequests'],
  borrowRequestsList: (filters) => [...transactionKeys.borrowRequests(), filters],
  borrowedItems: () => [...transactionKeys.all, 'borrowedItems'],
  returnedItems: () => [...transactionKeys.all, 'returnedItems'],
  recentActivity: (limit) => [...transactionKeys.all, 'recentActivity', limit],
  recentTransactions: (limit) => [...transactionKeys.all, 'recentTransactions', limit],
  categoryStats: () => [...transactionKeys.all, 'categoryStats'],
  mostBorrowed: (days, limit) => [...transactionKeys.all, 'mostBorrowed', days, limit],
  borrowingTrends: (period) => [...transactionKeys.all, 'borrowingTrends', period],
  predictiveAnalytics: (days, forecastDays) => [...transactionKeys.all, 'predictiveAnalytics', days, forecastDays],
  trendAnalysis: (period, startDate, endDate) => [...transactionKeys.all, 'trendAnalysis', period, startDate, endDate],
  forecasting: (type, days) => [...transactionKeys.all, 'forecasting', type, days],
};

/**
 * Hook to fetch borrow requests
 */
export function useBorrowRequests(options = {}) {
  return useQuery({
    queryKey: transactionKeys.borrowRequestsList(),
    queryFn: async () => {
      const response = await transactionApiIMS.getBorrowRequests();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch borrow requests');
      }
      // Handle paginated response
      return response.data?.data || response.data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute - requests change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch borrowed items
 */
export function useBorrowedItems(options = {}) {
  return useQuery({
    queryKey: transactionKeys.borrowedItems(),
    queryFn: async () => {
      const response = await transactionApiIMS.getBorrowedItems();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch borrowed items');
      }
      return response.data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch returned items
 */
export function useReturnedItems(options = {}) {
  return useQuery({
    queryKey: transactionKeys.returnedItems(),
    queryFn: async () => {
      const response = await transactionApiIMS.getReturnedItems();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch returned items');
      }
      return response.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch recent activity logs
 */
export function useRecentActivity(limit = 10, options = {}) {
  return useQuery({
    queryKey: transactionKeys.recentActivity(limit),
    queryFn: async () => {
      const response = await transactionApiIMS.getActivityLogs(limit);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch activity logs');
      }
      return response.data || [];
    },
    staleTime: 30 * 1000, // 30 seconds - activity updates frequently
    gcTime: 2 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors (429) - wait for next refetch
      if (error?.response?.status === 429) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    ...options,
  });
}

/**
 * Hook to fetch recent transactions for dashboard (both borrow and return)
 */
export function useRecentTransactions(limit = 10, options = {}) {
  return useQuery({
    queryKey: transactionKeys.recentTransactions(limit),
    queryFn: async () => {
      const response = await transactionApiIMS.getRecentTransactionsForDashboard(limit);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch recent transactions');
      }
      return response.data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute - transactions update frequently
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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
 * Hook to fetch category statistics
 */
export function useCategoryStats(options = {}) {
  return useQuery({
    queryKey: transactionKeys.categoryStats(),
    queryFn: async () => {
      const response = await transactionApiIMS.getCategoryStats();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch category stats');
      }
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
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
 * Hook to fetch most borrowed items
 */
export function useMostBorrowedItems(days = 30, limit = 10, options = {}) {
  return useQuery({
    queryKey: transactionKeys.mostBorrowed(days, limit),
    queryFn: async () => {
      const response = await transactionApiIMS.getMostBorrowedItems(days, limit);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch most borrowed items');
      }
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
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
 * Hook to fetch borrowing trends
 */
export function useBorrowingTrends(period = 'monthly', options = {}) {
  return useQuery({
    queryKey: transactionKeys.borrowingTrends(period),
    queryFn: async () => {
      const response = await transactionApiIMS.getBorrowingTrends(period);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch borrowing trends');
      }
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch predictive analytics
 */
export function usePredictiveAnalytics(days = 30, forecastDays = 7, options = {}) {
  return useQuery({
    queryKey: transactionKeys.predictiveAnalytics(days, forecastDays),
    queryFn: async () => {
      const response = await transactionApiIMS.getPredictiveAnalytics(days, forecastDays);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch predictive analytics');
      }
      return response.data || {};
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - analytics don't change frequently
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch trend analysis
 */
export function useTrendAnalysis(period = 'monthly', startDate = null, endDate = null, options = {}) {
  return useQuery({
    queryKey: transactionKeys.trendAnalysis(period, startDate, endDate),
    queryFn: async () => {
      const response = await transactionApiIMS.getTrendAnalysis(period, startDate, endDate);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch trend analysis');
      }
      return response.data || {};
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch forecasting data
 */
export function useForecasting(type = 'inventory', days = 30, options = {}) {
  return useQuery({
    queryKey: transactionKeys.forecasting(type, days),
    queryFn: async () => {
      const response = await transactionApiIMS.getForecasting(type, days);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch forecasting data');
      }
      return response.data || {};
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to create a borrow request
 */
export function useCreateBorrowRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData) => {
      const response = await transactionApiIMS.createBorrowRequest(requestData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create borrow request');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: transactionKeys.borrowRequests() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recentActivity() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recentTransactions() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.categoryStats() });
    },
  });
}

/**
 * Hook to approve/reject borrow request
 */
export function useApproveBorrowRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action, data }) => {
      let response;
      if (action === 'approve') {
        response = await transactionApiIMS.approveBorrowRequest(id, data);
      } else {
        response = await transactionApiIMS.rejectBorrowRequest(id, data);
      }
      if (!response.success) {
        throw new Error(response.message || `Failed to ${action} borrow request`);
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: transactionKeys.borrowRequests() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.borrowedItems() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recentActivity() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recentTransactions() });
    },
  });
}

