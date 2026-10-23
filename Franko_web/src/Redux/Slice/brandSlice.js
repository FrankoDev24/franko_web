import { publicGet } from "../../utils/publicReadCache";
import { catalogueRows } from "../../utils/catalogueShape.mjs";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance";

/* ============================
   FETCH BRANDS (via Lambda)
============================ */
export const fetchBrands = createAsyncThunk(
  "brand/fetchBrands",
  async (_, { rejectWithValue }) => {
    try {
      const response = await publicGet("/", {
        params: {
          endpoint: "/Brand/Get-Brand",
        },
      });
      const rows = catalogueRows(response.data, "brands");
      if (!rows) throw new Error("Invalid brands response: expected a list");
      return rows;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || error.message || "Failed to fetch brands"
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState().brands;
      return !state.loading && (!state.lastFetched || Date.now() - state.lastFetched > 60_000);
    },
  }
);

/* ============================
   ADD BRAND (via Lambda)
============================ */
export const addBrand = createAsyncThunk(
  "brand/addBrand",
  async (brandData, { rejectWithValue }) => {
    try {
      // Maintain original validations
      if (!brandData.get("BrandName"))
        throw new Error("BrandName is required.");
      if (!brandData.get("CategoryId"))
        throw new Error("CategoryId is required.");
      if (!brandData.get("LogoName"))
        throw new Error("LogoName is required.");

      const response = await axiosInstance.post(
        "/",           // Lambda root
        brandData,
        {
          params: {
            endpoint: "/Brand/Setup-Brand",
          },
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || error.message || "Failed to add brand"
      );
    }
  }
);

/* ============================
   UPDATE BRAND (via Lambda)
============================ */
export const updateBrand = createAsyncThunk(
  "brand/updateBrand",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      if (!id) {
        throw new Error("Brand ID is required to update the brand.");
      }

      const response = await axiosInstance.post(
        "/",           // Lambda root
        formData,
        {
          params: {
            endpoint: `/Brand/Put-Brand/${id}`,
          },
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update brand"
      );
    }
  }
);

/* ============================
   SLICE
============================ */
const brandSlice = createSlice({
  name: "brands",
  initialState: {
    brands: [],
    lastFetched: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch brands
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.brands = catalogueRows(action.payload, "brands") || [];
        state.lastFetched = Date.now();
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Add brand
      .addCase(addBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.brands.push(action.payload);
      })
      .addCase(addBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Update brand
      .addCase(updateBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBrand.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.brands.findIndex(
          (brand) => brand.brandId === action.payload.brandId
        );
        if (index !== -1) {
          state.brands[index] = action.payload;
        }
      })
      .addCase(updateBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default brandSlice.reducer;