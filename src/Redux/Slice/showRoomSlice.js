import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define the API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Async thunk for fetching all showrooms
export const fetchShowrooms = createAsyncThunk('showrooms/fetchShowrooms', async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/ShowRoom/Get-ShowRoom`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch showrooms';
  }
});

// Async thunk for fetching showrooms displayed on the home page
export const fetchHomePageShowrooms = createAsyncThunk('showrooms/fetchHomePageShowrooms', async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/ShowRoom/Get-HomePageShowRoom`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch home page showrooms';
  }
});

// Async thunk for adding a new showroom
export const addShowroom = createAsyncThunk('showrooms/addShowroom', async (showroomData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ShowRoom/Setup-Showroom`, showroomData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to add showroom';
  }
});

// Async thunk for updating a showroom
export const updateShowroom = createAsyncThunk(
  "showrooms/updateShowroom",
  async ({ Showroomid, ...showroomData }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/ShowRoom/Showroom-Put/${Showroomid}`, // Ensure correct ID is passed
        showroomData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Failed to update showroom";
    }
  }
);


// Create the showroom slice
const showroomSlice = createSlice({
  name: 'showrooms',
  initialState: {
    showrooms: [],
    homePageShowrooms: [], // Add state for home page showrooms
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
      })
      .addCase(fetchShowrooms.fulfilled, (state, action) => {
        state.loading = false;
        state.showrooms = action.payload;
      })
      .addCase(fetchShowrooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchHomePageShowrooms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHomePageShowrooms.fulfilled, (state, action) => {
        state.loading = false;
        state.homePageShowrooms = action.payload;
      })
      .addCase(fetchHomePageShowrooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addShowroom.pending, (state) => {
        state.loading = true;
      })
      .addCase(addShowroom.fulfilled, (state, action) => {
        state.loading = false;
        state.showrooms.push(action.payload);
      })
      .addCase(addShowroom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateShowroom.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateShowroom.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.showrooms.findIndex(showroom => showroom.showRoomID === action.payload.showRoomID);
        if (index !== -1) {
          state.showrooms[index] = action.payload;
        }
      })
      .addCase(updateShowroom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

// Export actions and reducer
export const { clearShowrooms } = showroomSlice.actions;
export default showroomSlice.reducer;
