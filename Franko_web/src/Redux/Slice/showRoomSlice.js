import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from './AxiosInstance'; // Use your centralized axios instance

// Async thunk for fetching all showrooms
export const fetchShowrooms = createAsyncThunk(
  'showrooms/fetchShowrooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/ShowRoom/Get-ShowRoom');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch showrooms');
    }
  }
);

// Async thunk for fetching showrooms displayed on the home page
export const fetchHomePageShowrooms = createAsyncThunk(
  'showrooms/fetchHomePageShowrooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/ShowRoom/Get-HomePageShowRoom');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch home page showrooms');
    }
  }
);

// Async thunk for adding a new showroom
export const addShowroom = createAsyncThunk(
  'showrooms/addShowroom',
  async (showroomData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/ShowRoom/Setup-Showroom', showroomData, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add showroom');
    }
  }
);

// Async thunk for updating a showroom
export const updateShowroom = createAsyncThunk(
  'showrooms/updateShowroom',
  async ({ Showroomid, ...showroomData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/ShowRoom/Showroom-Put/${Showroomid}`,
        showroomData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update showroom');
    }
  }
);

// Showroom slice
const showroomSlice = createSlice({
  name: 'showrooms',
  initialState: {
    showrooms: [],
    homePageShowrooms: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearShowrooms: (state) => {
      state.showrooms = [];
      state.homePageShowrooms = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShowrooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShowrooms.fulfilled, (state, action) => {
        state.loading = false;
        state.showrooms = action.payload;
      })
      .addCase(fetchShowrooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchHomePageShowrooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHomePageShowrooms.fulfilled, (state, action) => {
        state.loading = false;
        state.homePageShowrooms = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchHomePageShowrooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(addShowroom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addShowroom.fulfilled, (state, action) => {
        state.loading = false;
        state.showrooms.push(action.payload);
      })
      .addCase(addShowroom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateShowroom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateShowroom.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.showrooms.findIndex(
          (showroom) => showroom.showRoomID === action.payload.showRoomID
        );
        if (index !== -1) state.showrooms[index] = action.payload;
      })
      .addCase(updateShowroom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

// Export actions and reducer
export const { clearShowrooms } = showroomSlice.actions;
export default showroomSlice.reducer;
