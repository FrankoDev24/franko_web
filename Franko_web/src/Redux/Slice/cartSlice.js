import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import axiosInstance from "./AxiosInstance";

const CART_KEY = "cart";
const CART_ID_KEY = "cartId";

/* ===========================
   UTILITY
=========================== */

/**
 * ✅ FIX: Always compute item total from price × quantity.
 * Never store or trust a pre-computed `total` field.
 */
const computeItemTotal = (price, quantity) => {
  return parseFloat(price || 0) * parseInt(quantity || 1, 10);
};

/**
 * Normalize a raw API cart item into a consistent camelCase shape.
 * total is always recomputed — never taken from the API payload.
 */
const normalizeItem = (item) => {
  const price = parseFloat(item.price || item.Price || 0);
  const quantity = parseInt(item.quantity || item.Quantity || 1, 10);
  return {
    productId: item.productId || item.ProductId,
    productName: item.productName || item.ProductName,
    imagePath: item.imagePath || item.ImagePath,
    price,
    quantity,
    // ✅ total is always price × quantity — single source of truth
    total: computeItemTotal(price, quantity),
    cartId: item.cartId || item.CartId,
    customerId: item.customerId || item.CustomerId || null,
  };
};

/* ===========================
   LOCAL STORAGE HELPERS
=========================== */

const loadCartFromLocalStorage = () => {
  try {
    const savedCart = localStorage.getItem(CART_KEY);
    if (!savedCart) return [];
    const parsed = JSON.parse(savedCart);
    // Re-normalize on load so totals are always correct even for old data
    return Array.isArray(parsed) ? parsed.map(item => normalizeItem(item)) : [];
  } catch {
    return [];
  }
};

const saveCartToLocalStorage = (cart) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // silently fail
  }
};

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
   ASYNC THUNKS
