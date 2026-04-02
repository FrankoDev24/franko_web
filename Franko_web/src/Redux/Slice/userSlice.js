// src/Redux/Slice/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance"; // ✅ Lambda axios instance

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const USER_KEY = "user";
const LOGIN_TIME_KEY = "loginTime";
const AUTO_LOGOUT_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours

// ─────────────────────────────────────────────
// Safe localStorage helpers that work with encrypted localStorage
// Note: The localStorage is already monkey-patched in App.jsx
// ─────────────────────────────────────────────

const safeGetFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    
    // The monkey-patched localStorage already returns parsed objects or null
    if (!data) return null;
    
    // If it's already an object (from monkey patch), return it
    if (typeof data === "object" && data !== null) {
      return data;
    }
    
    // If it's a string that looks like corrupted object notation
    if (typeof data === "string" && data === "[object Object]") {
      console.warn(`Invalid object string found for key "${key}". Cleaning up.`);
      localStorage.removeItem(key);
      return null;
    }
    
    // If it's a valid JSON string, try parsing it
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (parseError) {
        console.warn(`Failed to parse JSON for key "${key}":`, parseError);
        return null;
      }
    }
    
    return data;
  } catch (e) {
    console.warn(`Failed to get ${key} from localStorage:`, e);
    return null;
  }
};

const safeSetToStorage = (key, value) => {
  try {
    if (!value) {
      localStorage.removeItem(key);
    } else {
      // The monkey-patched localStorage will handle encryption and stringification
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.error(`Failed to persist ${key}:`, e);
  }
};

// ─────────────────────────────────────────────
// User-specific localStorage helpers
// ─────────────────────────────────────────────
const loadFromStorage = () => {
  try {
    const data = safeGetFromStorage(USER_KEY);
    
    if (!data) return null;
    
    // Validate the user object structure
    if (typeof data === "object" && data !== null) {
      // Basic validation to ensure it's a valid user object
      if (data.contactNumber || data.contact || data.userAccountNumber || data.accessToken) {
        return data;
      }
    }
    
    return null;
  } catch (e) {
    console.warn("Failed to load user from storage:", e);
    return null;
  }
};

const saveToStorage = (user) => {
  try {
    if (!user) {
      safeSetToStorage(USER_KEY, null);
      safeSetToStorage(LOGIN_TIME_KEY, null);
    } else {
      // Ensure we're saving a valid user object with timestamp
      const userToSave = {
        ...user,
        lastUpdated: Date.now(),
      };
      safeSetToStorage(USER_KEY, userToSave);
      safeSetToStorage(LOGIN_TIME_KEY, Date.now());
    }
  } catch (e) {
    console.error("Failed to persist user:", e);
  }
};

const clearStorage = () => {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LOGIN_TIME_KEY);
  } catch (e) {
    console.error("Failed to clear user storage:", e);
  }
};

const getLoginTime = () => {
  try {
    const loginTime = safeGetFromStorage(LOGIN_TIME_KEY);
    return loginTime ? Number(loginTime) : null;
  } catch {
    return null;
  }
};

const updateLastActivityTime = () => {
  const user = loadFromStorage();
  if (user) {
    safeSetToStorage(LOGIN_TIME_KEY, Date.now());
  }
};

