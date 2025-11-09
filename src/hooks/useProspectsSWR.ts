import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { Prospect, ProspectStatus } from '../types';
import { swrConfig } from '../lib/swr-config';
import { useSWRMutation, useOptimisticMutation } from './useSWRMutation';
import { useNeon } from '../providers/NeonProvider';

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
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { authState } = useNeon();

  const { data, error, isLoading, isValidating, mutate } = useSWR<ProspectsResponse>(
    authState.isAuthenticated && authState.user
      ? ['/prospects/list-prospects', { ...filters, search: searchQuery, userId: authState.user.id }]
      : null,
    swrConfig
  );

  const prospects = data?.prospects || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  // Selection management
  const toggleProspectSelection = useCallback((prospectId: string) => {
    setSelectedProspects(prev =>
      prev.includes(prospectId)
        ? prev.filter(id => id !== prospectId)
        : [...prev, prospectId]
    );
  }, []);

  const selectAllProspects = useCallback(() => {
    setSelectedProspects(prospects.map(prospect => prospect.id));
  }, [prospects]);

  const clearSelection = useCallback(() => {
    setSelectedProspects([]);
  }, []);

  const isAllSelected = prospects.length > 0 && selectedProspects.length === prospects.length;
  const isPartiallySelected = selectedProspects.length > 0 && selectedProspects.length < prospects.length;

  return {
    prospects,
    total,
    hasMore,
    isLoading,
    isValidating,
    error,
    mutate,

    // Selection state
    selectedProspects,
    searchQuery,
    isAllSelected,
    isPartiallySelected,

    // Selection actions
    setSelectedProspects,
    setSearchQuery,
    toggleProspectSelection,
    selectAllProspects,
    clearSelection,
  };
};

// Hook for fetching a single prospect
export const useProspect = (id: string) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Prospect>(
    id ? [`/prospects/get-prospect?id=${id}`] : null,
    swrConfig
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
  return useOptimisticMutation(
    '/prospects/create-prospect',
    'POST',
    (newProspect: Prospect) => (current: Prospect[]) => [newProspect, ...current],
    {
      invalidateQueries: ['/prospects/list-prospects'],
    }
  );
};

// Hook for updating prospects
export const useUpdateProspect = (prospectId: string) => {
  return useOptimisticMutation(
    `/prospects/update-prospect?id=${prospectId}`,
    'PUT',
    (variables: Partial<Prospect>) => (current: Prospect[]) =>
      current.map(prospect =>
        prospect.id === prospectId
          ? { ...prospect, ...variables, updatedAt: new Date().toISOString() }
          : prospect
      ),
    {
      invalidateQueries: [
        `/prospects/get-prospect?id=${prospectId}`,
        '/prospects/list-prospects'
      ],
    }
  );
};

// Hook for updating prospect status
export const useUpdateProspectStatus = (prospectId: string) => {
  return useOptimisticMutation(
    `/prospects/update-prospect?id=${prospectId}`,
    'PUT',
    (status: ProspectStatus) => (current: Prospect[]) =>
      current.map(prospect =>
        prospect.id === prospectId
          ? { ...prospect, status, updatedAt: new Date().toISOString() }
          : prospect
      ),
    {
      invalidateQueries: [
        `/prospects/get-prospect?id=${prospectId}`,
        '/prospects/list-prospects'
      ],
    }
  );
};

// Hook for deleting prospects
export const useDeleteProspect = (prospectId: string) => {
  return useOptimisticMutation(
    `/prospects/delete-prospect?id=${prospectId}`,
    'DELETE',
    () => (current: Prospect[]) => current.filter(prospect => prospect.id !== prospectId),
    {
      invalidateQueries: ['/prospects/list-prospects'],
    }
  );
};

// Hook for bulk status update
export const useBulkUpdateStatus = () => {
  return useOptimisticMutation(
    '/prospects/bulk-update-status',
    'POST',
    ({ prospectIds, status }: { prospectIds: string[]; status: ProspectStatus }) =>
      (current: Prospect[]) =>
        current.map(prospect =>
          prospectIds.includes(prospect.id)
            ? { ...prospect, status, updatedAt: new Date().toISOString() }
            : prospect
        ),
    {
      invalidateQueries: ['/prospects/list-prospects'],
    }
  );
};

// Hook for bulk delete
export const useBulkDeleteProspects = () => {
  return useOptimisticMutation(
    '/prospects/bulk-delete',
    'DELETE',
    (prospectIds: string[]) => (current: Prospect[]) =>
      current.filter(prospect => !prospectIds.includes(prospect.id)),
    {
      invalidateQueries: ['/prospects/list-prospects'],
    }
  );
};

// Hook for CSV upload
export const useUploadCSV = () => {
  return useSWRMutation(
    '/upload/csv',
    'POST',
    {
      invalidateQueries: ['/prospects/list-prospects'],
    }
  );
};

// Hook for prospect search
export const useSearchProspects = (query: string, filters?: ProspectFilters) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Prospect[]>(
    query ? ['/prospects/search', { query, ...filters }] : null,
    swrConfig
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
        '/prospects/list-prospects'
      ],
    }
  );
};

// Combined prospects hook with all operations
export const useProspectsOperations = (filters?: ProspectFilters) => {
  const prospectsData = useProspects(filters);

  const { trigger: createProspect, isMutating: isCreating } = useCreateProspect();
  const { trigger: uploadCSV, isMutating: isUploading } = useUploadCSV();
  const { trigger: bulkUpdateStatus, isMutating: isBulkUpdating } = useBulkUpdateStatus();
  const { trigger: bulkDelete, isMutating: isBulkDeleting } = useBulkDeleteProspects();
  const { trigger: exportProspects, isMutating: isExporting } = useExportProspects();

  const handleBulkUpdateStatus = async (status: ProspectStatus) => {
    if (prospectsData.selectedProspects.length === 0) return;

    try {
      await bulkUpdateStatus({ prospectIds: prospectsData.selectedProspects, status });
      prospectsData.clearSelection();
    } catch (error) {
      throw error;
    }
  };

  const handleBulkDelete = async () => {
    if (prospectsData.selectedProspects.length === 0) return;

    try {
      await bulkDelete(prospectsData.selectedProspects);
      prospectsData.clearSelection();
    } catch (error) {
      throw error;
    }
  };

  const handleExport = async (exportFilters?: ProspectFilters) => {
    try {
      const blob = await exportProspects(exportFilters || filters || {});

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `prospects-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      throw error;
    }
  };

  return {
    ...prospectsData,

    // Operations
    createProspect,
    uploadCSV,
    bulkUpdateStatus: handleBulkUpdateStatus,
    bulkDelete: handleBulkDelete,
    export: handleExport,

    // Loading states
    isCreating,
    isUploading,
    isBulkUpdating,
    isBulkDeleting,
    isExporting,
  };
};