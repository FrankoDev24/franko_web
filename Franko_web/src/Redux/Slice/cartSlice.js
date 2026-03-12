// src/Redux/Slice/cartSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import axiosInstance from "./AxiosInstance";

const CART_KEY = "cart";
const CART_ID_KEY = "cartId";

/* ===========================
   UTILITY
=========================== */

/**
 * ✅ FIX: Always compute item total from unitPrice × quantity.
 */
const computeItemTotal = (unitPrice, quantity) => {
  return parseFloat(unitPrice || 0) * parseInt(quantity || 1, 10);
};

/**
 * ✅ FIX: Normalize a raw API cart item into a consistent shape.
 * 
 * CRITICAL: The API may return `price` as the LINE TOTAL (price × qty)
 * instead of the UNIT PRICE. We must detect and correct this.
 * 
 * We store `unitPrice` as the single-item price and always compute
 * `total` from `unitPrice × quantity`.
 */
const normalizeItem = (item, knownUnitPrice = null) => {
  const quantity = parseInt(
    item.quantity || item.Quantity || 1,
    10
  );

  // ✅ FIX: Determine the TRUE unit price
  // Priority:
  // 1. Explicitly passed knownUnitPrice (from addToCart where we know the real price)
  // 2. item.unitPrice / item.UnitPrice (if API provides it separately)
  // 3. If item.price looks like a line total (price / qty gives a round number
  //    and qty > 1), extract the unit price
  // 4. Fall back to item.price / item.Price as-is
  let unitPrice;

  if (knownUnitPrice !== null && knownUnitPrice !== undefined) {
    // We explicitly know the unit price (e.g., from the product page)
    unitPrice = parseFloat(knownUnitPrice);
  } else if (item.unitPrice !== undefined || item.UnitPrice !== undefined) {
    // API provides a separate unitPrice field
    unitPrice = parseFloat(item.unitPrice || item.UnitPrice || 0);
  } else {
    // ✅ FIX: The API's `price` field might be the line total
    // We need to check if dividing by quantity gives a clean number
    const rawPrice = parseFloat(item.price || item.Price || 0);

    if (quantity > 1 && rawPrice > 0) {
      const possibleUnitPrice = rawPrice / quantity;
      // Check if this division results in a reasonable price
      // (i.e., it's a clean division — the API multiplied unit × qty)
      if (Number.isFinite(possibleUnitPrice) && possibleUnitPrice > 0) {
        // Heuristic: if rawPrice is exactly divisible by quantity,
        // the API likely sent us a pre-multiplied total
        const remainder = rawPrice % quantity;
        if (Math.abs(remainder) < 0.01) {
          unitPrice = possibleUnitPrice;
          console.warn(
            `[cartSlice] Detected pre-multiplied price for "${item.productName || item.ProductName}": ` +
            `API price=${rawPrice}, qty=${quantity}, extracted unitPrice=${unitPrice}`
          );
        } else {
          // Not evenly divisible — treat rawPrice as the actual unit price
          unitPrice = rawPrice;
        }
      } else {
        unitPrice = rawPrice;
      }
    } else {
      // quantity is 1, so price IS the unit price
      unitPrice = rawPrice;
    }
  }

  return {
    productId: item.productId || item.ProductId,
    productName: item.productName || item.ProductName,
    imagePath: item.imagePath || item.ImagePath,
    // ✅ Store the TRUE unit price — never the line total
    price: unitPrice,
    unitPrice: unitPrice,
    quantity,
    // ✅ total is always unitPrice × quantity
    total: computeItemTotal(unitPrice, quantity),
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
    // ✅ Re-normalize on load — but for localStorage items we trust the
    // stored unitPrice since we already corrected it when saving
    return Array.isArray(parsed)
      ? parsed.map((item) => {
          // If we previously saved a unitPrice, use that as the known price
          const known = item.unitPrice || item.price;
          return normalizeItem(item, known);
        })
      : [];
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

      // ✅ Capture the REAL unit price before sending to API
      const realUnitPrice = parseFloat(
        item.Price || item.price || 0
      );
      const requestedQty = parseInt(
        item.Quantity || item.quantity || 1,
        10
      );

      const cartItem = {
        CartId: item.CartId || cartId,
        ProductId: item.ProductId || item.productId || item.productID,
        ProductName: item.ProductName || item.productName || item.name,
        ImagePath: item.ImagePath || item.imagePath || item.productImage,
        Price: realUnitPrice,
        Quantity: requestedQty,
        CustomerId: item.CustomerId || item.customerId || null,
      };

      if (!cartItem.ProductId) {
        throw new Error("ProductId is required");
      }

      const response = await axiosInstance.post("/", cartItem, {
        params: { endpoint: "/Cart/Add-To-Cart" },
      });

      // ✅ FIX: Pass the known unit price so normalizeItem doesn't
      // mistake a pre-multiplied API price for the unit price
      return normalizeItem(
        {
          ...response.data,
          productId: cartItem.ProductId,
          productName: cartItem.ProductName,
          imagePath: cartItem.ImagePath,
          price: realUnitPrice, // ✅ Always use the real unit price
          quantity: requestedQty,
          cartId: cartItem.CartId,
          customerId: cartItem.CustomerId,
        },
        realUnitPrice // ✅ Explicitly tell normalizeItem the unit price
      );
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

      const realUnitPrice = parseFloat(
        item.Price || item.price || 0
      );
      const requestedQty = parseInt(
        item.Quantity || item.quantity || 1,
        10
      );

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
          price: realUnitPrice,
          quantity: requestedQty,
          cartId: cartItem.CartId,
        },
        realUnitPrice
      );
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
        params: { endpoint: `/Cart/Cart-GetbyID/${cartId}` },
      });

      if (Array.isArray(response.data)) {
        // ✅ FIX: Log raw API response so we can see what the server sends
        console.group("🔍 Raw Cart API Response");
        response.data.forEach((item, i) => {
          console.log(`Item ${i + 1}:`, {
            productName: item.productName || item.ProductName,
            price: item.price || item.Price,
            unitPrice: item.unitPrice || item.UnitPrice || "N/A",
            quantity: item.quantity || item.Quantity,
            total: item.total || item.Total || "N/A",
          });
        });
        console.groupEnd();

        // ✅ FIX: Normalize items — the normalizeItem function will
        // detect if price is actually a line total and extract unit price
        return response.data.map((item) => normalizeItem(item));
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

      return {
        cartId,
        productId,
        quantity: parseInt(quantity, 10),
      };
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
      const productId = params.ProductId || params.productId;

      if (!productId) throw new Error("ProductId is required");

      await axiosInstance.post("/", null, {
        params: {
          endpoint: `/Cart/Cart-Delete/${cartId}/${productId}`,
        },
      });

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
      const knownPrice = parseFloat(
        action.payload.Price ||
        action.payload.price ||
        action.payload.unitPrice ||
        0
      );
      const incoming = normalizeItem(action.payload, knownPrice);
      const existingIndex = state.cart.findIndex(
        (item) => item.productId === incoming.productId
      );
      if (existingIndex >= 0) {
        const updated = state.cart[existingIndex];
        updated.quantity += incoming.quantity;
        updated.total = computeItemTotal(updated.price, updated.quantity);
      } else {
        state.cart.push(incoming);
      }
      state.totalItems = state.cart.reduce(
        (t, i) => t + (i.quantity || 1),
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
      const items = Array.isArray(action.payload)
        ? action.payload.map((item) => {
            const known = item.unitPrice || item.price;
            return normalizeItem(item, known);
          })
        : [];
      state.cart = items;
      state.totalItems = items.reduce(
        (t, i) => t + (i.quantity || 1),
        0
      );
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
        const payload = action.payload; // already normalized with correct unitPrice

        const index = state.cart.findIndex(
          (item) => item.productId === payload.productId
        );

        if (index >= 0) {
          // ✅ FIX: Don't add quantity again — the server already
          // incremented it. Instead, just set the new quantity.
          // After this, we'll refetch with getCartById anyway.
          state.cart[index].quantity += payload.quantity;
          state.cart[index].total = computeItemTotal(
            state.cart[index].price,
            state.cart[index].quantity
          );
        } else {
          state.cart.push(payload);
        }

        state.totalItems = state.cart.reduce(
          (t, i) => t + (i.quantity || 1),
          0
        );
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
        // ✅ FIX: Payload is already normalized with correct unit prices
        const cartData = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.cart = cartData;
        state.totalItems = cartData.reduce(
          (t, i) => t + (i.quantity || 1),
          0
        );
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
        const index = state.cart.findIndex(
          (item) => item.productId === productId
        );
        if (index !== -1) {
          state.cart[index].quantity = quantity;
          // ✅ FIX: Use the stored unitPrice (which we already corrected)
          state.cart[index].total = computeItemTotal(
            state.cart[index].price,
            quantity
          );
        }
        state.totalItems = state.cart.reduce(
          (t, i) => t + (i.quantity || 1),
          0
        );
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
        state.totalItems = state.cart.reduce(
          (t, i) => t + (i.quantity || 1),
          0
        );
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
        const payload = action.payload;
        const index = state.cart.findIndex(
          (item) => item.productId === payload.productId
        );
        if (index >= 0) {
          state.cart[index].quantity += payload.quantity;
          state.cart[index].total = computeItemTotal(
            state.cart[index].price,
            state.cart[index].quantity
          );
        } else {
          state.cart.push(payload);
        }
        state.totalItems = state.cart.reduce(
          (t, i) => t + (i.quantity || 1),
          0
        );
        saveCartToLocalStorage(state.cart);
      })
      .addCase(createCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearCart, addCart, removeFromCart, setCartItems } =
  cartSlice.actions;
export default cartSlice.reducer;