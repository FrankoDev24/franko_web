import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import axiosInstance from "./AxiosInstance";

const CART_KEY = "cart";
const CART_ID_KEY = "cartId";

/* ===========================
   LOCAL STORAGE HELPERS
=========================== */

// --- Load from secure localStorage ---
const loadCartFromLocalStorage = () => {
  try {
    const savedCart = localStorage.getItem(CART_KEY);
    if (!savedCart) return [];
    
    // Handle both JSON string and already parsed data
    if (typeof savedCart === 'string') {
      try {
        return JSON.parse(savedCart);
      } catch (e) {
        // If it's a string but not JSON, return empty array
        return [];
      }
    }
    
    return Array.isArray(savedCart) ? savedCart : [];
  } catch (error) {
    
    return [];
  }
};

// --- Save to secure localStorage ---
const saveCartToLocalStorage = (cart) => {
  try {
    // Always stringify when saving
    const serialized = typeof cart === 'string' ? cart : JSON.stringify(cart);
    localStorage.setItem(CART_KEY, serialized);
  } catch (error) {

  }
};

// --- Get or create encrypted Cart ID ---
const getOrCreateCartId = () => {
  let cartId = localStorage.getItem(CART_ID_KEY);
  if (!cartId) {
    cartId = uuidv4();
    localStorage.setItem(CART_ID_KEY, cartId);
  }
  return cartId;
};

/* ===========================
   INITIAL STATE
=========================== */

const initialState = {
  cart: loadCartFromLocalStorage(),
  totalItems: loadCartFromLocalStorage().reduce(
    (total, item) => total + (item.quantity || 1),
    0
  ),
  cartId: getOrCreateCartId(),
  loading: false,
  error: null,
};

