// src/Redux/Slice/telCartSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance";

/* ============================================================================
   TELECEL SPEED SHOPPING CART  —  deliberately bypasses the standard flow
   ----------------------------------------------------------------------------
   * Every id starts with "Tel": the cart id (Tel-m3k9x1-7fa2c1b4) and every
     line item id (cartItemId) too.
   * Own localStorage key, own slice, own checkout route. The standard
     cartSlice (uuid ids, "cart"/"cartId" keys) is never touched, so a customer
     can hold a normal cart and a Speed Shopping cart at the same time.
   * Server-side the same /Cart/* endpoints are used, but always with the
     "Tel-…" CartId, which keeps the promo cart separate from the normal one.

   IMPORTANT — the "Tel" prefix is enforced in three places:
     1. generateTelId()  — ids are minted with the prefix
     2. isTelCartId()    — guards every backend call that carries the id
     3. loadTelCart()    — an id without the prefix is discarded and re-minted
   ========================================================================== */

export const TEL_CART_STORAGE_KEY = "telecel_speed_cart";
export const TEL_CART_PREFIX = "Tel";
export const TEL_CART_ROUTE = "/tel-cart";
export const TEL_CHECKOUT_ROUTE = "/tel-checkout";

/* ===========================  UTILITIES  =========================== */

const safeStorage = () => {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const firstDefined = (...values) =>
  values.find((v) => v !== undefined && v !== null && v !== "");

const randomSuffix = () => {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    }
  } catch {
    /* fall through */
  }
  return Math.random().toString(36).slice(2, 10);
};

/** Mint a new id that is guaranteed to start with "Tel". */
export const generateTelId = () =>
  `${TEL_CART_PREFIX}-${Date.now().toString(36)}-${randomSuffix()}`;

/** Single source of truth for the prefix rule. */
export const isTelCartId = (cartId) =>
  typeof cartId === "string" && cartId.startsWith(TEL_CART_PREFIX);

export const getOrCreateTelCartId = (candidate) => {
  if (isTelCartId(candidate)) return candidate;

  const storage = safeStorage();
  const stored = storage?.getItem(TEL_CART_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (isTelCartId(parsed?.id)) return parsed.id;
    } catch {
      /* ignore */
    }
  }

  const fresh = generateTelId();
  storage?.setItem("cartId", fresh); // convenience mirror for other pages
  return fresh;
};

/* ===========================  NORMALISATION  =========================== */

/**
 * Accepts either a showroom product (productID / productImage / price)
 * or an API cart line (ProductId / ImagePath / Price) and returns the single
 * shape the whole Tel cart speaks.
 *
 * knownUnitPrice — trusted per-unit cost. Passed when we already know the
 * true unit price (product page, localStorage) so the API heuristic can
 * never inflate it. See the note in cartSlice.js for why qty===1 is unsafe.
 */
export const normalizeTelItem = (raw = {}, knownUnitPrice = null) => {
  const productId = firstDefined(
    raw.productId,
    raw.ProductId,
    raw.productID,
    raw.id
  );
  const productName = firstDefined(
    raw.productName,
    raw.ProductName,
    raw.name,
    "Product"
  );
  const imagePath = firstDefined(
    raw.imagePath,
    raw.ImagePath,
    raw.productImage,
    ""
  );
  const quantity = Math.max(
    1,
    parseInt(firstDefined(raw.quantity, raw.Quantity, 1), 10) || 1
  );

  let unitPrice = parseFloat(firstDefined(knownUnitPrice, 0)) || 0;

  if (!unitPrice) {
    unitPrice = parseFloat(firstDefined(raw.unitPrice, raw.UnitPrice, 0)) || 0;
  }

  if (!unitPrice) {
    const rawPrice = parseFloat(firstDefined(raw.price, raw.Price, 0)) || 0;
    if (quantity > 1 && rawPrice > 0) {
      const possibleUnit = rawPrice / quantity;
      unitPrice =
        Math.abs(rawPrice - possibleUnit * quantity) < 0.01
          ? round2(possibleUnit)
          : rawPrice;
    } else {
      unitPrice = rawPrice;
    }
  }

  return {
    ...raw,
    productId,
    productID: productId, // keep both spellings alive for the showroom code
    productName,
    imagePath,
    productImage: imagePath,
    price: unitPrice,
    unitPrice,
    quantity,
    lineTotal: round2(unitPrice * quantity),
    cartItemId: isTelCartId(raw.cartItemId) ? raw.cartItemId : generateTelId(),
    addedAt: raw.addedAt || Date.now(),
  };
};

export const normalizeTelItems = (items) =>
  Array.isArray(items) ? items.map((item) => normalizeTelItem(item)) : [];

/* ===========================  LOCAL STORAGE  =========================== */

