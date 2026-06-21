import axios from "axios";

const LAMBDA_BASE_URL = import.meta.env.VITE_LAMBDA_BASE_URL;
const LAMBDA_HEADER_NAME = import.meta.env.VITE_LAMBDA_HEADER_NAME || "Identifier";
const LAMBDA_HEADER_VALUE = import.meta.env.VITE_LAMBDA_HEADER_VALUE || "Franko";

const safeGetFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    if (raw === "[object Object]") {
      localStorage.removeItem(key);
      return null;
    }
    try { return JSON.parse(raw); } catch { return raw; }
  } catch { return null; }
};

const cleanupCorruptedEntries = () => {
  ["customer", "user"].forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      if (value === "[object Object]") localStorage.removeItem(key);
    } catch {}
  });
};

cleanupCorruptedEntries();

export const clearAuth = () => {
  try {
    localStorage.removeItem("customer");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
    localStorage.removeItem("lastActivityTimestamp");
  } catch {}
};

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

const forceLogoutAndRedirect = () => {
  clearAuth();

  if (window.location.pathname !== "/") {
    window.location.replace("/");
  }
};

const axiosInstance = axios.create({
  baseURL: LAMBDA_BASE_URL,
  timeout: 30000,
  headers: {
    [LAMBDA_HEADER_NAME]: LAMBDA_HEADER_VALUE,
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    config.params = { ...(config.params || {}), client: "website" };
    config.headers = config.headers || {};

    if (!config.headers.Authorization) {
      const token = getCurrentToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data && !config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response?.status === 401) {
      forceLogoutAndRedirect();
    }

    return Promise.reject(error);
  }
);

export const hasValidAuth = () => Boolean(getCurrentToken());
export const getCurrentAuth = () => {
  try {
    const customer = safeGetFromStorage("customer");
    const user = safeGetFromStorage("user");
    if (customer?.accessToken?.trim()) return { type: "customer", data: customer };
    if (user?.accessToken?.trim()) return { type: "user", data: user };
    return { type: null, data: null };
  } catch {
    return { type: null, data: null };
  }
};

export const forceCleanupStorage = () => cleanupCorruptedEntries();
export default axiosInstance;