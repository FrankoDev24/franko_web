// src/Redux/Slice/customerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance, { clearAuth, isUserActive } from "./AxiosInstance";

const CUSTOMER_KEY = "customer";

/* ─────────────────────────────────────────────
   Safe Storage Helpers
───────────────────────────────────────────── */
const clearStorage = () => {
  try {
    localStorage.removeItem("customer");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
    localStorage.removeItem("lastActivityTimestamp");
  } catch {
    localStorage.removeItem("customer");
  }
};

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem("customer");
    if (!raw) return null;

    // Monkey-patched localStorage may return object directly
    if (typeof raw === "object" && raw !== null) {
      return raw.contactNumber || raw.customerAccountNumber || raw.accessToken
        ? raw
        : null;
    }

    // Clean up corrupted entries
    if (raw === "[object Object]" || raw === "undefined" || raw === "null") {
      localStorage.removeItem("customer");
      return null;
    }

    // Parse JSON string (handles single and double stringification)
    let parsed;
    try {
      parsed = JSON.parse(raw);
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
    } catch {
      localStorage.removeItem("customer");
      return null;
    }

    if (!parsed || typeof parsed !== "object") return null;
    return parsed.contactNumber || parsed.customerAccountNumber || parsed.accessToken
      ? parsed
      : null;
  } catch {
    return null;
  }
};

const saveToStorage = (customer) => {
  if (!customer) {
    clearStorage();
    return;
  }
  try {
    // ✅ FIX: Always stringify before storing
    const data = JSON.stringify({ ...customer, lastUpdated: Date.now() });
    localStorage.setItem("customer", data);
    } catch {
      try {
        localStorage.setItem("customer", customer);
      } catch {
        // Ignore storage errors
      }
    }
};

/* ─────────────────────────────────────────────
   Validation Helpers
───────────────────────────────────────────── */
const validateCustomerData = (data) => {
  if (!data || typeof data !== "object") return false;
  return !!(
    data.contactNumber &&
    typeof data.contactNumber === "string" &&
    data.contactNumber.trim() !== ""
  );
};

const isTokenExpired = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false; // Not a JWT, can't check
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false; // No expiry claim, trust it
    return Date.now() > payload.exp * 1000;
  } catch {
    return false; // Can't decode, trust it
  }
};

const hasValidAuth = (data) => {
  if (!data?.accessToken) return false;
  if (typeof data.accessToken !== "string" || data.accessToken.trim() === "") return false;
  if (isTokenExpired(data.accessToken)) return false;
  return validateCustomerData(data);
};

/* ─────────────────────────────────────────────
   Backend & Auth Helpers
───────────────────────────────────────────── */
const callBackend = async ({ endpoint, method = "GET", data, extraParams = {}, headers = {} }) => {
  const config = { method, url: "/", params: { endpoint, ...extraParams }, headers };
  if (data) config.data = data;
  return axiosInstance(config);
};

