import useSWR, { mutate, mutate as globalMutate } from 'swr';
import { Campaign } from '../types';
import { swrConfig, realtimeConfig, swrSequenceDetailsFetcher } from '../lib/swr-config';
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
  const { data, error, isLoading, isValidating, mutate } = useSWR<CampaignsResponse>(
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

// Hook for creating empty sequences
export const useCreateSequence = () => {
  return useSWRMutation(
    '/campaigns-create-sequence',
    'POST',
    {
      invalidateQueries: ['/campaigns/advanced'],
      showToast: false, // Handle manually in component
    }
  );
};

// Hook for fetching sequence details
export const useSequenceDetails = (sequenceId: string | null) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    sequenceId ? ['/campaigns-get-sequence-details', { sequenceId }] : null,
    {
      fetcher: swrSequenceDetailsFetcher,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      dedupingInterval: 2000,
      focusThrottleInterval: 5000,
      loadingTimeout: 30000,
      keepPreviousData: false,
    }
  );

  // Return default values when sequence doesn't exist or there's an error
  const campaign = data?.campaign || (sequenceId ? {
    id: sequenceId,
    name: 'New Campaign',
    description: '',
    status: 'DRAFT' as const,
    createdAt: new Date().toISOString(),
    steps: [],
    prospects: [],
  } : null);

  return {
    campaign,
    isLoading,
    isValidating,
    error: (error && !data?.campaign) ? error : null, // Only show error if we don't have default data
    mutate,
  };
};

// Hook for updating campaigns
export const useUpdateCampaign = (campaignId: string) => {
  return useSWRMutation(
    '/campaigns-update-sequence',
    'PUT',
    {
      optimisticUpdate: (variables: any) => {
        // Extract only the campaign fields from the variables
        const { userId, sequenceId, ...campaignFields } = variables;
        return campaignFields;
      },
      invalidateQueries: [
        'campaigns',
        '/campaigns/advanced'
      ],
      onSuccess: (data, variables, optimisticData) => {
        // Update the sequence details cache with the optimistic data
        const sequenceKey = ['/campaigns-get-sequence-details', { sequenceId: campaignId }];
        globalMutate(sequenceKey, (current: any) => {
          if (current?.campaign) {
            return {
              ...current,
              campaign: {
                ...current.campaign,
                ...optimisticData,
                updatedAt: new Date().toISOString(),
              }
            };
          }
          return current;
        }, false);
      },
      showToast: false, // Handle manually in component
    }
  );
};

// Hook for deleting campaigns
export const useDeleteCampaign = () => {
  return useSWRMutation(
    '/campaigns-delete-campaign',
    'POST',
    {
      invalidateQueries: ['/campaigns/advanced'],
      showToast: false, // Handle manually in component
    }
  );
};

// Hook for duplicating campaigns
export const useDuplicateCampaign = () => {
  return useSWRMutation(
    '/campaigns-duplicate-campaign',
    'POST',
    {
      invalidateQueries: ['/campaigns/advanced'],
      showToast: false, // Handle manually in component
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

// Hook for starting campaigns
export const useStartCampaign = (campaignId: string) => {
  return useOptimisticMutation(
    '/campaigns-control',
    'POST',
    () => (current: Campaign) => ({
      ...current,
      status: 'ACTIVE' as const,
      startedAt: new Date().toISOString(),
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

// Hook for pausing campaigns
export const usePauseCampaign = (campaignId: string) => {
  return useOptimisticMutation(
    '/campaigns-control',
    'POST',
    () => (current: Campaign) => ({
      ...current,
      status: 'PAUSED' as const,
      pausedAt: new Date().toISOString(),
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
    '/campaigns-control',
    'POST',
    () => (current: Campaign) => ({
      ...current,
      status: 'ACTIVE' as const,
      pausedAt: null,
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

// Hook for stopping/cancelling campaigns
export const useStopCampaign = (campaignId: string) => {
  return useOptimisticMutation(
    '/campaigns-control',
    'POST',
    () => (current: Campaign) => ({
      ...current,
      status: 'CANCELLED' as const,
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

// Hook for scheduling campaigns
export const useScheduleCampaign = () => {
  return useSWRMutation(
    '/campaigns-schedule',
    'POST',
    {
      invalidateQueries: ['campaigns', '/campaigns/advanced'],
    }
  );
};
