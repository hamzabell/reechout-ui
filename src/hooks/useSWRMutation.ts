import { useState, useCallback } from 'react';
import { mutate as globalMutate } from 'swr';
import { swrPoster, swrPutter, swrDeleter } from '../lib/swr-config';
import { useToast } from './useToast';

// Generic mutation hook for POST/PUT/DELETE operations
export const useSWRMutation = <TData = any, TVariables = any>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options?: {
    onSuccess?: (data: TData, variables: TVariables, optimisticData?: any) => void;
    onError?: (error: Error, variables: TVariables, optimisticData?: any) => void;
    invalidateQueries?: string[]; // Query keys to invalidate after success
    optimisticUpdate?: (variables: TVariables) => any; // Function to create optimistic data
  }
) => {
  const [isMutating, setIsMutating] = useState(false);
  const { showToast } = useToast();

  const trigger = useCallback(async (variables: TVariables): Promise<TData> => {
    setIsMutating(true);
    let optimisticData: any;

    try {
      // Perform optimistic update if provided
      if (options?.optimisticUpdate) {
        optimisticData = options.optimisticUpdate(variables);
      }

      let response: TData;

      switch (method) {
        case 'POST':
          response = await swrPoster(endpoint, { arg: variables });
          break;
        case 'PUT':
          response = await swrPutter(endpoint, { arg: variables });
          break;
        case 'DELETE':
          response = await swrDeleter(endpoint, { arg: variables });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      // Invalidate related queries to refresh data
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          globalMutate(queryKey);
        });
      }

      // Call success callback with optimistic data
      if (options?.onSuccess) {
        options.onSuccess(response, variables, optimisticData);
      }

      // Show success message for CRUD operations
      if (method === 'POST') {
        showToast('Created successfully', 'success');
      } else if (method === 'PUT') {
        showToast('Updated successfully', 'success');
      } else if (method === 'DELETE') {
        showToast('Deleted successfully', 'success');
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Operation failed';

      // Call error callback with optimistic data for rollback
      if (options?.onError) {
        options.onError(error instanceof Error ? error : new Error(errorMessage), variables, optimisticData);
      }

      throw error;
    } finally {
      setIsMutating(false);
    }
  }, [endpoint, method, options, showToast]);

  return {
    trigger,
    isMutating,
  };
};

// Optimistic update mutation hook
export const useOptimisticMutation = <TData = any, TVariables = any>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  optimisticData: ((variables: TVariables) => any) | any,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    invalidateQueries?: string[];
  }
) => {
  const [isMutating, setIsMutating] = useState(false);

  const trigger = useCallback(async (variables: TVariables): Promise<TData> => {
    setIsMutating(true);

    // Store current data for rollback
    const queryKeys = options?.invalidateQueries || [];
    const previousData: Record<string, any> = {};

    queryKeys.forEach(key => {
      // Get current data for rollback
      const data = globalMutate(key);
      previousData[key] = data;
    });

    // Apply optimistic update
    const optimisticUpdate = typeof optimisticData === 'function'
      ? optimisticData(variables)
      : optimisticData;

    queryKeys.forEach(key => {
      globalMutate(key, optimisticUpdate, false);
    });

    try {
      let response: TData;

      switch (method) {
        case 'POST':
          response = await swrPoster(endpoint, { arg: variables });
          break;
        case 'PUT':
          response = await swrPutter(endpoint, { arg: variables });
          break;
        case 'DELETE':
          response = await swrDeleter(endpoint, { arg: variables });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      // Revalidate to get fresh data from server
      queryKeys.forEach(key => {
        globalMutate(key);
      });

      // Call success callback
      if (options?.onSuccess) {
        options.onSuccess(response, variables);
      }

      return response;
    } catch (error) {
      // Rollback optimistic update
      queryKeys.forEach(key => {
        globalMutate(key, previousData[key], false);
      });

      const errorMessage = error instanceof Error ? error.message : 'Operation failed';

      // Call error callback
      if (options?.onError) {
        options.onError(error instanceof Error ? error : new Error(errorMessage), variables);
      }

      throw error;
    } finally {
      setIsMutating(false);
    }
  }, [endpoint, method, optimisticData, options]);

  return {
    trigger,
    isMutating,
  };
};