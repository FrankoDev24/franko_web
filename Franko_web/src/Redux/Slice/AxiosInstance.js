// AxiosInstance.js
import axios from "axios";

const LAMBDA_BASE_URL = import.meta.env.VITE_LAMBDA_BASE_URL;
const LAMBDA_HEADER_NAME =
  import.meta.env.VITE_LAMBDA_HEADER_NAME || "Identifier";
const LAMBDA_HEADER_VALUE =
  import.meta.env.VITE_LAMBDA_HEADER_VALUE || "Franko";

// ─────────────────────────────────────────────
// Safe localStorage helpers that work with monkey-patched localStorage
// ─────────────────────────────────────────────
const safeGetFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);

    if (!data) return null;
    
    // If it's already an object (from monkey patch), return it
    if (typeof data === "object" && data !== null) {
      return data;
    }
    
    // If it's a string that looks like JSON, try parsing it
    if (typeof data === "string") {
      // Check if it's already parsed JSON that was somehow stringified
      if (data === "[object Object]") {
     
        localStorage.removeItem(key);
        return null;
      }
      
      // Try parsing if it looks like JSON
      if (data.startsWith('{') || data.startsWith('[')) {
        try {
          return JSON.parse(data);
        } catch (parseError) {
      
          return null;
        }
      }
      
      // Return as string if it's not JSON
      return data;
    }
    
    return data;
  } catch (e) {

    return null;
  }
};

// ─────────────────────────────────────────────
// Helper function to clean up corrupted localStorage entries
// ─────────────────────────────────────────────
const cleanupCorruptedEntries = () => {
  try {
    const keysToCheck = ['customer', 'user'];
    keysToCheck.forEach(key => {
      const raw = localStorage.getItem(key);
      if (typeof raw === "string" && raw === "[object Object]") {
  
        localStorage.removeItem(key);
      }
    });
  } catch (e) {

  }
};

// Clean up on initialization
cleanupCorruptedEntries();

// ─────────────────────────────────────────────
// Axios Instance Configuration
// ─────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: LAMBDA_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    [LAMBDA_HEADER_NAME]: LAMBDA_HEADER_VALUE,
  },
});

// ─────────────────────────────────────────────
// Request Interceptor
// ─────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    // Ensure params object exists and add client identifier
    config.params = { 
      ...(config.params || {}), 
      client: "website" 
    };

    // Ensure headers object exists
    config.headers = { ...(config.headers || {}) };

    // Only auto-attach token if no Authorization header is already set
    // This allows higher-level functions to control token management
    if (!config.headers.Authorization) {
      try {
        // Try to get current valid tokens using our safe getter
        const customer = safeGetFromStorage("customer");
        const user = safeGetFromStorage("user");

        let token = null;

        // Prioritize customer token, then user token
        if (customer?.accessToken && typeof customer.accessToken === 'string' && customer.accessToken.trim() !== '') {
          token = customer.accessToken;
        } else if (user?.accessToken && typeof user.accessToken === 'string' && user.accessToken.trim() !== '') {
          token = user.accessToken;
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
  
        // Clean up potentially corrupted entries
        cleanupCorruptedEntries();
      }
    }

    // Set Content-Type if not already set and there's data
    if (config.data && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// Response Interceptor
// ─────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
  
    }
    return response;
  },
  (error) => {
    const { config, response } = error;
    
    // Log errors in development
    if (import.meta.env.DEV) {
 
    }

    // Handle specific error scenarios
    if (response) {
      const status = response.status;
      
      switch (status) {
        case 401:
          // Don't auto-logout here - let the higher-level requestWithAutoRefresh handle it
          // This prevents conflicts with the silent refresh logic
       
          break;
          
        case 403:
         
          break;
          
        case 429:
   
          break;
          
        case 500:
   
          break;
          
        case 502:
        case 503:
        case 504:
  
          break;
          
        default:
          if (status >= 400) {
 
          }
      }
    } else if (error.code === 'ECONNABORTED') {

    } else if (error.message === 'Network Error') {

    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// Utility functions for manual token management
// ─────────────────────────────────────────────

/**
 * Check if we have valid authentication tokens
 */
export const hasValidAuth = () => {
  try {
    const customer = safeGetFromStorage("customer");
    const user = safeGetFromStorage("user");
    
    return (
      (customer?.accessToken && typeof customer.accessToken === 'string' && customer.accessToken.trim() !== '') ||
      (user?.accessToken && typeof user.accessToken === 'string' && user.accessToken.trim() !== '')
    );
  } catch {
    return false;
  }
};

/**
 * Get current access token for manual use
 */
export const getCurrentToken = () => {
  try {
    const customer = safeGetFromStorage("customer");
    const user = safeGetFromStorage("user");
    
    if (customer?.accessToken && typeof customer.accessToken === 'string' && customer.accessToken.trim() !== '') {
      return customer.accessToken;
    }
    
    if (user?.accessToken && typeof user.accessToken === 'string' && user.accessToken.trim() !== '') {
      return user.accessToken;
    }
    
    return null;
  } catch {
    return null;
  }
};

/**
 * Get current user type and details
 */
export const getCurrentAuth = () => {
  try {
    const customer = safeGetFromStorage("customer");
    const user = safeGetFromStorage("user");
    
    if (customer?.accessToken && typeof customer.accessToken === 'string' && customer.accessToken.trim() !== '') {
      return { type: 'customer', data: customer };
    }
    
    if (user?.accessToken && typeof user.accessToken === 'string' && user.accessToken.trim() !== '') {
      return { type: 'user', data: user };
    }
    
    return { type: null, data: null };
  } catch {
    return { type: null, data: null };
  }
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  try {
    localStorage.removeItem("customer");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
  } catch (e) {

  }
};

/**
 * Force cleanup of corrupted localStorage entries
 */
export const forceCleanupStorage = () => {
  cleanupCorruptedEntries();
};

export default axiosInstance;