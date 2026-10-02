// src/Redux/Slice/cartSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance";

const CART_KEY = "cart";
const CART_ID_KEY = "cartId";

// Keep the existing Telecel cart-ID policy and API endpoints.
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

export const generateTelCartId = () =>
  `${CART_ID_PREFIX}-${Date.now().toString(36)}-${randomSuffix()}`;

export const isTelCartId = (cartId) =>
  typeof cartId === "string" && cartId.startsWith(CART_ID_PREFIX);

/* ===========================
   NORMALIZATION
=========================== */

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

// Product endpoints use productID/productImage; cart endpoints use
// productId/imagePath. Normalize both into the cart-page fields.
const getProductId = (item) => firstValue(
  item?.productId,
  item?.productID,
  item?.ProductId,
  item?.ProductID,
  item?.id
);

const getProductName = (item) => firstValue(
  item?.productName,
  item?.ProductName,
  item?.name
) || "";

const getImagePath = (item) => firstValue(
  item?.imagePath,
  item?.ImagePath,
  item?.productImage,
  item?.ProductImage,
  item?.image
) || "";

const sameProductId = (left, right) =>
  left !== undefined && left !== null &&
  right !== undefined && right !== null &&
  String(left) === String(right);

const computeItemTotal = (unitPrice, quantity) =>
  parseFloat(unitPrice || 0) * parseInt(quantity || 1, 10);

/**
 * Return the canonical shape that Cart.jsx and TelCartSidebar both render.
 * Missing API metadata falls back to the known product/cart line.
 * Existing price interpretation is retained; this fix does not redefine the
 * backend's price-versus-line-total contract.
 */
const normalizeItem = (rawItem, knownUnitPrice = null, fallbackItem = {}) => {
  const item = rawItem || {};
  const fallback = fallbackItem || {};
  const quantity = parseInt(item.quantity || item.Quantity || 1, 10);

  let unitPrice;

  if (knownUnitPrice !== null && knownUnitPrice !== undefined && parseFloat(knownUnitPrice) > 0) {
    unitPrice = parseFloat(knownUnitPrice);
  } else if (parseFloat(item.unitPrice) > 0) {
    unitPrice = parseFloat(item.unitPrice);
  } else if (parseFloat(item.UnitPrice) > 0) {
    unitPrice = parseFloat(item.UnitPrice);
  } else {
    const rawPrice = parseFloat(item.price || item.Price || 0);

    // Preserved from the supplied slice. Reliable unitPrice/knownUnitPrice
    // fields take precedence, including prices supplied by useAddToCart.
    if (quantity > 1 && rawPrice > 0) {
      const possibleUnit = rawPrice / quantity;
      if (Math.abs(rawPrice - possibleUnit * quantity) < 0.01) {
        unitPrice = Math.round(possibleUnit * 100) / 100;
      } else {
        unitPrice = rawPrice;
      }
    } else {
      unitPrice = rawPrice;
    }
  }

  return {
    productId: getProductId(item) ?? getProductId(fallback),
    productName: getProductName(item) || getProductName(fallback),
    imagePath: getImagePath(item) || getImagePath(fallback),
    price: unitPrice,
    unitPrice,
    quantity,
    total: computeItemTotal(unitPrice, quantity),
    cartId: item.cartId || item.CartId || fallback.cartId || fallback.CartId,
    customerId: item.customerId || item.CustomerId ||
      fallback.customerId || fallback.CustomerId || null,
  };
};

const normalizeFromStorage = (item) => {
  const known = parseFloat(item?.unitPrice) || parseFloat(item?.UnitPrice) ||
    parseFloat(item?.price) || parseFloat(item?.Price) || 0;
  return normalizeItem(item, known > 0 ? known : null);
};

/* ===========================
   LOCAL STORAGE
=========================== */

const loadCartFromLocalStorage = () => {
  try {
    const savedCart = localStorage.getItem(CART_KEY);
    if (!savedCart) return [];
    const parsed = typeof savedCart === "string" ? JSON.parse(savedCart) : savedCart;
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

const clearStoredCart = () => {
  try {
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(CART_ID_KEY);
  } catch {
    /* localStorage may be unavailable */
  }
};

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
    return generateTelCartId();
  }
};

/* ===========================
   INITIAL STATE
=========================== */

const initialCart = loadCartFromLocalStorage();
const initialState = {
  cart: initialCart,
  totalItems: initialCart.reduce((total, item) => total + (item.quantity || 1), 0),
  cartId: getOrCreateCartId(),
  loading: false,
  error: null,
};

/* ===========================
   ASYNC THUNKS
=========================== */

