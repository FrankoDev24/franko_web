// store.js
import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
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



// --- Combine all reducers
const rootReducer = combineReducers({
  categories: categoryReducer,
  wishlist: wishlistReducer,
  brands: brandReducer,
  products: productReducer, // Product codes handled separately via productCodesStorage
  showrooms: showroomReducer,
  orders: orderReducer,

  customer: customerReducer,
  cart: cartReducer,
  advertisment: advertismentReducer,

  branchProducts: branchProductReducer,
  branchOrders: branchOrderReducer,
  payment: paymentReducer,
});

// --- Redux Persist config
const persistConfig = {
  key: "root",
  storage,
  whitelist: [
    "categories",
    "brands",
    "showrooms",
    "advertisment",
  ],
  // Products NOT in whitelist - codes are handled by productCodesStorage
};

// --- Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// --- Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// --- Persistor
export const persistor = persistStore(store);