export const loadTelCart = () => {
  const storage = safeStorage();
  const empty = {
    id: generateTelId(),
    items: [],
    customerId: null,
    serverSnapshot: {},
    lastSyncedAt: null,
  };
  if (!storage) return empty;

  try {
    const raw = storage.getItem(TEL_CART_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return empty;

    // An id that lost the prefix (legacy data, manual edit) is re-minted.
    return {
      id: isTelCartId(parsed.id) ? parsed.id : generateTelId(),
      items: parsed.items.map((item) => normalizeTelItem(item)),
      customerId: parsed.customerId || null,
      serverSnapshot: parsed.serverSnapshot || {},
      lastSyncedAt: parsed.lastSyncedAt || null,
    };
  } catch {
    return empty;
  }
};

export const saveTelCart = (cart) => {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(
      TEL_CART_STORAGE_KEY,
      JSON.stringify({
        id: cart.id,
        items: cart.items,
        customerId: cart.customerId ?? null,
        serverSnapshot: cart.serverSnapshot || {},
        lastSyncedAt: cart.lastSyncedAt || null,
      })
    );
    // mirror, so any page that only knows about "cartId" still finds a Tel id
    storage.setItem("cartId", cart.id);
  } catch {
    /* storage full / disabled — the Redux state still works for this session */
  }
};

export const readTelCartId = () => loadTelCart().id;

/** Product ids currently known to exist on the server for this Tel cart. */
const fingerprint = (items) =>
  items.reduce((acc, item) => {
    acc[String(item.productId)] = item.quantity;
    return acc;
  }, {});

const persist = (state) => {
  saveTelCart(state);
};

/* ===========================  INITIAL STATE  =========================== */

const initial = loadTelCart();

const initialState = {
  id: initial.id,
  items: initial.items,
  customerId: initial.customerId,
  serverSnapshot: initial.serverSnapshot, // productId -> qty last pushed to API
  lastSyncedAt: initial.lastSyncedAt,
  loading: false,
  syncing: false,
  error: null,
};

/* ===========================  THUNKS  =========================== */

/**
 * Reconciles the local Tel cart with the API cart.
 *
 * Called on sign-up and again before checkout. It is a DELTA sync, not a blind
 * re-push: items the server already has are updated with Cart-Update instead
 * of being added again (a blind re-push would silently double quantities).
 *
 *   new locally            -> POST /Cart/Add-To-Cart
 *   qty changed locally    -> POST /Cart/Cart-Update/{cartId}/{productId}/{qty}
 *   gone locally           -> POST /Cart/Cart-Delete/{cartId}/{productId}
 */
export const syncTelCartToBackend = createAsyncThunk(
  "telCart/syncTelCartToBackend",
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState().telCart || {};
      const cartId = getOrCreateTelCartId(params.cartId || state.id);

      if (!isTelCartId(cartId)) {
        throw new Error('Tel cart id must start with "Tel"');
      }

      const customerId = params.customerId ?? state.customerId ?? null;
      const items = params.items || state.items || [];
      const snapshot = params.snapshot || state.serverSnapshot || {};
      const force = Boolean(params.force);

      if (!force && items.length === 0 && Object.keys(snapshot).length === 0) {
        return { cartId, customerId, added: 0, updated: 0, removed: 0, failed: [] };
      }

      const jobs = [];

      items.forEach((item) => {
        const key = String(item.productId);
        const onServer = snapshot[key];

        if (onServer === undefined) {
          jobs.push({
            kind: "add",
            productId: item.productId,
            request: axiosInstance.post(
              "/",
              {
                CartId: cartId,
                CartItemId: item.cartItemId,
                ProductId: item.productId,
                ProductName: item.productName,
                ImagePath: item.imagePath,
                Price: Number(item.unitPrice ?? item.price) || 0, // per unit
                Quantity: item.quantity,
                CustomerId: customerId,
              },
              { params: { endpoint: "/Cart/Add-To-Cart" } }
            ),
          });
        } else if (Number(onServer) !== Number(item.quantity)) {
          jobs.push({
            kind: "update",
            productId: item.productId,
            request: axiosInstance.post("/", null, {
              params: {
                endpoint: `/Cart/Cart-Update/${cartId}/${item.productId}/${item.quantity}`,
              },
            }),
          });
        }
      });

      Object.keys(snapshot).forEach((productId) => {
        const stillThere = items.some(
          (item) => String(item.productId) === String(productId)
        );
        if (!stillThere) {
          jobs.push({
            kind: "remove",
            productId,
            request: axiosInstance.post("/", null, {
              params: { endpoint: `/Cart/Cart-Delete/${cartId}/${productId}` },
            }),
          });
        }
      });

      const settled = await Promise.allSettled(jobs.map((job) => job.request));

      const failed = [];
      settled.forEach((result, index) => {
        if (result.status === "rejected") {
          failed.push({
            kind: jobs[index].kind,
            productId: jobs[index].productId,
            reason:
              result.reason?.response?.data ||
              result.reason?.message ||
              "Request failed",
          });
        }
      });

      const count = (kind) =>
        settled.filter((r, i) => r.status === "fulfilled" && jobs[i].kind === kind)
          .length;

      // Only lines the API accepted go into the snapshot — anything that failed
      // is retried on the next sync instead of being silently marked as synced.
      const failedKeys = new Set(failed.map((f) => String(f.productId)));

      return {
        cartId,
        customerId,
        added: count("add"),
        updated: count("update"),
        removed: count("remove"),
        failed,
        snapshot: fingerprint(
          items.filter((item) => !failedKeys.has(String(item.productId)))
        ),
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

/** Pull the Tel cart down from the API (e.g. customer signs in on a new device). */
export const fetchTelCartFromBackend = createAsyncThunk(
  "telCart/fetchTelCartFromBackend",
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState().telCart || {};
      const cartId = getOrCreateTelCartId(params.cartId || state.id);

      if (!isTelCartId(cartId)) {
        throw new Error('Refusing to fetch a cart whose id does not start with "Tel"');
      }

      const response = await axiosInstance.get("/", {
        params: { endpoint: `/Cart/Cart-GetbyID/${cartId}` },
      });

      if (!Array.isArray(response.data)) return [];

      // Trust unit prices we already know locally (API price can be inflated).
      const known = {};
      (state.items || []).forEach((item) => {
        if (item.productId && item.unitPrice > 0) {
          known[item.productId] = item.unitPrice;
        }
      });

      return response.data.map((raw) => {
        const pid = raw.productId || raw.ProductId;
        return normalizeTelItem(raw, known[pid] ?? null);
      });
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch the Tel cart");
    }
  }
);