// ─────────────────────────────────────────────
// Safe JSON parser
// ─────────────────────────────────────────────
const safeParseJSON = (raw) => {
  if (typeof raw === "object" && raw !== null) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────
// User validation helper
// ─────────────────────────────────────────────
const validateUserData = (userData) => {
  if (!userData || typeof userData !== 'object') {
    return false;
  }
  
  // Check for required fields (either contactNumber or contact)
  const hasContact = (userData.contactNumber && typeof userData.contactNumber === 'string' && userData.contactNumber.trim() !== '') ||
                    (userData.contact && typeof userData.contact === 'string' && userData.contact.trim() !== '');
  
  return hasContact;
};

// ─────────────────────────────────────────────
// AXIOS HELPERS (via Lambda)
// ─────────────────────────────────────────────

/**
 * Base call through Lambda:
 * - endpoint: backend path (e.g. "/Users/User-Post")
 * - method: GET/POST/PUT/…
 * - data: request body
 * - extraParams: query params in addition to endpoint
 * - headers: additional headers
 */
const callBackend = async ({
  endpoint,
  method = "GET",
  data,
  extraParams = {},
  headers = {},
}) => {
  const config = {
    method,
    url: "/", // Lambda root
    params: {
      endpoint,
      ...extraParams,
    },
    headers,
  };

  if (data !== undefined) {
    config.data = data;
  }

  const res = await axiosInstance(config);
  return res;
};

/**
 * Attach Authorization from provided or stored token.
 */
const buildAuthHeaders = (providedToken = null) => {
  const stored = loadFromStorage();
  const accessToken = providedToken || stored?.accessToken;
  const headers = { "Content-Type": "application/json" };
  if (accessToken && typeof accessToken === 'string' && accessToken.trim() !== '') {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
};

// ─────────────────────────────────────────────
// Token refresh (via Lambda -> /Users/UserRefreshToken)
// ─────────────────────────────────────────────
const refreshUserToken = async (refreshToken) => {
  const headers = { "Content-Type": "application/json" };

  const res = await callBackend({
    endpoint: "/Users/UserRefreshToken",
    method: "POST",
    data: { refreshToken },
    headers,
  });

  const data = safeParseJSON(res.data);

  if (!res.status || res.status < 200 || res.status >= 300) {
    throw new Error(data?.response?.responseMessage || "Token refresh failed");
  }

  const code = data?.response?.responseCode;
  if (code !== "1") {
    throw new Error(data?.response?.responseMessage || "Token refresh failed");
  }

  return data;
};

// ─────────────────────────────────────────────
// Silent token refresh - ENHANCED
// ─────────────────────────────────────────────
let refreshPromise = null; // Prevent multiple simultaneous refresh attempts

const silentUserTokenRefresh = async (dispatch) => {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  try {
    const stored = loadFromStorage();
    const refreshToken = stored?.refreshToken;
    
    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
      console.warn('No valid refresh token found for user');
      dispatch(logoutUser());
      return null;
    }

    refreshPromise = refreshUserToken(refreshToken);
    const refreshed = await refreshPromise;

    const newTokens = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
    };

    // Update stored user with new tokens
    const updatedUser = { 
      ...stored, 
      ...newTokens,
      lastTokenRefresh: Date.now()
    };
    saveToStorage(updatedUser);
    
    // Update Redux state silently
    dispatch(updateToken(newTokens));
    
    refreshPromise = null;
    return newTokens.accessToken;
  } catch (error) {
    refreshPromise = null;
    console.error('Silent user token refresh failed:', error);
    dispatch(logoutUser());
    return null;
  }
};

// ─────────────────────────────────────────────
// Request with auto-refresh & auto-logout - ENHANCED
// ─────────────────────────────────────────────
const requestWithAutoRefresh = async ({
  endpoint,
  method = "GET",
  data,
  extraParams = {},
  providedToken = null,
  dispatch = null,
}) => {
  const stored = loadFromStorage();

  let headers = buildAuthHeaders(providedToken);

  let res;
  try {
    res = await callBackend({
      endpoint,
      method,
      data,
      extraParams,
      headers,
    });
  } catch (err) {
    if (err.response?.status !== 401) {
      throw err;
    }
    res = err.response;
  }

  if (res.status !== 401) {
    return res;
  }

  // 401: try silent refresh if dispatch is available
  if (dispatch) {
    const newAccessToken = await silentUserTokenRefresh(dispatch);
    if (newAccessToken) {
      // Retry original request with new access token
      headers = buildAuthHeaders(newAccessToken);

      const retryRes = await callBackend({
        endpoint,
        method,
        data,
        extraParams,
        headers,
      });

      return retryRes;
    }
  }

  // Fallback to old refresh logic
  const refreshToken = stored?.refreshToken;
  if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
    clearStorage();
    throw new Error("SESSION_EXPIRED");
  }

  try {
    const refreshed = await refreshUserToken(refreshToken);

    const newTokens = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
    };

    const updatedUser = { 
      ...stored, 
      ...newTokens,
      lastTokenRefresh: Date.now()
    };
    saveToStorage(updatedUser);

    headers = buildAuthHeaders(newTokens.accessToken);

    const retryRes = await callBackend({
      endpoint,
      method,
      data,
      extraParams,
      headers,
    });

    return retryRes;
  } catch (error) {
    clearStorage();
    throw new Error("SESSION_EXPIRED");
  }
};

// ─────────────────────────────────────────────
// Auto-logout with encrypted storage support
// ─────────────────────────────────────────────
export const startAutoLogoutCheck = (dispatch) => {
  setInterval(() => {
    const loginTime = getLoginTime();
    if (loginTime && Date.now() - loginTime > AUTO_LOGOUT_INTERVAL) {
      console.log('Auto-logout triggered due to inactivity');
      dispatch(logoutUser());
    }
  }, 60_000); // every minute
};

