// src/Redux/Slice/customerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════
const CUSTOMER_KEY = "customer";
const CUSTOMER_TOKEN_MIGRATION_FLAG = "customer_token_migrated";

// ═══════════════════════════════════════════════════════════════════
// LOCALSTORAGE HELPERS (Encrypted via monkey-patch)
// ═══════════════════════════════════════════════════════════════════
const loadFromStorage = () => {
  try {
    const parsed = localStorage.getItem(CUSTOMER_KEY);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    console.error("Failed to load customer from storage:", error);
    return null;
  }
};

const saveToStorage = (customer) => {
  try {
    if (!customer) {
      localStorage.removeItem(CUSTOMER_KEY);
      localStorage.removeItem(CUSTOMER_TOKEN_MIGRATION_FLAG);
    } else {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    }
  } catch (error) {
    console.error("Failed to save customer to storage:", error);
  }
};

// ═══════════════════════════════════════════════════════════════════
// SAFE JSON PARSER
// ═══════════════════════════════════════════════════════════════════
const safeParseJSON = (raw) => {
  if (typeof raw === "object" && raw !== null) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════
// AXIOS HELPERS
// ═══════════════════════════════════════════════════════════════════
const callBackend = async ({
  endpoint,
  method = "GET",
  data,
  extraParams = {},
  headers = {},
}) => {
  const config = {
    method,
    url: "/",
    params: { endpoint, ...extraParams },
    headers,
  };

  if (data !== undefined) {
    config.data = data;
  }

  return await axiosInstance(config);
};

const buildAuthHeaders = (providedToken = null) => {
  const stored = loadFromStorage();
  const accessToken = providedToken || stored?.accessToken;
  const headers = { "Content-Type": "application/json" };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
};

// ═══════════════════════════════════════════════════════════════════
// TOKEN REFRESH FOR CUSTOMERS
// ═══════════════════════════════════════════════════════════════════
const refreshCustomerToken = async (refreshToken) => {
  try {
    const res = await callBackend({
      endpoint: "/Users/CustomerRefreshToken",
      method: "POST",
      data: { refreshToken },
      headers: { "Content-Type": "application/json" },
    });

    const data = safeParseJSON(res.data);

    if (res.status < 200 || res.status >= 300) {
      throw new Error(data?.response?.responseMessage || "Token refresh failed");
    }

    if (data?.response?.responseCode !== "1") {
      throw new Error(data?.response?.responseMessage || "Invalid refresh response");
    }

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (error) {
    console.error("Customer token refresh error:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════
// TOKEN GENERATION FOR LEGACY CUSTOMERS
// ═══════════════════════════════════════════════════════════════════
const generateCustomerToken = async (contactNumber) => {
  try {
    const res = await callBackend({
      endpoint: "/Users/GenerateCustomerToken",
      method: "POST",
      data: { contactNumber },
      headers: { "Content-Type": "application/json" },
    });

    const data = safeParseJSON(res.data);

    if (res.status >= 200 && res.status < 300 && data?.accessToken) {
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
    }

    return null;
  } catch (error) {
    console.warn("Failed to generate customer token:", error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════
// REQUEST WITH AUTO-REFRESH (Customers never logout)
// ═══════════════════════════════════════════════════════════════════
const requestWithAutoRefresh = async ({
  endpoint,
  method = "GET",
  data,
  extraParams = {},
  providedToken = null,
}) => {
  const stored = loadFromStorage();
  let headers = buildAuthHeaders(providedToken);

  // First attempt
  let res;
  try {
    res = await callBackend({ endpoint, method, data, extraParams, headers });
  } catch (err) {
    if (err.response?.status !== 401) {
      throw err;
    }
    res = err.response;
  }

  // If not 401, return response
  if (res.status !== 401) {
    return res;
  }

  // 401: Attempt silent refresh
  const refreshToken = stored?.refreshToken;
  if (!refreshToken) {
    console.warn("No refresh token available for customer");
    throw new Error("NO_REFRESH_TOKEN");
  }

  try {
    // Refresh the token
    const newTokens = await refreshCustomerToken(refreshToken);

    // Update storage
    const updatedCustomer = { ...stored, ...newTokens };
    saveToStorage(updatedCustomer);

    // Retry original request with new token
    headers = buildAuthHeaders(newTokens.accessToken);
    const retryRes = await callBackend({
      endpoint,
      method,
      data,
      extraParams,
      headers,
    });

    return retryRes;
  } catch (refreshError) {
    console.error("Token refresh failed for customer:", refreshError);
    // Even if refresh fails, DO NOT log out customers
    throw new Error("TOKEN_REFRESH_FAILED");
  }
};

// ═══════════════════════════════════════════════════════════════════
// ASYNC THUNKS
// ═══════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────
// MIGRATE CUSTOMER TOKEN
// ──────────────────────────────────────────────────────────────────
export const migrateCustomerToken = createAsyncThunk(
  "customers/migrateToken",
  async (_, { rejectWithValue }) => {
    try {
      const stored = loadFromStorage();
      const migrated = localStorage.getItem(CUSTOMER_TOKEN_MIGRATION_FLAG);

      // Skip if already migrated or has token
      if (migrated || !stored || stored.accessToken) {
        return null;
      }

      const contactNumber = stored.contactNumber || stored.contact;
      if (!contactNumber) {
        return null;
      }

      console.log("🔄 Migrating customer token for:", contactNumber);

      const tokens = await generateCustomerToken(contactNumber);

      if (tokens) {
        const updated = { ...stored, ...tokens };
        saveToStorage(updated);
        localStorage.setItem(CUSTOMER_TOKEN_MIGRATION_FLAG, "true");
        console.log("✅ Customer token migrated successfully");
        return updated;
      }

      return null;
    } catch (error) {
      console.warn("Customer token migration failed:", error);
      return rejectWithValue({ message: error.message });
    }
  }
);

// ──────────────────────────────────────────────────────────────────
// CREATE CUSTOMER
// ──────────────────────────────────────────────────────────────────
export const createCustomer = createAsyncThunk(
  "customers/createCustomer",
  async (customerData, { rejectWithValue }) => {
    try {
      const res = await callBackend({
        endpoint: "/Users/Customer-Post",
        method: "POST",
        data: customerData,
        headers: { "Content-Type": "application/json" },
      });

      const data = safeParseJSON(res.data);

      if (res.status < 200 || res.status >= 300) {
        return rejectWithValue({
          message: data?.ResponseMessage || "Registration failed.",
          responseCode: data?.ResponseCode || String(res.status),
        });
      }

      return data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Registration failed.",
        responseCode: "0",
      });
    }
  }
);

// ──────────────────────────────────────────────────────────────────
// FETCH ALL CUSTOMERS
// ──────────────────────────────────────────────────────────────────
export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await requestWithAutoRefresh({
        endpoint: "/Users/Customer-Get",
        method: "GET",
      });

      const data = safeParseJSON(res.data);

      if (res.status < 200 || res.status >= 300) {
        return rejectWithValue({
          message: data?.ResponseMessage || "Failed to fetch customers.",
          responseCode: data?.ResponseCode || String(res.status),
        });
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to fetch customers.",
        responseCode: "0",
      });
    }
  }
);

// ──────────────────────────────────────────────────────────────────
// GET CUSTOMER BY ID
// ──────────────────────────────────────────────────────────────────
export const getCustomerById = createAsyncThunk(
  "customers/getCustomerById",
  async ({ contactNumber, accessToken = null }, { rejectWithValue }) => {
    try {
      const res = await requestWithAutoRefresh({
        endpoint: "/Users/GetCustomerById",
        method: "GET",
        extraParams: { contactNumber },
        providedToken: accessToken,
      });

      const data = safeParseJSON(res.data);

      if (res.status < 200 || res.status >= 300) {
        return rejectWithValue({
          message: data?.ResponseMessage || "Failed to fetch customer.",
          responseCode: data?.ResponseCode || String(res.status),
        });
      }

      const customer = Array.isArray(data) ? data[0] : data;

      if (!customer) {
        return rejectWithValue({
          message: "Customer not found.",
          responseCode: "404",
        });
      }

      return customer;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to fetch customer.",
        responseCode: "0",
      });
    }
  }
);

