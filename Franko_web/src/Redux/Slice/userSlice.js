import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTO_LOGOUT_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

// Helper to update the last activity time
const updateLastActivityTime = () => {
  localStorage.setItem('loginTime', Date.now());
};
// Periodically check for auto-logout
const checkAutoLogout = (dispatch) => {
  const loginTime = localStorage.getItem('loginTime');
  if (loginTime && Date.now() - loginTime > AUTO_LOGOUT_INTERVAL) {
    dispatch(logoutUser());}
};

export const startAutoLogoutCheck = (dispatch) => {
  setInterval(() => {
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime && Date.now() - loginTime > AUTO_LOGOUT_INTERVAL) {
      dispatch(logoutUser());
    }
  }, 60000); // Check every minute
};

// Async thunk for creating a new user
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/Users/User-Post`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'An unknown error occurred.');
    }
  }
);

// Async thunk for fetching all users
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Users/Users-Get`);
 
      return response.data;
    } catch (error) {
   
      return rejectWithValue(error.response?.data || "An error occurred.");
    }
  }
);

// Async thunk for login
export const loginUser = createAsyncThunk(
  'users/loginUser',
  async ({ contact, password }, { dispatch, rejectWithValue }) => {
    try {
      const fetchUsersResult = await dispatch(fetchUsers()).unwrap();

      const normalizedUsers = fetchUsersResult.map((user) => ({
        ...user,
        contact: user.contact || user.contactNumber,
      }));

      const matchingUser = normalizedUsers.find(
        (user) => user.contact === contact && user.password === password
      );

      if (matchingUser) {
        const loginTime = Date.now();
        localStorage.setItem('user', (matchingUser));
        localStorage.setItem('loginTime', loginTime);
        return matchingUser;
      } else {
        return rejectWithValue('Invalid contact number or password.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'An unknown error occurred.');
    }
  }
);

// Initial state
const initialState = {
  currentUser: (localStorage.getItem('user')) || null,
  currentUserDetails: null,
  userList: [],
  loading: false,
  error: null,
};

// Create the user slice
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
      localStorage.setItem('user', (action.payload));
      updateLastActivityTime();
    },
    clearSelectedUser: (state) => {
      state.currentUserDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.ResponseCode === '1') {
          const newUser = {
            ...action.meta.arg,
            ...action.payload,
          };
          state.currentUser = newUser;
          localStorage.setItem('user', (newUser));
        } else {
          state.error = 'Failed to create user.';
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'An unknown error occurred.';
      })
      
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
    
        state.loading = false;
        state.users = action.payload; // ✅ Ensure users array is updated
      })
      
      .addCase(fetchUsers.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
    .addCase(loginUser.fulfilled, (state, action) => {
  state.loading = false;
  state.currentUser = action.payload;
  state.currentUserDetails = action.payload;
  localStorage.setItem('user', (action.payload));
})

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed.';
      });
  },
});

// Start auto-logout monitoring after user logs in
export const { logoutUser, clearUsers, setUser, clearSelectedUser } = userSlice.actions;

// Monitor user activity
document.addEventListener('mousemove', updateLastActivityTime);
document.addEventListener('keydown', updateLastActivityTime);

// Export the reducer
export default userSlice.reducer;

// Initialize auto-logout check on app start
startAutoLogoutCheck((action) => userSlice.actions[action]);
