import { SWRConfiguration } from 'swr';
import { get, post, put, deleteRequest as del } from '../services/apiService';

// Enhanced fetcher function for SWR
export const swrFetcher = async (key: string | [string, any]) => {
  try {
    let url: string;
    let params: any = undefined;

    if (Array.isArray(key)) {
      [url, params] = key;
    } else {
      url = key;
    }

    // For GET requests with params, convert to query string
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url = queryString ? `${url}?${queryString}` : url;
    }

    const response = await get(url);
    return response;
  } catch (error) {
    throw error;
  }
};

// Fetcher function for POST requests
export const swrPoster = async (url: string, { arg }: { arg: any }) => {
  try {
    const response = await post(url, arg);
    return response;
  } catch (error) {
    throw error;
  }
};

// Specialized fetcher for sequence details that uses POST
export const swrSequenceDetailsFetcher = async (key: string | [string, any]) => {
  try {
    let url: string;
    let params: any = undefined;

    if (Array.isArray(key)) {
      [url, params] = key;
    } else {
      url = key;
    }

    // Ensure params is properly formatted for the API
    const requestBody = params && typeof params === 'object' ? params : {};
    
    console.log('SWR sequence details fetcher:', { url, params: requestBody });
    
    const response = await post(url, requestBody);
    return response;
  } catch (error) {
    console.error('Error in swrSequenceDetailsFetcher:', error);
    throw error;
  }
};

// Fetcher function for PUT requests
export const swrPutter = async (url: string, { arg }: { arg: any }) => {
  try {
    const response = await put(url, arg);
    return response;
  } catch (error) {
    throw error;
  }
};

// Fetcher function for DELETE requests
export const swrDeleter = async (url: string, { arg }: { arg?: any }) => {
  try {
    const response = await del(url, arg);
    return response;
  } catch (error) {
    throw error;
  }
};

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
  fetcher: swrFetcher,
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
};

// Configuration for real-time data (more frequent revalidation)
export const realtimeConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 30000, // 30 seconds
  revalidateOnFocus: true,
};

// Configuration for static data (less frequent revalidation)
export const staticConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 300000, // 5 minutes
};

// Configuration for user actions (immediate revalidation)
export const userActionConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshWhenHidden: true,
  dedupingInterval: 100,
};