// ──────────────────────────────────────────────────────────────────
// LOGIN CUSTOMER
// ──────────────────────────────────────────────────────────────────
export const loginCustomer = createAsyncThunk(
  "customers/loginCustomer",
  async ({ contactNumber, password }, { dispatch, rejectWithValue }) => {
    try {
      const res = await callBackend({
        endpoint: "/Users/CustomerLogin",
        method: "POST",
        data: { contactNumber, password, FullName: "N/A" },
        headers: { "Content-Type": "application/json" },
      });

      const data = safeParseJSON(res.data);

      if (res.status < 200 || res.status >= 300) {
        return rejectWithValue({
          message: data?.response?.responseMessage || "Login failed.",
          responseCode: data?.response?.responseCode || String(res.status),
          isAccountNotFound: false,
        });
      }

      const responseCode = data?.response?.responseCode;
      const responseMessage = data?.response?.responseMessage;
      const loginStatus = data?.status;

      if (!data || responseCode !== "1") {
        const msg = responseMessage || "Access Denied";
        const code = responseCode ?? "0";

        const isAccountNotFound =
          code === "0" ||
          msg.toLowerCase().includes("access denied") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("invalid");

        return rejectWithValue({
          message: msg,
          responseCode: code,
          isAccountNotFound,
        });
      }

      // Password change required
      if (loginStatus === false) {
        return {
          contactNumber,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          requiresPasswordChange: true,
          loginStatus: false,
        };
      }

      // Normal login flow
      const tempCustomer = {
        contactNumber,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      saveToStorage(tempCustomer);

      try {
        const profile = await dispatch(
          getCustomerById({
            contactNumber,
            accessToken: data.accessToken,
          })
        ).unwrap();

        const merged = {
          ...profile,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          contactNumber,
          loginStatus: true,
        };

        saveToStorage(merged);
        localStorage.setItem(CUSTOMER_TOKEN_MIGRATION_FLAG, "true");
        return merged;
      } catch (profileError) {
        console.warn("Failed to fetch customer profile:", profileError);
        const basicCustomer = {
          contactNumber,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          loginStatus: true,
          isAuthenticated: true,
        };

        saveToStorage(basicCustomer);
        localStorage.setItem(CUSTOMER_TOKEN_MIGRATION_FLAG, "true");
        return basicCustomer;
      }
    } catch (error) {
      if (error?.responseCode) return rejectWithValue(error);
      return rejectWithValue({
        message: error.message || "Login failed.",
        responseCode: "0",
        isAccountNotFound: false,
      });
    }
  }
);

// ──────────────────────────────────────────────────────────────────
// UPDATE CUSTOMER PASSWORD
// ──────────────────────────────────────────────────────────────────
export const updateCustomerPassword = createAsyncThunk(
  "customers/updateCustomerPassword",
  async ({ contactNumber, oldPassword, newPassword }, { rejectWithValue }) => {
    try {
      const res = await requestWithAutoRefresh({
        endpoint: "/Users/UpdateCustomerPassword",
        method: "POST",
        data: { contactNumber, oldPassword, newPassword },
      });

      const data = safeParseJSON(res.data);

      if (res.status < 200 || res.status >= 300 || data?.ResponseCode !== "1") {
        return rejectWithValue({
          message: data?.ResponseMessage || "Password update failed.",
          responseCode: data?.ResponseCode || String(res.status),
        });
      }

      return data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Password update failed.",
        responseCode: "0",
      });
    }
  }
);

