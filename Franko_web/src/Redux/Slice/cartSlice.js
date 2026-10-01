// src/Redux/Slice/cartSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance";

const CART_KEY = "cart";
const CART_ID_KEY = "cartId";

/* ============================================================================
   CART ID — "Tel" prefix
   ----------------------------------------------------------------------------
   This is the ONLY behavioural change from the previous version: cart ids are
   minted with a "Tel-" prefix instead of a bare uuid, so orders placed from this
   cart are identifiable as Speed Shopping orders on the backend.

   Everything else is untouched: same thunks, same state shape, same localStorage
   keys ("cart" / "cartId"), same endpoints, same reducers that Cart.jsx and
   Checkout.jsx already consume.

   ENFORCE_TEL_PREFIX:
     true  (default) — a stored id without the prefix is re-minted on load, so
                       every cart id begins with "Tel".
     false           — existing ids are left alone; only NEW carts get the prefix.
   ========================================================================== */

const CART_ID_PREFIX = "Tel";
const ENFORCE_TEL_PREFIX = true;

const randomSuffix = () => {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    }
  } catch {
    /* fall through to Math.random */
  }
  return Math.random().toString(36).slice(2, 10);
};

/** e.g. "Tel-m3k9x1-7fa2c1b4" — always starts with "Tel-" */
export const generateTelCartId = () =>
  `${CART_ID_PREFIX}-${Date.now().toString(36)}-${randomSuffix()}`;

export const isTelCartId = (cartId) =>
  typeof cartId === "string" && cartId.startsWith(CART_ID_PREFIX);

/* ===========================
   UTILITY
=========================== */

const computeItemTotal = (unitPrice, quantity) => {
  return parseFloat(unitPrice || 0) * parseInt(quantity || 1, 10);
};

/**
 * Normalize a raw API cart item.
 *
 * knownUnitPrice — when provided, is always trusted as the true per-unit cost.
 * Without it the function tries to detect pre-multiplied prices, but that
 * heuristic CANNOT work when quantity === 1 (no way to tell 2420×1 from 1210×2
 * that was later changed to qty 1 on the server).
 */
const normalizeItem = (item, knownUnitPrice = null) => {
  const quantity = parseInt(item.quantity || item.Quantity || 1, 10);

  let unitPrice;

  // Priority 1: explicitly provided known unit price
  if (knownUnitPrice !== null && knownUnitPrice !== undefined && parseFloat(knownUnitPrice) > 0) {
    unitPrice = parseFloat(knownUnitPrice);
  }
  // Priority 2: API provides a dedicated unitPrice field
  else if (parseFloat(item.unitPrice) > 0) {
    unitPrice = parseFloat(item.unitPrice);
  } else if (parseFloat(item.UnitPrice) > 0) {
    unitPrice = parseFloat(item.UnitPrice);
  }
  // Priority 3: derive from raw price
  else {
    const rawPrice = parseFloat(item.price || item.Price || 0);

    if (quantity > 1 && rawPrice > 0) {
      const possibleUnit = rawPrice / quantity;
      // If evenly divisible, API likely sent line total
      if (Math.abs(rawPrice - possibleUnit * quantity) < 0.01) {
        unitPrice = Math.round(possibleUnit * 100) / 100;
      } else {
        unitPrice = rawPrice;
      }
    } else {
      // qty === 1: cannot detect inflation — take rawPrice as-is
      unitPrice = rawPrice;
    }
  }

  return {
    productId: item.productId || item.ProductId,
    productName: item.productName || item.ProductName,
    imagePath: item.imagePath || item.ImagePath,
    price: unitPrice,
    unitPrice: unitPrice,
    quantity,
    total: computeItemTotal(unitPrice, quantity),
    cartId: item.cartId || item.CartId,
    customerId: item.customerId || item.CustomerId || null,
  };
};

/**
 * For items loaded from localStorage we already saved the corrected
 * unitPrice, so pass it as known to avoid re-applying heuristics.
 */
const normalizeFromStorage = (item) => {
  const known = parseFloat(item.unitPrice) || parseFloat(item.price) || 0;
  return normalizeItem(item, known > 0 ? known : null);
};

/* ===========================
   LOCAL STORAGE HELPERS
=========================== */

const loadCartFromLocalStorage = () => {
  try {
    const savedCart = localStorage.getItem(CART_KEY);
    if (!savedCart) return [];
    const parsed =
      typeof savedCart === "string" ? JSON.parse(savedCart) : savedCart;
    return Array.isArray(parsed) ? parsed.map(normalizeFromStorage) : [];
  } catch {
    return [];
  }
};

const saveCartToLocalStorage = (cart) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* silent */
  }
};

/**
 * Returns the cart id, always minted with the "Tel-" prefix.
 * A stored id that does not start with "Tel" is replaced when
 * ENFORCE_TEL_PREFIX is on — the old server-side cart is left as-is, and the
 * local line items (keyed by productId) carry over untouched.
 */
export const getOrCreateCartId = () => {
  try {
    let cartId = localStorage.getItem(CART_ID_KEY);

    if (cartId && isTelCartId(cartId)) return cartId;

    if (cartId && !ENFORCE_TEL_PREFIX) return cartId;

    if (cartId) {
      console.warn(
        `[cart] Replacing cart id "${cartId}" with a "Tel"-prefixed id. ` +
          "Set ENFORCE_TEL_PREFIX = false to keep legacy ids."
      );
    }

    cartId = generateTelCartId();
    localStorage.setItem(CART_ID_KEY, cartId);
    return cartId;
  } catch {
    // localStorage unavailable (SSR / privacy mode) — still return a valid id
    return generateTelCartId();
  }
};

