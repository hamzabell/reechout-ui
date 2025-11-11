import useSWR, { mutate, mutate as globalMutate } from 'swr';
import { Campaign } from '../types';
import { swrConfig, realtimeConfig, swrSequenceDetailsFetcher } from '../lib/swr-config';
import { useSWRMutation, useOptimisticMutation } from './useSWRMutation';
import { useCallback } from 'react';

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

// Hook for adding prospects to campaigns
export const useAddProspectsToCampaign = (campaignId: string) => {
  return useSWRMutation(
    '/campaigns-add-prospects',
    'POST',
    {
      optimisticUpdate: (variables: any) => {
        // Return optimistic data structure
        const { prospectIds } = variables;
        return {
          success: true,
          status: 'success',
          message: `Adding ${prospectIds.length} prospects to campaign...`,
          added: prospectIds.length,
          duplicates: 0,
          campaignProspects: prospectIds.map((id: string, index: number) => ({
            id: `optimistic-${Date.now()}-${index}`,
            campaignId,
            prospectId: id,
            status: 'NEW',
            prospect: {
              id,
              name: 'Loading...',
              email: 'Loading...',
              company: '',
              title: '',
              status: 'NEW'
            }
          }))
        };
      },
      invalidateQueries: [
        `/campaigns/${campaignId}`,
        '/campaigns/advanced',
        '/campaigns-get-sequence-details',
        'prospects'
      ],
      onSuccess: (data, variables) => {
        // Update sequence details cache with the new prospects
        const sequenceKey = ['/campaigns-get-sequence-details', { sequenceId: campaignId }];
        globalMutate(sequenceKey, (current: any) => {
          if (current?.campaign && data?.campaignProspects) {
            const newProspects = data.campaignProspects.map((cp: any) => ({
              id: cp.id,
              status: cp.status,
              prospect: cp.prospect,
              personalizedEmails: []
            }));
            
            return {
              ...current,
              campaign: {
                ...current.campaign,
                prospects: [...current.campaign.prospects, ...newProspects]
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

// Hook for removing prospects from campaigns
export const useRemoveProspectFromCampaign = (campaignId: string) => {
  return useSWRMutation(
    '/campaigns-remove-prospect',
    'POST',
    {
      optimisticUpdate: (variables: any) => {
        const { prospectId } = variables;
        // Return optimistic data structure
        return {
          success: true,
          message: 'Removing prospect from campaign...',
          campaignId,
          prospectId
        };
      },
      onSuccess: (data, variables, optimisticData) => {
        // Update the sequence details cache to remove the prospect optimistically
        const sequenceKey = ['/campaigns-get-sequence-details', { sequenceId: campaignId }];
        globalMutate(sequenceKey, (current: any) => {
          if (current?.campaign) {
            return {
              ...current,
              campaign: {
                ...current.campaign,
                prospects: current.campaign.prospects.filter((p: any) => p.prospect.id !== variables.prospectId)
              }
            };
          }
          return current;
        }, false);
      },
      onError: (error, variables, optimisticData) => {
        // Rollback by revalidating the cache
        const sequenceKey = ['/campaigns-get-sequence-details', { sequenceId: campaignId }];
        globalMutate(sequenceKey);
      },
      invalidateQueries: [
        `/campaigns/${campaignId}`,
        '/campaigns/advanced',
        '/campaigns-get-sequence-details',
        'prospects'
      ],
      showToast: false // Handle manually in component
    }
  );
};

// Hook for pausing prospects in campaigns
export const usePauseProspect = (campaignId: string) => {
  const { trigger, isMutating } = useSWRMutation(
    '/campaigns-prospect-status',
    'POST',
    {
      onSuccess: () => {
        // Mutate the campaign details to refresh the data
        globalMutate(['/campaigns-get-sequence-details', { sequenceId: campaignId }]);
      }
    }
  );

  const pauseProspectTrigger = useCallback(async (variables: any) => {
    // Apply optimistic update
    const queryKey = ['/campaigns-get-sequence-details', { sequenceId: campaignId }];
    globalMutate(queryKey, (current: any) => {
      if (current?.campaign) {
        const { prospectId } = variables;
        return {
          ...current,
          campaign: {
            ...current.campaign,
            prospects: current.campaign.prospects.map((p: any) => 
              p.prospect.id === prospectId 
                ? { ...p, isPaused: true, pausedAt: new Date().toISOString(), status: 'PAUSED' }
                : p
            )
          }
        };
      }
      return current;
    }, false);

    return trigger(variables);
  }, [campaignId, trigger]);

  return {
    trigger: pauseProspectTrigger,
    isMutating
  };
};

// Hook for resuming prospects in campaigns
export const useResumeProspect = (campaignId: string) => {
  const { trigger, isMutating } = useSWRMutation(
    '/campaigns-prospect-status',
    'POST',
    {
      onSuccess: () => {
        // Mutate the campaign details to refresh the data
        globalMutate(['/campaigns-get-sequence-details', { sequenceId: campaignId }]);
      }
    }
  );

  const resumeProspectTrigger = useCallback(async (variables: any) => {
    // Apply optimistic update
    const queryKey = ['/campaigns-get-sequence-details', { sequenceId: campaignId }];
    globalMutate(queryKey, (current: any) => {
      if (current?.campaign) {
        const { prospectId } = variables;
        return {
          ...current,
          campaign: {
            ...current.campaign,
            prospects: current.campaign.prospects.map((p: any) => 
              p.prospect.id === prospectId 
                ? { ...p, isPaused: false, pausedAt: null, status: 'RUNNING' }
                : p
            )
          }
        };
      }
      return current;
    }, false);

    return trigger(variables);
  }, [campaignId, trigger]);

  return {
    trigger: resumeProspectTrigger,
    isMutating
  };
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
