import { configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage'; // Default storage (localStorage for web)
import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from 'redux';
import categoryReducer from './Slice/categorySlice';
import brandReducer from './Slice/brandSlice';
import productReducer from './Slice/productSlice';
import showroomReducer from './Slice/showRoomSlice';
import orderReducer from './Slice/orderSlice';
import userReducer from './Slice/userSlice';
import customerReducer from './Slice/customerSlice';
import cartReducer from './Slice/cartSlice';
import advertismentReducer from './Slice/advertismentSlice';
import wishlistReducer from './Slice/wishlistSlice';
import paymentReducer from './Slice/paymentSlice'; // Assuming you have a payment slice

// Combine reducers
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
 payment: paymentReducer, // Assuming you have a payment slice
  
});

// Redux Persist configuration
const persistConfig = {
  key: 'root',
  storage, // Use localStorage as the storage engine
  whitelist: ['categories', 'brands', 'products', 'showrooms', 'orders'], // Specify slices to persist
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Required for Redux Persist
    }),
});

// Create persistor
export const persistor = persistStore(store);
