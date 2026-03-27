// src/Redux/Slice/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════
const USER_KEY = "user";
const USER_TOKEN_MIGRATION_FLAG = "user_token_migrated";
const AUTO_LOGOUT_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours
const SESSION_WARNING_TIME = 3 * 60 * 1000; // 3 minutes

// ═══════════════════════════════════════════════════════════════════
// LOCALSTORAGE HELPERS (Encrypted via monkey-patch)
// ═══════════════════════════════════════════════════════════════════
const loadFromStorage = () => {
  try {
    const parsed = localStorage.getItem(USER_KEY);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    console.error("Failed to load user from storage:", error);
    return null;
  }
};

const saveToStorage = (user) => {
  try {
    if (!user) {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem("loginTime");
      localStorage.removeItem(USER_TOKEN_MIGRATION_FLAG);
    } else {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem("loginTime", String(Date.now()));
    }
  } catch (error) {
    console.error("Failed to save user to storage:", error);
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
// TOKEN REFRESH FOR USERS
// ═══════════════════════════════════════════════════════════════════
const refreshUserToken = async (refreshToken) => {
  try {
    const res = await callBackend({
      endpoint: "/Users/UserRefreshToken",
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
    console.error("User token refresh error:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════
// TOKEN GENERATION FOR LEGACY USERS
// ═══════════════════════════════════════════════════════════════════
const generateUserToken = async (contactNumber) => {
  try {
    const res = await callBackend({
      endpoint: "/Users/GenerateUserToken",
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
    console.warn("Failed to generate user token:", error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════
// REQUEST WITHOUT AUTO-REFRESH (Users get modal instead)
// ═══════════════════════════════════════════════════════════════════
const requestWithoutAutoRefresh = async ({
  endpoint,
  method = "GET",
  data,
  extraParams = {},
  providedToken = null,
}) => {
  const headers = buildAuthHeaders(providedToken);

  try {
    const res = await callBackend({ endpoint, method, data, extraParams, headers });
    return res;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error("SESSION_EXPIRING");
    }
    throw err;
  }
};

// ═══════════════════════════════════════════════════════════════════
// ACTIVITY TRACKING
// ═══════════════════════════════════════════════════════════════════
const updateLastActivityTime = () => {
  const user = loadFromStorage();
  if (user) {
    localStorage.setItem("loginTime", String(Date.now()));
  }
};

export const startAutoLogoutCheck = (dispatch) => {
  setInterval(() => {
    const loginTime = Number(localStorage.getItem("loginTime") || 0);
    if (loginTime && Date.now() - loginTime > AUTO_LOGOUT_INTERVAL) {
      dispatch(logoutUser());
    }
  }, 60_000); // Check every minute
};

// ═══════════════════════════════════════════════════════════════════
// ASYNC THUNKS
// ═══════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────
// MIGRATE USER TOKEN
// ──────────────────────────────────────────────────────────────────
export const migrateUserToken = createAsyncThunk(
  "users/migrateToken",
  async (_, { rejectWithValue }) => {
    try {
      const stored = loadFromStorage();
      const migrated = localStorage.getItem(USER_TOKEN_MIGRATION_FLAG);

      // Skip if already migrated or has token
      if (migrated || !stored || stored.accessToken) {
        return null;
      }

      const contactNumber = stored.contactNumber || stored.contact;
      if (!contactNumber) {
        return null;
      }

      console.log("🔄 Migrating user token for:", contactNumber);

      const tokens = await generateUserToken(contactNumber);

      if (tokens) {
        const updated = { ...stored, ...tokens };
        saveToStorage(updated);
        localStorage.setItem(USER_TOKEN_MIGRATION_FLAG, "true");
        console.log("✅ User token migrated successfully");
        return updated;
      }

      return null;
    } catch (error) {
      console.warn("User token migration failed:", error);
      return rejectWithValue({ message: error.message });
    }
  }
);

// ──────────────────────────────────────────────────────────────────
// CREATE USER
// ──────────────────────────────────────────────────────────────────
export const createUser = createAsyncThunk(
  "users/createUser",
  async (userData, { rejectWithValue }) => {
    try {
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

// ──────────────────────────────────────────────────────────────────
// FETCH ALL USERS
// ──────────────────────────────────────────────────────────────────
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const res = await requestWithoutAutoRefresh({
        endpoint: "/Users/Access",
        method: "GET",
      });

      const data = safeParseJSON(res.data);

      if (res.status < 200 || res.status >= 300) {
        return rejectWithValue({
          message: data?.ResponseMessage || "Failed to fetch users.",
          responseCode: data?.ResponseCode || String(res.status),
        });
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error.message === "SESSION_EXPIRING") {
        dispatch(setSessionExpiring());
        return rejectWithValue({
          message: "Session expiring. Please refresh.",
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

// ──────────────────────────────────────────────────────────────────
// GET USER BY ID
// ──────────────────────────────────────────────────────────────────
export const getUserById = createAsyncThunk(
  "users/getUserById",
  async ({ contactNumber, accessToken = null }, { rejectWithValue, dispatch }) => {
    try {
      const res = await requestWithoutAutoRefresh({
        endpoint: "/Users/GetUserById",
        method: "GET",
        extraParams: { contactNumber },
        providedToken: accessToken,
      });

      const data = safeParseJSON(res.data);

      if (res.status < 200 || res.status >= 300) {
        return rejectWithValue({
          message: data?.ResponseMessage || "Failed to fetch user.",
          responseCode: data?.ResponseCode || String(res.status),
        });
      }

      const user = Array.isArray(data) ? data[0] : data;

      if (!user) {
        return rejectWithValue({
          message: "User not found.",
          responseCode: "404",
        });
      }

      return user;
    } catch (error) {
      if (error.message === "SESSION_EXPIRING") {
        dispatch(setSessionExpiring());
        return rejectWithValue({
          message: "Session expiring. Please refresh.",
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

// ──────────────────────────────────────────────────────────────────
// LOGIN USER
// ──────────────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  "users/LogIn",
  async ({ contact, password }, { dispatch, rejectWithValue }) => {
    try {
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

      // Password change required
      if (loginStatus === false) {
        return {
          contactNumber: contact,
          contact: contact,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          requiresPasswordChange: true,
          loginStatus: false,
        };
      }

      // Normal login flow
      const tempUser = {
        contactNumber: contact,
        contact: contact,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
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
        };

        saveToStorage(merged);
        localStorage.setItem(USER_TOKEN_MIGRATION_FLAG, "true");
        return merged;
      } catch (profileError) {
        console.warn("Failed to fetch user profile:", profileError);
        const basicUser = {
          contactNumber: contact,
          contact: contact,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          loginStatus: true,
          isAuthenticated: true,
        };

        saveToStorage(basicUser);
        localStorage.setItem(USER_TOKEN_MIGRATION_FLAG, "true");
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

// ──────────────────────────────────────────────────────────────────
// UPDATE USER PASSWORD
// ──────────────────────────────────────────────────────────────────
export const updateUserPassword = createAsyncThunk(
  "users/updateUserPassword",
  async ({ contactNumber, oldPassword, newPassword }, { rejectWithValue, dispatch }) => {
    try {
      const res = await requestWithoutAutoRefresh({
        endpoint: "/Users/UpdateUserPassword",
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
      if (error.message === "SESSION_EXPIRING") {
        dispatch(setSessionExpiring());
        return rejectWithValue({
          message: "Session expiring. Please refresh.",
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

// ──────────────────────────────────────────────────────────────────
// UPDATE ACCOUNT STATUS
// ──────────────────────────────────────────────────────────────────
export const updateAccountStatus = createAsyncThunk(
  "users/updateAccountStatus",
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const user = getState().user.currentUser;

      const res = await requestWithoutAutoRefresh({
        endpoint: "/Users/User-Status",
        method: "POST",
        data: {
          accountNumber: user?.userAccountNumber,
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
      if (error.message === "SESSION_EXPIRING") {
        dispatch(setSessionExpiring());
        return rejectWithValue({
          message: "Session expiring. Please refresh.",
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

// ──────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ──────────────────────────────────────────────────────────────────
export const forgotPassword = createAsyncThunk(
  "users/forgotPassword",
  async ({ contactNumber, email }, { rejectWithValue }) => {
    try {
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

// ──────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ──────────────────────────────────────────────────────────────────
export const resetPassword = createAsyncThunk(
  "users/resetPassword",
  async ({ contactNumber, token, newPassword }, { rejectWithValue }) => {
    try {
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

// ──────────────────────────────────────────────────────────────────
// REFRESH USER SESSION (Manual - from modal)
// ──────────────────────────────────────────────────────────────────
export const refreshUserSession = createAsyncThunk(
  "users/refreshUserSession",
  async (_, { rejectWithValue }) => {
    try {
      const stored = loadFromStorage();
      const refreshToken = stored?.refreshToken;

      if (!refreshToken) {
        return rejectWithValue({
          message: "No refresh token available.",
          responseCode: "401",
        });
      }

      const newTokens = await refreshUserToken(refreshToken);
      saveToStorage({ ...stored, ...newTokens });

      return newTokens;
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Session refresh failed.",
        responseCode: "401",
      });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════
const hydrated = loadFromStorage();

const initialState = {
  currentUser: hydrated,
  currentUserDetails: hydrated,
  users: [],
  loading: false,
  error: null,
  isAuthenticated: !!hydrated?.accessToken,
  sessionExpiring: false,
  sessionExpiresAt: null,
  tokenMigrated: !!localStorage.getItem(USER_TOKEN_MIGRATION_FLAG),
};

// ═══════════════════════════════════════════════════════════════════
// SLICE
// ═══════════════════════════════════════════════════════════════════
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.currentUser = null;
      state.currentUserDetails = null;
      state.isAuthenticated = false;
      state.sessionExpiring = false;
      state.sessionExpiresAt = null;
      state.tokenMigrated = false;
      saveToStorage(null);
    },
    setUser: (state, action) => {
      state.currentUser = action.payload;
      state.currentUserDetails = action.payload;
      state.isAuthenticated = !!action.payload?.accessToken;
      saveToStorage(action.payload);
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
      if (state.currentUser) {
        state.currentUser.accessToken = action.payload.accessToken;
        state.currentUser.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        saveToStorage(state.currentUser);
      }
    },
    setSessionExpiring: (state) => {
      state.sessionExpiring = true;
      state.sessionExpiresAt = Date.now() + SESSION_WARNING_TIME;
    },
    clearSessionExpiring: (state) => {
      state.sessionExpiring = false;
      state.sessionExpiresAt = null;
    },
    forceSessionExpire: (state) => {
      state.currentUser = null;
      state.currentUserDetails = null;
      state.isAuthenticated = false;
      state.sessionExpiring = false;
      state.sessionExpiresAt = null;
      state.tokenMigrated = false;
      saveToStorage(null);
    },
  },
  extraReducers: (builder) => {
    builder
      // Migration
      .addCase(migrateUserToken.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentUser = action.payload;
          state.currentUserDetails = action.payload;
          state.isAuthenticated = true;
          state.tokenMigrated = true;
        }
      })

      // Create User
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.ResponseCode === "1") {
          const user = { ...action.meta.arg, ...action.payload };
          state.currentUser = user;
          state.currentUserDetails = user;
          state.isAuthenticated = !!user?.accessToken;
          saveToStorage(user);
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Registration failed.";
      })

      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // Get User By ID
      .addCase(getUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUserDetails = action.payload;
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // Login User
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload.requiresPasswordChange) {
          state.currentUser = action.payload;
          state.currentUserDetails = action.payload;
          state.isAuthenticated = true;
          state.tokenMigrated = true;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed.";
        state.isAuthenticated = false;
      })

      // Update User Password
      .addCase(updateUserPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateUserPassword.rejected, (state, action) => {
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
        state.currentUser = null;
        state.currentUserDetails = null;
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
      })

      // Refresh User Session
      .addCase(refreshUserSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshUserSession.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentUser) {
          state.currentUser.accessToken = action.payload.accessToken;
          state.currentUser.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
        }
        state.sessionExpiring = false;
        state.sessionExpiresAt = null;
      })
      .addCase(refreshUserSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.currentUser = null;
        state.currentUserDetails = null;
        state.isAuthenticated = false;
        state.sessionExpiring = false;
        state.sessionExpiresAt = null;
        state.tokenMigrated = false;
      });
  },
});

// Activity tracking
if (typeof document !== "undefined") {
  document.addEventListener("mousemove", updateLastActivityTime);
  document.addEventListener("keydown", updateLastActivityTime);
}

export const {
  logoutUser,
  setUser,
  clearUsers,
  clearSelectedUser,
  clearError,
  updateToken,
  setSessionExpiring,
  clearSessionExpiring,
  forceSessionExpire,
} = userSlice.actions;

export default userSlice.reducer;