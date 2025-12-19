import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ======================= Axios instance =======================
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ======================= Async Thunks ========================

// Add Product
export const addProduct = createAsyncThunk('products/addProduct', async (productData) => {
  const { data } = await axiosInstance.post('/Product/Product-Post', productData);
  return data;
});

// Update Product
export const updateProduct = createAsyncThunk('products/updateProduct', async (productData) => {
  const { Productid, ...restData } = productData;
  const { data } = await axiosInstance.post(`/Product/Product_Put/${Productid}`, restData, {
    headers: { 'accept': 'text/plain', 'Content-Type': 'application/json' },
  });
  return data;
});

// Update Product Image
export const updateProductImage = createAsyncThunk(
  'products/updateProductImage',
  async ({ productID, imageFile }) => {
    const formData = new FormData();
    formData.append('ProductId', productID);
    formData.append('ImageName', imageFile);

    const { data } = await axiosInstance.post('/Product/Product-Image-Edit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }
);

// Fetch All Products
export const fetchAllProducts = createAsyncThunk('products/fetchAllProducts', async () => {
  const { data } = await axiosInstance.get('/Product/Product-Get');
  return Array.isArray(data) ? data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)) : [];
});

// Fetch Active Products
export const fetchActiveProducts = createAsyncThunk('products/fetchActiveProducts', async () => {
  const { data } = await axiosInstance.get('/Product/Product-Get-Active');
  return Array.isArray(data) ? data : [];
});

// Fetch Inactive Products
export const fetchInactiveProducts = createAsyncThunk('products/fetchInactiveProducts', async () => {
  const { data } = await axiosInstance.get('/Product/Product-Get-0');
  return Array.isArray(data) ? data : [];
});

// Fetch Products by Brand
export const fetchProductsByBrand = createAsyncThunk('products/fetchProductsByBrand', async (brandId) => {
  const { data } = await axiosInstance.get(`/Product/Product-Get-by-Brand/${brandId}`);
  return Array.isArray(data) ? data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)) : [];
});

// Fetch Products by Category
export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchProductsByCategory',
  async (categoryId) => {
    const { data } = await axiosInstance.get(`/Product/Product-Get-by-Category/${categoryId}`);
    return { categoryId, products: Array.isArray(data) ? data : [] };
  }
);

// Fetch Products by Showroom
export const fetchProductsByShowroom = createAsyncThunk(
  'products/fetchProductsByShowroom',
  async (showRoomID) => {
    const { data } = await axiosInstance.get(`/Product/Product-Get-by-ShowRoom/${showRoomID}`);
    return { showRoomID, products: Array.isArray(data) ? data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)) : [] };
  }
);

// Fetch Product by ID
export const fetchProductById = createAsyncThunk('products/fetchProductById', async (productId) => {
  const { data } = await axiosInstance.get(`/Product/Product-Get-by-Product_ID/${productId}`);
  return data;
});

// Fetch Product by Showroom and Record Number
export const fetchProductByShowroomAndRecord = createAsyncThunk(
  'products/fetchProductByShowroomAndRecord',
  async ({ showRoomCode, recordNumber }) => {
    const { data } = await axiosInstance.get('/Product/Product-Get-by-ShowRoom_RecordNumber', {
      params: { ShowRommCode: showRoomCode, RecordNumber: recordNumber },
    });
    const products = Array.isArray(data) ? data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)) : [];
    return { showRoomCode, products };
  }
);

// Fetch Paginated Products
export const fetchPaginatedProducts = createAsyncThunk(
  'products/fetchPaginatedProducts',
  async ({ pageNumber, pageSize = 10 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/Product/Product-Get-Paginated', { params: { PageNumber: pageNumber, PageSize: pageSize } });
      return Array.isArray(data) ? data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)) : [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ======================= Slice ========================
const initialState = {
  products: [],
  currentPage: 1,
  filteredProducts: [],
  brandProducts: [],
  productsByShowroom: {},
  productsByCategory: {},
  productsCache: {},
  activeProducts: [],
  inactiveProducts: [],
  currentProduct: null,
  loading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setPage: (state, action) => { state.currentPage = action.payload; },
    clearProducts: (state) => {
      state.products = [];
      state.filteredProducts = [];
      state.productsByShowroom = {};
      state.currentProduct = null;
      state.error = null;
    },
    setFilteredProducts: (state, action) => { state.filteredProducts = action.payload; },
    setProductsCache: (state, action) => {
      const { brandId, products } = action.payload;
      state.productsCache[brandId] = products;
    },
    resetProducts: (state) => { state.products = []; },
    clearCurrentProduct: (state) => { state.currentProduct = null; },
  },
  extraReducers: (builder) => {
    builder
      // Generic pending handler
      .addMatcher(
        (action) => action.type.startsWith('products/') && action.type.endsWith('/pending'),
        (state) => { state.loading = true; state.error = null; }
      )
      // Generic rejected handler
      .addMatcher(
        (action) => action.type.startsWith('products/') && action.type.endsWith('/rejected'),
        (state, action) => { state.loading = false; state.error = action.payload || action.error.message; }
      )
      // Fulfilled handlers
      .addCase(fetchAllProducts.fulfilled, (state, action) => { state.loading = false; state.products = action.payload; })
      .addCase(fetchProducts.fulfilled, (state, action) => { state.loading = false; state.products = action.payload; })
      .addCase(fetchProductById.fulfilled, (state, action) => { state.loading = false; state.currentProduct = action.payload; })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        const { categoryId, products } = action.payload;
        state.productsByCategory[categoryId] = products;
        state.loading = false;
      })
      .addCase(fetchProductsByShowroom.fulfilled, (state, action) => {
        const { showRoomID, products } = action.payload;
        state.productsByShowroom[showRoomID] = products;
        state.loading = false;
      })
      .addCase(fetchProductByShowroomAndRecord.fulfilled, (state, action) => {
        const { showRoomCode, products } = action.payload;
        state.productsByShowroom[showRoomCode] = products;
        state.loading = false;
      })
      .addCase(fetchPaginatedProducts.fulfilled, (state, action) => { state.loading = false; state.products = action.payload; })
      .addCase(fetchProductsByBrand.fulfilled, (state, action) => { state.loading = false; state.brandProducts = action.payload; })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProduct = action.payload;
        const index = state.products.findIndex(item => item.Productid == updatedProduct.Productid);
        if (index !== -1) state.products[index] = updatedProduct;
      })
      .addCase(updateProductImage.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(item => item.Productid === action.payload.Productid);
        if (index !== -1) state.products[index] = action.payload;
      })
      .addCase(fetchActiveProducts.fulfilled, (state, action) => { state.loading = false; state.activeProducts = action.payload; })
      .addCase(fetchInactiveProducts.fulfilled, (state, action) => { state.loading = false; state.inactiveProducts = action.payload; });
  },
});

export const {
  clearProducts,
  setFilteredProducts,
  setProductsCache,
  setPage,
  clearCurrentProduct,
  resetProducts,
} = productSlice.actions;

export default productSlice.reducer;