const buildAuthHeaders = (providedToken = null) => {
  const stored = loadFromStorage();
  const accessToken = providedToken || stored?.accessToken;
  const headers = { "Content-Type": "application/json" };
  if (accessToken && typeof accessToken === "string" && accessToken.trim() !== "") {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
};

const refreshCustomerToken = async (refreshToken) => {
  const res = await callBackend({
    endpoint: "/Users/CustomerRefreshToken",
    method: "POST",
    data: { refreshToken },
    headers: { "Content-Type": "application/json" },
  });
  const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
  if (!res.status || res.status < 200 || res.status >= 300 || data?.response?.responseCode !== "1") {
    throw new Error(data?.response?.responseMessage || "Token refresh failed");
  }
  return data;
};

let refreshPromise = null;

/* ✅ FIX: silentTokenRefresh does NOT call saveToStorage.
   It only dispatches updateToken, which the reducer handles safely. */
const silentTokenRefresh = async (dispatch) => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const stored = loadFromStorage();
      const refreshToken = stored?.refreshToken;

      if (!refreshToken) {
        forceLogout(dispatch);
        return null;
      }

      const refreshed = await refreshCustomerToken(refreshToken);
      const updatedTokens = {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken || refreshToken,
      };

      // ✅ FIX: Do NOT call saveToStorage here.
      // The updateToken reducer handles storage safely
      // (only saves when currentCustomer exists = user still logged in).
      if (dispatch) {
        dispatch({ type: "customer/updateToken", payload: updatedTokens });
      }

      return updatedTokens.accessToken;
    } catch {
      forceLogout(dispatch);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/* ✅ FIX: No redirect — RequireAuth shows auth modal, Nav shows "Sign up" */
const forceLogout = (dispatch) => {
  clearStorage();
  clearAuth();
  if (dispatch) {
    dispatch({ type: "customer/logoutCustomer" });
  }
};

/* ─────────────────────────────────────────────
   Request Wrapper with Activity Check & Auto-Refresh
───────────────────────────────────────────── */
const requestWithAutoRefresh = async ({
  endpoint,
  method = "GET",
  data,
  extraParams = {},
  providedToken = null,
  dispatch = null,
}) => {
  let headers = buildAuthHeaders(providedToken);
  let response;

  try {
    response = await callBackend({ endpoint, method, data, extraParams, headers });
    return response;
  } catch (error) {
    if (error?.response?.status !== 401) throw error;
    response = error.response;
  }

  if (!isUserActive()) {
    forceLogout(dispatch);
    throw new Error("SESSION_EXPIRED");
  }

  const newAccessToken = await silentTokenRefresh(dispatch);

  if (!newAccessToken) {
    forceLogout(dispatch);
    throw new Error("SESSION_EXPIRED");
  }

  headers = buildAuthHeaders(newAccessToken);

  try {
    return await callBackend({ endpoint, method, data, extraParams, headers });
  } catch (retryError) {
    if (retryError?.response?.status === 401) {
      forceLogout(dispatch);
      throw new Error("SESSION_EXPIRED");
    }
    throw retryError;
  }
};

/* ─────────────────────────────────────────────
   Async Thunks
───────────────────────────────────────────── */
export const createCustomer = createAsyncThunk(
  "customer/createCustomer",
  async (customerData, { rejectWithValue }) => {
    try {
      if (!validateCustomerData(customerData))
        return rejectWithValue({ message: "Invalid customer data.", responseCode: "0" });

      const res = await callBackend({
        endpoint: "/Users/Customer-Post",
        method: "POST",
        data: customerData,
        headers: { "Content-Type": "application/json" },
      });
      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      if (res.status < 200 || res.status >= 300)
        return rejectWithValue({
          message: data?.ResponseMessage || "Registration failed.",
          responseCode: data?.ResponseCode || String(res.status),
        });
      return data;
    } catch (error) {
      return rejectWithValue({ message: error.message || "Registration failed.", responseCode: "0" });
    }
  }
);

export const loginCustomer = createAsyncThunk(
  "customer/loginCustomer",
  async ({ contactNumber, password }, { dispatch, rejectWithValue }) => {
    try {
      if (!contactNumber || !password)
        return rejectWithValue({ message: "Contact number and password are required.", responseCode: "0" });

      const res = await callBackend({
        endpoint: "/Users/CustomerLogin",
        method: "POST",
        data: { contactNumber, password, FullName: "N/A" },
        headers: { "Content-Type": "application/json" },
      });
      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

      if (res.status < 200 || res.status >= 300 || data?.response?.responseCode !== "1")
        return rejectWithValue({
          message: data?.response?.responseMessage || "Login failed.",
          responseCode: data?.response?.responseCode || String(res.status),
        });

      const tempCustomer = {
        contactNumber,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        loginStatus: true,
        isAuthenticated: true,
        loginTime: Date.now(),
      };
      saveToStorage(tempCustomer);

      try {
        const profile = await dispatch(
          getCustomerById({ contactNumber, accessToken: data.accessToken })
        ).unwrap();
        const mergedCustomer = { ...profile, ...tempCustomer };
        saveToStorage(mergedCustomer);
        return mergedCustomer;
      } catch {
        return tempCustomer;
      }
    } catch (error) {
      return rejectWithValue({ message: error.message || "Login failed.", responseCode: "0" });
    }
  }
);

export const fetchCustomers = createAsyncThunk(
  "customer/fetchCustomers",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const res = await requestWithAutoRefresh({ endpoint: "/Users/Customer-Get", method: "GET", dispatch });
      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      if (res.status < 200 || res.status >= 300)
        return rejectWithValue({ message: data?.ResponseMessage || "Failed.", responseCode: String(res.status) });
      return Array.isArray(data) ? data : [data].filter(Boolean);
    } catch (error) {
      return rejectWithValue({ message: error.message || "Failed.", responseCode: error.message === "SESSION_EXPIRED" ? "401" : "0" });
    }
  }
);

