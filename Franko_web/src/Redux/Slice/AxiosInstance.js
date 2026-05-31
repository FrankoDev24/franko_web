// AxiosInstance.js
import axios from "axios";

const LAMBDA_BASE_URL = import.meta.env.VITE_LAMBDA_BASE_URL;
const LAMBDA_HEADER_NAME =
  import.meta.env.VITE_LAMBDA_HEADER_NAME || "Identifier";
const LAMBDA_HEADER_VALUE =
  import.meta.env.VITE_LAMBDA_HEADER_VALUE || "Franko";

/* ─────────────────────────────────────────────
   Safe localStorage helpers
───────────────────────────────────────────── */

const safeGetFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    // Remove corrupted "[object Object]" entries
    if (raw === "[object Object]") {
      localStorage.removeItem(key);
      return null;
    }

    // Try parsing JSON
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
};

const cleanupCorruptedEntries = () => {
  ["customer", "user"].forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      if (value === "[object Object]") {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  });
};

// Run once on load
cleanupCorruptedEntries();

/* ─────────────────────────────────────────────
   Axios Instance
───────────────────────────────────────────── */

const axiosInstance = axios.create({
  baseURL: LAMBDA_BASE_URL,
  timeout: 30000,
  headers: {
    [LAMBDA_HEADER_NAME]: LAMBDA_HEADER_VALUE,
  },
});

/* ─────────────────────────────────────────────
   Request Interceptor
───────────────────────────────────────────── */

axiosInstance.interceptors.request.use(
  (config) => {
    config.params = {
      ...(config.params || {}),
      client: "website",
    };

    config.headers = config.headers || {};

    // Attach token only if not manually set
    if (!config.headers.Authorization) {
      const token = getCurrentToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Only set JSON header if not already set
    if (config.data && !config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ─────────────────────────────────────────────
   Response Interceptor
───────────────────────────────────────────── */

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (!response) {
      return Promise.reject(error);
    }

    const { status } = response;

    switch (status) {
      case 401:
        // Let higher-level logic handle refresh/logout
        break;

      case 403:
      case 429:
      case 500:
      case 502:
      case 503:
      case 504:
      default:
        break;
    }

    return Promise.reject(error);
  }
);

/* ─────────────────────────────────────────────
   Auth Utilities
───────────────────────────────────────────── */

export const getCurrentToken = () => {
  try {
    const customer = safeGetFromStorage("customer");
    const user = safeGetFromStorage("user");

    if (customer?.accessToken?.trim()) return customer.accessToken;
    if (user?.accessToken?.trim()) return user.accessToken;

    return null;
  } catch {
    return null;
  }
};

export const hasValidAuth = () => {
  return Boolean(getCurrentToken());
};

export const getCurrentAuth = () => {
  try {
    const customer = safeGetFromStorage("customer");
    const user = safeGetFromStorage("user");

    if (customer?.accessToken?.trim()) {
      return { type: "customer", data: customer };
    }

    if (user?.accessToken?.trim()) {
      return { type: "user", data: user };
    }

    return { type: null, data: null };
  } catch {
    return { type: null, data: null };
  }
};

export const clearAuth = () => {
  try {
    localStorage.removeItem("customer");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
  } catch {
    // ignore
  }
};

export const forceCleanupStorage = () => {
  cleanupCorruptedEntries();
};

export default axiosInstance;