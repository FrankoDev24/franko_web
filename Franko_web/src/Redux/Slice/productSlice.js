// src/redux/slices/productSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const addProduct = createAsyncThunk(
  'products/addProduct',
  async (productData) => {
    const response = await fetch(`${API_BASE_URL}/Product/Product-Post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add product');
    }
    
    return response.json();
  }
);

// Async thunk for updating a product
export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async (productData) => {
    const { Productid, ...restData } = productData;

    const response = await fetch(
      `${API_BASE_URL}/Product/Product_Put/${Productid}`,
      {
        method: 'POST',
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restData),
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to update product');
    }
    
    return response.json();
  }
);

// Async thunk for updating a product's image
export const updateProductImage = createAsyncThunk(
  'products/updateProductImage',
  async ({ productID, imageFile }) => {
    const formData = new FormData();
    formData.append('ProductId', productID);
    formData.append('ImageName', imageFile);

    const response = await fetch(
      `${API_BASE_URL}/Product/Product-Image-Edit`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to update product image');
    }

    return response.json();
  }
);

// Async thunk for fetching all products
export const fetchAllProducts = createAsyncThunk(
  'products/fetchAllProducts',
  async () => {
    const response = await fetch(`${API_BASE_URL}/Product/Product-Get`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch all products');
    }
    
    const products = await response.json();

    return products.sort(
      (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
    );
  }
);

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Product/Product-Get`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const products = await response.json();

      const filteredProducts = products
        .filter((product) => product.status == 1)
        .sort(
          (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
        );
      return filteredProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
);

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Product/Product-Get`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      
      const products = await response.json();

      const filteredProducts = products
        .filter((product) => product.status == 1)
        .sort(
          (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
        )
        .slice(0, 10);

      return filteredProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
);

export const fetchPaginatedProducts = createAsyncThunk(
  'products/fetchPaginatedProducts',
  async ({ pageNumber, pageSize = 10 }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Product/Product-Get-Paginated?PageNumber=${pageNumber}&PageSize=${pageSize}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch paginated products');
      }
      
      const data = await response.json();

      const sortedData = data.sort(
        (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
      );

      return sortedData;
    } catch (error) {
      console.error('Error fetching paginated products:', error);
      return rejectWithValue(
        error.message || 'Failed to fetch products'
      );
    }
  }
);

export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchProductsByCategory',
  async (categoryId) => {
    const response = await fetch(
      `${API_BASE_URL}/Product/Product-Get-by-Category/${categoryId}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch products by category');
    }
    
    const data = await response.json();
    return { categoryId, products: data };
  }
);

export const fetchProductsByBrand = createAsyncThunk(
  'products/fetchProductsByBrand',
  async (brandId) => {
    const response = await fetch(
      `${API_BASE_URL}/Product/Product-Get-by-Brand/${brandId}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch products by brand');
    }
    
    const data = await response.json();
    return data.sort(
      (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
    );
  }
);

export const fetchProductsByShowroom = createAsyncThunk(
  'products/fetchProductsByShowroom',
  async (showRoomID) => {
    const response = await fetch(
      `${API_BASE_URL}/Product/Product-Get-by-ShowRoom/${showRoomID}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch products by showroom');
    }
    
    const data = await response.json();
    return {
      showRoomID,
      products: data.sort(
        (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
      ),
    };
  }
);

// Async thunk for fetching a product by its ID
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId) => {
    const response = await fetch(
      `${API_BASE_URL}/Product/Product-Get-by-Product_ID/${productId}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch product by ID');
    }
    
    return response.json();
  }
);

export const fetchActiveProducts = createAsyncThunk(
  'products/fetchActiveProducts',
  async () => {
    const response = await fetch(
      `${API_BASE_URL}/Product/Product-Get-Active`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch active products');
    }
    
    return response.json();
  }
);

export const fetchInactiveProducts = createAsyncThunk(
  'products/fetchInactiveProducts',
  async () => {
    const response = await fetch(`${API_BASE_URL}/Product/Product-Get-0`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch inactive products');
    }
    
    return response.json();
  }
);

export const fetchProductByShowroomAndRecord = createAsyncThunk(
  'products/fetchProductByShowroomAndRecord',
  async ({ showRoomCode, recordNumber }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Product/Product-Get-by-ShowRoom_RecordNumber?ShowRommCode=${showRoomCode}&RecordNumber=${recordNumber}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch product by showroom and record number');
      }

      const data = await response.json();

      const sortedProducts = data.sort(
        (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
      );

      return { showRoomCode, products: sortedProducts };
    } catch (error) {
      console.error(
        'Error fetching product by showroom and record number:',
        error
      );
      throw error;
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