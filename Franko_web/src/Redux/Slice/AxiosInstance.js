// AxiosInstance.js
import axios from "axios";

const LAMBDA_BASE_URL = import.meta.env.VITE_LAMBDA_BASE_URL;
const LAMBDA_HEADER_NAME =
  import.meta.env.VITE_LAMBDA_HEADER_NAME || "Identifier";
const LAMBDA_HEADER_VALUE =
  import.meta.env.VITE_LAMBDA_HEADER_VALUE || "Franko";

const axiosInstance = axios.create({
  baseURL: LAMBDA_BASE_URL,
  headers: {
    [LAMBDA_HEADER_NAME]: LAMBDA_HEADER_VALUE,
  },
});

axiosInstance.interceptors.request.use((config) => {
  config.params = { ...(config.params || {}) };
  config.headers = { ...(config.headers || {}) };

  // Handle payment-specific params
  const isPayment =
    (config.params.target || "").toString().toLowerCase() === "payment";
  if (!isPayment) {
    config.params.client = "website";
  }

  try {
    // Get both customer and user from localStorage
    const customer = localStorage.getItem("customer"); // returns parsed object
    const user = localStorage.getItem("user"); // returns parsed object

    // Determine which token to use based on the endpoint
    const endpoint = config.params?.endpoint || "";
    let token = null;

    // ✅ CUSTOMER ENDPOINTS - Use customer token
    if (
      endpoint.includes("Customer") ||
      endpoint.includes("/customer") ||
      endpoint.toLowerCase().includes("customer")
    ) {
      if (customer && typeof customer === "object" && customer.accessToken) {
        token = customer.accessToken;
      }
    }
    // ✅ USER/ADMIN ENDPOINTS - Use user token
    else if (
      endpoint.includes("User") ||
      endpoint.includes("/user") ||
      endpoint.includes("/Users/") ||
      endpoint.toLowerCase().includes("user") ||
      endpoint.includes("Access") ||
      endpoint.includes("admin")
    ) {
      if (user && typeof user === "object" && user.accessToken) {
        token = user.accessToken;
      }
    }
    // ✅ FALLBACK - If endpoint doesn't clearly indicate, check context hints
    else {
      // Allow explicit override via config
      if (config.useCustomerToken) {
        token = customer?.accessToken;
      } else if (config.useUserToken) {
        token = user?.accessToken;
      } else {
        // Default fallback: prefer user token over customer for ambiguous requests
        token = user?.accessToken || customer?.accessToken;
      }
    }

    // Attach token if found
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn("Could not attach auth token from storage:", e);
  }

  return config;
});

export default axiosInstance;