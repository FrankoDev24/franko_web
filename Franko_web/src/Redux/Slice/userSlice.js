// src/Redux/Slice/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from './AxiosInstance';

const AUTO_LOGOUT_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours

// -------------------------
// Helpers
// -------------------------
const updateLastActivityTime = () => {
  localStorage.setItem('loginTime', String(Date.now()));
};

// Call this once during app startup: startAutoLogoutCheck(store.dispatch)
export const startAutoLogoutCheck = (dispatch) => {
  setInterval(() => {
    const loginTime = Number(localStorage.getItem('loginTime') || 0);
    if (loginTime && Date.now() - loginTime > AUTO_LOGOUT_INTERVAL) {
      dispatch(logoutUser());
    }
  }, 60_000); // every minute
};

// -------------------------
// Thunks
// -------------------------

// Create user
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/', // Lambda root
        userData,
        {
          params: {
            endpoint: '/Users/User-Post',
          },
        }
      );
      return res.data;
    } catch (error) {
      const payload =
        error.response?.data?.message ??
        error.response?.data ??
        error.message ??
        'An unknown error occurred.';
      return rejectWithValue(payload);
    }
  }
);

// Fetch all users
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/', {
        params: {
          endpoint: '/Users/Users-Get',
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'An error occurred.');
    }
  }
);

// Login user
export const loginUser = createAsyncThunk(
  'users/loginUser',
  async ({ contact, password }, { dispatch, rejectWithValue }) => {
    try {
      const users = await dispatch(fetchUsers()).unwrap();

      const normalizedUsers = (Array.isArray(users) ? users : []).map((u) => ({
        ...u,
        contact: u.contact ?? u.contactNumber,
      }));

      const matchingUser = normalizedUsers.find(
        (u) => u.contact === contact && u.password === password
      );

      if (!matchingUser) {
        return rejectWithValue('Invalid contact number or password.');
      }

      const loginTime = Date.now();
      localStorage.setItem('user', JSON.stringify(matchingUser));
      localStorage.setItem('loginTime', String(loginTime));
      return matchingUser;
    } catch (error) {
      const payload =
        typeof error === 'string'
          ? error
          : error?.message ?? 'An unknown error occurred.';
      return rejectWithValue(payload);
    }
  }
);

// -------------------------
// Initial state
// -------------------------
const initialState = {
  currentUser: (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })(),
  currentUserDetails: null,
  users: [], // unified key (was userList)
  loading: false,
  error: null,
};

// -------------------------
// Slice
// -------------------------
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.currentUser = null;
      state.currentUserDetails = null;
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
    },
    clearUsers: (state) => {
      state.users = [];
    },
    setUser: (state, action) => {
      state.currentUser = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
      updateLastActivityTime();
    },
    clearSelectedUser: (state) => {
      state.currentUserDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // createUser
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;

        // If your API uses ResponseCode, check it; otherwise just store user
        if (action.payload?.ResponseCode === '1' || action.payload) {
          const newUser = { ...action.meta.arg, ...action.payload };
          state.currentUser = newUser;
          localStorage.setItem('user', JSON.stringify(newUser));
        } else {
          state.error = 'Failed to create user.';
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ||
          action.error?.message ||
          'An unknown error occurred.';
      })

      // fetchUsers
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
        // when using rejectWithValue, prefer action.payload
        state.error =
          action.payload || action.error?.message || 'An error occurred.';
      })

      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.currentUserDetails = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed.';
      });
  },
});

export const { logoutUser, clearUsers, setUser, clearSelectedUser } =
  userSlice.actions;

// -------------------------
// Activity tracking
// -------------------------
document.addEventListener('mousemove', updateLastActivityTime);
document.addEventListener('keydown', updateLastActivityTime);

export default userSlice.reducer;