/* ===========================
   ASYNC THUNKS (via Lambda)
=========================== */

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (item, { rejectWithValue }) => {
    try {
 

      const cartId = getOrCreateCartId();

      // Handle both PascalCase (from API) and camelCase (from internal)
      const cartItem = {
        CartId: item.CartId || cartId,
        ProductId: item.ProductId || item.productId || item.productID,
        ProductName: item.ProductName || item.productName || item.name,
        ImagePath: item.ImagePath || item.imagePath || item.productImage,
        Price: item.Price || item.price,
        Quantity: item.Quantity || item.quantity || 1,
        CustomerId: item.CustomerId || item.customerId || null,
      };

   

      // Validate required fields
      if (!cartItem.ProductId) {
        throw new Error("ProductId is required");
      }

      const response = await axiosInstance.post(
        "/",            // Lambda root
        cartItem,       // Send the properly formatted item
        {
          params: {
            endpoint: "/Cart/Add-To-Cart",
          },
        }
      );

  

      // Return normalized response
      return {
        productId: cartItem.ProductId,
        productName: cartItem.ProductName,
        imagePath: cartItem.ImagePath,
        price: parseFloat(cartItem.Price),
        quantity: parseInt(cartItem.Quantity),
        cartId: cartItem.CartId,
        customerId: cartItem.CustomerId,
        ...response.data,
      };
    } catch (error) {

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const createCartItem = createAsyncThunk(
  "cart/createCartItem",
  async (item, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();

      // Handle both PascalCase and camelCase
      const cartItem = {
        CartId: item.CartId || cartId,
        ProductId: item.ProductId || item.productId || item.productID,
        ProductName: item.ProductName || item.productName || item.name,
        ImagePath: item.ImagePath || item.imagePath || item.productImage,
        Price: item.Price || item.price,
        Quantity: item.Quantity || item.quantity || 1,
        CustomerId: item.CustomerId || item.customerId || null,
      };

      const response = await axiosInstance.post(
        "/",
        cartItem,
        {
          params: {
            endpoint: "/Cart/Add-To-Cart",
          },
        }
      );

      return {
        productId: cartItem.ProductId,
        productName: cartItem.ProductName,
        imagePath: cartItem.ImagePath,
        price: parseFloat(cartItem.Price),
        quantity: parseInt(cartItem.Quantity),
        cartId: cartItem.CartId,
        ...response.data,
      };
    } catch (error) {
    
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const getCartById = createAsyncThunk(
  "cart/getCartById",
  async (_, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();

    

      const response = await axiosInstance.get("/", {
        params: {
          endpoint: `/Cart/Cart-GetbyID/${cartId}`,
        },
      });



      // Normalize the response data
      if (Array.isArray(response.data)) {
        return response.data.map(item => ({
          productId: item.productId || item.ProductId,
          productName: item.productName || item.ProductName,
          imagePath: item.imagePath || item.ImagePath,
          price: parseFloat(item.price || item.Price || 0),
          quantity: parseInt(item.quantity || item.Quantity || 1),
          cartId: item.cartId || item.CartId,
          customerId: item.customerId || item.CustomerId,
        }));
      }

      return response.data;
    } catch (error) {
 
      return rejectWithValue(
        error.message || "Failed to fetch cart"
      );
    }
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async (params, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();
      
      // Handle both camelCase and PascalCase parameters
      const productId = params.ProductId || params.productId;
      const quantity = params.Quantity || params.quantity;

      if (!productId) {
        throw new Error("ProductId is required");
      }

 

      await axiosInstance.post(
        "/",
        null,
        {
          params: {
            endpoint: `/Cart/Cart-Update/${cartId}/${productId}/${quantity}`,
          },
        }
      );

      return { cartId, productId, quantity };
    } catch (error) {

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const deleteCartItem = createAsyncThunk(
  "cart/deleteCartItem",
  async (params, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();
      
      // Handle both camelCase and PascalCase parameters
      const productId = params.ProductId || params.productId;

      if (!productId) {
        throw new Error("ProductId is required");
      }



      await axiosInstance.post(
        "/",
        null,
        {
          params: {
            endpoint: `/Cart/Cart-Delete/${cartId}/${productId}`,
          },
        }
      );

      return { cartId, productId };
    } catch (error) {

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

/* ===========================
   SLICE
=========================== */

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addCart: (state, action) => {
      const existingItemIndex = state.cart.findIndex(
        (item) => item.productId === action.payload.productId
      );
      if (existingItemIndex >= 0) {
        state.cart[existingItemIndex].quantity += action.payload.quantity || 1;
      } else {
        state.cart.push({
          ...action.payload,
          quantity: action.payload.quantity || 1,
        });
      }
      state.totalItems = state.cart.reduce(
        (total, item) => total + (item.quantity || 1),
        0
      );
      saveCartToLocalStorage(state.cart);
    },
    removeFromCart: (state, action) => {
      const index = state.cart.findIndex(
        (item) => item.productId === action.payload.productId
      );
      if (index >= 0) {
        state.totalItems -= state.cart[index].quantity || 1;
        state.cart.splice(index, 1);
        saveCartToLocalStorage(state.cart);
        if (state.cart.length === 0) {
          localStorage.removeItem(CART_KEY);
          localStorage.removeItem(CART_ID_KEY);
          state.cartId = null;
        }
      }
    },
    clearCart: (state) => {
      state.cart = [];
      state.totalItems = 0;
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(CART_ID_KEY);
      state.cartId = null;
    },
    setCartItems: (state, action) => {
      const items = Array.isArray(action.payload) ? action.payload : [];
      state.cart = items;
      state.totalItems = items.reduce(
        (total, item) => total + (item.quantity || 1),
        0
      );
      saveCartToLocalStorage(state.cart);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        const index = state.cart.findIndex(
          (item) => item.productId === payload.productId
        );
        if (index >= 0) {
          state.cart[index].quantity += payload.quantity || 1;
        } else {
          state.cart.push({
            productId: payload.productId,
            productName: payload.productName,
            imagePath: payload.imagePath,
            price: payload.price,
            quantity: payload.quantity || 1,
            cartId: payload.cartId,
            customerId: payload.customerId,
          });
        }
        state.totalItems = state.cart.reduce(
          (total, item) => total + (item.quantity || 1),
          0
        );
        saveCartToLocalStorage(state.cart);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
     
      })
      .addCase(getCartById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCartById.fulfilled, (state, action) => {
        state.loading = false;
        const cartData = Array.isArray(action.payload) ? action.payload : [];
        state.cart = cartData;
        state.totalItems = cartData.reduce(
          (total, item) => total + (item.quantity || 1),
          0
        );
        saveCartToLocalStorage(state.cart);
      })
      .addCase(getCartById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
   
      })
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const { productId, quantity } = action.payload;
        const index = state.cart.findIndex(
          (item) => item.productId === productId
        );
        if (index !== -1) {
          state.cart[index].quantity = quantity;
        }
        state.totalItems = state.cart.reduce(
          (total, item) => total + (item.quantity || 1),
          0
        );
        saveCartToLocalStorage(state.cart);
        state.loading = false;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
   
      })
      .addCase(deleteCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        state.cart = state.cart.filter(
          (item) => item.productId !== action.payload.productId
        );
        state.totalItems = state.cart.reduce(
          (total, item) => total + (item.quantity || 1),
          0
        );
        saveCartToLocalStorage(state.cart);
        if (state.cart.length === 0) {
          localStorage.removeItem(CART_KEY);
          localStorage.removeItem(CART_ID_KEY);
          state.cartId = null;
        }
        state.loading = false;
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
   
      })
      .addCase(createCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCartItem.fulfilled, (state, action) => {
        const payload = action.payload;
        const index = state.cart.findIndex(
          (item) => item.productId === payload.productId
        );
        if (index >= 0) {
          state.cart[index].quantity += payload.quantity || 1;
        } else {
          state.cart.push({
            productId: payload.productId,
            productName: payload.productName,
            imagePath: payload.imagePath,
            price: payload.price,
            quantity: payload.quantity || 1,
            cartId: payload.cartId,
            customerId: payload.customerId,
          });
        }
        state.totalItems = state.cart.reduce(
          (total, item) => total + (item.quantity || 1),
          0
        );
        saveCartToLocalStorage(state.cart);
        state.loading = false;
      })
      .addCase(createCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;

      });
  },
});

// --- Exports ---
export const { clearCart, addCart, removeFromCart, setCartItems } =
  cartSlice.actions;
export default cartSlice.reducer;