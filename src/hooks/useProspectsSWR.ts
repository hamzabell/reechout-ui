import useSWR from 'swr';
import { Prospect } from '../types';
import { staticConfig } from '../lib/swr-config';
import { useSWRMutation } from './useSWRMutation';
import { useNeon } from '../providers/NeonProvider';
import { post } from '../services/apiService';

export interface ProspectFilters {
  status?: string;
  company?: string;
  industry?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'score';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ProspectsResponse {
  prospects: Prospect[];
  total: number;
  hasMore: boolean;
}

// Hook for fetching prospects with filtering and search
export const useProspects = (filters?: ProspectFilters) => {
  const { authState } = useNeon();

  const { data, error, isLoading, isValidating, mutate } = useSWR<ProspectsResponse>(
    authState.isAuthenticated && authState.user
      ? ['/prospects-list-prospects', { ...filters, userId: authState.user.id }]
      : null,
    async ([url, params]) => {
      const response = await post(url, params);
      return response;
    },
    staticConfig
  );

  const prospects = data?.prospects || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  return {
    prospects,
    total,
    hasMore,
    isLoading,
    isValidating,
    error,
    mutate, // CRITICAL: Expose mutate for optimistic updates
  };
};

// Hook for fetching a single prospect
export const useProspect = (id: string) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Prospect>(
    id ? [`/prospects/get-prospect?id=${id}`] : null,
    staticConfig
  );

  return {
    prospect: data,
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for creating prospects
export const useCreateProspect = () => {
  const { mutate } = useProspects();

  return useSWRMutation(
    '/prospects-create-prospect',
    'POST',
    {
      invalidateQueries: ['/prospects-list-prospects'],
      // Optimistic update for creating prospects
      optimisticUpdate: (variables: any) => {
        // Create a temporary prospect with a generated ID
        const tempId = `temp-${Date.now()}`;
        const tempProspect: Prospect = {
          id: tempId,
          name: variables.name,
          email: variables.email,
          company: variables.company || '',
          title: variables.title || '',
          website: variables.website || '',
          industry: variables.industry || '',
          linkedinProfile: variables.linkedinProfile || '',
          phoneNumber: variables.phoneNumber || '',
          location: variables.location || '',
          status: variables.status || 'NEW',
          tags: variables.tags || [],
          researchData: variables.researchData || null,
          notes: variables.notes || '',
          isOptedOut: variables.isOptedOut || false,
          source: variables.source || '',
          createdBy: variables.userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: {
            campaignProspects: 0,
            emailLogs: 0,
            activities: 0
          }
        };

        // Optimistically add the prospect to the cache
        mutate(
          (currentData: ProspectsResponse | undefined) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              prospects: [tempProspect, ...currentData.prospects],
              total: currentData.total + 1
            };
          },
          false // Don't revalidate yet
        );

        return tempProspect;
      },
      // Update with real data when successful
      onSuccess: (response: { prospect: Prospect }, variables: any, optimisticData: Prospect) => {
        // Replace the optimistic prospect with the real one
        mutate(
          (currentData: ProspectsResponse | undefined) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              prospects: currentData.prospects.map(p =>
                p.id === optimisticData.id ? response.prospect : p
              )
            };
          },
          false
        );
      },
      // Rollback on error
      onError: (error: Error, variables: any, optimisticData: Prospect) => {
        mutate(
          (currentData: ProspectsResponse | undefined) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              prospects: currentData.prospects.filter(p => p.id !== optimisticData.id),
              total: currentData.total - 1
            };
          },
          false
        );
      }
    }
  );
};

// Hook for updating prospects
export const useUpdateProspect = () => {
  const { mutate } = useProspects();

  return useSWRMutation(
    '/prospects-update-prospect',
    'PUT',
    {
      invalidateQueries: ['/prospects-list-prospects'],
      // Optimistic update for updating prospects
      optimisticUpdate: (variables: any) => {
        // Store the original state for potential rollback
        const { id, userId, ...updateFields } = variables;

        // Create the optimistic updated prospect
        const optimisticUpdate = {
          id,
          ...updateFields,
          updatedAt: new Date().toISOString()
        };

        // Optimistically update the prospect in the cache
        mutate(
          (currentData: ProspectsResponse | undefined) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              prospects: currentData.prospects.map(p =>
                p.id === id ? { ...p, ...optimisticUpdate } : p
              )
            };
          },
          false // Don't revalidate yet
        );

        return { id, originalUpdate: optimisticUpdate };
      },
      // Update with real data when successful
      onSuccess: (response: { prospect: Prospect }, variables: any, optimisticData: any) => {
        // Replace the optimistic update with the real one
        mutate(
          (currentData: ProspectsResponse | undefined) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              prospects: currentData.prospects.map(p =>
                p.id === optimisticData.id ? response.prospect : p
              )
            };
          },
          false
        );
      },
      // Rollback on error
      onError: (error: Error, variables: any, optimisticData: any) => {
        // Re-fetch to get the original state since we don't have the original
        mutate(
          (currentData: ProspectsResponse | undefined) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              prospects: currentData.prospects.map(p =>
                p.id === optimisticData.id ? { ...p, updatedAt: p.updatedAt } : p
              )
            };
          },
          false
        );
      }
    }
  );
};

// Removed problematic bulk operation hooks - functionality handled at component level

// Hook for CSV upload
export const useUploadCSV = () => {
  return useSWRMutation(
    '/upload/csv',
    'POST',
    {
      invalidateQueries: ['/prospects-list-prospects'],
    }
  );
};

// Hook for prospect search
export const useSearchProspects = (query: string, filters?: ProspectFilters) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Prospect[]>(
    query ? ['/prospects/search', { query, ...filters }] : null,
    staticConfig
  );

  return {
    searchResults: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for prospect export
export const useExportProspects = () => {
  return useSWRMutation<Blob, ProspectFilters>(
    '/prospects/export',
    'POST'
  );
};

// Hook for prospect research
export const useResearchProspect = (prospectId: string) => {
  return useSWRMutation(
    '/api/ai-research',
    'POST',
    {
      invalidateQueries: [
        `/prospects/get-prospect?id=${prospectId}`,
        '/prospects-list-prospects'
      ],
    }
  );
};

// Note: Selection functionality moved to component level