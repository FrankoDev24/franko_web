// src/Redux/Slice/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from './AxiosInstance';

const AUTO_LOGOUT_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours

// ----------------------
// Helper: Last activity
// ----------------------
const updateLastActivityTime = () => {
  localStorage.setItem('loginTime', Date.now());
};

// Auto-logout checker
export const startAutoLogoutCheck = (dispatch) => {
  setInterval(() => {
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime && Date.now() - loginTime > AUTO_LOGOUT_INTERVAL) {
      dispatch(logoutUser());
    }
  }, 60000); // check every minute
};

// ----------------------
// Async Thunks
// ----------------------

// Create a new user
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/Users/User-Post', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'An unknown error occurred.');
    }
  }
);

// Fetch all users
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/Users/Users-Get');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'An error occurred.');
    }
  }
);

// User login
export const loginUser = createAsyncThunk(
  'users/loginUser',
  async ({ contact, password }, { dispatch, rejectWithValue }) => {
    try {
      const users = await dispatch(fetchUsers()).unwrap();
      const normalizedUsers = users.map((user) => ({
        ...user,
        contact: user.contact || user.contactNumber,
      }));

      const matchingUser = normalizedUsers.find(
        (user) => user.contact === contact && user.password === password
      );

      if (!matchingUser) return rejectWithValue('Invalid contact number or password.');

      // Save user to localStorage safely
      localStorage.setItem('user', JSON.stringify(matchingUser));
      localStorage.setItem('loginTime', Date.now());

      return matchingUser;
    } catch (error) {
      return rejectWithValue(error.message || 'An unknown error occurred.');
    }
  }
);

// ----------------------
// Initial State
// ----------------------
const safeParse = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const initialState = {
  currentUser: safeParse('user'),
  currentUserDetails: safeParse('user'),
  userList: [],
  loading: false,
  error: null,
};

// ----------------------
// Slice
// ----------------------
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
      state.userList = [];
    },
    setUser: (state, action) => {
      state.currentUser = action.payload;
      state.currentUserDetails = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
      updateLastActivityTime();
    },
    clearSelectedUser: (state) => {
      state.currentUserDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE USER
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.ResponseCode === '1') {
          const newUser = { ...action.meta.arg, ...action.payload };
          state.currentUser = newUser;
          state.currentUserDetails = newUser;
          localStorage.setItem('user', JSON.stringify(newUser));
        } else {
          state.error = action.payload?.ResponseMessage || 'Failed to create user.';
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || 'An unknown error occurred.';
      })

      // FETCH USERS
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.userList = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.currentUserDetails = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed.';
      });
  },
});

// ----------------------
// Exports
// ----------------------
export const { logoutUser, clearUsers, setUser, clearSelectedUser } = userSlice.actions;

// Monitor user activity
document.addEventListener('mousemove', updateLastActivityTime);
document.addEventListener('keydown', updateLastActivityTime);

export default userSlice.reducer;
