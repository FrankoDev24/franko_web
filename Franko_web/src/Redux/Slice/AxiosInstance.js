// src/Redux/Slice/AxiosInstance.js
import axios from "axios";

// ═══════════════════════════════════════════════════════════════════
// ENV CONFIG
// ═══════════════════════════════════════════════════════════════════

const LAMBDA_BASE_URL = import.meta.env.VITE_LAMBDA_BASE_URL;
const LAMBDA_HEADER_NAME =
  import.meta.env.VITE_LAMBDA_HEADER_NAME || "Identifier";
const LAMBDA_HEADER_VALUE =
  import.meta.env.VITE_LAMBDA_HEADER_VALUE || "Franko";

// ═══════════════════════════════════════════════════════════════════
// SAFE LOCALSTORAGE READER
// Always returns a parsed object or null — handles both:
//   - Raw browser localStorage (strings)
//   - Monkey-patched localStorage (already parsed objects)
// ═══════════════════════════════════════════════════════════════════

const readFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);

    // Nothing stored
    if (raw === null || raw === undefined) return null;

    // Already a parsed object (monkey-patched localStorage)
    if (typeof raw === "object") return raw;

    // String — parse it
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed || trimmed === "undefined" || trimmed === "null") return null;
      return JSON.parse(trimmed);
    }

    return null;
  } catch (error) {
    console.warn(`⚠️ AxiosInstance: Failed to read "${key}" from storage:`, error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════
// TOKEN EXTRACTOR
// Returns the accessToken string or null
// ═══════════════════════════════════════════════════════════════════

const getToken = (storageKey) => {
  const data = readFromStorage(storageKey);
  const token = data?.accessToken;
  if (token && typeof token === "string" && token.trim()) {
    return token.trim();
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════════
// ENDPOINT CLASSIFIER
// Determines which token context to use for a given endpoint
// ═══════════════════════════════════════════════════════════════════

const classifyEndpoint = (endpoint = "") => {
  const lower = endpoint.toLowerCase();

  // ✅ Explicit customer endpoints
  const isCustomerEndpoint =
    lower.includes("/users/customer") ||
    lower.includes("/users/getcustomerbyid") ||
    lower.includes("/users/customerlogin") ||
    lower.includes("/users/customerrefreshtoken") ||
    lower.includes("/users/generatecustomertoken") ||
    lower.includes("/users/updatecustomerpassword") ||
    lower.includes("/users/customer-post") ||
    lower.includes("/users/customer-get") ||
    lower.includes("/users/customer-status") ||
    lower.includes("/users/forgotpassword") ||
    lower.includes("/users/resetpassword");

  // ✅ Explicit user/admin/staff endpoints
  const isUserEndpoint =
    lower.includes("/users/login") ||
    lower.includes("/users/refresh") ||
    lower.includes("/users/getusers") ||
    lower.includes("/users/user-post") ||
    lower.includes("/users/user-get") ||
    lower.includes("/users/getuser") ||
    lower.includes("/users/updatepassword") ||
    lower.includes("access") ||
    lower.includes("admin") ||
    lower.includes("/dev/") ||
    lower.includes("/agent/") ||
    lower.includes("/fulfillment/") ||
    lower.includes("/content/");

  if (isCustomerEndpoint) return "customer";
  if (isUserEndpoint) return "user";
  return "ambiguous";
};

// ═══════════════════════════════════════════════════════════════════
// AXIOS INSTANCE
// ═══════════════════════════════════════════════════════════════════

const axiosInstance = axios.create({
  baseURL: LAMBDA_BASE_URL,
  headers: {
    [LAMBDA_HEADER_NAME]: LAMBDA_HEADER_VALUE,
  },
});

// ═══════════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR
// ═══════════════════════════════════════════════════════════════════

axiosInstance.interceptors.request.use(
  (config) => {
    // ── Ensure params and headers objects exist ──────────────────
    config.params = { ...(config.params || {}) };
    config.headers = { ...(config.headers || {}) };

    // ── Payment requests skip the client param ───────────────────
    const isPayment =
      (config.params.target || "").toString().toLowerCase() === "payment";

    if (!isPayment) {
      config.params.client = "website";
    }

    // ── Skip token injection if already set externally ───────────
    if (config.headers.Authorization) {
      return config;
    }

    // ── Classify the endpoint ────────────────────────────────────
    const endpoint = config.params?.endpoint || config.url || "";
    const context = classifyEndpoint(endpoint);

    const customerToken = getToken("customer");
    const userToken = getToken("user");

    let token = null;

    if (context === "customer") {
      // ✅ Customer endpoints — use customer token only
      token = customerToken;

      if (!token) {
        console.debug(
          `🔑 No customer token available for endpoint: ${endpoint}`
        );
      }
    } else if (context === "user") {
      // ✅ User/admin endpoints — use user token only
      token = userToken;

      if (!token) {
        console.debug(
          `🔑 No user token available for endpoint: ${endpoint}`
        );
      }
    } else {
      // ✅ Ambiguous — respect explicit overrides or use best available
      if (config.useCustomerToken) {
        token = customerToken;
      } else if (config.useUserToken) {
        token = userToken;
      } else {
        // Default: prefer user token for ambiguous requests
        // (admin panels, dashboards, etc.)
        token = userToken || customerToken;
      }
    }

    // ── Attach token ─────────────────────────────────────────────
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("❌ AxiosInstance request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR
// Logs 401s for debugging — actual refresh logic lives in the slices
// ═══════════════════════════════════════════════════════════════════

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const endpoint =
        error.config?.params?.endpoint || error.config?.url || "unknown";
      console.warn(`🔒 401 Unauthorized — endpoint: ${endpoint}`);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;