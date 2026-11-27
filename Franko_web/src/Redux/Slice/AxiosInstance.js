import { appStorage as localStorage } from "../../utils/secureLocalStorageInit";
import axios from "axios";

const LAMBDA_BASE_URL = import.meta.env.VITE_LAMBDA_BASE_URL;
const LAMBDA_HEADER_NAME =
  import.meta.env.VITE_LAMBDA_HEADER_NAME || "Identifier";
const LAMBDA_HEADER_VALUE =
  import.meta.env.VITE_LAMBDA_HEADER_VALUE || "Franko";

const safeGetFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);

    if (!raw || raw === "[object Object]") {
      if (raw === "[object Object]") {
        localStorage.removeItem(key);
      }
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  try {
    [
      "customer",
      "user",
      "loginTime",
      "lastActivityTimestamp",
      "refreshToken",
      "accessToken",
    ].forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore storage errors
  }
};

export const getCurrentToken = () => {
  const customer = safeGetFromStorage("customer");
  const user = safeGetFromStorage("user");

  if (customer?.accessToken) return customer.accessToken;
  if (user?.accessToken) return user.accessToken;

  return null;
};

export const isUserActive = () => {
  const lastActivity = Number(
    localStorage.getItem("lastActivityTimestamp") || 0
  );

  const INACTIVITY_LIMIT = 15 * 60 * 1000;

  return (
    lastActivity > 0 &&
    Date.now() - lastActivity < INACTIVITY_LIMIT
  );
};

export const updateLastActivity = () => {
  try {
    localStorage.setItem(
      "lastActivityTimestamp",
      String(Date.now())
    );
  } catch {
    // Ignore storage errors
  }
};

/* ═══════════════════════════════════════════════════════════════
   TELECEL BLACK FRIDAY PRODUCT FILTER
   Hide every product whose showRoomName is "Telecel black Friday"
   from the whole website — EXCEPT on the /telecel-blackfriday page.
   Applied centrally on the axios response so no other page/component
   needs its own filter.
   ═══════════════════════════════════════════════════════════════ */
const TELECEL_BF_SHOWROOM = "telecel black friday";
const TELECEL_BF_ROUTE = "/telecel-blackfriday";

const isOnTelecelBlackFridayPage = () => {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname || "";
  return path === TELECEL_BF_ROUTE || path.startsWith(`${TELECEL_BF_ROUTE}/`);
};

export const isTelecelBlackFridayProduct = (item) => {
  if (!item || typeof item !== "object" || Array.isArray(item)) return false;
  const showroom = String(
    item.showRoomName ?? item.ShowRoomName ?? item.showroomName ?? ""
  )
    .trim()
    .toLowerCase();
  return showroom === TELECEL_BF_SHOWROOM;
};

const isPlainData = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

export const stripTelecelBlackFridayProducts = (value) => {
  if (isOnTelecelBlackFridayPage()) return value;
  if (Array.isArray(value)) {
    const out = [];
    for (const item of value) {
      if (isTelecelBlackFridayProduct(item)) continue;
      out.push(stripTelecelBlackFridayProducts(item));
    }
    return out;
  }
  if (isPlainData(value)) {
    if (isTelecelBlackFridayProduct(value)) return null;
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = stripTelecelBlackFridayProducts(child);
    }
    return out;
  }
  return value;
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
    config.params = {
      ...(config.params || {}),
      client: "website",
    };

    config.headers = config.headers || {};

    if (!config.headers.Authorization) {
      const token = getCurrentToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.data && !config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Do not redirect or clear state here.
 *
 * requestWithAutoRefresh() must receive the 401 response first so it can
 * decide whether the user is active and whether the token can be refreshed.
 */
axiosInstance.interceptors.response.use(
  (response) => {
    if (response?.data) {
      response.data = stripTelecelBlackFridayProducts(response.data);
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
