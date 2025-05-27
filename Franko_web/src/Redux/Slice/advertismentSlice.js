import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Async Thunks

export const postAdvertisment = createAsyncThunk(
  "advertisment/postAdvertisment",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/Advertisment/PostAdvertisment`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
export const getAdvertisment = createAsyncThunk(
  "advertisment/get",
  async (AdsName, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `https://smfteapi.salesmate.app/Advertisment/GetAdvertisment?AdsName=${encodeURIComponent(AdsName)}`
      );

      // ✅ Ensure data is an array and remove index 0
      const formattedData = Array.isArray(response.data)
        ? response.data.slice(1) // Exclude first advertisement (index 0)
        : [];

      return formattedData;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch advertisements");
    }
  }
);

export const getBannerPageAdvertisment = createAsyncThunk(
  "advertisment/getBannerPage",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `https://smfteapi.salesmate.app/Advertisment/GetAdvertisment?AdsName=${encodeURIComponent("Banner")}`
      );

      // Ensure data is an array and exclude index 0
      const formattedData = Array.isArray(response.data) ? response.data.slice(1) : [];

      return formattedData;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch Home Page advertisements");
    }
  }
);

export const getHomePageAdvertisment = createAsyncThunk(
  "advertisment/getHomePage",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `https://smfteapi.salesmate.app/Advertisment/GetAdvertisment?AdsName=${encodeURIComponent("Home Page")}`
      );

      // ✅ Ensure data is an array and remove index 0
      const formattedData = Array.isArray(response.data)
        ? response.data.slice(1) // Exclude first advertisement (index 0)
        : [];

      return formattedData;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch Home Page advertisements");
    }
  }
);





export const putAdvertisment = createAsyncThunk(
  "advertisment/putAdvertisment",
  async ({ Fileid, AdsName, IndexOrder, AdsNote, FileName }, { rejectWithValue }) => {
    try {
      if (!Fileid || !FileName) {
        throw new Error("Fileid and FileName are required.");
      }

      const fileToUpload = FileName.originFileObj || FileName;

      // Construct query parameters correctly
      const queryParams = new URLSearchParams({
        Fileid,  
        AdsName,
        IndexOrder,
        AdsNote,
      }).toString();

      // Prepare FormData for the file
      const formData = new FormData();
      formData.append("FileName", fileToUpload);

      // Debugging: Log the request
      console.log("API Request URL:", `${API_BASE_URL}/Advertisment/PutAdvertisment?${queryParams}`);
      console.log("FormData being sent:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await axios.post(
        `${API_BASE_URL}/Advertisment/PutAdvertisment?${queryParams}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);



// Slice

const advertismentSlice = createSlice({
  name: "advertisment",
  initialState: {
    advertisments: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(postAdvertisment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postAdvertisment.fulfilled, (state, action) => {
        state.loading = false;
        state.advertisments.push(action.payload);
      })
      .addCase(postAdvertisment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAdvertisment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdvertisment.fulfilled, (state, action) => {
        state.loading = false;
        state.advertisments = action.payload;
      })
      .addCase(getAdvertisment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getHomePageAdvertisment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHomePageAdvertisment.fulfilled, (state, action) => {
        state.loading = false;
        state.advertisments = action.payload;
      })
      .addCase(getHomePageAdvertisment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getBannerPageAdvertisment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBannerPageAdvertisment.fulfilled, (state, action) => {
        state.loading = false;
        state.advertisments = action.payload; // Ensure correct field
      })
      
      .addCase(getBannerPageAdvertisment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(putAdvertisment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(putAdvertisment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.advertisments.findIndex(ad => ad.Fileid === action.payload.Fileid);
        if (index !== -1) {
          state.advertisments[index] = action.payload;
        }
      })
      .addCase(putAdvertisment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
  },
});

export default advertismentSlice.reducer;
