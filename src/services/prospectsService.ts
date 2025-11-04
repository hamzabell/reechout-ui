import { get, post, put, del, API_ENDPOINTS, PaginatedResponse } from './apiService';

export interface CreateProspectRequest {
  name: string;
  email: string;
  company: string;
  title?: string;
  website?: string;
  industry?: string;
  linkedinProfile?: string;
  phoneNumber?: string;
  location?: string;
  tags?: string[];
  notes?: string;
  source?: string;
}

export interface UpdateProspectRequest {
  id: string;
  data: Partial<Prospect>;
}

export interface ListProspectsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  industry?: string;
  score_min?: number;
  score_max?: number;
  tags?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  date_from?: string;
  date_to?: string;
}

export interface UploadCSVResponse {
  success: boolean;
  message: string;
  prospects: Prospect[];
  errors?: string[];
}

export interface Prospect {
  id: string;
  name: string;
  email: string;
  company: string;
  title?: string;
  website?: string;
  industry?: string;
  linkedinProfile?: string;
  phoneNumber?: string;
  location?: string;
  status: ProspectStatus;
  score: number;
  tags: string[];
  researchData?: any;
  personalizationData?: any;
  notes?: string;
  lastContacted?: string;
  nextFollowUp?: string;
  timezone?: string;
  isOptedOut: boolean;
  source?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    campaigns: number;
    emailLogs: number;
    activities: number;
  };
}

export type ProspectStatus = 'NEW' | 'CONTACTED' | 'ENGAGED' | 'REPLIED' | 'INTERESTED' | 'NOT_INTERESTED' | 'OPTED_OUT' | 'CONVERTED' | 'BOUNCED';

export class ProspectsService {
  /**
   * Get prospects with pagination and filtering
   */
  static async listProspects(params?: ListProspectsParams): Promise<PaginatedResponse<Prospect[]>> {
    try {
      const response = await get(API_ENDPOINTS.LIST_LEADS, params);
      return response;
    } catch (error) {
      console.error('Failed to get prospects:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch prospects');
    }
  }

  /**
   * Get a single prospect by ID
   */
  static async getProspect(id: string): Promise<Prospect> {
    try {
      const response = await get(API_ENDPOINTS.GET_LEAD, { id });
      // Handle both response formats: { data: { prospect: ... } } and { prospect: ... }
      if (response.data && response.data.prospect) {
        return response.data.prospect;
      } else if (response.prospect) {
        return response.prospect;
      } else if (response.data) {
        return response.data;
      } else {
        throw new Error('Invalid response format: prospect data not found');
      }
    } catch (error) {
      console.error('Failed to get prospect:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch prospect');
    }
  }

  /**
   * Create a new prospect
   */
  static async createProspect(prospectData: CreateProspectRequest): Promise<Prospect> {
    try {
      const response = await post(API_ENDPOINTS.CREATE_LEAD, prospectData);
      return response.data.prospect;
    } catch (error) {
      console.error('Failed to create prospect:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create prospect');
    }
  }

  /**
   * Update an existing prospect
   */
  static async updateProspect(request: UpdateProspectRequest): Promise<Prospect> {
    try {
      const response = await put(API_ENDPOINTS.UPDATE_LEAD, {
        id: request.id,
        ...request.data
      });
      // Handle both response formats: { data: { prospect: ... } } and { prospect: ... }
      if (response.data && response.data.prospect) {
        return response.data.prospect;
      } else if (response.prospect) {
        return response.prospect;
      } else if (response.data) {
        return response.data;
      } else {
        throw new Error('Invalid response format: prospect data not found');
      }
    } catch (error) {
      console.error('Failed to update prospect:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update prospect');
    }
  }

  /**
   * Delete a prospect
   */
  static async deleteProspect(id: string): Promise<void> {
    try {
      await del(`${API_ENDPOINTS.DELETE_LEAD}/${id}`);
    } catch (error) {
      console.error('Failed to delete prospect:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete prospect');
    }
  }

  /**
   * Research a prospect using AI
   */
  static async researchProspect(prospectId: string, researchType?: string): Promise<{
    success: boolean;
    researchData: any;
    personalizationData: any;
    prospectScore: number;
    cached: boolean;
  }> {
    try {
      const response = await post(API_ENDPOINTS.RESEARCH_LEAD, {
        prospectId,
        researchType
      });
      return response;
    } catch (error) {
      console.error('Failed to research prospect:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to research prospect');
    }
  }

  /**
   * Upload prospects from CSV file
   */
  static async uploadCSV(file: File): Promise<UploadCSVResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(API_ENDPOINTS.UPLOAD_CSV, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to upload CSV:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to upload CSV file');
    }
  }

  /**
   * Search prospects by query
   */
  static async searchProspects(query: string, filters?: {
    status?: string;
    company?: string;
    industry?: string;
  }): Promise<Prospect[]> {
    try {
      const params: ListProspectsParams = {
        search: query,
        ...filters
      };

      const response = await get(API_ENDPOINTS.LIST_LEADS, params);
      return response.data.prospects || [];
    } catch (error) {
      console.error('Failed to search prospects:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to search prospects');
    }
  }

  /**
   * Get prospects by status
   */
  static async getProspectsByStatus(status: ProspectStatus): Promise<Prospect[]> {
    try {
      const response = await get(API_ENDPOINTS.LIST_LEADS, { status });
      return response.data.prospects || [];
    } catch (error) {
      console.error('Failed to get prospects by status:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch prospects by status');
    }
  }

  /**
   * Update prospect status
   */
  static async updateProspectStatus(id: string, status: ProspectStatus): Promise<Prospect> {
    try {
      const response = await put(API_ENDPOINTS.UPDATE_LEAD, {
        id,
        status
      });
      return response.data.prospect;
    } catch (error) {
      console.error('Failed to update prospect status:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update prospect status');
    }
  }

  /**
   * Get prospect statistics
   */
  static async getProspectStats(): Promise<{
    total: number;
    new: number;
    contacted: number;
    engaged: number;
    replied: number;
    interested: number;
    notInterested: number;
    optedOut: number;
    converted: number;
    bounced: number;
  }> {
    try {
      const response = await get('/api/prospects/stats');
      return response.data.stats;
    } catch (error) {
      console.error('Failed to get prospect stats:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch prospect statistics');
    }
  }

  /**
   * Export prospects to CSV
   */
  static async exportProspects(filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Blob> {
    try {
      const params = new URLSearchParams();

      if (filters?.status) params.append('status', filters.status);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);

      const response = await fetch(`/api/prospects/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to export prospects:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to export prospects');
    }
  }

  /**
   * Get prospect activities
   */
  static async getProspectActivities(prospectId: string): Promise<any[]> {
    try {
      const response = await get(`/api/prospects/${prospectId}/activities`);
      return response.data.activities || [];
    } catch (error) {
      console.error('Failed to get prospect activities:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch prospect activities');
    }
  }

  /**
   * Add note to prospect
   */
  static async addProspectNote(prospectId: string, note: string): Promise<Prospect> {
    try {
      const response = await post(`/api/prospects/${prospectId}/notes`, { note });
      return response.data.prospect;
    } catch (error) {
      console.error('Failed to add prospect note:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to add prospect note');
    }
  }
}

export default ProspectsService;
