// src/Redux/Slice/categorySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;



export const fetchCategories = createAsyncThunk('Category/fetchCategories', async () => {
    const response = await axios.get(`${API_BASE_URL}/Category/Category-Get`);
    return response.data; // Adjust based on your backend response
});

export const addCategory = createAsyncThunk('Category/addCategory', async (categoryData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/Category/Setup-Category`, categoryData);
 
        return response.data; // Adjust based on your backend response
    } catch (error) {
        console.error('Error adding category:', error); // Log error details
        throw error; // Rethrow to handle in the rejected case
    }
});

// New updateCategory async thunk
export const updateCategory = createAsyncThunk('Category/updateCategory', async ({ categoryId, categoryData }) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/Category/Category-Put/${categoryId}`, categoryData);
      
        return response.data; // Adjust based on your backend response
    } catch (error) {
        console.error('Error updating category:', error); // Log error details
        throw error; // Rethrow to handle in the rejected case
    }
});

const categorySlice = createSlice({
    name: 'categories',
    initialState: {
        categories: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(addCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.categories.push(action.payload); // Add new category to the state
            })
            .addCase(addCategory.rejected, (state, action) => {
                state.loading = false;
                console.error('Error while adding category:', action.error); // Log error details
                state.error = action.error.message;
            })
            .addCase(updateCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCategory.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.categories.findIndex((category) => category.categoryId === action.payload.categoryId);
                if (index !== -1) {
                    state.categories[index] = { ...state.categories[index], ...action.payload }; // Merge updated fields
                }
            })
            
            .addCase(updateCategory.rejected, (state, action) => {
                state.loading = false;
                console.error('Error while updating category:', action.error); // Log error details
                state.error = action.error.message;
            });
    },
});

export default categorySlice.reducer;