// ──────────────────────────────────────────────────────────────────
// UPDATE ACCOUNT STATUS
// ──────────────────────────────────────────────────────────────────
export const updateAccountStatus = createAsyncThunk(
  "customers/updateAccountStatus",
  async (_, { getState, rejectWithValue }) => {
    try {
      const customer = getState().customer.currentCustomer;

      const res = await requestWithAutoRefresh({
        endpoint: "/Users/Customer-Status",
        method: "POST",
        data: {
          accountNumber: customer?.customerAccountNumber,
          accountStatus: "0",
        },
      });

      const data = safeParseJSON(res.data);

      if (res.status < 200 || res.status >= 300) {
        return rejectWithValue({
          message: data?.ResponseMessage || "Status update failed.",
          responseCode: data?.ResponseCode || String(res.status),
        });
      }

      saveToStorage(null);
      return data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Status update failed.",
        responseCode: "0",
      });
    }
  }
);

// ──────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ──────────────────────────────────────────────────────────────────
export const forgotPassword = createAsyncThunk(
  "customers/forgotPassword",
  async ({ contactNumber, email }, { rejectWithValue }) => {
    try {
      const res = await callBackend({
        endpoint: "/Users/ForgotPassword",
        method: "POST",
        data: { contactNumber, email },
        headers: { "Content-Type": "application/json" },
      });

      const data = safeParseJSON(res.data);

      if (res.status < 200 || res.status >= 300 || data?.ResponseCode !== "1") {
        return rejectWithValue({
          message: data?.ResponseMessage || "Password reset request failed.",
          responseCode: data?.ResponseCode || String(res.status),
        });
      }

      return data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Password reset request failed.",
        responseCode: "0",
      });
    }
  }
);

