// src/Redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { combineReducers } from "redux";

import categoryReducer from "./Slice/categorySlice";
import brandReducer from "./Slice/brandSlice";
import productReducer from "./Slice/productSlice";
import showroomReducer from "./Slice/showRoomSlice";
import orderReducer from "./Slice/orderSlice";
import customerReducer from "./Slice/customerSlice";
import cartReducer from "./Slice/cartSlice";
import advertismentReducer from "./Slice/advertismentSlice";
import wishlistReducer from "./Slice/wishlistSlice";
import branchProductReducer from "./Slice/branchProductSlice";
import branchOrderReducer from "./Slice/branchOrderSlice";
import paymentReducer from "./Slice/paymentSlice";
import ctp001Reducer from "./Slice/ctp001Slice";

/* ─────────────────────────────────────────────
   Auto-Logout Middleware
───────────────────────────────────────────── */
const clearAuthStorage = () => {
  try {
    ["customer", "user", "loginTime", "lastActivityTimestamp"].forEach(
      (key) => localStorage.removeItem(key)
    );
  } catch {
    // Ignore storage errors
  }
};

const autoLogoutMiddleware = (store) => (next) => (action) => {
  const preAuth = store.getState()?.customer?.isAuthenticated;

  const result = next(action);

  const state = store.getState()?.customer || {};
  const postAuth = state.isAuthenticated;

  // 1) Auth transition: true → false
  if (preAuth === true && postAuth === false) {
    clearAuthStorage();
  }

  // 2) Unauthenticated but customer data leaks into state
  if (postAuth === false && state.currentCustomer && !state.loading) {
    store.dispatch({ type: "customer/syncWithStorage" });
  }

  // 3) Unauthenticated but stale key in localStorage
  // ✅ FIX: postState → state
  if (!postAuth && !state.loading && localStorage.getItem("customer")) {
    clearAuthStorage();
  }

  return result;
};

// --- Combine all reducers
const rootReducer = combineReducers({
  categories: categoryReducer,
  wishlist: wishlistReducer,
  brands: brandReducer,
  products: productReducer,
  showrooms: showroomReducer,
  orders: orderReducer,
  ctp001: ctp001Reducer,
  customer: customerReducer,
  cart: cartReducer,
  advertisment: advertismentReducer,
  branchProducts: branchProductReducer,
  branchOrders: branchOrderReducer,
  payment: paymentReducer,
});

// --- Redux Persist config
// The app monkey-patches localStorage (see src/utils/secureLocalStorageInit.js)
// so getItem auto-decrypts and JSON.parses on read. redux-persist expects a raw
// JSON *string*, so wrap the patched storage with an adapter that revers
// serializes values back to strings before handing them to the persist layer.
const persistStorage = {
  getItem: (key) =>
    new Promise((resolve) => {
      try {
        const value = localStorage.getItem(key);
        resolve(
          value === null || value === undefined
            ? null
            : typeof value === "string"
            ? value
            : JSON.stringify(value)
        );
      } catch {
        resolve(null);
      }
    }),
  setItem: (key, value) =>
    new Promise((resolve) => {
      try {
        localStorage.setItem(
          key,
          typeof value === "string" ? value : JSON.stringify(value)
        );
      } catch {
        /* ignore storage errors */
      }
      resolve();
    }),
  removeItem: (key) =>
    new Promise((resolve) => {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore storage errors */
      }
      resolve();
    }),
};

const persistConfig = {
  key: "root",
  storage: persistStorage,
  whitelist: ["categories", "brands", "showrooms", "advertisment"],
};

// --- Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// --- Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(autoLogoutMiddleware),
});

// --- Persistor
export const persistor = persistStore(store);