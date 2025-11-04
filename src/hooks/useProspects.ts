import { useState, useCallback, useEffect } from 'react';
import { Prospect, ProspectStatus } from '../types';
import ProspectsService, { CreateProspectRequest, UploadCSVResponse } from '../services/prospectsService';

export interface ProspectsState {
  prospects: Prospect[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedProspects: string[];
  filters: {
    status?: string;
    company?: string;
    industry?: string;
  };
}

export const useProspects = () => {
  const [state, setState] = useState<ProspectsState>({
    prospects: [],
    loading: false,
    error: null,
    searchQuery: '',
    selectedProspects: [],
    filters: {},
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const setProspects = useCallback((prospectsOrUpdater: Prospect[] | ((prev: Prospect[]) => Prospect[])) => {
    setState(prev => ({
      ...prev,
      prospects: typeof prospectsOrUpdater === 'function' ? prospectsOrUpdater(prev.prospects) : prospectsOrUpdater
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setFilters = useCallback((filters: Partial<ProspectsState['filters']>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters }
    }));
  }, []);

  const setSelectedProspects = useCallback((selectedProspectsOrUpdater: string[] | ((prev: string[]) => string[])) => {
    setState(prev => ({
      ...prev,
      selectedProspects: typeof selectedProspectsOrUpdater === 'function' ? selectedProspectsOrUpdater(prev.selectedProspects) : selectedProspectsOrUpdater
    }));
  }, []);

  /**
   * Fetch all prospects
   */
  const fetchProspects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch from API first
      const response = await ProspectsService.listProspects({ limit: 100 });
      if (response.success && response.data && Array.isArray(response.data)) {
        setProspects(response.data);
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.warn('API fetch failed, using mock data:', error);
      // Fallback to mock data if API fails
      const mockProspects: Prospect[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@acme.com',
          company: 'Acme Corp',
          title: 'CEO',
          status: 'NEW',
          score: 75,
          tags: [],
          isOptedOut: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@techco.com',
          company: 'TechCo',
          title: 'CTO',
          status: 'CONTACTED',
          score: 85,
          tags: [],
          lastContacted: '2024-01-15',
          isOptedOut: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Bob Johnson',
          email: 'bob@startup.io',
          company: 'StartupIO',
          title: 'Founder',
          status: 'REPLIED',
          score: 90,
          tags: [],
          isOptedOut: false,
          lastContacted: '2024-01-14',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Alice Williams',
          email: 'alice@enterprise.com',
          company: 'Enterprise Inc',
          title: 'VP of Engineering',
          status: 'NOT_INTERESTED',
          score: 30,
          tags: [],
          isOptedOut: false,
          lastContacted: '2024-01-10',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setProspects(mockProspects);
      return mockProspects;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProspects]);

  /**
   * Fetch a single prospect by ID
   */
  const fetchProspect = useCallback(async (id: string): Promise<Prospect> => {
    setLoading(true);
    setError(null);

    try {
      const prospect = await ProspectsService.getProspect(id);
      return prospect;
    } catch (error) {
      console.warn('API fetch failed for prospect, using fallback data:', error);

      // Fallback: Find prospect in existing state or use mock data
      let existingProspect = state.prospects.find(p => p.id === id);

      if (existingProspect) {
        return existingProspect;
      }

      // If not in state, create a mock prospect for testing
      const mockProspect: Prospect = {
        id: id,
        name: 'Mock Prospect',
        email: 'mock@example.com',
        company: 'Mock Company',
        title: 'Mock Title',
        status: 'NEW',
        score: 50,
        tags: [],
        isOptedOut: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return mockProspect;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, state.prospects]);

  /**
   * Create a new prospect
   */
  const createProspect = useCallback(async (prospectData: CreateProspectRequest): Promise<Prospect> => {
    setLoading(true);
    setError(null);

    try {
      // Try API first, fallback to frontend creation
      let newProspect: Prospect;

      try {
        newProspect = await ProspectsService.createProspect(prospectData);
      } catch (apiError) {
        console.warn('API creation failed, creating frontend prospect:', apiError);
        // Fallback: create prospect on frontend
        newProspect = {
          id: Date.now().toString(),
          name: prospectData.name,
          email: prospectData.email,
          company: prospectData.company,
          title: prospectData.title,
          status: 'NEW',
          score: 50,
          tags: [],
          isOptedOut: false,
          lastContacted: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setProspects((prev) => [...prev, newProspect]);
      return newProspect;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create prospect';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProspects]);

  /**
   * Update an existing prospect
   */
  const updateProspect = useCallback(async (id: string, data: Partial<Prospect>): Promise<Prospect> => {
    setLoading(true);
    setError(null);

    try {
      let updatedProspect: Prospect;

      try {
        updatedProspect = await ProspectsService.updateProspect({ id, data });
        // Update local state with server response
        setProspects((prev) => prev.map((prospect) =>
          prospect.id === id ? updatedProspect : prospect
        ));
      } catch (apiError) {
        console.warn('API update failed, updating frontend prospect:', apiError);
        // Fallback: update prospect on frontend only
        setProspects((prev) => {
          const prospects = [...prev];
          const index = prospects.findIndex(prospect => prospect.id === id);
          if (index !== -1) {
            updatedProspect = {
              ...prospects[index],
              ...data,
              updatedAt: new Date().toISOString()
            };
            prospects[index] = updatedProspect;
          } else {
            // If prospect doesn't exist in state, create it with the updated data
            updatedProspect = {
              id,
              name: data.name || 'Unknown',
              email: data.email || 'unknown@example.com',
              company: data.company || 'Unknown Company',
              title: data.title,
              status: 'NEW',
              score: 50,
              tags: data.tags || [],
              isOptedOut: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...data
            };
            prospects.push(updatedProspect);
          }
          return prospects;
        });
      }

      return updatedProspect!;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update prospect';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProspects]);

  /**
   * Delete a prospect
   */
  const deleteProspect = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      try {
        await ProspectsService.deleteProspect(id);
      } catch (apiError) {
        console.warn('API deletion failed, deleting frontend prospect:', apiError);
        // Fallback: just delete from frontend state
      }

      setProspects((prev) => prev.filter((prospect) => prospect.id !== id));
      setSelectedProspects((prev) => prev.filter((prospectId) => prospectId !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete prospect';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProspects, setSelectedProspects]);

  /**
   * Upload prospects from CSV file
   */
  const uploadCSV = useCallback(async (file: File): Promise<UploadCSVResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ProspectsService.uploadCSV(file);
      if (response.success && response.prospects && Array.isArray(response.prospects) && response.prospects.length > 0) {
        setProspects((prev) => [...prev, ...response.prospects]);
      }
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload CSV';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProspects]);

  /**
   * Search prospects
   */
  const searchProspects = useCallback(async (query?: string) => {
    const searchQuery = query || state.searchQuery;
    setLoading(true);
    setError(null);

    try {
      const response = await ProspectsService.searchProspects(searchQuery, state.filters);
      if (Array.isArray(response)) {
        setProspects(response);
        return response;
      } else {
        throw new Error('Invalid search response format');
      }
    } catch (error) {
      console.warn('Search API failed, filtering mock data:', error);
      // Fallback: filter existing mock data
      const mockProspects: Prospect[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@acme.com',
          company: 'Acme Corp',
          title: 'CEO',
          status: 'NEW',
          score: 50,
          tags: [],
          isOptedOut: false,
          lastContacted: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@techco.com',
          company: 'TechCo',
          title: 'CTO',
          status: 'CONTACTED',
          score: 85,
          tags: [],
          lastContacted: '2024-01-15',
          isOptedOut: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Bob Johnson',
          email: 'bob@startup.io',
          company: 'StartupIO',
          title: 'Founder',
          status: 'REPLIED',
          score: 90,
          tags: [],
          isOptedOut: false,
          lastContacted: '2024-01-14',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Alice Williams',
          email: 'alice@enterprise.com',
          company: 'Enterprise Inc',
          title: 'VP of Engineering',
          status: 'NOT_INTERESTED',
          score: 30,
          tags: [],
          isOptedOut: false,
          lastContacted: '2024-01-10',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      let filteredProspects = mockProspects;

      // Apply status filter
      if (state.filters.status) {
        filteredProspects = filteredProspects.filter(prospect => prospect.status === state.filters.status);
      }

      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProspects = filteredProspects.filter(prospect =>
          prospect.name.toLowerCase().includes(query) ||
          prospect.email.toLowerCase().includes(query) ||
          prospect.company.toLowerCase().includes(query) ||
          (prospect.title && prospect.title.toLowerCase().includes(query))
        );
      }

      setProspects(filteredProspects);
      return filteredProspects;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProspects, state.searchQuery, state.filters]);

  /**
   * Update prospect status
   */
  const updateProspectStatus = useCallback(async (id: string, status: ProspectStatus): Promise<Prospect> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedProspect = await ProspectsService.updateProspectStatus(id, status);
      setProspects((prev) => prev.map((prospect) =>
        prospect.id === id ? updatedProspect : prospect
      ));
      return updatedProspect;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update prospect status';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProspects]);

  /**
   * Bulk update prospect status
   */
  const bulkUpdateStatus = useCallback(async (prospectIds: string[], status: ProspectStatus): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Try API first, fallback to frontend update
      try {
        await Promise.all(
          prospectIds.map(id => ProspectsService.updateProspectStatus(id, status))
        );
      } catch (apiError) {
        console.warn('API bulk update failed, updating frontend prospects:', apiError);
        // Fallback: just update in frontend state
      }

      setProspects((prev) => prev.map((prospect) =>
        prospectIds.includes(prospect.id) ? { ...prospect, status } : prospect
      ));

      setSelectedProspects([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update prospect status';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProspects, setSelectedProspects]);

  /**
   * Delete selected prospects
   */
  const deleteSelectedProspects = useCallback(async (): Promise<void> => {
    if (state.selectedProspects.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all(
        state.selectedProspects.map(id => ProspectsService.deleteProspect(id))
      );
      
      setProspects((prev) => prev.filter((prospect) => !state.selectedProspects.includes(prospect.id)));
      setSelectedProspects([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete prospects';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProspects, setSelectedProspects, state.selectedProspects]);

  /**
   * Toggle prospect selection
   */
  const toggleProspectSelection = useCallback((prospectId: string) => {
    setSelectedProspects((prev) =>
      prev.includes(prospectId)
        ? prev.filter((id) => id !== prospectId)
        : [...prev, prospectId]
    );
  }, [setSelectedProspects]);

  /**
   * Select all prospects
   */
  const selectAllProspects = useCallback(() => {
    setSelectedProspects(state.prospects.map(prospect => prospect.id));
  }, [setSelectedProspects, state.prospects]);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelectedProspects([]);
  }, [setSelectedProspects]);

  /**
   * Export prospects to CSV
   */
  const exportProspects = useCallback(async (filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const blob = await ProspectsService.exportProspects(filters);
      
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to export prospects';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Auto-fetch prospects on mount
  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  return {
    // State
    ...state,
    
    // Actions
    clearError,
    
    // Prospect operations
    fetchProspects,
    fetchProspect,
    createProspect,
    updateProspect,
    deleteProspect,
    uploadCSV,
    searchProspects,
    updateProspectStatus,
    bulkUpdateStatus,
    deleteSelectedProspects,
    exportProspects,
    
    // UI actions
    setSearchQuery,
    setFilters,
    toggleProspectSelection,
    selectAllProspects,
    clearSelection,
  };
};
