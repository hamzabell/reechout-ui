// Base API configuration - use the same configuration as src/lib/api.ts
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001'
    : 'https://your-app.netlify.app');

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Generic API request function with authentication
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {

  // Add .netlify/functions prefix for Netlify function endpoints
  const isNetlifyFunction = endpoint.startsWith('/prospects') ||
                           endpoint.startsWith('/user-') ||
                           endpoint.startsWith('/templates') ||
                           endpoint.startsWith('/password-');

  const url = isNetlifyFunction
    ? `${API_BASE_URL}/.netlify/functions${endpoint}`
    : `${API_BASE_URL}${endpoint}`;

  const token = getAuthToken();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

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

      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Generic GET request
export async function get(endpoint: string, params?: Record<string, any>): Promise<any> {
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    url += `?${searchParams.toString()}`;
  }
  return apiRequest(url, { method: 'GET' });
}

// Generic POST request
export async function post(endpoint: string, data: any): Promise<any> {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Generic PUT request
export async function put(endpoint: string, data: any): Promise<any> {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Generic DELETE request
export async function del(endpoint: string, data?: any): Promise<any> {
  return apiRequest(endpoint, {
    method: 'DELETE',
    ...(data && { body: JSON.stringify(data) }),
  });
}

// API endpoints for new architecture
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  SIGNUP: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',

  // Prospects
  CREATE_LEAD: '/api/prospects/create-prospect',
  LIST_LEADS: '/prospects-list-prospects',
  GET_LEAD: '/api/prospects/get-prospect',
  UPDATE_LEAD: '/api/prospects/update-prospect',
  DELETE_LEAD: '/api/prospects/delete-prospect',
  RESEARCH_LEAD: '/api/ai-research',

  // Campaigns
  CREATE_CAMPAIGN: '/api/campaigns/create-campaign',
  LIST_CAMPAIGNS: '/api/campaigns/list-campaigns',
  GET_CAMPAIGN: '/api/campaigns/get-campaign',
  UPDATE_CAMPAIGN: '/api/campaigns/update-campaign',
  DELETE_CAMPAIGN: '/api/campaigns/delete-campaign',
  SEND_CAMPAIGN: '/api/campaigns/send-campaign',

  // Templates
  CREATE_TEMPLATE: '/api/templates/create-template',
  LIST_TEMPLATES: '/api/templates/list-templates',
  GET_TEMPLATE: '/api/templates/get-template',
  UPDATE_TEMPLATE: '/api/templates/update-template',
  DELETE_TEMPLATE: '/api/templates/delete-template',

  // AI Services
  PERSONALIZE_EMAIL: '/api/ai/personalize-email',
  GENERATE_TEMPLATE: '/api/ai/generate-template',
  ANALYZE_EMAIL: '/api/ai/analyze-email',

  // Email
  SEND_EMAIL: '/api/email/send-email',
  GET_EMAIL_LOGS: '/api/email/get-email-logs',

  // Analytics
  GET_ANALYTICS: '/api/analytics/get-analytics',
  GET_CAMPAIGN_ANALYTICS: '/api/analytics/campaign-analytics',

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
