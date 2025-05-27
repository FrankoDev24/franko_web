import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export const addProduct = createAsyncThunk('products/addProduct', async (productData) => {
  const response = await axios.post(`${API_BASE_URL}/Product/Product-Post`, productData);
  return response.data;
});
// Async thunk for fetching paginated products

export const updateProduct = createAsyncThunk('products/updateProduct', async (productData) => {
  const { Productid, ...restData } = productData;

  const response = await axios.post(
    `https://smfteapi.salesmate.app/Product/Product_Put/${Productid}`,
    restData,
    {
      headers: {
        'accept': 'text/plain',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
});

// Async thunk for updating a product's image
export const updateProductImage = createAsyncThunk(
  'products/updateProductImage',
  async ({ productID, imageFile }) => {
    const formData = new FormData();
    formData.append('ProductId', productID);  // Ensure this key matches backend
    formData.append('ImageName', imageFile); // Ensure this key matches backend
    
    const response = await axios.post(`${API_BASE_URL}/Product/Product-Image-Edit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
);

// Async thunk for fetching all products
export const fetchAllProducts = createAsyncThunk(
  'products/fetchAllProducts',
  async () => {
    const response = await axios.get(`${API_BASE_URL}/Product/Product-Get`);
    
    // Assuming `response.data` contains an array of products
    const products = response.data;

    
    return products.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  }
);
// Async thunk for fetching products by category
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Product/Product-Get`);
      
      
      const products = response.data;

      // Filter and sort
      const filteredProducts = products
        .filter(product => product.status == 1) // Loose equality to handle possible type mismatch
        .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
      
 
      
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
      const response = await axios.get(`${API_BASE_URL}/Product/Product-Get`);
      const products = response.data;

      // Filter, sort, and limit to the most recent 24
      const filteredProducts = products
        .filter(product => product.status == 1) // Loose equality to handle possible type mismatch
        .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
        .slice(0, 24); // Limit to the 24 most recent

      return filteredProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
);
export const fetchPaginatedProducts = createAsyncThunk(
  'products/fetchPaginatedProducts',
  async ({ pageNumber, pageSize = 24 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/Product/Product-Get-Paginated`,
        {
          params: { PageNumber: pageNumber, PageSize: pageSize },
        }
      );
      
      // Sort the products by dateCreated before returning the data
      const sortedData = response.data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
      
      // Return the sorted data to Redux
      return sortedData;
    } catch (error) {
      console.error('Error fetching paginated products:', error);
      
      // Return the error message to Redux so it can be handled in the state
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const fetchProductsByCategory = createAsyncThunk(
  "products/fetchProductsByCategory",
  async (categoryId) => {
    const response = await axios.get(`${API_BASE_URL}/Product/Product-Get-by-Category/${categoryId}`);
    return { categoryId, products: response.data };
  }
);


// Async thunk for fetching products by brand 
export const fetchProductsByBrand = createAsyncThunk('products/fetchProductsByBrand', async (brandId) => {
  const response = await axios.get(`${API_BASE_URL}/Product/Product-Get-by-Brand/${brandId}`);
  return response.data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
});

export const fetchProductsByShowroom = createAsyncThunk('products/fetchProductsByShowroom', async (showRoomID) => {
  const response = await axios.get(`${API_BASE_URL}/Product/Product-Get-by-ShowRoom/${showRoomID}`);
  return { showRoomID, products: response.data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)) };
});

// Async thunk for fetching a product by its ID
export const fetchProductById = createAsyncThunk('products/fetchProductById', async (productId) => {
  const response = await axios.get(`${API_BASE_URL}/Product/Product-Get-by-Product_ID/${productId}`);
  return response.data;
});
export const fetchActiveProducts = createAsyncThunk('products/fetchActiveProducts', async () => {
  const response = await axios.get(`${API_BASE_URL}/Product/Product-Get-Active`);
  return response.data;
});

export const fetchInactiveProducts = createAsyncThunk('products/fetchInactiveProducts', async () => {
  const response = await axios.get(`${API_BASE_URL}/Product/Product-Get-0`);
  return response.data;
});

export const fetchProductByShowroomAndRecord = createAsyncThunk(
  "products/fetchProductByShowroomAndRecord",
  async ({ showRoomCode, recordNumber }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Product/Product-Get-by-ShowRoom_RecordNumber`, {
        params: {
          ShowRommCode: showRoomCode, // Ensure correct spelling
          RecordNumber: recordNumber,
        },
      });

      // Sort products by dateCreated (newest first)
      const sortedProducts = response.data.sort((a, b) => 
        new Date(b.dateCreated) - new Date(a.dateCreated)
      );

      return { showRoomCode, products: sortedProducts };
    } catch (error) {
      console.error("Error fetching product by showroom and record number:", error);
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
    brandProducts: [], // if this exists
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
      
        // Ensure case consistency in ID comparison
        const index = state.products.findIndex(item => item.Productid == updatedProduct.productID);
        
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
        const index = state.products.findIndex(item => item.Productid === action.payload.Productid);
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
        state.brandProducts = action.payload; // ✅ correct place
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
        state.productsByCategory[action.payload.categoryId] = action.payload.products;
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
        state.error = null; // Reset error on new request
      })
      .addCase(fetchPaginatedProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload; // Assign fetched products
      })
      .addCase(fetchPaginatedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products'; // Set error message from action payload
      })
      
      // New cases for the added endpoints
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
        state.productsByShowroom[showRoomCode] = products; // Store data by showroom
        state.loading = false;
      })
      .addCase(fetchProductByShowroomAndRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  
},
});
// Export the reducer and actions
export const { clearProducts, setFilteredProducts, setProductsCache,  setPage, resetProducts } = productSlice.actions;
export default productSlice.reducer;