/* ===========================
   INITIAL STATE
=========================== */

const initialCart = loadCartFromLocalStorage();

const initialState = {
  cart: initialCart,
  totalItems: initialCart.reduce(
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
      const realUnitPrice = parseFloat(item.Price || item.price || 0);
      const requestedQty = parseInt(item.Quantity || item.quantity || 1, 10);

      const cartItem = {
        CartId: item.CartId || cartId,
        ProductId: item.ProductId || item.productId || item.productID,
        ProductName: item.ProductName || item.productName || item.name,
        ImagePath: item.ImagePath || item.imagePath || item.productImage,
        Price: realUnitPrice,
        Quantity: requestedQty,
        CustomerId: item.CustomerId || item.customerId || null,
      };

      if (!cartItem.ProductId) throw new Error("ProductId is required");

      const response = await axiosInstance.post("/", cartItem, {
        params: { endpoint: "/Cart/Add-To-Cart" },
      });

      return normalizeItem(
        {
          ...response.data,
          productId: cartItem.ProductId,
          productName: cartItem.ProductName,
          imagePath: cartItem.ImagePath,
          quantity: requestedQty,
          cartId: cartItem.CartId,
          customerId: cartItem.CustomerId,
        },
        realUnitPrice
      );
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
      const realUnitPrice = parseFloat(item.Price || item.price || 0);
      const requestedQty = parseInt(item.Quantity || item.quantity || 1, 10);

      const cartItem = {
        CartId: item.CartId || cartId,
        ProductId: item.ProductId || item.productId || item.productID,
        ProductName: item.ProductName || item.productName || item.name,
        ImagePath: item.ImagePath || item.imagePath || item.productImage,
        Price: realUnitPrice,
        Quantity: requestedQty,
        CustomerId: item.CustomerId || item.customerId || null,
      };

      const response = await axiosInstance.post("/", cartItem, {
        params: { endpoint: "/Cart/Add-To-Cart" },
      });

      return normalizeItem(
        {
          ...response.data,
          productId: cartItem.ProductId,
          productName: cartItem.ProductName,
          imagePath: cartItem.ImagePath,
          quantity: requestedQty,
          cartId: cartItem.CartId,
        },
        realUnitPrice
      );
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Fetches the cart for the current ("Tel") cart id and cross-references unit
 * prices already known in Redux, so a qty=1 line whose API price is inflated
 * is corrected instead of accepted as-is.
 */
export const getCartById = createAsyncThunk(
  "cart/getCartById",
  async (_, { rejectWithValue, getState }) => {
    try {
      const cartId = getOrCreateCartId();

      const response = await axiosInstance.get("/", {
        params: { endpoint: `/Cart/Cart-GetbyID/${cartId}` },
      });

      if (Array.isArray(response.data)) {
        // Build a lookup of known correct unit prices from current Redux state
        const existingCart = getState().cart.cart || [];
        const knownPriceMap = {};
        existingCart.forEach((item) => {
          if (item.productId && item.unitPrice > 0) {
            knownPriceMap[item.productId] = item.unitPrice;
          }
        });

        return response.data.map((item) => {
          const pid = item.productId || item.ProductId;
          const knownUnit = knownPriceMap[pid] || null;
          return normalizeItem(item, knownUnit);
        });
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
        params: { endpoint: `/Cart/Cart-Delete/${cartId}/${productId}` },
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
      const knownPrice = parseFloat(
        action.payload.Price ||
          action.payload.price ||
          action.payload.unitPrice ||
          0
      );
      const incoming = normalizeItem(action.payload, knownPrice > 0 ? knownPrice : null);
      const existingIndex = state.cart.findIndex(
        (item) => item.productId === incoming.productId
      );
      if (existingIndex >= 0) {
        const updated = state.cart[existingIndex];
        updated.quantity += incoming.quantity;
        updated.total = computeItemTotal(updated.unitPrice, updated.quantity);
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
        ? action.payload.map((item) => normalizeFromStorage(item))
        : [];
      state.cart = items;
      state.totalItems = items.reduce((t, i) => t + (i.quantity || 1), 0);
      saveCartToLocalStorage(state.cart);
    },
  },

  extraReducers: (builder) => {
    builder
      // ── addToCart ──
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
          state.cart[index].quantity += payload.quantity;
          state.cart[index].total = computeItemTotal(
            state.cart[index].unitPrice,
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

      // ── getCartById ──
      .addCase(getCartById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCartById.fulfilled, (state, action) => {
        state.loading = false;
        const cartData = Array.isArray(action.payload) ? action.payload : [];

        // Guard: a brand-new "Tel" cart id returns an empty array from the API.
        // Without this, mounting Cart.jsx would wipe a locally-held cart.
        const localStorageHasItems = loadCartFromLocalStorage().length > 0;
        if (cartData.length === 0 && state.cart.length > 0 && localStorageHasItems) {
          state.totalItems = state.cart.reduce((t, i) => t + (i.quantity || 1), 0);
          saveCartToLocalStorage(state.cart);
          return;
        }

        state.cart = cartData;
        state.totalItems = cartData.reduce((t, i) => t + (i.quantity || 1), 0);
        saveCartToLocalStorage(state.cart);
      })
      .addCase(getCartById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // ── updateCartItem ──
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
          state.cart[index].total = computeItemTotal(
            state.cart[index].unitPrice,
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

      // ── deleteCartItem ──
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

      // ── createCartItem ──
      .addCase(createCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCartItem.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        const index = state.cart.findIndex(
          (item) => item.productId === payload.productId
        );
        if (index >= 0) {
          state.cart[index].quantity += payload.quantity;
          state.cart[index].total = computeItemTotal(
            state.cart[index].unitPrice,
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
