import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance";

/* ===========================
   ASYNC THUNKS
=========================== */

// Add product
export const addProduct = createAsyncThunk(
  'products/addProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const isFormData = productData instanceof FormData;

      const response = await axiosInstance.post(
        '/Product/Product-Post',
        productData,
        {
          headers: isFormData
            ? { 'Content-Type': 'multipart/form-data' }
            : { 'Content-Type': 'application/json' },
        }
      );

      // Axios returns parsed data directly
      return response.data;
    } catch (error) {
      // Surface server validation errors back to UI
      const payload = error.response?.data ?? error.message ?? 'Failed to add product';
      return rejectWithValue(payload);
    }
  }
);



// Update product
export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const { Productid, ...restData } = productData;

      const { data } = await axiosInstance.post(
        `/Product/Product_Put/${Productid}`,
        restData,
        {
          headers: {
            accept: "text/plain",
            "Content-Type": "application/json",
          },
        }
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update product"
      );
    }
  }
);

// Update product image
export const updateProductImage = createAsyncThunk(
  "products/updateProductImage",
  async ({ productID, imageFile }, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      // 🔴 IMPORTANT: field names MUST match backend DTO exactly
      formData.append("ProductId", productID);

      // 🔴 Must be a FILE object
      formData.append("ImageName", imageFile, imageFile.name);


      const response = await axiosInstance.post(
        "/Product/Product-Image-Edit",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data || "Failed to update product image"
      );
    }
  }
);


// Fetch all products
export const fetchAllProducts = createAsyncThunk(
  "products/fetchAllProducts",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        "/Product/Product-Get"
      );

      return data.sort(
        (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
      );
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch all products"
      );
    }
  }
);

// Fetch active products (status === 1)
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        "/Product/Product-Get"
      );

      return data
        .filter((product) => product.status == 1)
        .sort(
          (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
        );
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch products"
      );
    }
  }
);

// Fetch top 10 products
export const fetchProduct = createAsyncThunk(
  "products/fetchProduct",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        "/Product/Product-Get"
      );

      return data
        .filter((product) => product.status == 1)
        .sort(
          (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
        )
        .slice(0, 10);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch product"
      );
    }
  }
);

// Fetch paginated products
export const fetchPaginatedProducts = createAsyncThunk(
  "products/fetchPaginatedProducts",
  async ({ pageNumber, pageSize = 10 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        "/Product/Product-Get-Paginated",
        { params: { PageNumber: pageNumber, PageSize: pageSize } }
      );

      return data.sort(
        (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
      );
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch products"
      );
    }
  }
);

// Fetch by category
export const fetchProductsByCategory = createAsyncThunk(
  "products/fetchProductsByCategory",
  async (categoryId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/Product/Product-Get-by-Category/${categoryId}`
      );

      return { categoryId, products: data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch products by category"
      );
    }
  }
);

// Fetch by brand
export const fetchProductsByBrand = createAsyncThunk(
  "products/fetchProductsByBrand",
  async (brandId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/Product/Product-Get-by-Brand/${brandId}`
      );

      return data.sort(
        (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
      );
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch products by brand"
      );
    }
  }
);

// Fetch by showroom
export const fetchProductsByShowroom = createAsyncThunk(
  "products/fetchProductsByShowroom",
  async (showRoomID, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/Product/Product-Get-by-ShowRoom/${showRoomID}`
      );

      return {
        showRoomID,
        products: data.sort(
          (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
        ),
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch products by showroom"
      );
    }
  }
);

// Fetch product by ID
export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/Product/Product-Get-by-Product_ID/${productId}`
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch product by ID"
      );
    }
  }
);

// Fetch active products
export const fetchActiveProducts = createAsyncThunk(
  "products/fetchActiveProducts",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        "/Product/Product-Get-Active"
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch active products"
      );
    }
  }
);

// Fetch inactive products
export const fetchInactiveProducts = createAsyncThunk(
  "products/fetchInactiveProducts",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        "/Product/Product-Get-0"
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch inactive products"
      );
    }
  }
);

// Fetch by showroom + record
export const fetchProductByShowroomAndRecord = createAsyncThunk(
  "products/fetchProductByShowroomAndRecord",
  async ({ showRoomCode, recordNumber }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        "/Product/Product-Get-by-ShowRoom_RecordNumber",
        { params: { ShowRommCode: showRoomCode, RecordNumber: recordNumber } }
      );

      return {
        showRoomCode,
        products: data.sort(
          (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
        ),
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data ||
          "Failed to fetch product by showroom and record number"
      );
    }
  }
);


// Create the product slice
const productSlice = createSlice({
  name: 'products',
  initialState: {
    products: [],
    currentPage: 1,
    filteredProducts: [],
    brandProducts: [],
    productsByShowroom: {},
    productsByCategory: {},
    currentProduct: null,
    loading: false,
    error: null,
  },
  reducers: {
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
    clearProducts: (state) => {
      state.products = [];
      state.filteredProducts = [];
      state.productsByShowroom = {};
      state.currentProduct = null;
      state.error = null;
    },
    setProductsCache: (state, action) => {
      const { brandId, products } = action.payload;
      state.productsCache[brandId] = products;
    },
    resetProducts: (state) => {
      state.products = [];
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProduct = action.payload;

        const index = state.products.findIndex(
          (item) => item.Productid == updatedProduct.productID
        );

        if (index !== -1) {
          state.products[index] = updatedProduct;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateProductImage.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(
          (item) => item.Productid === action.payload.Productid
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(updateProductImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProductsByBrand.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductsByBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.brandProducts = action.payload;
      })
      .addCase(fetchProductsByBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchAllProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.productsByCategory[action.payload.categoryId] =
          action.payload.products;
        state.loading = false;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(fetchProductsByShowroom.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductsByShowroom.fulfilled, (state, action) => {
        state.loading = false;
        const { showRoomID, products } = action.payload;
        state.productsByShowroom[showRoomID] = products;
      })
      .addCase(fetchProductsByShowroom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchPaginatedProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaginatedProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchPaginatedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      })
      .addCase(fetchActiveProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.activeProducts = action.payload;
      })
      .addCase(fetchActiveProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchInactiveProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInactiveProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.inactiveProducts = action.payload;
      })
      .addCase(fetchInactiveProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProductByShowroomAndRecord.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductByShowroomAndRecord.fulfilled, (state, action) => {
        const { showRoomCode, products } = action.payload;
        state.productsByShowroom[showRoomCode] = products;
        state.loading = false;
      })
      .addCase(fetchProductByShowroomAndRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
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