export const getCustomerById = createAsyncThunk(
  "customer/getCustomerById",
  async ({ contactNumber, accessToken = null }, { rejectWithValue, dispatch }) => {
    try {
      const res = await requestWithAutoRefresh({
        endpoint: "/Users/GetCustomerById",
        method: "GET",
        extraParams: { contactNumber },
        providedToken: accessToken,
        dispatch,
      });
      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      if (res.status < 200 || res.status >= 300)
        return rejectWithValue({ message: data?.ResponseMessage || "Failed.", responseCode: String(res.status) });
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      return rejectWithValue({ message: error.message || "Failed.", responseCode: error.message === "SESSION_EXPIRED" ? "401" : "0" });
    }
  }
);

export const updateCustomerPassword = createAsyncThunk(
  "customer/updateCustomerPassword",
  async ({ contactNumber, oldPassword, newPassword }, { rejectWithValue, dispatch }) => {
    try {
      const res = await requestWithAutoRefresh({
        endpoint: "/Users/UpdateCustomerPassword",
        method: "POST",
        data: { contactNumber, oldPassword, newPassword },
        dispatch,
      });
      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      if (res.status < 200 || res.status >= 300 || data?.ResponseCode !== "1")
        return rejectWithValue({ message: data?.ResponseMessage || "Failed.", responseCode: String(res.status) });
      return data;
    } catch (error) {
      return rejectWithValue({ message: error.message || "Failed.", responseCode: error.message === "SESSION_EXPIRED" ? "401" : "0" });
    }
  }
);

export const updateAccountStatus = createAsyncThunk(
  "customer/updateAccountStatus",
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const customer = getState().customer.currentCustomer;
      const res = await requestWithAutoRefresh({
        endpoint: "/Users/Customer-Status",
        method: "POST",
        data: { accountNumber: customer.customerAccountNumber, accountStatus: "0" },
        dispatch,
      });
      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      if (res.status < 200 || res.status >= 300)
        return rejectWithValue({ message: data?.ResponseMessage || "Failed.", responseCode: String(res.status) });
      clearStorage();
      return data;
    } catch (error) {
      return rejectWithValue({ message: error.message || "Failed.", responseCode: error.message === "SESSION_EXPIRED" ? "401" : "0" });
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "customer/forgotPassword",
  async ({ contactNumber, email }, { rejectWithValue }) => {
    try {
      const res = await callBackend({
        endpoint: "/Users/ForgotPassword",
        method: "POST",
        data: { contactNumber, email },
        headers: { "Content-Type": "application/json" },
      });
      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      if (res.status < 200 || res.status >= 300 || data?.ResponseCode !== "1")
        return rejectWithValue({ message: data?.ResponseMessage || "Failed.", responseCode: String(res.status) });
      return data;
    } catch (error) {
      return rejectWithValue({ message: error.message || "Failed.", responseCode: "0" });
    }
  }
);