// ─────────────────────────────────────────────
// Async Thunks (via Lambda) - ENHANCED
// ─────────────────────────────────────────────

// ── Create User ──────────────────────────────
export const createUser = createAsyncThunk(
  "users/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      // Validate input data
      if (!validateUserData(userData)) {
        return rejectWithValue({
          message: "Invalid user data provided.",
          responseCode: "0",
        });
      }

      const res = await callBackend({
        endpoint: "/Users/User-Post",
        method: "POST",
        data: userData,
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

// ── Fetch All Users (Admin Access) ───────────
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const res = await requestWithAutoRefresh({
        endpoint: "/Users/Access",
        method: "GET",
        dispatch,
      });

      const data = safeParseJSON(res.data);

      if (res.status < 200 || res.status >= 300) {
        return rejectWithValue({
          message: data?.ResponseMessage || "Failed to fetch users.",
          responseCode: data?.ResponseCode || String(res.status),
        });
      }

      // Ensure we return an array
      return Array.isArray(data) ? data : [data].filter(Boolean);
    } catch (error) {
      if (error.message === "SESSION_EXPIRED") {
        return rejectWithValue({
          message: "Session expired. Please login again.",
          responseCode: "401",
        });
      }
      return rejectWithValue({
        message: error.message || "Failed to fetch users.",
        responseCode: "0",
      });
    }
  }
);

// ── Get User By Contact Number ───────────────
export const getUserById = createAsyncThunk(
  "users/getUserById",
  async ({ contactNumber, accessToken = null }, { rejectWithValue, dispatch }) => {
    try {
      if (!contactNumber || typeof contactNumber !== 'string' || contactNumber.trim() === '') {
        return rejectWithValue({
          message: "Valid contact number is required.",
          responseCode: "0",
        });
      }

      const res = await requestWithAutoRefresh({
        endpoint: "/Users/GetUserById",
        method: "GET",
        extraParams: { contactNumber },
        providedToken: accessToken,
        dispatch,
      });

      const data = safeParseJSON(res.data);

      if (res.status < 200 || res.status >= 300) {
        return rejectWithValue({
          message: data?.ResponseMessage || "Failed to fetch user.",
          responseCode: data?.ResponseCode || String(res.status),
        });
      }

      const user = Array.isArray(data) ? data[0] : data;

      if (!user || !validateUserData(user)) {
        return rejectWithValue({
          message: "User not found or invalid user data.",
          responseCode: "0",
        });
      }

      return user;
    } catch (error) {
      if (error.message === "SESSION_EXPIRED") {
        return rejectWithValue({
          message: "Session expired. Please login again.",
          responseCode: "401",
        });
      }
      return rejectWithValue({
        message: error.message || "Failed to fetch user.",
        responseCode: "0",
      });
    }
  }
);

