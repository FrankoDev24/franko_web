import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Utility Functions
const loadCartFromLocalStorage = () => {
  const savedCart = localStorage.getItem('cart');
  return savedCart ? JSON.parse(savedCart) : [];
};

const saveCartToLocalStorage = (cart) => {
  localStorage.setItem('cart', JSON.stringify(cart));
};

// Initial State
const initialState = {
  cart: loadCartFromLocalStorage(),
  totalItems: loadCartFromLocalStorage().reduce((total, item) => total + item.quantity, 0),
  cartId: localStorage.getItem('cartId') || uuidv4(),
  loading: false,
  error: null,
};

// Async Thunks
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (item, { rejectWithValue }) => {
    try {
      let cartId = localStorage.getItem('cartId');
      if (!cartId) {
        cartId = uuidv4(); // Generate new ID if not present
        localStorage.setItem('cartId', cartId);
      }

      const cartItem = {
        cartId,
        productId: item.productID,
        price: item.price,
        quantity: item.quantity,
      };

      const response = await axios.post('https://smfteapi.salesmate.app/Cart/Add-To-Cart', cartItem);
      return { ...cartItem, ...response.data }; 
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const getCartById = createAsyncThunk(
  'cart/getCartById',
  async (cartId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`https://smfteapi.salesmate.app/Cart/Cart-GetbyID/${cartId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCartItem = createAsyncThunk(
    'cart/updateCartItem',
    async ({ cartId, productId, quantity }, { rejectWithValue }) => {
      try {
        await axios.post(
          `https://smfteapi.salesmate.app/Cart/Cart-Update/${cartId}/${productId}/${quantity}`
        );
        // Explicitly return what the reducer needs
        return { productId, quantity };
      } catch (error) {
        return rejectWithValue(error.response?.data || error.message);
      }
    }
  );
  

export const deleteCartItem = createAsyncThunk(
  'cart/deleteCartItem',
  async ({ cartId, productId }, { rejectWithValue }) => {
    try {
      await axios.post(`https://smfteapi.salesmate.app/Cart/Cart-Delete/${cartId}/${productId}`);
      return { cartId, productId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Cart Slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addCart: (state, action) => {
      const itemIndex = state.cart.findIndex((item) => item.productId === action.payload.productId);
      if (itemIndex >= 0) {
        // Update quantity if item already exists
        state.cart[itemIndex].quantity += action.payload.quantity;
      } else {
        // Add new item to the cart
        state.cart.push({ ...action.payload, quantity: action.payload.quantity || 1 });
      }

      // Update total items in the cart
      state.totalItems = state.cart.reduce((total, item) => total + item.quantity, 0);
      saveCartToLocalStorage(state.cart);
      // Ensure cartId is set if not already set
      if (!localStorage.getItem('cartId')) {
        localStorage.setItem('cartId', uuidv4()); // Use uuidv4 directly to generate a new ID
      }
    },
    removeFromCart: (state, action) => {
      const itemIndex = state.cart.findIndex((item) => item.productId === action.payload.productId);
      
      if (itemIndex >= 0) {
        // Update total items
        state.totalItems -= state.cart[itemIndex].quantity;
    
        // Remove the item from the cart
        state.cart.splice(itemIndex, 1);
        saveCartToLocalStorage(state.cart);
    
        // Check if the cart is empty after removal
        if (state.cart.length === 0) {
          console.log("Cart is empty, removing cartId and cart from localStorage");
          localStorage.removeItem('cartId'); // Clear cartId from localStorage
          localStorage.removeItem('cart'); // Clear the cart from localStorage
        }
      }
    },
    clearCart: (state) => {
      state.cart = [];
      state.totalItems = 0;
      console.log("Clearing cart and removing cartId from localStorage");
      localStorage.removeItem('cartId'); // Clear cartId from localStorage
      localStorage.removeItem('cart'); // Clear the cart from localStorage
    },
    
    setCartItems: (state, action) => {
      state.cart = action.payload;
      state.totalItems = action.payload.reduce((total, item) => total + item.quantity, 0);
      saveCartToLocalStorage(state.cart);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        const existingItemIndex = state.cart.findIndex(item => item.productId === action.payload.productId);
        if (existingItemIndex >= 0) {
          state.cart[existingItemIndex].quantity += action.payload.quantity;
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
      .addCase(getCartById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCartById.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.totalItems = action.payload.reduce((total, item) => total + item.quantity, 0);
        state.loading = false;
        saveCartToLocalStorage(state.cart);
      })
      .addCase(getCartById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const { productId, quantity } = action.payload;
        const itemIndex = state.cart.findIndex(item => item.productId === productId);
      
        if (itemIndex !== -1) {
          state.cart[itemIndex].quantity = quantity;
        }
      
        state.loading = false; // <- make sure to stop loading!
        state.totalItems = state.cart.reduce((total, item) => total + item.quantity, 0);
        saveCartToLocalStorage(state.cart);
      })
      
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deleteCartItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        state.loading = false;
        // Filter out the deleted item from the cart
        state.cart = state.cart.filter(item => item.productId !== action.payload.productId);
        state.totalItems = state.cart.reduce((total, item) => total + item.quantity, 0); // Update total items
        saveCartToLocalStorage(state.cart);
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

// Exporting actions and reducer
export const { clearCart, addCart, removeFromCart, setCartItems } = cartSlice.actions;
export default cartSlice.reducer;
