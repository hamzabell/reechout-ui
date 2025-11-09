// API helper functions for making requests to Netlify functions
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || window.location.origin;

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // For Netlify functions, we need to use the correct path format
  const isNetlifyFunction = endpoint.startsWith('/user-') ||
                           endpoint.startsWith('/prospects-') ||
                           endpoint.startsWith('/templates-');

  // If the base URL already includes .netlify/functions, don't add it again
  const baseUrlIncludesFunctions = API_BASE_URL.includes('.netlify/functions');

  const url = isNetlifyFunction && !baseUrlIncludesFunctions
    ? `${API_BASE_URL}/.netlify/functions${endpoint}`
    : `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    // Add fallback handling for network/API errors
    if (
      (error as any).message?.includes("Failed to fetch") ||
      (error as any).message?.includes("Network error")
    ) {
      throw new Error(
        "Network connection error. Please check your internet connection and try again.",
      );
    }
    throw error;
  }
};

// User profile API functions
export const userProfileApi = {
  get: async (neonUserId: string) => {
    const data = await apiRequest("/user-profile-get", {
      body: JSON.stringify({ neonUserId }),
    });
    return data.userProfile;
  },

  create: async (neonUser: any) => {
    const data = await apiRequest("/user-profile-create", {
      body: JSON.stringify({ neonUser }),
    });
    return data.userProfile;
  },

  update: async (neonUserId: string, updates: any) => {
    const data = await apiRequest("/user-profile-update", {
      body: JSON.stringify({ neonUserId, updates }),
    });
    return data.userProfile;
  },

  updateLastLogin: async (neonUserId: string) => {
    const data = await apiRequest("/user-profile-update-last-login", {
      body: JSON.stringify({ neonUserId }),
    });
    return data.userProfile;
  },

  confirmEmail: async (neonUserId: string) => {
    const data = await apiRequest("/user-confirm-email", {
      body: JSON.stringify({ neonUserId }),
    });
    return data.userProfile;
  },
};

// Utility function to get API base URL
export const getApiBaseUrl = () => API_BASE_URL;
