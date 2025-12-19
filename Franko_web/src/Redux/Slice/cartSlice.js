import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance";
import { v4 as uuidv4 } from "uuid";

const CART_KEY = "cart";
const CART_ID_KEY = "cartId";

/* =========================
   LOCAL STORAGE HELPERS
========================= */

const loadCartFromLocalStorage = () => {
  const savedCart = localStorage.getItem(CART_KEY);
  return Array.isArray(savedCart) ? savedCart : [];
};

const saveCartToLocalStorage = (cart) => {
  localStorage.setItem(CART_KEY, cart);
};

const getOrCreateCartId = () => {
  let cartId = localStorage.getItem(CART_ID_KEY);
  if (!cartId) {
    cartId = uuidv4();
    localStorage.setItem(CART_ID_KEY, cartId);
  }
  return cartId;
};

/* =========================
   INITIAL STATE
========================= */

const initialState = {
  cart: loadCartFromLocalStorage(),
  totalItems: loadCartFromLocalStorage().reduce(
    (total, item) => total + item.quantity,
    0
  ),
  cartId: getOrCreateCartId(),
  loading: false,
  error: null,
};

/* =========================
   ASYNC THUNKS
========================= */

// Add to Cart
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (item, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();

      const cartItem = {
        cartId,
        productId: item.productID,
        price: item.price,
        quantity: item.quantity,
      };

      const response = await axiosInstance.post(
        "/Cart/Add-To-Cart",
        cartItem
      );

      return { ...cartItem, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create Cart Item
export const createCartItem = createAsyncThunk(
  "cart/createCartItem",
  async (item, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();

      const response = await axiosInstance.post(
        "/Cart/Add-To-Cart",
        { ...item, cartId }
      );

      return { ...item, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get Cart by ID
export const getCartById = createAsyncThunk(
  "cart/getCartById",
  async (_, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();
      const response = await axiosInstance.get(
        `/Cart/Cart-GetbyID/${cartId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch cart"
      );
    }
  }
);

// Update Cart Item
export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();

      await axiosInstance.post(
        `/Cart/Cart-Update/${cartId}/${productId}/${quantity}`
      );

      return { productId, quantity };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete Cart Item
export const deleteCartItem = createAsyncThunk(
  "cart/deleteCartItem",
  async ({ productId }, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();

      await axiosInstance.post(
        `/Cart/Cart-Delete/${cartId}/${productId}`
      );

      return { productId };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* =========================
   SLICE
========================= */

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addCart: (state, action) => {
      const index = state.cart.findIndex(
        (item) => item.productId === action.payload.productId
      );

      if (index >= 0) {
        state.cart[index].quantity += action.payload.quantity;
      } else {
        state.cart.push({
          ...action.payload,
          quantity: action.payload.quantity || 1,
        });
      }

      state.totalItems = state.cart.reduce(
        (total, item) => total + item.quantity,
        0
      );
      saveCartToLocalStorage(state.cart);
    },

    removeFromCart: (state, action) => {
      const index = state.cart.findIndex(
        (item) => item.productId === action.payload.productId
      );

      if (index >= 0) {
        state.totalItems -= state.cart[index].quantity;
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
      state.cart = action.payload;
      state.totalItems = action.payload.reduce(
        (total, item) => total + item.quantity,
        0
      );
      saveCartToLocalStorage(state.cart);
    },
  },

  extraReducers: (builder) => {
    builder

      // ADD
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.cart.findIndex(
          (item) => item.productId === action.payload.productId
        );

        if (index >= 0) {
          state.cart[index].quantity += action.payload.quantity;
        } else {
          state.cart.push(action.payload);
        }

        state.totalItems = state.cart.reduce(
          (total, item) => total + item.quantity,
          0
        );
        saveCartToLocalStorage(state.cart);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // GET
      .addCase(getCartById.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.totalItems = action.payload.reduce(
          (total, item) => total + item.quantity,
          0
        );
        saveCartToLocalStorage(state.cart);
        state.loading = false;
      })

      // UPDATE
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const index = state.cart.findIndex(
          (item) => item.productId === action.payload.productId
        );
        if (index !== -1) {
          state.cart[index].quantity = action.payload.quantity;
        }
        state.totalItems = state.cart.reduce(
          (total, item) => total + item.quantity,
          0
        );
        saveCartToLocalStorage(state.cart);
        state.loading = false;
      })

      // DELETE
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        state.cart = state.cart.filter(
          (item) => item.productId !== action.payload.productId
        );
        state.totalItems = state.cart.reduce(
          (total, item) => total + item.quantity,
          0
        );
        saveCartToLocalStorage(state.cart);

        if (state.cart.length === 0) {
          localStorage.removeItem(CART_KEY);
          localStorage.removeItem(CART_ID_KEY);
          state.cartId = null;
        }
        state.loading = false;
      });
  },
});

/* =========================
   EXPORTS
========================= */

export const {
  clearCart,
  addCart,
  removeFromCart,
  setCartItems,
} = cartSlice.actions;

export default cartSlice.reducer;
