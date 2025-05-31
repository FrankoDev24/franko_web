import { createSlice } from '@reduxjs/toolkit';

// Load initial wishlist from localStorage
const loadWishlist = () => {
  try {
    const data = localStorage.getItem('wishlist');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading wishlist from localStorage', e);
    return [];
  }
};

// Save wishlist to localStorage
const saveWishlist = (wishlist) => {
  try {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  } catch (e) {
    console.error('Error saving wishlist to localStorage', e);
  }
};

const initialState = {
  items: loadWishlist(), // array of product objects
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      const existing = state.items.find(item => item.id === action.payload.id);
      if (!existing) {
        if (state.items.length < 10) {
          state.items.push(action.payload);
        } else {
          console.warn('Wishlist limit reached (10 items).');
        }
        saveWishlist(state.items);
      }
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      saveWishlist(state.items);
    },
    clearWishlist: (state) => {
      state.items = [];
      saveWishlist(state.items);
    }
  }
});

export const { addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