// ── Login User ────────────────────────────────
export const loginUser = createAsyncThunk(
  "users/LogIn",
  async ({ contact, password }, { dispatch, rejectWithValue }) => {
    try {
      if (!contact || !password || 
          typeof contact !== 'string' || typeof password !== 'string' ||
          contact.trim() === '' || password.trim() === '') {
        return rejectWithValue({
          message: "Contact number and password are required.",
          responseCode: "0",
          isAccountNotFound: false,
        });
      }

      const res = await callBackend({
        endpoint: "/Users/LogIn",
        method: "POST",
        data: { contactNumber: contact, password, FullName: "N/A" },
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

      // Require password change
      if (loginStatus === false) {
        const loginResult = {
          contactNumber: contact,
          contact: contact,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          requiresPasswordChange: true,
          loginStatus: false,
          loginTime: Date.now(),
        };
        return loginResult;
      }

      // Normal login - temporarily store tokens
      const tempUser = {
        contactNumber: contact,
        contact: contact,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        loginTime: Date.now(),
      };
      saveToStorage(tempUser);

      try {
        const profile = await dispatch(
          getUserById({
            contactNumber: contact,
            accessToken: data.accessToken,
          })
        ).unwrap();

        const merged = {
          ...profile,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          contactNumber: contact,
          contact: contact,
          loginStatus: true,
          isAuthenticated: true,
          loginTime: Date.now(),
        };

        saveToStorage(merged);
        return merged;
      } catch (profileError) {
        console.warn("Failed to fetch user profile, using basic data:", profileError);
        
        const basicUser = {
          contactNumber: contact,
          contact: contact,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          loginStatus: true,
          isAuthenticated: true,
          loginTime: Date.now(),
        };

        saveToStorage(basicUser);
        return basicUser;
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

// ── Update Password ───────────────────────────
export const updateUserPassword = createAsyncThunk(
  "users/updateUserPassword",
  async ({ contactNumber, oldPassword, newPassword }, { rejectWithValue, dispatch }) => {
    try {
      if (!contactNumber || !oldPassword || !newPassword ||
          typeof contactNumber !== 'string' || 
          typeof oldPassword !== 'string' || 
          typeof newPassword !== 'string' ||
          contactNumber.trim() === '' || 
          oldPassword.trim() === '' || 
          newPassword.trim() === '') {
        return rejectWithValue({
          message: "All password fields are required.",
          responseCode: "0",
        });
      }

      const res = await requestWithAutoRefresh({
        endpoint: "/Users/UpdateUserPassword",
        method: "POST",
        data: { contactNumber, oldPassword, newPassword },
        dispatch,
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
      if (error.message === "SESSION_EXPIRED") {
        return rejectWithValue({
          message: "Session expired. Please login again.",
          responseCode: "401",
        });
      }
      return rejectWithValue({
        message: error.message || "Password update failed.",
        responseCode: "0",
      });
    }
  }
);

// ── Update Account Status ─────────────────────
export const updateAccountStatus = createAsyncThunk(
  "users/updateAccountStatus",
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const user = getState().user.currentUser;

      if (!user?.userAccountNumber) {
        return rejectWithValue({
          message: "No user account found.",
          responseCode: "0",
        });
      }

      const res = await requestWithAutoRefresh({
        endpoint: "/Users/User-Status",
        method: "POST",
        data: {
          accountNumber: user.userAccountNumber,
          accountStatus: "0",
        },
        dispatch,
      });

      const data = safeParseJSON(res.data);

      if (res.status < 200 || res.status >= 300) {
        return rejectWithValue({
          message: data?.ResponseMessage || "Status update failed.",
          responseCode: data?.ResponseCode || String(res.status),
        });
      }

      clearStorage();
      return data;
    } catch (error) {
      if (error.message === "SESSION_EXPIRED") {
        return rejectWithValue({
          message: "Session expired. Please login again.",
          responseCode: "401",
        });
      }
      return rejectWithValue({
        message: error.message || "Status update failed.",
        responseCode: "0",
      });
    }
  }
);

// ── Forgot Password ───────────────────────────
export const forgotPassword = createAsyncThunk(
  "users/forgotPassword",
  async ({ contactNumber, email }, { rejectWithValue }) => {
    try {
      if (!contactNumber || !email ||
          typeof contactNumber !== 'string' || typeof email !== 'string' ||
          contactNumber.trim() === '' || email.trim() === '') {
        return rejectWithValue({
          message: "Contact number and email are required.",
          responseCode: "0",
        });
      }

      const res = await callBackend({
        endpoint: "/Users/UserForgotPassword",
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

// ── Reset Password ────────────────────────────
export const resetPassword = createAsyncThunk(
  "users/resetPassword",
  async ({ contactNumber, token, newPassword }, { rejectWithValue }) => {
    try {
      if (!contactNumber || !token || !newPassword ||
          typeof contactNumber !== 'string' || 
          typeof token !== 'string' || 
          typeof newPassword !== 'string' ||
          contactNumber.trim() === '' || 
          token.trim() === '' || 
          newPassword.trim() === '') {
        return rejectWithValue({
          message: "All reset password fields are required.",
          responseCode: "0",
        });
      }

      const res = await callBackend({
        endpoint: "/Users/UserResetPassword",
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

// ─────────────────────────────────────────────
// Initial State - Enhanced with proper validation
// ─────────────────────────────────────────────
const hydrated = loadFromStorage();

const initialState = {
  currentUser: hydrated,
  currentUserDetails: hydrated,
  users: [],
  loading: false,
  error: null,
  isAuthenticated: !!(hydrated?.accessToken && 
                      typeof hydrated.accessToken === 'string' && 
                      hydrated.accessToken.trim() !== ''),
};

// ─────────────────────────────────────────────
// Slice - Enhanced
// ─────────────────────────────────────────────
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.currentUser = null;
      state.currentUserDetails = null;
      state.isAuthenticated = false;
      state.error = null;
      clearStorage();
    },
    setUser: (state, action) => {
      const user = action.payload;
      if (user && validateUserData(user)) {
        state.currentUser = user;
        state.currentUserDetails = user;
        state.isAuthenticated = !!(user.accessToken && 
                                  typeof user.accessToken === 'string' && 
                                  user.accessToken.trim() !== '');
        saveToStorage(user);
      } else {
        state.currentUser = null;
        state.currentUserDetails = null;
        state.isAuthenticated = false;
        clearStorage();
      }
    },
    clearUsers: (state) => {
      state.users = [];
    },
    clearSelectedUser: (state) => {
      state.currentUserDetails = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateToken: (state, action) => {
      if (state.currentUser && action.payload?.accessToken && action.payload?.refreshToken) {
        const updatedUser = {
          ...state.currentUser,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
          lastTokenRefresh: Date.now(),
        };
        
        state.currentUser = updatedUser;
        state.currentUserDetails = updatedUser;
        state.isAuthenticated = true;
        saveToStorage(updatedUser);
      }
    },
    syncWithStorage: (state) => {
      // Utility action to sync Redux state with localStorage
      const stored = loadFromStorage();
      if (stored && validateUserData(stored)) {
        state.currentUser = stored;
        state.currentUserDetails = stored;
        state.isAuthenticated = !!(stored.accessToken && 
                                  typeof stored.accessToken === 'string' && 
                                  stored.accessToken.trim() !== '');
      } else {
        state.currentUser = null;
        state.currentUserDetails = null;
        state.isAuthenticated = false;
      }
    },
    updateActivity: (state) => {
      // Update last activity time
      updateLastActivityTime();
    },
  },
  extraReducers: (builder) => {
    builder
      // ── createUser ──
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.ResponseCode === "1") {
          const user = { ...action.meta.arg, ...action.payload, createdAt: Date.now() };
          if (validateUserData(user)) {
            state.currentUser = user;
            state.currentUserDetails = user;
            state.isAuthenticated = !!(user?.accessToken && 
                                      typeof user.accessToken === 'string' && 
                                      user.accessToken.trim() !== '');
            saveToStorage(user);
          }
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Registration failed.";
      })

      // ── fetchUsers ──
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch users.";
        if (action.payload?.responseCode === "401") {
          state.currentUser = null;
          state.currentUserDetails = null;
          state.isAuthenticated = false;
          clearStorage();
        }
      })

      // ── getUserById ──
      .addCase(getUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.loading = false;
        if (validateUserData(action.payload)) {
          state.currentUserDetails = action.payload;
        }
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch user details.";
        if (action.payload?.responseCode === "401") {
          state.currentUser = null;
          state.currentUserDetails = null;
          state.isAuthenticated = false;
          clearStorage();
        }
      })

      // ── loginUser ──
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload.requiresPasswordChange && validateUserData(action.payload)) {
          state.currentUser = action.payload;
          state.currentUserDetails = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed.";
        state.isAuthenticated = false;
        clearStorage();
      })

      // ── updateUserPassword ──
      .addCase(updateUserPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserPassword.fulfilled, (state) => {
        state.loading = false;
        // Update last password change timestamp
        if (state.currentUser) {
          const updatedUser = {
            ...state.currentUser,
            lastPasswordChange: Date.now(),
          };
          state.currentUser = updatedUser;
          saveToStorage(updatedUser);
        }
      })
      .addCase(updateUserPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Password update failed.";
        if (action.payload?.responseCode === "401") {
          state.currentUser = null;
          state.currentUserDetails = null;
          state.isAuthenticated = false;
          clearStorage();
        }
      })

      // ── updateAccountStatus ──
      .addCase(updateAccountStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAccountStatus.fulfilled, (state) => {
        state.loading = false;
        state.currentUser = null;
        state.currentUserDetails = null;
        state.isAuthenticated = false;
      })
      .addCase(updateAccountStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Status update failed.";
      })

      // ── forgotPassword ──
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Password reset request failed.";
      })

      // ── resetPassword ──
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Password reset failed.";
      });
  },
});

// Activity tracking with encrypted localStorage
document.addEventListener("mousemove", updateLastActivityTime);
document.addEventListener("keydown", updateLastActivityTime);

export const {
  logoutUser,
  setUser,
  clearUsers,
  clearSelectedUser,
  clearError,
  updateToken,
  syncWithStorage,
  updateActivity,
} = userSlice.actions;

// Export utility functions (removed duplicate startAutoLogoutCheck)
export { 
  silentUserTokenRefresh, 
  loadFromStorage, 
  saveToStorage, 
  clearStorage,
  validateUserData,
  getLoginTime,
  updateLastActivityTime 
};

export default userSlice.reducer;