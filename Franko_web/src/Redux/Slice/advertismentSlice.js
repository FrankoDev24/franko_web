import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance";

/* =========================
   ASYNC THUNKS
========================= */

// POST Advertisement
export const postAdvertisment = createAsyncThunk(
  "advertisment/postAdvertisment",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/Advertisment/PostAdvertisment",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// GET Advertisement by Name
export const getAdvertisment = createAsyncThunk(
  "advertisment/get",
  async (AdsName, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/Advertisment/GetAdvertisment?AdsName=${encodeURIComponent(AdsName)}`
      );

      return Array.isArray(response.data) ? response.data.slice(1) : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch advertisements"
      );
    }
  }
);

// GET Banner Page Advertisements
export const getBannerPageAdvertisment = createAsyncThunk(
  "advertisment/getBannerPage",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/Advertisment/GetAdvertisment?AdsName=${encodeURIComponent("Banner")}`
      );

      return Array.isArray(response.data) ? response.data.slice(1) : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch banner advertisements"
      );
    }
  }
);

// GET Home Page Advertisements
export const getHomePageAdvertisment = createAsyncThunk(
  "advertisment/getHomePage",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/Advertisment/GetAdvertisment?AdsName=${encodeURIComponent("Home Page")}`
      );

      return Array.isArray(response.data) ? response.data.slice(1) : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch home page advertisements"
      );
    }
  }
);

// PUT Advertisement
export const putAdvertisment = createAsyncThunk(
  "advertisment/putAdvertisment",
  async ({ Fileid, AdsName, IndexOrder, AdsNote, FileName }, { rejectWithValue }) => {
    try {
      if (!Fileid || !FileName) {
        throw new Error("Fileid and FileName are required.");
      }

      const fileToUpload = FileName.originFileObj || FileName;

      const queryParams = new URLSearchParams({
        Fileid,
        AdsName,
        IndexOrder,
        AdsNote,
      }).toString();

      const formData = new FormData();
      formData.append("FileName", fileToUpload);

      const response = await axiosInstance.post(
        `/Advertisment/PutAdvertisment?${queryParams}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* =========================
   SLICE
========================= */

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

      // POST
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

      // GET
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

      // HOME PAGE
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

      // BANNER PAGE
      .addCase(getBannerPageAdvertisment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBannerPageAdvertisment.fulfilled, (state, action) => {
        state.loading = false;
        state.advertisments = action.payload;
      })
      .addCase(getBannerPageAdvertisment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // PUT
      .addCase(putAdvertisment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(putAdvertisment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.advertisments.findIndex(
          (ad) => ad.Fileid === action.payload.Fileid
        );
        if (index !== -1) {
          state.advertisments[index] = action.payload;
        }
      })
      .addCase(putAdvertisment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default advertismentSlice.reducer;
