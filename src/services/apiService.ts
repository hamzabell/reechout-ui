// Base API configuration - use the same configuration as src/lib/api.ts
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3002'
    : 'https://your-app.netlify.app');

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Get user ID from localStorage
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

// Generic API request function with authentication
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {

  // Determine if this is a Netlify function
  const isNetlifyFunction = endpoint.startsWith('/prospects') ||
                           endpoint.startsWith('/user-') ||
                           endpoint.startsWith('/templates') ||
                           endpoint.startsWith('/password-') ||
                           endpoint.startsWith('/campaigns/') ||
                           endpoint.startsWith('/campaigns-') ||
                           endpoint.startsWith('/overview-') ||
                           endpoint === '/campaigns-delete-sequence-step';

  // Map endpoint to function name using switch statement for clarity
  let functionEndpoint = endpoint;
  
  switch (endpoint) {
    // Campaign endpoints
    case '/campaigns/advanced':
      functionEndpoint = '/campaigns-advanced';
      break;
    case '/campaigns-delete-campaign':
      functionEndpoint = '/campaigns-delete-campaign';
      break;
    case '/campaigns-duplicate-campaign':
      functionEndpoint = '/campaigns-duplicate-campaign';
      break;
    case '/campaigns-get-analytics':
      functionEndpoint = '/campaigns-get-analytics';
      break;
    case '/campaigns-get-sequences':
      functionEndpoint = '/campaigns-get-sequences';
      break;
    case '/campaigns-list-campaigns':
      functionEndpoint = '/campaigns-list-campaigns';
      break;
    case '/campaigns-get-sequence-details':
      functionEndpoint = '/campaigns-get-sequence-details';
      break;
    case '/campaigns-update-sequence-step':
      functionEndpoint = '/campaigns-update-sequence-step';
      break;
    case '/campaigns-delete-sequence-step':
      functionEndpoint = '/campaigns-delete-sequence-step';
      break;
    
    // Prospects endpoints
    case '/prospects-create-prospect':
      functionEndpoint = '/prospects-create-prospect';
      break;
    case '/prospects-update-prospect':
      functionEndpoint = '/prospects-update-prospect';
      break;
    case '/prospects-delete-prospect':
      functionEndpoint = '/prospects-delete-prospect';
      break;
    case '/prospects-list-prospects':
      functionEndpoint = '/prospects-list-prospects';
      break;
    case '/prospects-get-prospect':
      functionEndpoint = '/prospects-get-prospect';
      break;
    
    // Generic campaign update handlers
    default:
      // Handle campaign endpoints that need special mapping
      if (endpoint.startsWith('/campaigns/') && endpoint.includes('/update')) {
        functionEndpoint = '/campaigns-update-sequence';
      } else if (endpoint.match(/^\/campaigns\/[a-f0-9-]+$/)) {
        // Handle direct campaign ID endpoints for PUT requests
        functionEndpoint = '/campaigns-update-sequence';
      }
      break;
  }

  const url = isNetlifyFunction
    ? `${API_BASE_URL}/.netlify/functions${functionEndpoint}`
    : `${API_BASE_URL}${endpoint}`;

  const token = getAuthToken();
  const userId = getUserId();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(userId && { 'X-User-ID': userId }),
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log('API Request details:', { 
      endpoint, 
      url, 
      method: config.method,
      hasBody: !!config.body,
      bodyPreview: config.body ? (typeof config.body === 'string' ? config.body.substring(0, 200) + '...' : 'object') : null
    });

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Only log detailed error info for non-409 responses (409 is expected for duplicates)
      if (response.status !== 409) {
        console.log('API Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: response.url
        });
      }

      // Handle authentication errors
      if (response.status === 401) {
        // Clear invalid token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
        // Redirect to login or handle globally
        throw new Error('Authentication expired. Please login again.');
      }

      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Don't log 409 conflicts as errors since they're expected behavior for duplicates
    if (!(error instanceof Error && error.message.includes('HTTP error! status: 409'))) {
      console.error(`API request failed for ${endpoint}:`, error);
    }
    throw error;
  }
}

