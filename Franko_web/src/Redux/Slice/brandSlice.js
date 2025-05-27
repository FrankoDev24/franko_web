// src/Redux/Slice/brandSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch brands
export const fetchBrands = createAsyncThunk("brand/fetchBrands", async () => {
  const response = await axios.get(`${API_BASE_URL}/Brand/Get-Brand`);
  return response.data; // Adjust based on your backend response
});

// Add a new brand
export const addBrand = createAsyncThunk("brand/addBrand", async (brandData) => {

  if (!brandData.get("BrandName")) throw new Error("BrandName is required.");
  if (!brandData.get("CategoryId")) throw new Error("CategoryId is required.");
  if (!brandData.get("LogoName")) throw new Error("LogoName is required.");

  const response = await axios.post(
    `${API_BASE_URL}/Brand/Setup-Brand`,
    brandData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return response.data;
});



export const updateBrand = createAsyncThunk(
  "brand/updateBrand",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      if (!id) {
        throw new Error("Brand ID is required to update the brand.");
      }
      const response = await axios.post(
        `${API_BASE_URL}/Brand/Put-Brand/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update brand"
      );
    }
  }
);

  

const brandSlice = createSlice({
  name: "brands",
  initialState: {
    brands: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.brands = action.payload;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
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
        state.error = action.error.message;
      })
      .addCase(updateBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBrand.fulfilled, (state, action) => {
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