=========================== */

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (item, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();

      const cartItem = {
        CartId: item.CartId || cartId,
        ProductId: item.ProductId || item.productId || item.productID,
        ProductName: item.ProductName || item.productName || item.name,
        ImagePath: item.ImagePath || item.imagePath || item.productImage,
        Price: item.Price || item.price,
        Quantity: item.Quantity || item.quantity || 1,
        CustomerId: item.CustomerId || item.customerId || null,
      };

      if (!cartItem.ProductId) {
        throw new Error("ProductId is required");
      }

      const response = await axiosInstance.post("/", cartItem, {
        params: { endpoint: "/Cart/Add-To-Cart" },
      });

      // ✅ Normalize response — total always recomputed
      return normalizeItem({
        ...response.data,
        productId: cartItem.ProductId,
        productName: cartItem.ProductName,
        imagePath: cartItem.ImagePath,
        price: cartItem.Price,
        quantity: cartItem.Quantity,
        cartId: cartItem.CartId,
        customerId: cartItem.CustomerId,
      });
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const createCartItem = createAsyncThunk(
  "cart/createCartItem",
  async (item, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();

      const cartItem = {
        CartId: item.CartId || cartId,
        ProductId: item.ProductId || item.productId || item.productID,
        ProductName: item.ProductName || item.productName || item.name,
        ImagePath: item.ImagePath || item.imagePath || item.productImage,
        Price: item.Price || item.price,
        Quantity: item.Quantity || item.quantity || 1,
        CustomerId: item.CustomerId || item.customerId || null,
      };

      const response = await axiosInstance.post("/", cartItem, {
        params: { endpoint: "/Cart/Add-To-Cart" },
      });

      return normalizeItem({
        ...response.data,
        productId: cartItem.ProductId,
        productName: cartItem.ProductName,
        imagePath: cartItem.ImagePath,
        price: cartItem.Price,
        quantity: cartItem.Quantity,
        cartId: cartItem.CartId,
      });
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getCartById = createAsyncThunk(
  "cart/getCartById",
  async (_, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();

      const response = await axiosInstance.get("/", {
        params: { endpoint: `/Cart/Cart-GetbyID/${cartId}` },
      });

      if (Array.isArray(response.data)) {
        // ✅ FIX: Normalize every item — total always recomputed from price × qty
        return response.data.map(item => normalizeItem(item));
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch cart");
    }
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async (params, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();
      const productId = params.ProductId || params.productId;
      const quantity = params.Quantity || params.quantity;

      if (!productId) throw new Error("ProductId is required");

      await axiosInstance.post("/", null, {
        params: {
          endpoint: `/Cart/Cart-Update/${cartId}/${productId}/${quantity}`,
        },
      });

      return { cartId, productId, quantity: parseInt(quantity, 10) };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const deleteCartItem = createAsyncThunk(
  "cart/deleteCartItem",
  async (params, { rejectWithValue }) => {
    try {
      const cartId = getOrCreateCartId();
      const productId = params.ProductId || params.productId;

      if (!productId) throw new Error("ProductId is required");

      await axiosInstance.post("/", null, {
        params: {
          endpoint: `/Cart/Cart-Delete/${cartId}/${productId}`,
        },
      });

      return { cartId, productId };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
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
      const incoming = normalizeItem(action.payload);
      const existingIndex = state.cart.findIndex(
        (item) => item.productId === incoming.productId
      );
      if (existingIndex >= 0) {
        const updated = state.cart[existingIndex];
        updated.quantity += incoming.quantity;
        // ✅ Recompute total after quantity change
        updated.total = computeItemTotal(updated.price, updated.quantity);
      } else {
        state.cart.push(incoming);
      }
      state.totalItems = state.cart.reduce((t, i) => t + (i.quantity || 1), 0);
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
      const items = Array.isArray(action.payload)
        ? action.payload.map(item => normalizeItem(item))
        : [];
      state.cart = items;
      state.totalItems = items.reduce((t, i) => t + (i.quantity || 1), 0);
      saveCartToLocalStorage(state.cart);
    },
  },

  extraReducers: (builder) => {
    builder
      // ── addToCart ──────────────────────────────────────────
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload; // already normalized
        const index = state.cart.findIndex(
          (item) => item.productId === payload.productId
        );
        if (index >= 0) {
          state.cart[index].quantity += payload.quantity;
          // ✅ Recompute total
          state.cart[index].total = computeItemTotal(
            state.cart[index].price,
            state.cart[index].quantity
          );
        } else {
          state.cart.push(payload);
        }
        state.totalItems = state.cart.reduce((t, i) => t + (i.quantity || 1), 0);
        saveCartToLocalStorage(state.cart);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // ── getCartById ────────────────────────────────────────
      .addCase(getCartById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCartById.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ FIX: payload is already normalized (total = price × qty)
        const cartData = Array.isArray(action.payload) ? action.payload : [];
        state.cart = cartData;
        state.totalItems = cartData.reduce((t, i) => t + (i.quantity || 1), 0);
        saveCartToLocalStorage(state.cart);
      })
      .addCase(getCartById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // ── updateCartItem ─────────────────────────────────────
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        const { productId, quantity } = action.payload;
        const index = state.cart.findIndex((item) => item.productId === productId);
        if (index !== -1) {
          state.cart[index].quantity = quantity;
          // ✅ FIX: Recompute total after quantity update
          state.cart[index].total = computeItemTotal(
            state.cart[index].price,
            quantity
          );
        }
        state.totalItems = state.cart.reduce((t, i) => t + (i.quantity || 1), 0);
        saveCartToLocalStorage(state.cart);
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // ── deleteCartItem ─────────────────────────────────────
      .addCase(deleteCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = state.cart.filter(
          (item) => item.productId !== action.payload.productId
        );
        state.totalItems = state.cart.reduce((t, i) => t + (i.quantity || 1), 0);
        saveCartToLocalStorage(state.cart);
        if (state.cart.length === 0) {
          localStorage.removeItem(CART_KEY);
          localStorage.removeItem(CART_ID_KEY);
          state.cartId = null;
        }
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // ── createCartItem ─────────────────────────────────────
      .addCase(createCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCartItem.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload; // already normalized
        const index = state.cart.findIndex(
          (item) => item.productId === payload.productId
        );
        if (index >= 0) {
          state.cart[index].quantity += payload.quantity;
          // ✅ Recompute total
          state.cart[index].total = computeItemTotal(
            state.cart[index].price,
            state.cart[index].quantity
          );
        } else {
          state.cart.push(payload);
        }
        state.totalItems = state.cart.reduce((t, i) => t + (i.quantity || 1), 0);
        saveCartToLocalStorage(state.cart);
      })
      .addCase(createCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearCart, addCart, removeFromCart, setCartItems } = cartSlice.actions;
export default cartSlice.reducer;