/* ===========================  SLICE  =========================== */

const telCartSlice = createSlice({
  name: "telCart",
  initialState,
  reducers: {
    /** addItem({ ...product, quantity }) — merges by productId. */
    addItem: (state, action) => {
      const incoming = normalizeTelItem(
        action.payload,
        firstDefined(action.payload?.Price, action.payload?.price, null)
      );
      if (!incoming.productId) return;

      const existing = state.items.find(
        (item) => String(item.productId) === String(incoming.productId)
      );

      if (existing) {
        existing.quantity += incoming.quantity;
        existing.lineTotal = round2(existing.unitPrice * existing.quantity);
      } else {
        state.items.push(incoming);
      }
      state.error = null;
      persist(state);
    },

    /** setQuantity({ cartItemId, quantity }) — 1 is the floor, 0 removes. */
    setQuantity: (state, action) => {
      const { cartItemId, productId, quantity } = action.payload || {};
      const next = parseInt(quantity, 10);
      const index = state.items.findIndex(
        (item) =>
          (cartItemId && item.cartItemId === cartItemId) ||
          (productId && String(item.productId) === String(productId))
      );
      if (index === -1) return;

      if (next <= 0) {
        state.items.splice(index, 1);
      } else {
        state.items[index].quantity = next;
        state.items[index].lineTotal = round2(
          state.items[index].unitPrice * next
        );
      }
      persist(state);
    },

    removeItem: (state, action) => {
      const { cartItemId, productId } = action.payload || {};
      state.items = state.items.filter(
        (item) =>
          !(
            (cartItemId && item.cartItemId === cartItemId) ||
            (productId && String(item.productId) === String(productId))
          )
      );
      persist(state);
    },

    setItems: (state, action) => {
      const items = Array.isArray(action.payload)
        ? action.payload.map((item) => normalizeTelItem(item))
        : [];
      state.items = items;
      persist(state);
    },

    /** Keeps the customer id on the cart so the API lines stay attributable. */
    attachCustomer: (state, action) => {
      state.customerId = action.payload ?? null;
      persist(state);
    },

    clearTelCart: (state) => {
      state.items = [];
      state.serverSnapshot = {};
      state.lastSyncedAt = null;
      state.id = generateTelId(); // a fresh Tel id for the next shopping trip
      persist(state);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(syncTelCartToBackend.pending, (state) => {
        state.syncing = true;
        state.error = null;
      })
      .addCase(syncTelCartToBackend.fulfilled, (state, action) => {
        state.syncing = false;
        state.customerId = action.payload.customerId ?? state.customerId;
        state.serverSnapshot = action.payload.snapshot || fingerprint(state.items);
        state.lastSyncedAt = Date.now();
        persist(state);
      })
      .addCase(syncTelCartToBackend.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(fetchTelCartFromBackend.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTelCartFromBackend.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        persist(state);
      })
      .addCase(fetchTelCartFromBackend.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const {
  addItem,
  setQuantity,
  removeItem,
  setItems,
  attachCustomer,
  clearTelCart,
} = telCartSlice.actions;

/* ===========================  SELECTORS  =========================== */

export const selectTelCart = (state) => state.telCart;
export const selectTelCartId = (state) => state.telCart?.id || null;
export const selectTelItems = (state) => state.telCart?.items || [];
export const selectTelItemCount = (state) =>
  (state.telCart?.items || []).reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );
export const selectTelSubtotal = (state) =>
  round2(
    (state.telCart?.items || []).reduce(
      (total, item) =>
        total + (Number(item.unitPrice ?? item.price) || 0) * (item.quantity || 1),
      0
    )
  );
export const selectTelSyncing = (state) => Boolean(state.telCart?.syncing);

export default telCartSlice.reducer;