// Shared implementation keeps addToCart/createCartItem metadata consistent.
const postCartItem = async (item, { rejectWithValue }) => {
  try {
    const cartId = getOrCreateCartId();
    const realUnitPrice = parseFloat(item.Price ?? item.price ?? item.unitPrice ?? item.UnitPrice ?? 0);
    const requestedQty = parseInt(item.Quantity || item.quantity || 1, 10);

    const cartItem = {
      CartId: item.CartId || item.cartId || cartId,
      ProductId: getProductId(item),
      ProductName: getProductName(item),
      ImagePath: getImagePath(item),
      Price: realUnitPrice,
      Quantity: requestedQty,
      CustomerId: item.CustomerId || item.customerId || null,
    };

    if (cartItem.ProductId === undefined || cartItem.ProductId === null || cartItem.ProductId === "") {
      throw new Error("ProductId is required");
    }

    const response = await axiosInstance.post("/", cartItem, {
      params: { endpoint: "/Cart/Add-To-Cart" },
    });

    const responseItem = response.data && typeof response.data === "object" &&
      !Array.isArray(response.data) ? response.data : {};

    // Do not overwrite API product fields with undefined payload values.
    // If the add endpoint returns only an acknowledgement, use cartItem's
    // product name and image as the metadata fallback instead.
    return normalizeItem({
      ...responseItem,
      productId: cartItem.ProductId,
      quantity: requestedQty,
      cartId: cartItem.CartId,
      customerId: cartItem.CustomerId,
    }, realUnitPrice, cartItem);
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
};

export const addToCart = createAsyncThunk("cart/addToCart", postCartItem);
export const createCartItem = createAsyncThunk("cart/createCartItem", postCartItem);

export const getCartById = createAsyncThunk(
  "cart/getCartById",
  async (_, { rejectWithValue, getState }) => {
    try {
      // Preserve the supplied slice's current Telecel-cart lookup policy.
      const cartId = getOrCreateCartId();
      const response = await axiosInstance.get("/", {
        params: { endpoint: `/Cart/Cart-GetbyID/${cartId}` },
      });

      if (!Array.isArray(response.data)) return response.data;

      const stateCart = getState().cart?.cart;
      const knownItems = new Map();

      // Read the latest Redux state after the request; an add may have completed
      // while it was in flight. Storage is an extra metadata fallback only:
      // membership/quantity still come from the fetched cart response.
      const existingItems = [
        ...loadCartFromLocalStorage(),
        ...(Array.isArray(stateCart) ? stateCart : []),
      ];

      existingItems.forEach((item) => {
        const id = getProductId(item);
        if (id === undefined || id === null || id === "") return;
        const key = String(id);
        const previous = knownItems.get(key) || {};
        const knownPrice = parseFloat(item.unitPrice) || parseFloat(item.UnitPrice) ||
          parseFloat(item.price) || parseFloat(item.Price) || previous.unitPrice || 0;

        knownItems.set(key, {
          ...previous,
          ...item,
          productId: id,
          productName: getProductName(item) || getProductName(previous),
          imagePath: getImagePath(item) || getImagePath(previous),
          unitPrice: knownPrice,
        });
      });

      return response.data.map((item) => {
        const id = getProductId(item);
        const known = id === undefined || id === null ? undefined : knownItems.get(String(id));
        return normalizeItem(item, known?.unitPrice || null, { ...known, cartId });
      });
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
        params: { endpoint: `/Cart/Cart-Update/${cartId}/${productId}/${quantity}` },
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
   REDUCER HELPERS
=========================== */

const syncCart = (state) => {
  state.totalItems = state.cart.reduce((total, item) => total + (item.quantity || 1), 0);
  saveCartToLocalStorage(state.cart);
};

const insertAddedItem = (state, incoming) => {
  const existing = state.cart.find((item) => sameProductId(item.productId, incoming.productId));

  if (existing) {
    // Repair an existing partial row too, instead of updating only its quantity.
    existing.productName = incoming.productName || existing.productName;
    existing.imagePath = incoming.imagePath || existing.imagePath;
    existing.quantity += incoming.quantity;
    existing.total = computeItemTotal(existing.unitPrice, existing.quantity);
  } else {
    state.cart.push(incoming);
  }

  state.cartId = incoming.cartId || state.cartId;
  syncCart(state);
};

/* ===========================
   SLICE
=========================== */

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addCart: (state, action) => {
      const knownPrice = parseFloat(
        action.payload.Price || action.payload.price || action.payload.unitPrice || 0
      );
      insertAddedItem(state, normalizeItem(action.payload, knownPrice > 0 ? knownPrice : null));
    },

    removeFromCart: (state, action) => {
      state.cart = state.cart.filter((item) =>
        !sameProductId(item.productId, getProductId(action.payload))
      );
      syncCart(state);
      if (state.cart.length === 0) {
        clearStoredCart();
        state.cartId = null;
      }
    },

    clearCart: (state) => {
      state.cart = [];
      state.totalItems = 0;
      clearStoredCart();
      state.cartId = null;
    },

    setCartItems: (state, action) => {
      state.cart = Array.isArray(action.payload)
        ? action.payload.map(normalizeFromStorage)
        : [];
      syncCart(state);
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
        insertAddedItem(state, action.payload);
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

        // Preserve the original guard for locally held lines after a Tel-ID remint.
        const localStorageHasItems = loadCartFromLocalStorage().length > 0;
        if (cartData.length === 0 && state.cart.length > 0 && localStorageHasItems) {
          syncCart(state);
          return;
        }

        state.cart = cartData;
        state.cartId = cartData[0]?.cartId || state.cartId;
        syncCart(state);
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
        state.loading = false;
        const { productId, quantity } = action.payload;
        const item = state.cart.find((line) => sameProductId(line.productId, productId));
        if (item) {
          item.quantity = quantity;
          item.total = computeItemTotal(item.unitPrice, quantity);
        }
        syncCart(state);
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
        state.loading = false;
        state.cart = state.cart.filter((item) =>
          !sameProductId(item.productId, action.payload.productId)
        );
        syncCart(state);
        if (state.cart.length === 0) {
          clearStoredCart();
          state.cartId = null;
        }
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
        state.loading = false;
        insertAddedItem(state, action.payload);
      })
      .addCase(createCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearCart, addCart, removeFromCart, setCartItems } = cartSlice.actions;
export default cartSlice.reducer;