// ──────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ──────────────────────────────────────────────────────────────────
export const resetPassword = createAsyncThunk(
  "customers/resetPassword",
  async ({ contactNumber, token, newPassword }, { rejectWithValue }) => {
    try {
      const res = await callBackend({
        endpoint: "/Users/ResetPassword",
        method: "POST",
        data: { contactNumber, token, newPassword },
        headers: { "Content-Type": "application/json" },
      });

      const data = safeParseJSON(res.data);

      if (res.status < 200 || res.status >= 300 || data?.ResponseCode !== "1") {
        return rejectWithValue({
          message: data?.ResponseMessage || "Password reset failed.",
          responseCode: data?.ResponseCode || String(res.status),
        });
      }

      return data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Password reset failed.",
        responseCode: "0",
      });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════
const hydrated = loadFromStorage();

const initialState = {
  currentCustomer: hydrated,
  currentCustomerDetails: hydrated,
  customerList: [],
  loading: false,
  error: null,
  isAuthenticated: !!hydrated?.accessToken,
  tokenMigrated: !!localStorage.getItem(CUSTOMER_TOKEN_MIGRATION_FLAG),
};

// ═══════════════════════════════════════════════════════════════════
// SLICE
// ═══════════════════════════════════════════════════════════════════
const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    logoutCustomer: (state) => {
      state.currentCustomer = null;
      state.currentCustomerDetails = null;
      state.isAuthenticated = false;
      state.tokenMigrated = false;
      saveToStorage(null);
    },
    setCurrentCustomer: (state, action) => {
      state.currentCustomer = action.payload;
      state.currentCustomerDetails = action.payload;
      state.isAuthenticated = !!action.payload?.accessToken;
      saveToStorage(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    updateToken: (state, action) => {
      if (state.currentCustomer) {
        state.currentCustomer.accessToken = action.payload.accessToken;
        state.currentCustomer.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        saveToStorage(state.currentCustomer);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Migration
      .addCase(migrateCustomerToken.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentCustomer = action.payload;
          state.currentCustomerDetails = action.payload;
          state.isAuthenticated = true;
          state.tokenMigrated = true;
        }
      })

      // Create Customer
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.ResponseCode === "1") {
          const customer = { ...action.meta.arg, ...action.payload };
          state.currentCustomer = customer;
          state.currentCustomerDetails = customer;
          state.isAuthenticated = !!customer?.accessToken;
          saveToStorage(customer);
        }
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Registration failed.";
      })

      // Fetch Customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customerList = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // Get Customer By ID
      .addCase(getCustomerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCustomerDetails = action.payload;
      })
      .addCase(getCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // Login Customer
      .addCase(loginCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginCustomer.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload.requiresPasswordChange) {
          state.currentCustomer = action.payload;
          state.currentCustomerDetails = action.payload;
          state.isAuthenticated = true;
          state.tokenMigrated = true;
        }
      })
      .addCase(loginCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed.";
        state.isAuthenticated = false;
      })

      // Update Customer Password
      .addCase(updateCustomerPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomerPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateCustomerPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // Update Account Status
      .addCase(updateAccountStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAccountStatus.fulfilled, (state) => {
        state.loading = false;
        state.currentCustomer = null;
        state.currentCustomerDetails = null;
        state.isAuthenticated = false;
      })
      .addCase(updateAccountStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });
  },
});

export const {
  logoutCustomer,
  setCurrentCustomer,
  clearError,
  updateToken,
} = customerSlice.actions;

export default customerSlice.reducer;