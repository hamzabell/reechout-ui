import useSWR, { mutate } from 'swr';
import { Campaign } from '../types';
import { swrConfig, realtimeConfig } from '../lib/swr-config';
import { useSWRMutation, useOptimisticMutation } from './useSWRMutation';

export interface CampaignFilters {
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'status' | 'sent' | 'replyRate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  total: number;
  hasMore: boolean;
}

// Hook for fetching all campaigns
export const useCampaigns = (filters?: CampaignFilters) => {
  const { data, error, isLoading, isValidating } = useSWR<CampaignsResponse>(
    ['/campaigns/advanced', filters],
    swrConfig
  );

  return {
    campaigns: data?.campaigns || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for fetching a single campaign
export const useCampaign = (id: string) => {
  const { data, error, isLoading, isValidating } = useSWR<Campaign>(
    id ? [`/campaigns/${id}`] : null,
    swrConfig
  );

  return {
    campaign: data,
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for campaign analytics
export const useCampaignAnalytics = (campaignId: string) => {
  const { data, error, isLoading, isValidating } = useSWR(
    campaignId ? [`/campaigns/${campaignId}/analytics`] : null,
    realtimeConfig // More frequent updates for analytics
  );

  return {
    analytics: data,
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for campaign emails
export const useCampaignEmails = (
  campaignId: string,
  filters?: {
    status?: string;
    search?: string;
    sortBy?: 'createdAt' | 'personalizationScore' | 'status';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }
) => {
  const { data, error, isLoading, isValidating } = useSWR(
    campaignId ? [`/campaigns/${campaignId}/emails`, filters] : null,
    swrConfig
  );

  return {
    emails: data?.emails || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for campaign performance over time
export const useCampaignPerformance = (
  campaignId: string,
  period: '24h' | '7d' | '30d' | '90d' = '30d'
) => {
  const { data, error, isLoading, isValidating } = useSWR(
    campaignId ? [`/campaigns/${campaignId}/performance`, { period }] : null,
    realtimeConfig
  );

  return {
    performance: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for creating campaigns
export const useCreateCampaign = () => {
  return useSWRMutation(
    '/campaigns',
    'POST',
    {
      invalidateQueries: ['campaigns'],
      onSuccess: () => {
        mutate('/campaigns/advanced'); // Refresh campaigns list
      },
    }
  );
};

// Hook for updating campaigns
export const useUpdateCampaign = (campaignId: string) => {
  return useOptimisticMutation(
    `/campaigns/${campaignId}`,
    'PUT',
    (variables: Partial<Campaign>) => (current: Campaign) => ({
      ...current,
      ...variables,
      updatedAt: new Date().toISOString(),
    }),
    {
      invalidateQueries: [
        `/campaigns/${campaignId}`,
        'campaigns',
        '/campaigns/advanced'
      ],
    }
  );
};

// Hook for deleting campaigns
export const useDeleteCampaign = () => {
  return useOptimisticMutation(
    '/campaigns',
    'DELETE',
    (campaignId: string) => (current: Campaign[]) =>
      current.filter((campaign: Campaign) => campaign.id !== campaignId),
    {
      invalidateQueries: ['campaigns', '/campaigns/advanced'],
    }
  );
};

// Hook for duplicating campaigns
export const useDuplicateCampaign = () => {
  return useSWRMutation(
    '/campaigns',
    'POST',
    {
      invalidateQueries: ['campaigns', '/campaigns/advanced'],
    }
  );
};

// Hook for pausing campaigns
export const usePauseCampaign = (campaignId: string) => {
  return useOptimisticMutation(
    `/campaigns/${campaignId}/pause`,
    'PUT',
    () => (current: Campaign) => ({
      ...current,
      status: 'paused' as const,
    }),
    {
      invalidateQueries: [
        `/campaigns/${campaignId}`,
        'campaigns',
        '/campaigns/advanced'
      ],
    }
  );
};

// Hook for resuming campaigns
export const useResumeCampaign = (campaignId: string) => {
  return useOptimisticMutation(
    `/campaigns/${campaignId}/resume`,
    'PUT',
    () => (current: Campaign) => ({
      ...current,
      status: 'sending' as const,
    }),
    {
      invalidateQueries: [
        `/campaigns/${campaignId}`,
        'campaigns',
        '/campaigns/advanced'
      ],
    }
  );
};

// Hook for sending campaigns
export const useSendCampaign = (campaignId: string) => {
  return useSWRMutation(
    `/campaigns/${campaignId}/send`,
    'POST',
    {
      invalidateQueries: [
        `/campaigns/${campaignId}`,
        'campaigns',
        '/campaigns/advanced'
      ],
    }
  );
};

// Hook for generating campaign emails
export const useGenerateEmails = (campaignId: string) => {
  return useSWRMutation(
    `/campaigns/generate-emails`,
    'POST',
    {
      invalidateQueries: [
        `/campaigns/${campaignId}/emails`,
        `/campaigns/${campaignId}`
      ],
    }
  );
};

// Hook for bulk email approval
export const useBulkApproval = () => {
  return useSWRMutation(
    '/emails/bulk-approval',
    'POST',
    {
      invalidateQueries: ['campaigns', '/campaigns/advanced'],
    }
  );
};

// Hook for scheduling emails
export const useScheduleEmails = (campaignId: string) => {
  return useSWRMutation(
    `/campaigns/${campaignId}/schedule`,
    'POST',
    {
      invalidateQueries: [
        `/campaigns/${campaignId}`,
        `/campaigns/${campaignId}/emails`,
        'campaigns'
      ],
    }
  );
};