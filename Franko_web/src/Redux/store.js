import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage"; // localStorage (already encrypted globally)
import { persistStore, persistReducer } from "redux-persist";
import { combineReducers } from "redux";

import categoryReducer from "./Slice/categorySlice";
import brandReducer from "./Slice/brandSlice";
import productReducer from "./Slice/productSlice";
import showroomReducer from "./Slice/showRoomSlice";
import orderReducer from "./Slice/orderSlice";
import userReducer from "./Slice/userSlice";
import customerReducer from "./Slice/customerSlice";
import cartReducer from "./Slice/cartSlice";
import advertismentReducer from "./Slice/advertismentSlice";
import wishlistReducer from "./Slice/wishlistSlice";
import paymentReducer from "./Slice/paymentSlice";

// --- Combine all reducers
const rootReducer = combineReducers({
  categories: categoryReducer,
  wishlist: wishlistReducer,
  brands: brandReducer,
  products: productReducer,
  showrooms: showroomReducer,
  orders: orderReducer,
  user: userReducer,
  customer: customerReducer,
  cart: cartReducer,
  advertisment: advertismentReducer,
  payment: paymentReducer,
});

// --- Redux Persist config
const persistConfig = {
  key: "root",
  storage, // ✅ This storage is now your globally encrypted localStorage
  whitelist: [
    "categories",
    "brands",
    "products",
    "showrooms",
    "advertisment",
  ],
};

// --- Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// --- Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Required for redux-persist
    }),
});

// --- Persistor
export const persistor = persistStore(store);
