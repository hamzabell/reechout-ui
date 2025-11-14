import useSWR from 'swr';
import { post } from '../services/apiService';
import { API_ENDPOINTS } from '../services/apiService';
import { OverviewStats, Campaign } from '../types';

// Get user ID for API requests
const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id || user.neonId;
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }
  return null;
};

// Custom hook for overview stats
export const useOverviewStats = () => {
  const { data, error, mutate, isValidating } = useSWR<OverviewStats>(
    API_ENDPOINTS.GET_STATS,
    async (endpoint) => {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      const response = await post(endpoint, { userId });
      return response; // The API returns data directly, not wrapped in a data property
    },
    {
      revalidateOnFocus: true, // Changed to true to match the error logs
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute cache
    }
  );

  return {
    stats: data,
    isLoading: isValidating,
    error,
    mutate,
  };
};

// Custom hook for recent campaigns
export const useRecentCampaigns = (limit = 3) => {
  const { data, error, mutate, isValidating } = useSWR<Campaign[]>(
    [API_ENDPOINTS.GET_RECENT_CAMPAIGNS, limit],
    async ([endpoint, limit]) => {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      const response = await post(endpoint, { userId, limit });
      return response.campaigns || [];
    },
    {
      revalidateOnFocus: true, // Changed to true to match the error logs
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds cache
    }
  );

  return {
    campaigns: data || [],
    isLoading: isValidating,
    error,
    mutate,
  };
};



// Combined hook for all overview data
export const useOverviewData = () => {
  const stats = useOverviewStats();
  const campaigns = useRecentCampaigns();

  const isLoading = stats.isLoading || campaigns.isLoading;
  const error = stats.error || campaigns.error;

  return {
    stats: stats.stats,
    recentCampaigns: campaigns.campaigns,
    isLoading,
    error,
    refresh: () => {
      stats.mutate();
      campaigns.mutate();
    },
  };
};