// API endpoint constants
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REGISTER: '/auth/register',

  // Password
  REQUEST_PASSWORD_RESET: '/password-request-reset',
  RESET_PASSWORD: '/password-reset',

  // Templates
  GET_TEMPLATES: '/templates',
  CREATE_TEMPLATE: '/templates',
  UPDATE_TEMPLATE: '/templates',
  DELETE_TEMPLATE: '/templates',

  // Campaigns
  GET_CAMPAIGNS: '/campaigns-list-campaigns',
  CREATE_CAMPAIGN: '/campaigns',
  UPDATE_CAMPAIGN: '/campaigns',
  DELETE_CAMPAIGN: '/campaigns-delete-campaign',
  DUPLICATE_CAMPAIGN: '/campaigns-duplicate-campaign',
  GET_CAMPAIGN_ANALYTICS: '/campaigns-get-analytics',
  GET_SEQUENCES: '/campaigns-get-sequences',
  GET_SEQUENCE_DETAILS: '/campaigns-get-sequence-details',
  UPDATE_SEQUENCE_STEP: '/campaigns-update-sequence-step',
  DELETE_SEQUENCE_STEP: '/campaigns-delete-sequence-step',
  CREATE_SEQUENCE: '/campaigns-create-sequence',
  CREATE_SEQUENCE_STEP: '/campaigns-create-sequence-step',
  REORDER_SEQUENCE_STEPS: '/campaigns-reorder-sequence-steps',
  ADD_PROSPECTS_TO_SEQUENCE: '/campaigns-add-prospects-to-sequence',
  CAMPAIGN_CONTROL: '/campaigns-control',
  PROSPECT_STATUS: '/campaigns-prospect-status',
  REMOVE_PROSPECT: '/campaigns-remove-prospect',
  CAMPAIGN_ADVANCED: '/campaigns/advanced',
  SCHEDULE_CAMPAIGN: '/campaigns-schedule',

  // Prospects
  GET_PROSPECTS: '/prospects',
  CREATE_PROSPECT: '/prospects',
  UPDATE_PROSPECT: '/prospects',
  DELETE_PROSPECT: '/prospects',

  // Email
  SEND_EMAIL: '/api/email/send-email',
  GET_EMAIL_LOGS: '/api/email/get-email-logs',

  // Analytics
  GET_ANALYTICS: '/api/analytics/get-analytics',

  // File Upload
  UPLOAD_CSV: '/api/upload/csv',

  // Users
  GET_PROFILE: '/api/users/profile',
  UPDATE_PROFILE: '/api/users/update-profile',
  GET_SETTINGS: '/api/users/settings',
  UPDATE_SETTINGS: '/api/users/update-settings',

  // Tasks
  GET_TASKS: '/tasks',
  GET_TASK: '/tasks',
  CREATE_TASK: '/tasks',
  UPDATE_TASK: '/tasks',
  DELETE_TASK: '/tasks',

  // Overview
  GET_STATS: '/overview-get-stats',
  GET_RECENT_CAMPAIGNS: '/overview-get-recent-campaigns',
  GET_RECENT_PROSPECTS: '/overview-get-recent-prospects',

  // AI Services
  PERSONALIZE_EMAIL: '/api/ai/personalize-email',
  GENERATE_TEMPLATE: '/api/ai/generate-template',
  ANALYZE_EMAIL: '/api/ai/analyze-email',
  RESEARCH_LEAD: '/api/ai/research-lead',

  // Lead Management (Prospects)
  LIST_LEADS: '/prospects',
  GET_LEAD: '/prospects',
  CREATE_LEAD: '/prospects',
  UPDATE_LEAD: '/prospects',
  DELETE_LEAD: '/prospects',
} as const;

// Auth token management
export const authStorage = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  },

  getToken: () => getAuthToken(),

  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  },

  setUserData: (userData: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(userData));
    }
  },

  getUserData: () => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('user_data');
      return data ? JSON.parse(data) : null;
    }
    return null;
  }
};

// Type definitions for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user: {
    id: string;
    email: string;
    name: string;
    company?: string;
    title?: string;
    isActive: boolean;
    createdAt: string;
  };
  token: string;
  sessionToken: string;
  expiresIn: string;
  error?: string;
}

// Export the apiRequest function
export { apiRequest };

// Helper function to add query parameters to URL
function addQueryParams(endpoint: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const queryString = new URLSearchParams(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
  ).toString();
  
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

// Export specific API methods for convenience
export const api = {
  get: (endpoint: string, params?: Record<string, any>, options?: RequestInit) => 
    apiRequest(addQueryParams(endpoint, params), { ...options, method: 'GET' }),
  post: (endpoint: string, data?: any, options?: RequestInit) => {
    console.log('POST request:', { endpoint, data, options });
    return apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  put: (endpoint: string, data?: any, options?: RequestInit) => apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }),
  delete: (endpoint: string, data?: any, options?: RequestInit) => apiRequest(endpoint, {
    ...options,
    method: 'DELETE',
    body: data ? JSON.stringify(data) : undefined,
  }),
};

export default api;

// Export individual functions for backward compatibility
export const get = api.get;
export const post = api.post;
export const put = api.put;
export const deleteRequest = api.delete;
