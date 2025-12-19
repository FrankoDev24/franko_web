
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const CART_KEY = 'cart';
const CART_ID_KEY = 'cartId';

// --- Load from secure localStorage ---
const loadCartFromLocalStorage = () => {
  const savedCart = localStorage.getItem(CART_KEY);
  // ⚠️ no JSON.parse needed — it's already decrypted and parsed
  return Array.isArray(savedCart) ? savedCart : [];
};

// --- Save to secure localStorage ---
const saveCartToLocalStorage = (cart) => {
  // ⚠️ no JSON.stringify — encryption handles it
  localStorage.setItem(CART_KEY, cart);
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

// --- Initial State ---
const initialState = {
  cart: loadCartFromLocalStorage(),
  totalItems: loadCartFromLocalStorage().reduce((total, item) => total + item.quantity, 0),
  cartId: getOrCreateCartId(),
  loading: false,
  error: null,
};

// ...rest of your slice logic (reducers, thunks, etc.)


// --- Thunks ---

export const addToCart = createAsyncThunk('cart/addToCart', async (item, { rejectWithValue }) => {
  try {
    const cartId = getOrCreateCartId();
    const cartItem = {
      cartId,
      productId: item.productID,
      price: item.price,
      quantity: item.quantity,
    };

    const response = await axios.post('https://smfteapi.salesmate.app/Cart/Add-To-Cart', cartItem);
    return { ...cartItem, ...response.data };
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const createCartItem = createAsyncThunk('cart/createCartItem', async (item, { rejectWithValue }) => {
  try {
    const cartId = getOrCreateCartId();
    const response = await axios.post('https://smfteapi.salesmate.app/Cart/Add-To-Cart', { ...item, cartId });
    return { ...item, ...response.data };
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const getCartById = createAsyncThunk('cart/getCartById', async (_, { rejectWithValue }) => {
  try {
    const cartId = getOrCreateCartId();
    const response = await axios.get(`https://smfteapi.salesmate.app/Cart/Cart-GetbyID/${cartId}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to fetch cart');
  }
});

export const updateCartItem = createAsyncThunk('cart/updateCartItem', async ({ productId, quantity }, { rejectWithValue }) => {
  try {
    const cartId = getOrCreateCartId();
    const response = await axios.post(
      `https://smfteapi.salesmate.app/Cart/Cart-Update/${cartId}/${productId}/${quantity}`
    );
    return { cartId, productId, quantity };
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const deleteCartItem = createAsyncThunk('cart/deleteCartItem', async ({ productId }, { rejectWithValue }) => {
  try {
    const cartId = getOrCreateCartId();
    await axios.post(`https://smfteapi.salesmate.app/Cart/Cart-Delete/${cartId}/${productId}`);
    return { cartId, productId };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// --- Slice ---
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addCart: (state, action) => {
      const existingItemIndex = state.cart.findIndex(item => item.productId === action.payload.productId);
      if (existingItemIndex >= 0) {
        state.cart[existingItemIndex].quantity += action.payload.quantity;
      } else {
        state.cart.push({ ...action.payload, quantity: action.payload.quantity || 1 });
      }
      state.totalItems = state.cart.reduce((total, item) => total + item.quantity, 0);
      saveCartToLocalStorage(state.cart);
    },
    removeFromCart: (state, action) => {
      const index = state.cart.findIndex(item => item.productId === action.payload.productId);
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
      state.totalItems = action.payload.reduce((total, item) => total + item.quantity, 0);
      saveCartToLocalStorage(state.cart);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addToCart.pending, state => { state.loading = true; })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.cart.findIndex(item => item.productId === action.payload.productId);
        if (index >= 0) {
          state.cart[index].quantity += action.payload.quantity;
        } else {
          state.cart.push(action.payload);
        }
        state.totalItems = state.cart.reduce((total, item) => total + item.quantity, 0);
        saveCartToLocalStorage(state.cart);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(getCartById.pending, state => { state.loading = true; })
      .addCase(getCartById.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.totalItems = action.payload.reduce((total, item) => total + item.quantity, 0);
        saveCartToLocalStorage(state.cart);
      })
      .addCase(getCartById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateCartItem.pending, state => { state.loading = true; })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const { productId, quantity } = action.payload;
        const index = state.cart.findIndex(item => item.productId === productId);
        if (index !== -1) {
          state.cart[index].quantity = quantity;
        }
        state.totalItems = state.cart.reduce((total, item) => total + item.quantity, 0);
        saveCartToLocalStorage(state.cart);
        state.loading = false;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteCartItem.pending, state => { state.loading = true; })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        state.cart = state.cart.filter(item => item.productId !== action.payload.productId);
        state.totalItems = state.cart.reduce((total, item) => total + item.quantity, 0);
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
      .addCase(createCartItem.pending, state => { state.loading = true; })
      .addCase(createCartItem.fulfilled, (state, action) => {
        const index = state.cart.findIndex(item => item.productId === action.payload.productId);
        if (index >= 0) {
          state.cart[index].quantity += action.payload.quantity;
        } else {
          state.cart.push(action.payload);
        }
        state.totalItems = state.cart.reduce((total, item) => total + item.quantity, 0);
        saveCartToLocalStorage(state.cart);
        state.loading = false;
      })
      .addCase(createCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  }
});

// --- Exports ---
export const { clearCart, addCart, removeFromCart, setCartItems } = cartSlice.actions;
export default cartSlice.reducer;