export const resetPassword = createAsyncThunk(
  "customer/resetPassword",
  async ({ contactNumber, token, newPassword }, { rejectWithValue }) => {
    try {
      const res = await callBackend({
        endpoint: "/Users/ResetPassword",
        method: "POST",
        data: { contactNumber, token, newPassword },
        headers: { "Content-Type": "application/json" },
      });
      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      if (res.status < 200 || res.status >= 300 || data?.ResponseCode !== "1")
        return rejectWithValue({ message: data?.ResponseMessage || "Failed.", responseCode: String(res.status) });
      return data;
    } catch (error) {
      return rejectWithValue({ message: error.message || "Failed.", responseCode: "0" });
    }
  }
);

/* ✅ New: Validate session on app load */
export const validateSession = createAsyncThunk(
  "customer/validateSession",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState().customer;
    if (!state.isAuthenticated || !state.currentCustomer) {
      return rejectWithValue({ message: "Not authenticated.", responseCode: "401" });
    }
    const contactNumber = state.currentCustomer.contactNumber;
    const accessToken = state.currentCustomer.accessToken;

    try {
      const res = await requestWithAutoRefresh({
        endpoint: "/Users/GetCustomerById",
        method: "GET",
        extraParams: { contactNumber },
        providedToken: accessToken,
        dispatch,
      });
      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      if (res.status < 200 || res.status >= 300) {
        return rejectWithValue({ message: "Session invalid.", responseCode: "401" });
      }
      const customer = Array.isArray(data) ? data[0] : data;
      return customer;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Session invalid.",
        responseCode: error.message === "SESSION_EXPIRED" ? "401" : "0",
      });
    }
  }
);

/* ─────────────────────────────────────────────
   Slice & Reducers
───────────────────────────────────────────── */
const hydrated = loadFromStorage();
const isAuthed = hasValidAuth(hydrated);

// If stored data exists but is NOT valid auth, clear it immediately
if (hydrated && !isAuthed) {
  clearStorage();
}

const initialState = {
  currentCustomer: isAuthed ? hydrated : null,
  currentCustomerDetails: isAuthed ? hydrated : null,
  customerList: [],
  loading: false,
  error: null,
  isAuthenticated: isAuthed,
};

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    logoutCustomer: (state) => {
      state.currentCustomer = null;
      state.currentCustomerDetails = null;
      state.customerList = [];
      state.loading = false;
      state.error = null;
      state.isAuthenticated = false;
      clearStorage();
    },

    setCurrentCustomer: (state, action) => {
      const customer = action.payload;
      const authed = hasValidAuth(customer);

      if (authed) {
        state.currentCustomer = customer;
        state.currentCustomerDetails = customer;
        state.isAuthenticated = true;
        saveToStorage(customer);
      } else {
        state.currentCustomer = null;
        state.currentCustomerDetails = null;
        state.isAuthenticated = false;
        clearStorage();
      }
    },

    clearError: (state) => {
      state.error = null;
    },

    updateToken: (state, action) => {
      // ✅ Only update when user is still logged in
      if (
        state.currentCustomer &&
        state.isAuthenticated &&
        action.payload?.accessToken &&
        action.payload?.refreshToken
      ) {
        const updatedCustomer = {
          ...state.currentCustomer,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
          lastTokenRefresh: Date.now(),
        };
        state.currentCustomer = updatedCustomer;
        state.currentCustomerDetails = updatedCustomer;
        state.isAuthenticated = true;
        saveToStorage(updatedCustomer);
      }
    },

    syncWithStorage: (state) => {
      const stored = loadFromStorage();
      const authed = hasValidAuth(stored);

      if (authed) {
        state.currentCustomer = stored;
        state.currentCustomerDetails = stored;
        state.isAuthenticated = true;
      } else {
        state.currentCustomer = null;
        state.currentCustomerDetails = null;
        state.isAuthenticated = false;
        clearStorage();
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // createCustomer
      .addCase(createCustomer.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createCustomer.fulfilled, (state) => { state.loading = false; state.error = null; })
      .addCase(createCustomer.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || "Registration failed."; })

      // loginCustomer
      .addCase(loginCustomer.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (action.payload?.requiresPasswordChange) {
          state.currentCustomer = null;
          state.currentCustomerDetails = null;
          state.isAuthenticated = false;
          return;
        }
        if (hasValidAuth(action.payload)) {
          state.currentCustomer = action.payload;
          state.currentCustomerDetails = action.payload;
          state.isAuthenticated = true;
        } else {
          state.currentCustomer = null;
          state.currentCustomerDetails = null;
          state.isAuthenticated = false;
          clearStorage();
        }
      })
      .addCase(loginCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed.";
        state.currentCustomer = null;
        state.currentCustomerDetails = null;
        state.isAuthenticated = false;
        clearStorage();
      })

      // fetchCustomers
      .addCase(fetchCustomers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCustomers.fulfilled, (state, action) => { state.loading = false; state.customerList = Array.isArray(action.payload) ? action.payload : []; })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed.";
        if (action.payload?.responseCode === "401") {
          state.currentCustomer = null; state.currentCustomerDetails = null;
          state.isAuthenticated = false; clearStorage();
        }
      })

      // getCustomerById
      .addCase(getCustomerById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        if (validateCustomerData(action.payload)) {
          state.currentCustomerDetails = action.payload;
        }
      })
      .addCase(getCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed.";
        if (action.payload?.responseCode === "401") {
          state.currentCustomer = null; state.currentCustomerDetails = null;
          state.isAuthenticated = false; clearStorage();
        }
      })

      // updateCustomerPassword
      .addCase(updateCustomerPassword.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateCustomerPassword.fulfilled, (state) => {
        state.loading = false;
        if (state.currentCustomer) {
          const updated = { ...state.currentCustomer, lastPasswordChange: Date.now() };
          state.currentCustomer = updated;
          state.currentCustomerDetails = updated;
          saveToStorage(updated);
        }
      })
      .addCase(updateCustomerPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed.";
        if (action.payload?.responseCode === "401") {
          state.currentCustomer = null; state.currentCustomerDetails = null;
          state.isAuthenticated = false; clearStorage();
        }
      })

      // updateAccountStatus
      .addCase(updateAccountStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateAccountStatus.fulfilled, (state) => {
        state.loading = false;
        state.currentCustomer = null; state.currentCustomerDetails = null;
        state.customerList = []; state.isAuthenticated = false; clearStorage();
      })
      .addCase(updateAccountStatus.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || "Failed."; })

      // forgotPassword
      .addCase(forgotPassword.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(forgotPassword.fulfilled, (state) => { state.loading = false; })
      .addCase(forgotPassword.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || "Failed."; })

      // resetPassword
      .addCase(resetPassword.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(resetPassword.fulfilled, (state) => { state.loading = false; })
      .addCase(resetPassword.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || "Failed."; })

      // ✅ validateSession
      .addCase(validateSession.pending, (state) => { state.loading = true; })
      .addCase(validateSession.fulfilled, (state, action) => {
        state.loading = false;
        if (hasValidAuth({ ...state.currentCustomer, ...action.payload })) {
          const merged = { ...state.currentCustomer, ...action.payload };
          state.currentCustomer = merged;
          state.currentCustomerDetails = action.payload;
          state.isAuthenticated = true;
          saveToStorage(merged);
        }
      })
      .addCase(validateSession.rejected, (state, action) => {
        state.loading = false;
        if (action.payload?.responseCode === "401" || action.payload?.responseCode === "0") {
          state.currentCustomer = null;
          state.currentCustomerDetails = null;
          state.isAuthenticated = false;
          clearStorage();
        }
      });
  },
});

export const {
  logoutCustomer,
  setCurrentCustomer,
  clearError,
  updateToken,
  syncWithStorage,
} = customerSlice.actions;

export { silentTokenRefresh, loadFromStorage, saveToStorage, clearStorage, validateCustomerData, hasValidAuth };
export default customerSlice.reducer;